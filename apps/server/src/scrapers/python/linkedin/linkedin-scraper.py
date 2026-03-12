import sys
import json
import os
import asyncio
from typing import List 
from dotenv import load_dotenv
import httpx

# Import the new scraper logic
from scraper import LinkedInLiteScraper

load_dotenv()

# --- Proxy Configuration ---
proxies_str = os.getenv("PROXIES", "")
PROXIES = [p.strip() for p in proxies_str.split(",") if p.strip()]

def parse_list_arg(arg: str) -> List[str]:
    """Convert a string representation of a list into a Python list with string elements."""
    try:
        if arg.startswith("[") and arg.endswith("]"):
            parsed_list = json.loads(arg.replace("'", '"'))
        else:
            parsed_list = [arg]
        return [str(item) for item in parsed_list]
    except (json.JSONDecodeError, TypeError):
        return [str(arg)]

def parse_remote_arg(arg: str) -> List[str]:
    """
    In old scraper, 'remote' was often passed as boolean-like string or list of strings.
    In new scraper, workplace_types: 1: On-site, 2: Remote, 3: Hybrid
    """
    try:
        # If passed as JSON list like '["true"]' or '["2"]'
        val = parse_list_arg(arg)
        # If it contains "true" or "2", we'll treat it as remote.
        if "true" in [v.lower() for v in val] or "2" in val:
            return ["2"]
    except:
        pass
    return []

async def fetch_jobs_and_print(
    keywords: str, 
    location: str, 
    limit: int = 20, 
    experience: List[str] = None, 
    remote: List[str] = None, 
    job_type: List[str] = None, 
    listed_at: int = 86400, 
    existing_urns: List[str] = None
):
    if existing_urns is None:
        existing_urns = []

    # Map listed_at (seconds) to f_TPR (LinkedIn filter)
    # listed_at 86400 -> r86400
    time_period = f"r{listed_at}" if listed_at else ""

    async with httpx.AsyncClient() as client:
        scraper = LinkedInLiteScraper(client, max_results=limit, proxies=PROXIES)
        
        # In this lite version, 'skills' isn't explicitly passed but we can add to keywords if needed.
        # For now, we'll keep it as keywords for the most part.
        
        jobs = await scraper.search_jobs_concurrent(
            keywords=keywords,
            location=location,
            time_period=time_period,
            experience_levels=experience if experience and experience != [""] else None,
            job_types=job_type if job_type and job_type != [""] else None,
            workplace_types=remote if remote and remote != [""] else None
        )

        # Map to the format expected by the frontend
        formatted_jobs = []
        for job in jobs:
            job_id = job.get("jobId")
            urn = f"urn:li:jobPosting:{job_id}"
            
            # Skip if already exists
            if urn in existing_urns:
                continue

            # Map the fields
            formatted_jobs.append({
                "urn": urn,
                "title": job.get("title"),
                "company": job.get("company"),
                "location": job.get("location"),
                "company_url": "",
                "job_link": job.get("url"),
                "posted_date": job.get("posted_at"), # Already formatted as YYYY-MM-DD or similar
                "skills": [] # Not available in lite scraper without extra detail fetching
            })

        print(json.dumps(formatted_jobs))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing keywords or location"}))
        sys.exit(1)

    keywords = sys.argv[1]
    location = sys.argv[2]
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 20
    offset = int(sys.argv[4]) if len(sys.argv) > 4 else 0
    experience = parse_list_arg(sys.argv[5]) if len(sys.argv) > 5 else [""]
    remote_mapped = parse_remote_arg(sys.argv[6]) if len(sys.argv) > 6 else [""]
    job_type = parse_list_arg(sys.argv[7]) if len(sys.argv) > 7 else [""]
    listed_at = int(sys.argv[8]) if len(sys.argv) > 8 else 86400
    existing_urns = parse_list_arg(sys.argv[9]) if len(sys.argv) > 9 else []

    try:
        asyncio.run(fetch_jobs_and_print(
            keywords=keywords,
            location=location,
            limit=limit,
            experience=experience,
            remote=remote_mapped,
            job_type=job_type,
            listed_at=listed_at,
            existing_urns=existing_urns
        ))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
