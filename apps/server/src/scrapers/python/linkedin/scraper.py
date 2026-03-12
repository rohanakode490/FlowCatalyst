import asyncio
import logging
import random
import re
from typing import Any, Optional, List, Dict

import httpx
from bs4 import BeautifulSoup, Tag

# --- Configuration & Utilities ---

logger = logging.getLogger(__name__)

# Default interval if not using proxies. 
# If using proxies, this can be reduced significantly.
REQUEST_INTERVAL = 1.0 
MAX_RETRIES = 3

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Edge/121.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
]

GUEST_API_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"

class RateLimiter:
    def __init__(self, interval: float = REQUEST_INTERVAL) -> None:
        self._interval = interval
        self._last_request: float = 0.0
        self._lock = asyncio.Lock()

    async def wait(self) -> None:
        async with self._lock:
            now = asyncio.get_event_loop().time()
            elapsed = now - self._last_request
            if elapsed < self._interval:
                await asyncio.sleep(self._interval - elapsed)
            self._last_request = asyncio.get_event_loop().time()

async def fetch_html(
    client: httpx.AsyncClient,
    url: str,
    rate_limiter: RateLimiter,
    params: Optional[Dict[str, str]] = None,
    proxy: Optional[str] = None
) -> Optional[str]:
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    
    for attempt in range(MAX_RETRIES):
        await rate_limiter.wait()
        try:
            if proxy:
                # If using a proxy, we must create a temporary client with the proxy transport
                transport = httpx.AsyncHTTPTransport(proxy=proxy)
                async with httpx.AsyncClient(transport=transport) as proxy_client:
                    response = await proxy_client.get(
                        url, params=params, headers=headers, timeout=20.0, follow_redirects=True
                    )
            else:
                # Otherwise, use the shared client directly
                response = await client.get(
                    url, params=params, headers=headers, timeout=20.0, follow_redirects=True
                )
            
            if response.status_code == 200:
                return response.text
            if response.status_code in [429, 403]:
                await asyncio.sleep(5 * (attempt + 1))
                continue
        except Exception as e:
            logger.error(f"Request failed: {e}")
            await asyncio.sleep(2)
    return None

class LinkedInLiteScraper:
    def __init__(self, client: httpx.AsyncClient, max_results: int = 20, proxies: List[str] = None):
        self.client = client
        self.rate_limiter = RateLimiter(0.1 if proxies else 2.0) # Faster if we have proxies
        self.max_results = max_results
        self.proxies = proxies or []

    async def search_jobs_concurrent(
        self, 
        keywords: str, 
        location: str = "", 
        skills: List[str] = None,          # New: List of languages/skills (e.g., ["Python", "AWS"])
        time_period: str = "",
        experience_levels: List[str] = None, # 1: Internship, 2: Entry, 3: Associate, 4: Mid-Senior, 5: Director, 6: Executive
        job_types: List[str] = None,        # F: Full-time, P: Part-time, C: Contract, T: Temporary
        workplace_types: List[str] = None   # 1: On-site, 2: Remote, 3: Hybrid
    ) -> List[Dict[str, Any]]:
        
        # Combine keywords and skills for a more targeted search
        query = keywords
        if skills:
            query += " " + " ".join(skills)

        base_params = {"keywords": query, "location": location}
        if time_period: 
            base_params["f_TPR"] = time_period
        if experience_levels: 
            base_params["f_E"] = ",".join(experience_levels)
        if job_types:
            base_params["f_JT"] = ",".join(job_types)
        if workplace_types: 
            base_params["f_WT"] = ",".join(workplace_types)

        # Calculate number of pages (25 jobs per page)
        num_pages = (self.max_results // 25) + (1 if self.max_results % 25 > 0 else 0)
        tasks = []

        for i in range(num_pages):
            start = i * 25
            page_params = {**base_params, "start": str(start)}
            proxy = random.choice(self.proxies) if self.proxies else None
            tasks.append(fetch_html(self.client, GUEST_API_URL, self.rate_limiter, page_params, proxy))

        pages_html = await asyncio.gather(*tasks)
        
        all_jobs = []
        for html in pages_html:
            if not html: 
                continue
            soup = BeautifulSoup(html, "lxml")
            cards = soup.find_all("div", class_="job-search-card")
            for card in cards:
                if len(all_jobs) >= self.max_results: 
                    break
                job = self._parse_card(card)
                if job: 
                    all_jobs.append(job)
        
        return all_jobs

    def _parse_card(self, card: Tag) -> Dict[str, Any]:
        job = {}
        urn = card.get("data-entity-urn", "")
        if "jobPosting:" in str(urn):
            job["jobId"] = str(urn).split("jobPosting:")[-1]
        
        title_el = card.find("h3", class_=re.compile(r"base-search-card__title"))
        if title_el: 
            job["title"] = title_el.get_text(strip=True)
        
        company_el = card.find("h4", class_=re.compile(r"base-search-card__subtitle"))
        if company_el: 
            job["company"] = company_el.get_text(strip=True)
            # New Output: Company URL
            company_link = company_el.find("a")
            if company_link:
                job["company_url"] = company_link.get("href", "").split("?")[0]

        location_el = card.find("span", class_=re.compile(r"job-search-card__location"))
        if location_el: 
            job["location"] = location_el.get_text(strip=True)
        
        # New Output: Posted Date
        time_el = card.find("time", class_=re.compile(r"job-search-card__listdate"))
        if time_el: 
            job["posted_at"] = time_el.get("datetime")
        
        link_el = card.find("a", class_=re.compile(r"base-card__full-link"))
        if link_el: 
            job["url"] = link_el.get("href", "").split("?")[0]
        
        return job
