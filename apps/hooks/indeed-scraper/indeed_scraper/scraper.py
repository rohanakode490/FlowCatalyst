"""
Job listing scraper for Indeed.com.

This module handles the extraction of job listings from search result pages.
"""

import re
import signal
from typing import List, Dict, Optional, Set, Tuple, Any, Callable
from urllib.parse import quote_plus
from contextlib import contextmanager, nullcontext
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from seleniumbase import Driver

from .models import JobListing, ScrapeJob
from .config import config
from .logger import logger
from .browser import setup_browser, random_delay, scroll_page, navigate_to_next_page, handle_possible_captcha
from .descriptions import batch_scrape_descriptions

# Signal handling for graceful shutdown
SHOULD_EXIT = False

def handle_exit_signal(sig=None, frame=None) -> None:
    """Handle exit signals like Ctrl+C."""
    global SHOULD_EXIT
    logger.info("Received exit signal. Cleaning up...")
    SHOULD_EXIT = True

def get_search_url(
    job_title: str,
    location: str = "",
    search_radius: Optional[int] = None,
    days_ago: int = 7,
    work_setting: Optional[str] = None,
    job_type: Optional[str] = None
) -> str:
    """
    Build an Indeed search URL with the specified parameters.
    
    Args:
        job_title: Job title to search for
        location: Location to search in
        search_radius: Search radius in miles
        days_ago: Filter for jobs posted within this many days
        work_setting: Work setting filter (remote, hybrid, onsite)
        job_type: Job type filter
        
    Returns:
        Formatted search URL
    """
    url = f"https://www.indeed.com/jobs?q={quote_plus(job_title)}"
    
    if location:
        url += f"&l={quote_plus(location)}"
        radius = search_radius or config.default_search_radius
        url += f"&radius={radius}"
    
    url += f"&fromage={days_ago if days_ago in config.valid_days_ago else config.default_days_ago}"
    
    if work_setting and work_setting in config.work_setting_filters:
        url += config.work_setting_filters[work_setting]
    
    if job_type and job_type.lower() in config.job_type_filters:
        url += config.job_type_filters[job_type.lower()]
    
    return url

def find_element_with_retry(card: WebElement, selectors: List[Tuple[str, str]]) -> Optional[WebElement]:
    """
    Find an element using multiple selectors with retry.
    
    Args:
        card: Parent WebElement to search within
        selectors: List of (selector_type, selector) tuples to try
        
    Returns:
        WebElement if found, None otherwise
    """
    for selector_type, selector in selectors:
        if selector_type != "css selector":
            continue  # SeleniumBase uses CSS selectors
        try:
            return card.find_element(By.CSS_SELECTOR, selector)
        except NoSuchElementException:
            continue
    return None

def extract_job_data(card: WebElement) -> Optional[Dict[str, Any]]:
    """
    Extract information from a job card.
    
    Args:
        card: Job card WebElement to extract data from
        
    Returns:
        Dictionary of job data or None if extraction failed
    """
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
                    job_data[field] = f"https://www.indeed.com/viewjob?jk={job_id}"
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
    """
    Set up signal handlers for graceful exit.
    
    Yields:
        None
    """
    global SHOULD_EXIT
    SHOULD_EXIT = False
    
    old_handlers = {}
    
    try:
        for sig in [signal.SIGINT, signal.SIGTERM]:
            old_handlers[sig] = signal.getsignal(sig)
            signal.signal(sig, handle_exit_signal)
        yield
    finally:
        # Restore original handlers
        for sig, handler in old_handlers.items():
            signal.signal(sig, handler)

def scrape_job_listings(
    job_title: str,
    location: str = "",
    search_radius: Optional[int] = None,
    max_pages: int = 3,
    days_ago: int = 7,
    work_setting: Optional[str] = None,
    job_type: Optional[str] = None,
    captcha_already_solved: bool = False,
    headless: bool = False,
    input_prompt: Callable = input,
    driver: Optional[Driver] = None,
    proxy: Optional[str] = None
) -> List[JobListing]:
    """
    Main function to scrape Indeed job listings.
    
    Args:
        job_title: Job title to search for
        location: Location to search in
        search_radius: Search radius in miles
        max_pages: Number of result pages to scrape
        days_ago: Filter for jobs posted within this many days
        work_setting: Work setting filter (remote, hybrid, onsite)
        job_type: Job type filter
        captcha_already_solved: Whether CAPTCHA has already been solved
        headless: Whether to run browser in headless mode
        input_prompt: Function to get user input for CAPTCHA handling
        driver: Existing browser instance to reuse
        proxy: Proxy URL
        
    Returns:
        List of JobListing objects
    """
    with setup_exit_handler():
        if SHOULD_EXIT:
            return []
        
        # Reuse existing driver or spin up a new one
        browser_ctx = setup_browser(headless=headless, proxy=proxy) if driver is None else nullcontext(driver)
        with browser_ctx as driver_instance:
            try:
                search_url = get_search_url(
                    job_title, location, search_radius, days_ago, work_setting, job_type
                )
                logger.info(f"Searching for jobs: {search_url}")
                driver_instance.get(search_url)
                random_delay()
                
                if not captcha_already_solved:
                    driver_instance.uc_gui_click_captcha()
                    logger.info("Attempted automated CAPTCHA handling")
                    random_delay(1.0, 2.0)
                
                all_jobs = []
                job_ids = set()
                title_company_pairs = set()
                
                for page in range(1, max_pages + 1):
                    if SHOULD_EXIT:
                        break
                        
                    logger.info(f"Scraping page {page} of {max_pages}...")
                    scroll_page(driver_instance)
                    
                    job_cards = driver_instance.find_elements(By.CSS_SELECTOR, config.job_card_selector)
                    if not job_cards:
                        logger.info("No job cards found on this page.")
                        if handle_possible_captcha(driver_instance, input_prompt):
                            job_cards = driver_instance.find_elements(By.CSS_SELECTOR, config.job_card_selector)
                            if not job_cards:
                                logger.info("Still no job cards found after CAPTCHA handling. Moving to next job.")
                                break
                        else:
                            return all_jobs
                        
                    jobs_on_page = []
                    
                    for card in job_cards:
                        if SHOULD_EXIT:
                            break
                            
                        job_data = extract_job_data(card)
                        if not job_data:
                            continue
                            
                        job_id = job_data.get('job_id', '')
                        
                        title_company = f"{job_data['title']}_{job_data['company']}"
                        
                        if (job_id and job_id in job_ids) or (title_company in title_company_pairs):
                            continue
                            
                        if job_id:
                            job_ids.add(job_id)
                        title_company_pairs.add(title_company)
                        
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
                            queried_job_title=job_data.get('title')
                        )
                        
                        jobs_on_page.append(job_listing)
                        random_delay(0.2, 0.5)
                    
                    logger.info(f"Found {len(jobs_on_page)} unique jobs on this page")
                    
                    # Scrape descriptions for the jobs on this page
                    if jobs_on_page:
                        processed_jobs = batch_scrape_descriptions(driver_instance, jobs_on_page, input_prompt)
                        all_jobs.extend(processed_jobs)
                    
                    if SHOULD_EXIT or page >= max_pages:
                        break
                        
                    if not navigate_to_next_page(driver_instance):
                        logger.info("No more pages to scrape")
                        break
                        
                    random_delay(2.0, 4.0)
                
                logger.info(f"Scraped {len(all_jobs)} unique jobs total")
                return all_jobs
                
            except Exception as e:
                logger.error(f"Error during scraping: {str(e)}")
                return []

def run_scrape_job(
    scrape_job: ScrapeJob,
    headless: bool = False,
    captcha_already_solved: bool = False,
    input_prompt: Callable = input,
    driver: Optional[Driver] = None,
    proxy: Optional[str]=None
) -> List[JobListing]:
    """
    Run a scrape job with the given configuration.
    
    Args:
        scrape_job: Job configuration
        headless: Whether to run browser in headless mode
        captcha_already_solved: Whether CAPTCHA has already been solved
        input_prompt: Function to get user input for CAPTCHA handling
        driver: Existing browser instance to reuse
        proxy: Proxy URL
        
    Returns:
        List of scraped job listings
    """
    logger.info(f"Starting scrape job: {scrape_job.job_title} in {scrape_job.location or 'any location'}")
    
    jobs = scrape_job_listings(
        job_title=scrape_job.job_title,
        location=scrape_job.location or "",
        search_radius=scrape_job.search_radius,
        max_pages=scrape_job.max_pages,
        days_ago=scrape_job.days_ago,
        work_setting=scrape_job.work_setting,
        job_type=scrape_job.job_type,
        captcha_already_solved=captcha_already_solved,
        headless=headless,
        input_prompt=input_prompt,
        driver=driver,
        proxy=proxy
    )
    
    logger.info(f"Completed scrape job: {scrape_job.job_title}. Found {len(jobs)} jobs.")
    return jobs
