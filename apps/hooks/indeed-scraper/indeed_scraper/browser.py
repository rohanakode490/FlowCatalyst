"""Browser setup and navigation helpers for Indeed job scraper."""

import random
import time
import os
from typing import Optional, Callable, Generator
from contextlib import contextmanager
from seleniumbase import Driver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import (
    TimeoutException, NoSuchElementException, ElementNotInteractableException, WebDriverException
)

from .config import config
from .logger import logger

class CaptchaDetectedException(Exception):
    """Exception raised when a CAPTCHA is detected."""
    pass

# @contextmanager
# def setup_browser(headless: bool = False, proxy: Optional[str] = None) -> Generator[Driver, None, None]:
#     """
#     Set up and tear down SeleniumBase Driver instance.
#     Args:
#         headless: Whether to run in headless mode
#     Yields:
#         SeleniumBase Driver instance
#     """
#     driver = None
#     try:
#         logger.info("Setting up browser...")
#         # Initialize SeleniumBase Driver with undetected mode
#         driver = Driver(uc=True, headless=headless, disable_gpu=True, no_sandbox=True)
#         driver.maximize_window()
#         driver.implicitly_wait(10)  # Implicit wait for elements
#         logger.info("Browser setup complete")
#         yield driver
#     except WebDriverException as e:
#         logger.error(f"Browser setup failed: {e}")
#         try:
#             # Fallback with minimal options
#             driver = Driver(uc=True, headless=headless)
#             driver.maximize_window()
#             driver.implicitly_wait(10)
#             logger.info("Browser setup complete with minimal options")
#             yield driver
#         except Exception as e:
#             logger.error(f"Browser setup failed with minimal options: {e}")
#             raise
#     finally:
#         if driver:
#             logger.info("Closing browser")
#             try:
#                 driver.quit()
#             except Exception as e:
#                 logger.error(f"Browser cleanup failed: {e}")

@contextmanager
def setup_browser(headless: bool = True, proxy: Optional[str] = None):
    """
    Set up a SeleniumBase Driver with proxy support.
    
    Args:
        headless: Run browser in headless mode
        proxy: Proxy URL (e.g., http://user:pass@host:port)
    
    Yields:
        SeleniumBase Driver instance
    """
    try:
        driver = Driver(
            browser="chrome",
            headless2=headless,
            incognito=True,
            proxy=proxy,
            uc=True,
            disable_js=False
        )
        logger.info(f"Browser initialized (headless={headless}, proxy={proxy})")
        yield driver
    except Exception as e:
        logger.error(f"Browser setup failed: {e}")
        raise
    finally:
        try:
            driver.quit()
            logger.info("Browser closed")
        except Exception:
            pass

def random_delay(min_seconds: Optional[float] = None, max_seconds: Optional[float] = None) -> None:
    """
    Add a random delay to mimic human behavior.

    Args:
        min_seconds: Minimum seconds to delay (default from config)
        max_seconds: Maximum seconds to delay (default from config)
    """
    min_s = min_seconds if min_seconds is not None else float(os.getenv('INDEED_MIN_DELAY_SECONDS', config.min_delay_seconds))
    max_s = max_seconds if max_seconds is not None else float(os.getenv('INDEED_MAX_DELAY_SECONDS', config.max_delay_seconds))
    time.sleep(random.uniform(min_s, max_s))

def scroll_page(driver: Driver) -> None:
    """
    Scroll the page to load all content.

    Args:
        driver: SeleniumBase Driver instance
    """
    logger.info("Scrolling page...")

    last_height = driver.execute_script("return document.body.scrollHeight")

    for i in range(1, 11):
        driver.execute_script(f"window.scrollTo(0, {i * last_height / 10});")
        time.sleep(0.2)

    time.sleep(1)

    new_height = driver.execute_script("return document.body.scrollHeight")
    if new_height > last_height:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1)

def navigate_to_next_page(driver: Driver) -> bool:
    """
    Navigate to the next page of search results.

    Args:
        driver: SeleniumBase Driver instance

    Returns:
        bool: True if navigated to next page, False if no next page
    """
    try:
        next_buttons = driver.find_elements(By.CSS_SELECTOR, config.next_page_selector)
        if not next_buttons:
            logger.info("No next page button found - reached the last page")
            return False

        next_page_url = next_buttons[0].get_attribute('href')
        if not next_page_url:
            return False

        current_url = driver.current_url
        driver.get(next_page_url)

        WebDriverWait(driver, config.browser_timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, config.job_card_selector))
        )

        if driver.current_url == current_url:
            return False

        random_delay()
        # Attempt CAPTCHA handling
        driver.uc_gui_click_captcha()
        random_delay()
        return True

    except (TimeoutException, NoSuchElementException, ElementNotInteractableException) as e:
        logger.warning(f"Error navigating to next page: {e}")
        return False

def handle_possible_captcha(driver: Driver, input_prompt: Callable = input) -> bool:
    """
    Handle a potential CAPTCHA situation by attempting automated handling.

    Args:
        driver: SeleniumBase Driver instance
        input_prompt: Function to get user input (fallback)

    Returns:
        bool: True if CAPTCHA was handled or no CAPTCHA detected, False if user exits
    """
    try:
        # Try automated CAPTCHA handling
        driver.uc_gui_click_captcha()
        logger.info("Attempted automated CAPTCHA handling")
        time.sleep(2)  # Wait for page to stabilize
        return True
    except Exception as e:
        logger.warning(f"Automated CAPTCHA handling failed: {e}")
        # Fallback to manual prompt
        captcha_message = """
        !! CAPTCHA DETECTED !!
        ======================

        Automated CAPTCHA handling failed.
        Please check the browser window and solve any CAPTCHAs if present.
        After solving the CAPTCHA, press Enter to continue scraping...
        """

        logger.warning(captcha_message)

        try:
            current_url = driver.current_url
            driver.get("https://www.indeed.com/")
            time.sleep(1)
        except Exception as e:
            logger.error(f"Error navigating to Indeed homepage: {e}")

        try:
            response = input_prompt("Press Enter after solving the CAPTCHA (or Ctrl+C to exit): ")
            time.sleep(2)

            try:
                if driver.current_url != current_url:
                    driver.get(current_url)
                    time.sleep(2)
            except Exception as e:
                logger.error(f"Error navigating back to original URL: {e}")

            return True
        except (KeyboardInterrupt, EOFError):
            logger.info("User requested exit")
            return False
