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

    async def login_google(self, email: str, password: str) -> dict:
        """Login to Google via Playwright and store session cookies.

        Follows the multi-step Google login flow:
        1. Navigate to accounts.google.com
        2. Enter email, click Next
        3. Enter password, click Next
        4. Wait for redirect to myaccount.google.com
        5. Extract and store cookies
        """
        await self._ensure_browser()

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

        try:
            page = await context.new_page()
            page.set_default_timeout(60000)

            # Navigate to Google login
            await page.goto("https://accounts.google.com/signin", wait_until="domcontentloaded")
            await asyncio.sleep(2)

            # Step 1: Enter email
            email_selector = 'input[type="email"]'
            await page.wait_for_selector(email_selector, timeout=15000)
            await page.click(email_selector)
            await page.fill(email_selector, "")
            await page.type(email_selector, email, delay=50)
            await asyncio.sleep(0.5)

            # Click Next
            next_btn = page.locator('#identifierNext button, #identifierNext')
            await next_btn.click()
            await asyncio.sleep(3)

            # Step 2: Enter password
            password_selector = 'input[type="password"]'
            await page.wait_for_selector(password_selector, state="visible", timeout=15000)
            await page.click(password_selector)
            await page.fill(password_selector, "")
            await page.type(password_selector, password, delay=50)
            await asyncio.sleep(0.5)

            # Click Next
            pass_next = page.locator('#passwordNext button, #passwordNext')
            await pass_next.click()
            await asyncio.sleep(5)

            # Check for 2FA or verification challenges
            current_url = page.url
            if "challenge" in current_url or "signin/v2" in current_url:
                # Wait longer for user to complete 2FA if needed
                logger.warning("Google 2FA/challenge detected at %s — waiting 30s", current_url)
                await asyncio.sleep(30)

            # Wait for successful login (redirect away from accounts.google.com/signin)
            try:
                await page.wait_for_url(
                    lambda url: "myaccount.google.com" in url or "google.com/search" in url or "mail.google.com" in url,
                    timeout=60000,
                )
            except Exception:
                # Check if we're at least past the login page
                final_url = page.url
                if "accounts.google.com/signin" in final_url:
                    logger.error("Still on login page: %s", final_url)
                    page_text = await page.evaluate("() => document.body.innerText.substring(0, 500)")
                    await context.close()
                    return {
                        "status": "failed",
                        "url": final_url,
                        "message": page_text[:200],
                    }

            # Extract cookies from authenticated context
            cookies = await context.cookies()
            self.set_cookies(cookies)

            domains = set()
            for c in cookies:
                d = c.get("domain", "")
                if d:
                    domains.add(d.lstrip("."))

            logger.info("Google login successful — stored %d cookies for %d domains", len(cookies), len(domains))
            return {
                "status": "ok",
                "cookies_stored": len(cookies),
                "domains": sorted(domains),
                "url": page.url,
            }
        except Exception as e:
            logger.error("Google login failed: %s", e)
            raise
        finally:
            await context.close()

    async def login_linkedin(self, email: str, password: str) -> dict:
        """Login to LinkedIn via Playwright and store session cookies.

        Flow:
        1. Navigate to linkedin.com/login
        2. Enter email and password
        3. Click Sign in
        4. Wait for feed redirect
        5. Extract and store cookies
        """
        await self._ensure_browser()

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

        try:
            page = await context.new_page()
            page.set_default_timeout(60000)

            await page.goto("https://www.linkedin.com/login", wait_until="domcontentloaded")
            await asyncio.sleep(2)

            # Enter email
            email_selector = '#username'
            await page.wait_for_selector(email_selector, timeout=15000)
            await page.click(email_selector)
            await page.fill(email_selector, "")
            await page.type(email_selector, email, delay=50)
            await page.dispatch_event(email_selector, 'input')
            await page.dispatch_event(email_selector, 'change')
            await asyncio.sleep(0.3)

            # Enter password
            password_selector = '#password'
            await page.click(password_selector)
            await page.fill(password_selector, "")
            await page.type(password_selector, password, delay=50)
            await page.dispatch_event(password_selector, 'input')
            await page.dispatch_event(password_selector, 'change')
            await asyncio.sleep(0.3)

            # Click Sign in
            await page.evaluate("""() => {
                const btn = document.querySelector('button[type="submit"], .login__form_action_container button');
                if (btn) btn.click();
            }""")
            await asyncio.sleep(5)

            # Check for verification challenge
            current_url = page.url
            if "checkpoint" in current_url or "challenge" in current_url:
                logger.warning("LinkedIn verification challenge at %s — waiting 30s", current_url)
                await asyncio.sleep(30)

            # Wait for feed/home page
            try:
                await page.wait_for_url(
                    lambda url: "/feed" in url or "/mynetwork" in url or "linkedin.com/in/" in url,
                    timeout=60000,
                )
            except Exception:
                final_url = page.url
                if "/login" in final_url or "/checkpoint" in final_url:
                    page_text = await page.evaluate("() => document.body.innerText.substring(0, 500)")
                    await context.close()
                    return {
                        "status": "failed",
                        "url": final_url,
                        "message": page_text[:200],
                    }

            # Extract cookies
            cookies = await context.cookies()
            self.set_cookies(cookies)

            domains = set()
            for c in cookies:
                d = c.get("domain", "")
                if d:
                    domains.add(d.lstrip("."))

            logger.info("LinkedIn login successful — stored %d cookies for %d domains", len(cookies), len(domains))
            return {
                "status": "ok",
                "cookies_stored": len(cookies),
                "domains": sorted(domains),
                "url": page.url,
            }
        except Exception as e:
            logger.error("LinkedIn login failed: %s", e)
            raise
        finally:
            await context.close()

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
