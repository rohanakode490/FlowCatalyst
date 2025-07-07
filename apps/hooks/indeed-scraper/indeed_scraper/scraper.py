"""
Job listing scraper for Indeed.com.

This module handles the extraction of job listings from search result pages.
"""

import re
import signal
import time
from typing import List, Optional, Set, Tuple, Any, Callable
from urllib.parse import quote_plus
from contextlib import contextmanager, nullcontext
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from seleniumbase import Driver
import pyautogui
from pyvirtualdisplay import Display
from Xlib import display as xdisplay

from .models import JobListing, ScrapeJob
from .config import config
from .logger import logger
from .browser import setup_browser, random_delay, scroll_page, navigate_to_next_page
from .descriptions import batch_scrape_descriptions

SHOULD_EXIT = False

def handle_exit_signal(sig=None, frame=None) -> None:
    """Handle exit signals like Ctrl+C."""
    global SHOULD_EXIT
    logger.info("Received exit signal. Cleaning up...")
    SHOULD_EXIT = True

@contextmanager
def setup_virtual_display():
    """Set up a virtual X11 display using pyvirtualdisplay."""
    try:
        virtual_display = Display(visible=0, size=(1920, 1080), backend="xvfb")
        # virtual_display.start()
        logger.info("Virtual display started")
        
        # Verify display with Xlib
        try:
            xdisp = xdisplay.Display()
            logger.info(f"X11 display verified: {xdisp.get_display_name()}")
        except Exception as e:
            logger.error(f"Failed to verify X11 display: {e}")
            raise
        
        yield virtual_display
    finally:
        # virtual_display.stop()
        logger.info("Virtual display stopped")

def get_search_url(
    job_title: str,
    location: str = "",
    # search_radius: Optional[int] = None,
    days_ago: int = 7,
    work_setting: Optional[str] = None,
    job_type: Optional[str] = None
) -> str:
    """Build an Indeed search URL with the specified parameters."""
    url = f"https://www.indeed.co.in/jobs?q={quote_plus(job_title)}"
    if location:
        url += f"&l={quote_plus(location)}"
        # radius = search_radius or config.default_search_radius
        # url += f"&radius={radius}"
    
    url += f"&fromage={days_ago if days_ago in config.valid_days_ago else config.default_days_ago}"
    
    if work_setting and work_setting in config.work_setting_filters:
        url += config.work_setting_filters[work_setting]
    
    if job_type and job_type.lower() in config.job_type_filters:
        url += config.job_type_filters[job_type.lower()]
    
    return url

def find_element_with_retry(card: WebElement, selectors: List[Tuple[str, str]]) -> Optional[WebElement]:
    """Find an element using multiple selectors with retry."""
    for selector_type, selector in selectors:
        if selector_type != "css selector":
            continue
        try:
            return card.find_element(By.CSS_SELECTOR, selector)
        except NoSuchElementException:
            continue
    return None

def extract_job_data(card: WebElement) -> Optional[dict]:
    """Extract information from a job card."""
    try:
        job_data = {}
        required_fields = ['title', 'company', 'link']
        
        for field, selectors in config.JOB_FIELD_SELECTORS.items():
            element = find_element_with_retry(card, selectors)
            
            if not element:
                if field in required_fields:
                    return None
                job_data[field] = None
                continue
                
            if field == 'link':
                original_url = element.get_attribute('href')
                job_id_match = re.search(r'jk=([a-zA-Z0-9]+)', original_url)
                if job_id_match:
                    job_id = job_id_match.group(1)
                    job_data['job_id'] = job_id
                    job_data[field] = f"https://www.indeed.co.in/viewjob?jk={job_id}"
                else:
                    job_data[field] = original_url
                    job_data['job_id'] = None
            else:
                if field == 'title' and element.get_attribute('title'):
                    job_data[field] = element.get_attribute('title')
                else:
                    job_data[field] = element.text.strip()
        
        if not all(job_data.get(field) for field in required_fields):
            return None
            
        return job_data
        
    except Exception as e:
        logger.debug(f"Failed to scrape job card: {e}")
        return None

@contextmanager
def setup_exit_handler() -> None:
    """Set up signal handlers for graceful exit."""
    global SHOULD_EXIT
    SHOULD_EXIT = False
    
    old_handlers = {}
    
    try:
        for sig in [signal.SIGINT, signal.SIGTERM]:
            old_handlers[sig] = signal.getsignal(sig)
            signal.signal(sig, handle_exit_signal)
        yield
    finally:
        for sig, handler in old_handlers.items():
            signal.signal(sig, handler)

def solve_captcha_pyautogui(driver: Driver) -> bool:
    """Attempt to solve CAPTCHA using pyautogui to click the checkbox."""
    try:
        captcha_checkbox = WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "iframe[src*='challenges.cloudflare.com/turnstile']"))
        )
        location = captcha_checkbox.location
        size = captcha_checkbox.size
        x = location['x'] + size['width'] // 2
        y = location['y'] + size['height'] // 2
        
        logger.info(f"Attempting pyautogui click at ({x}, {y})")
        pyautogui.moveTo(x, y, duration=0.7)
        pyautogui.click()
        random_delay(2.0, 4.0)
        
        # Verify CAPTCHA resolution
        # WebDriverWait(driver, 5).until_not(
        #     EC.presence_of_element_located((By.CSS_SELECTOR, "div.g-recaptcha, iframe[title*='recaptcha']"))
        # )
        logger.info("CAPTCHA resolved by pyautogui")
        return True
    except Exception as e:
        logger.warning(f"pyautogui CAPTCHA solving failed: {e}")
        return False

def handle_possible_captcha(driver: Driver, input_prompt: Callable = input) -> bool:
    """Handle CAPTCHA if present, using uc_gui_click_captcha, pyautogui, or manual input."""
    for attempt in range(3):  # Retry up to 3 times
        try:
            captcha_element = WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[name*='cf-turnstile-response']"))
            )
            logger.info(f"CAPTCHA detected on attempt {attempt + 1}")
            
            # Try SeleniumBase's uc_gui_click_captcha
            try:
                random_delay(2.0, 4.0)
                driver.uc_gui_handle_captcha()
                # driver.uc_gui_click_captcha()
                logger.info("Attempted uc_gui_click_captcha")
                random_delay(2.0, 4.0)
                WebDriverWait(driver, 15).until_not(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div[class='job_seen_beacon]"))
                )
                logger.info("CAPTCHA resolved by uc_gui_click_captcha")
                return True
            except Exception as e:
                logger.warning(f"uc_gui_click_captcha failed: {e}")
            
            # Try pyautogui for checkbox CAPTCHAs
            if solve_captcha_pyautogui(driver):
                return True
            
            # Fallback to manual solving if not headless
            # if not driver.is_headless:
            #     logger.info("Please solve the CAPTCHA manually in the browser and press Enter to continue...")
            #     input_prompt("Press Enter after solving CAPTCHA: ")
            #     random_delay(2.0, 4.0)
            #     return True
            
            logger.error("Manual CAPTCHA solving not possible in headless mode")
            return False
        except TimeoutException:
            logger.info("No CAPTCHA detected")
            return True  # No CAPTCHA, proceed
        except Exception as e:
            logger.error(f"CAPTCHA handling failed on attempt {attempt + 1}: {e}")
            random_delay(2.0, 4.0)
    
    logger.error("Failed to handle CAPTCHA after 3 attempts")
    return False

def scrape_job_listings(
    job_title: str,
    location: str = "",
    # search_radius: Optional[int] = None,
    max_pages: int = 3,
    days_ago: int = 7,
    work_setting: Optional[str] = None,
    job_type: Optional[str] = None,
    headless: bool = False,  # Default to non-headless with virtual display
    captcha_already_solved: bool=False,
    input_prompt: Callable = input,
    driver: Optional[Driver] = None,
    proxy: Optional[str] = None
) -> List[JobListing]:
    """Main function to scrape Indeed job listings."""
    all_jobs = []
    with setup_exit_handler():
        if SHOULD_EXIT:
            return all_jobs
        
        # Set up virtual display only if not headless
        print("not headless", not headless)
        display_ctx = setup_virtual_display() if not headless else nullcontext()
        browser_ctx = setup_browser(headless=headless, proxy=proxy) if driver is None else nullcontext(driver)
        
        with display_ctx, browser_ctx as driver_instance:
            try:
                # search_url = get_search_url(
                #     job_title, location, search_radius, days_ago, work_setting, job_type
                # )
                search_url = get_search_url(
                    job_title, location, days_ago, work_setting, job_type
                )
                logger.info(f"Searching for jobs: {search_url}")
                driver_instance.uc_open_with_reconnect(search_url, 4)
                random_delay(5.0, 8.0)
                
                # if not captcha_already_solved: 
                if not handle_possible_captcha(driver_instance, input_prompt):
                    # driver.uc_gui_click_captcha()
                    # driver.uc_gui_handle_captcha()
                    logger.error("Failed to proceed due to unresolved CAPTCHA")
                    return all_jobs
                
                random_delay(5.0, 8.0)
                job_ids = set()
                
                for page in range(1, max_pages + 1):
                    if SHOULD_EXIT:
                        break
                        
                    logger.info(f"Scraping page {page} of {max_pages}...")
                    scroll_page(driver_instance)
                    
                    job_cards = driver_instance.find_elements(By.CSS_SELECTOR, config.job_card_selector)
                    if not job_cards:
                        logger.info("No job cards found on this page.")
                        if not handle_possible_captcha(driver_instance, input_prompt):
                            logger.info("Stopping due to unresolved CAPTCHA or no jobs.")
                            break
                        job_cards = driver_instance.find_elements(By.CSS_SELECTOR, config.job_card_selector)
                        if not job_cards:
                            logger.info("Still no job cards found after CAPTCHA handling.")
                            break
                        
                    jobs_on_page = []
                    
                    for card in job_cards:
                        if SHOULD_EXIT:
                            break
                            
                        job_data = extract_job_data(card)
                        if not job_data:
                            continue
                            
                        job_id = job_data.get('job_id', '')
                        if job_id and job_id in job_ids:
                            continue
                            
                        if job_id:
                            job_ids.add(job_id)
                        
                        job_listing = JobListing(
                            title=job_data['title'],
                            company=job_data['company'],
                            location=job_data.get('location'),
                            salary=job_data.get('salary'),
                            job_url=job_data.get('link'),
                            job_id=job_data.get('job_id'),
                            job_type=job_data.get('job_type'),
                            work_setting=job_data.get('work_setting'),
                            search_url=search_url,
                            queried_job_title=job_title
                        )
                        
                        jobs_on_page.append(job_listing)
                        random_delay(0.2, 0.5)
                    
                    logger.info(f"Found {len(jobs_on_page)} unique jobs on this page")
                    
                    if jobs_on_page:
                        processed_jobs = batch_scrape_descriptions(driver_instance, jobs_on_page, input_prompt)
                        all_jobs.extend(processed_jobs)
                    
                    if page >= max_pages:
                        break
                        
                    if not navigate_to_next_page(driver_instance):
                        logger.info("No more pages to scrape")
                        break
                        
                    random_delay(2.0, 4.0)
                
                logger.info(f"Scraped {len(all_jobs)} unique jobs total")
                return all_jobs
                
            except Exception as e:
                logger.error(f"Error during scraping: {e}")
                return all_jobs

def run_scrape_job(
    scrape_job: ScrapeJob,
    headless: bool = False,  # Default to non-headless with virtual display
    captcha_already_solved: bool = False,
    input_prompt: Callable = input,
    driver: Optional[Driver] = None,
    proxy: Optional[str] = None
) -> List[JobListing]:
    """Run a scrape job with the given configuration."""
    logger.info(f"Starting scrape job: {scrape_job.job_title} in {scrape_job.location or 'any location'}")
    
    jobs = scrape_job_listings(
        job_title=scrape_job.job_title,
        location=scrape_job.location or "",
        # search_radius=scrape_job.search_radius,
        max_pages=scrape_job.max_pages,
        days_ago=scrape_job.days_ago,
        work_setting=scrape_job.work_setting,
        job_type=scrape_job.job_type,
        headless=headless,
        captcha_already_solved=captcha_already_solved,
        input_prompt=input_prompt,
        driver=driver,
        proxy=proxy
    )
    
    logger.info(f"Completed scrape job: {scrape_job.job_title}. Found {len(jobs)} jobs.")
    return jobs
