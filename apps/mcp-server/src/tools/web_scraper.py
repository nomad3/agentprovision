"""Web scraping tools for the MCP server.

Three main operations:
- scrape_webpage: Navigate to URL, extract text/links/meta
- scrape_structured_data: Extract data matching a CSS selector schema
- search_and_scrape: Google search via Playwright, scrape top results
"""
import logging
from typing import Optional

from src.services.browser_service import get_browser_service, extract_text, extract_links, extract_meta
from src.scrapers.base_page import BasePage
from src.config import settings

logger = logging.getLogger(__name__)


async def scrape_webpage(
    url: str,
    selectors: Optional[dict[str, str]] = None,
    wait_for: Optional[str] = None,
    extract_links_flag: bool = False,
    timeout: int = 30000,
) -> dict:
    """Navigate to a URL and extract content.

    Args:
        url: The webpage URL to scrape.
        selectors: Optional map of field_name -> css_selector for targeted extraction.
        wait_for: CSS selector to wait for before extracting.
        extract_links_flag: Whether to also extract all page links.
        timeout: Max wait time in ms.

    Returns:
        {url, title, content, links[], meta{}}
    """
    browser_service = get_browser_service()
    async with browser_service.new_page(timeout=timeout) as page:
        bp = BasePage(page)
        await bp.navigate(url, wait_for=wait_for, timeout=timeout)

        title = await page.title()

        if selectors:
            content = await bp.extract_content(selectors)
        else:
            content = await extract_text(page)

        result = {
            "url": url,
            "title": title,
            "content": content,
        }

        if extract_links_flag:
            result["links"] = await extract_links(page)

        result["meta"] = await extract_meta(page)
        return result


async def scrape_structured_data(
    url: str,
    schema: dict[str, str],
    selectors: Optional[dict[str, str]] = None,
    timeout: int = 30000,
) -> dict:
    """Navigate to a URL and extract structured data matching a CSS selector schema.

    Args:
        url: The webpage URL to scrape.
        schema: {"field_name": "css_selector"} mapping for data extraction.
        selectors: Optional additional selectors for context extraction.
        timeout: Max wait time in ms.

    Returns:
        {url, data: {...}}
    """
    browser_service = get_browser_service()
    async with browser_service.new_page(timeout=timeout) as page:
        bp = BasePage(page)
        await bp.navigate(url, timeout=timeout)

        data = await bp.extract_structured(schema)

        if selectors:
            extra = await bp.extract_content(selectors)
            data.update(extra)

        return {
            "url": url,
            "data": data,
        }


async def _search_serper(query: str, max_results: int) -> list[dict]:
    """Search via Serper.dev API (no CAPTCHA, fast, reliable)."""
    import httpx
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://google.serper.dev/search",
            json={"q": query, "num": max_results},
            headers={"X-API-KEY": settings.SERPER_API_KEY, "Content-Type": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
    results = []
    for item in data.get("organic", [])[:max_results]:
        results.append({
            "url": item.get("link", ""),
            "title": item.get("title", ""),
            "snippet": item.get("snippet", ""),
        })
    return results


async def _search_duckduckgo(query: str, max_results: int) -> list[dict]:
    """Search via DuckDuckGo API (JSON endpoint, no Playwright needed)."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": "1", "skip_disambig": "1"},
            )
            resp.raise_for_status()
            data = resp.json()
        results = []
        for item in data.get("RelatedTopics", [])[:max_results]:
            if "FirstURL" in item:
                results.append({
                    "url": item["FirstURL"],
                    "title": item.get("Text", "")[:100],
                    "snippet": item.get("Text", ""),
                })
        if not results:
            # Fallback to Bing
            return await _search_bing(query, max_results)
        return results
    except Exception as e:
        logger.warning("DuckDuckGo API failed: %s, falling back to Bing", e)
        return await _search_bing(query, max_results)


async def _search_bing(query: str, max_results: int) -> list[dict]:
    """Search via Bing using Playwright (less aggressive bot detection than Google)."""
    browser_service = get_browser_service()
    async with browser_service.new_page() as page:
        await page.goto(
            f"https://www.bing.com/search?q={query.replace(' ', '+')}",
            wait_until="domcontentloaded",
        )
        await page.wait_for_selector("#b_results", timeout=10000)
        search_results = await page.evaluate("""() => {
            const results = [];
            document.querySelectorAll('#b_results .b_algo').forEach(r => {
                const a = r.querySelector('h2 a');
                const snippet = r.querySelector('.b_caption p');
                if (a && a.href && a.href.startsWith('http')) {
                    results.push({
                        url: a.href,
                        title: a.innerText.trim(),
                        snippet: snippet ? snippet.innerText.trim() : ''
                    });
                }
            });
            return results;
        }""")
    return search_results[:max_results]


async def _search_google(query: str, max_results: int) -> list[dict]:
    """Search via Google using Playwright (may hit CAPTCHA from cloud IPs)."""
    browser_service = get_browser_service()
    async with browser_service.new_page() as page:
        await page.goto("https://www.google.com", wait_until="domcontentloaded")

        # Accept cookies if the consent dialog appears
        try:
            accept_btn = page.locator("button:has-text('Accept all')")
            if await accept_btn.count() > 0:
                await accept_btn.click()
                await page.wait_for_timeout(1000)
        except Exception:
            pass

        search_input = page.locator('textarea[name="q"], input[name="q"]')
        await search_input.fill(query)
        await search_input.press("Enter")
        await page.wait_for_selector("#search", timeout=10000)

        search_results = await page.evaluate("""() => {
            const results = [];
            document.querySelectorAll('#search .g').forEach(g => {
                const a = g.querySelector('a[href]');
                const snippet = g.querySelector('.VwiC3b, .IsZvec');
                if (a && a.href && a.href.startsWith('http')) {
                    results.push({
                        url: a.href,
                        title: a.innerText.split('\\n')[0] || '',
                        snippet: snippet ? snippet.innerText.trim() : ''
                    });
                }
            });
            return results;
        }""")
    return search_results[:max_results]


async def search_and_scrape(
    query: str,
    engine: str = "",
    max_results: int = 5,
) -> list[dict]:
    """Search the web and scrape top results.

    Uses Serper API if configured, otherwise DuckDuckGo (no CAPTCHA),
    with Google as an explicit option (may CAPTCHA from cloud IPs).

    Args:
        query: Search query string.
        engine: "serper", "duckduckgo", or "google". Defaults to config.
        max_results: Maximum number of results to scrape.

    Returns:
        [{url, title, snippet, content}]
    """
    max_results = min(max_results, settings.SCRAPE_MAX_RESULTS)
    engine = engine or settings.SEARCH_ENGINE

    # Pick search backend
    if engine == "serper" or (not engine and settings.SERPER_API_KEY):
        if not settings.SERPER_API_KEY:
            raise ValueError("SERPER_API_KEY not configured")
        logger.info("Searching via Serper API: %s", query)
        search_results = await _search_serper(query, max_results)
    elif engine == "google":
        logger.info("Searching via Google Playwright: %s", query)
        search_results = await _search_google(query, max_results)
    elif engine == "bing":
        logger.info("Searching via Bing Playwright: %s", query)
        search_results = await _search_bing(query, max_results)
    else:
        logger.info("Searching via DuckDuckGo API (Bing fallback): %s", query)
        search_results = await _search_duckduckgo(query, max_results)

    # Scrape the top N result pages
    results = []
    for sr in search_results[:max_results]:
        try:
            scraped = await scrape_webpage(sr["url"], timeout=15000)
            results.append({
                "url": sr["url"],
                "title": sr.get("title", scraped.get("title", "")),
                "snippet": sr.get("snippet", ""),
                "content": scraped.get("content", ""),
            })
        except Exception as e:
            logger.warning("Failed to scrape %s: %s", sr["url"], e)
            results.append({
                "url": sr["url"],
                "title": sr.get("title", ""),
                "snippet": sr.get("snippet", ""),
                "content": f"Error: {str(e)}",
            })

    return results
