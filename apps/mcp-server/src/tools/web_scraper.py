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


async def search_and_scrape(
    query: str,
    engine: str = "google",
    max_results: int = 5,
) -> list[dict]:
    """Search the web via Playwright and scrape top results.

    Args:
        query: Search query string.
        engine: Search engine to use (currently only "google").
        max_results: Maximum number of results to scrape.

    Returns:
        [{url, title, snippet, content}]
    """
    max_results = min(max_results, settings.SCRAPE_MAX_RESULTS)
    browser_service = get_browser_service()

    async with browser_service.new_page() as page:
        # Navigate to Google and search
        await page.goto("https://www.google.com", wait_until="domcontentloaded")

        # Accept cookies if the consent dialog appears
        try:
            accept_btn = page.locator("button:has-text('Accept all')")
            if await accept_btn.count() > 0:
                await accept_btn.click()
                await page.wait_for_timeout(1000)
        except Exception:
            pass

        # Type the query and search
        search_input = page.locator('textarea[name="q"], input[name="q"]')
        await search_input.fill(query)
        await search_input.press("Enter")
        await page.wait_for_selector("#search", timeout=10000)

        # Collect search result URLs and snippets
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
