"""Playwright browser lifecycle manager with anti-detection, cookie auth, and pooling."""
import asyncio
import json
import logging
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from playwright.async_api import async_playwright, Browser, BrowserContext, Page, Playwright

from src.config import settings
from src.utils.retry import CircuitBreaker

logger = logging.getLogger(__name__)

# Chrome 120 user agent
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# Anti-detection browser args
BROWSER_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
]

# Webdriver masking init script
WEBDRIVER_MASK_SCRIPT = """
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
    });
"""

COOKIE_STORE_PATH = Path("/tmp/mcp_cookies.json")


class BrowserService:
    """Manages a reusable Playwright browser instance with anti-detection."""

    def __init__(self):
        self._playwright: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._lock = asyncio.Lock()
        self._cookies: list[dict] = []
        self.circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=120)
        self._load_stored_cookies()

    def _load_stored_cookies(self):
        """Load cookies from persistent storage if available."""
        if COOKIE_STORE_PATH.exists():
            try:
                self._cookies = json.loads(COOKIE_STORE_PATH.read_text())
                logger.info("Loaded %d stored cookies", len(self._cookies))
            except Exception as e:
                logger.warning("Failed to load stored cookies: %s", e)

    def set_cookies(self, cookies: list[dict]):
        """Store cookies for injection into browser contexts."""
        self._cookies = cookies
        try:
            COOKIE_STORE_PATH.write_text(json.dumps(cookies))
            logger.info("Stored %d cookies to %s", len(cookies), COOKIE_STORE_PATH)
        except Exception as e:
            logger.warning("Failed to persist cookies: %s", e)

    def get_cookies(self) -> list[dict]:
        """Return currently stored cookies."""
        return self._cookies

    async def start(self):
        """Start the browser pool."""
        async with self._lock:
            if self._browser is not None:
                return
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=settings.BROWSER_HEADLESS,
                args=BROWSER_ARGS,
            )
            logger.info("Browser service started (headless=%s)", settings.BROWSER_HEADLESS)

    async def stop(self):
        """Shut down the browser and Playwright."""
        async with self._lock:
            if self._browser:
                await self._browser.close()
                self._browser = None
            if self._playwright:
                await self._playwright.stop()
                self._playwright = None
            logger.info("Browser service stopped")

    async def _ensure_browser(self):
        """Ensure browser is running, start if not."""
        if self._browser is None or not self._browser.is_connected():
            await self.start()

    @asynccontextmanager
    async def new_page(self, timeout: Optional[int] = None, use_cookies: bool = True):
        """Create a new browser page with anti-detection context.

        Args:
            timeout: Page timeout in ms.
            use_cookies: Whether to inject stored cookies into the context.

        Usage:
            async with browser_service.new_page() as page:
                await page.goto("https://example.com")
        """
        if not self.circuit_breaker.can_execute():
            raise RuntimeError("Browser circuit breaker is open — too many recent failures")

        await self._ensure_browser()
        page_timeout = timeout or settings.BROWSER_TIMEOUT

        context: Optional[BrowserContext] = None
        try:
            context = await self._browser.new_context(
                user_agent=USER_AGENT,
                viewport={"width": 1920, "height": 1080},
                device_scale_factor=1,
                has_touch=False,
                is_mobile=False,
                locale="en-US",
                timezone_id="America/New_York",
            )
            await context.add_init_script(WEBDRIVER_MASK_SCRIPT)
            if use_cookies and self._cookies:
                await context.add_cookies(self._cookies)
                logger.debug("Injected %d cookies into context", len(self._cookies))
            page = await context.new_page()
            page.set_default_timeout(page_timeout)
            self.circuit_breaker.record_success()
            yield page
        except Exception:
            self.circuit_breaker.record_failure()
            raise
        finally:
            if context:
                await context.close()


# Content extraction helpers

async def extract_text(page: Page) -> str:
    """Extract visible text content from the page."""
    return await page.evaluate("() => document.body.innerText || ''")


async def extract_links(page: Page) -> list[dict]:
    """Extract all links from the page."""
    return await page.evaluate("""() => {
        return Array.from(document.querySelectorAll('a[href]')).map(a => ({
            text: a.innerText.trim(),
            href: a.href
        })).filter(l => l.href && l.href.startsWith('http'));
    }""")


async def extract_meta(page: Page) -> dict:
    """Extract meta tags from the page."""
    return await page.evaluate("""() => {
        const meta = {};
        document.querySelectorAll('meta').forEach(m => {
            const name = m.getAttribute('name') || m.getAttribute('property') || '';
            const content = m.getAttribute('content') || '';
            if (name && content) meta[name] = content;
        });
        return meta;
    }""")


# Singleton
_browser_service: Optional[BrowserService] = None


def get_browser_service() -> BrowserService:
    """Get or create the browser service singleton."""
    global _browser_service
    if _browser_service is None:
        _browser_service = BrowserService()
    return _browser_service
