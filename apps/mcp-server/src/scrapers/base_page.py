"""Generic base page object for web scraping."""
import logging
import os
from datetime import datetime
from typing import Optional

from playwright.async_api import Page

from src.utils.retry import retry_with_backoff

logger = logging.getLogger(__name__)

SCREENSHOT_DIR = "/tmp/scraper_debug"


class BasePage:
    """Base page object for generic web scraping (no site-specific logic)."""

    def __init__(self, page: Page):
        self.page = page

    @retry_with_backoff(retries=2, backoff_in_seconds=2, error_message="Navigation failed")
    async def navigate(self, url: str, wait_for: Optional[str] = None, timeout: int = 30000):
        """Navigate to a URL and optionally wait for a selector.

        Args:
            url: Full URL to navigate to.
            wait_for: CSS selector to wait for after navigation.
            timeout: Max wait time in ms.
        """
        logger.info("Navigating to %s", url)
        await self.page.goto(url, timeout=timeout, wait_until="domcontentloaded")

        if wait_for:
            await self.page.wait_for_selector(wait_for, timeout=timeout)

    async def extract_content(self, selectors: Optional[dict[str, str]] = None) -> dict:
        """Extract content using CSS selectors.

        Args:
            selectors: Map of field_name -> css_selector. If None, extracts full page text.

        Returns:
            Dict with extracted content per field.
        """
        if not selectors:
            text = await self.page.evaluate("() => document.body.innerText || ''")
            return {"content": text}

        result = {}
        for field, selector in selectors.items():
            try:
                elements = await self.page.query_selector_all(selector)
                texts = []
                for el in elements:
                    t = await el.inner_text()
                    if t and t.strip():
                        texts.append(t.strip())
                result[field] = texts if len(texts) > 1 else (texts[0] if texts else "")
            except Exception as e:
                logger.warning("Failed to extract '%s' with selector '%s': %s", field, selector, e)
                result[field] = ""
        return result

    async def extract_structured(self, schema: dict[str, str]) -> dict:
        """Extract structured data by mapping field names to CSS selectors.

        Args:
            schema: {"field_name": "css_selector"} - each selector extracts text.

        Returns:
            {"field_name": "extracted_text"}
        """
        result = {}
        for field, selector in schema.items():
            try:
                el = await self.page.query_selector(selector)
                result[field] = (await el.inner_text()).strip() if el else ""
            except Exception as e:
                logger.warning("Structured extraction failed for '%s': %s", field, e)
                result[field] = ""
        return result

    async def get_all_links(self) -> list[dict]:
        """Get all links from the current page."""
        return await self.page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a[href]')).map(a => ({
                text: a.innerText.trim(),
                href: a.href
            })).filter(l => l.href && l.href.startsWith('http'));
        }""")

    async def _save_debug_artifacts(self, name: str):
        """Save HTML and screenshot for debugging."""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            os.makedirs(SCREENSHOT_DIR, exist_ok=True)
            screenshot_path = f"{SCREENSHOT_DIR}/{name}_{timestamp}.png"
            html_path = f"{SCREENSHOT_DIR}/{name}_{timestamp}.html"

            await self.page.screenshot(path=screenshot_path, full_page=True)
            with open(html_path, "w") as f:
                f.write(await self.page.content())

            logger.info("Saved debug artifacts: %s", screenshot_path)
        except Exception as e:
            logger.error("Failed to save debug artifacts: %s", e)
