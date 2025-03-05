import sys
import json
import os
import time
from dotenv import load_dotenv
from linkedin_api import Linkedin
import ast
from datetime import datetime, timezone

load_dotenv()

EMAIL = os.getenv("LINKEDIN_EMAIL")
PASSWORD = os.getenv("LINKEDIN_PASSWORD")

# Authenticate to LinkedIn
api = Linkedin(EMAIL, PASSWORD)


def parse_list_arg(arg):
    """Convert a string representation of a list into a Python list with string elements."""
    try:
        # Ensure correct JSON formatting, if the argument is already wrapped in quotes
        if arg.startswith("[") and arg.endswith("]"):
            # Remove any extra outer quotes and parse it
            parsed_list = json.loads(arg.replace("'", '"'))
        else:
            # If it's just a single value, treat it as a list with one string element
            parsed_list = [arg]
        
        return [str(item) for item in parsed_list]  # Ensure all elements are strings
    except (json.JSONDecodeError, TypeError):
        return [str(arg)] # Fallback to treating it as a single-item list

def fetch_jobs(keywords, location, limit=10, offset=0, experience=[""], remote=[""], job_type=[""], listed_at=86400, existing_urns=None):
    # existingUrns = set(json.loads(existing_urns)) if existing_urns else set()
    jobs_with_links = []
    retries = 0
    while len(jobs_with_links) < 10:
        try:
            jobs = api.search_jobs(
                keywords=keywords, # strings separated by OR
                location_name=location, # string
                limit=limit, #Number
                offset=offset,
                remote=remote, #Array of strings
                experience=experience, #Array of strings
                job_type=job_type, #Array of strings
                listed_at=listed_at
            )
            if retries > 4:
                break
            for job in jobs:
                job_urn = job['entityUrn']
                if job_urn not in existing_urns:
                    job_id = job['entityUrn'].split(':')[-1]
                    job_details = api.get_job(job_id)
                    
                    # Get job skills
                    skills = api.get_job_skills(job_id)
                    skills_list=[]
                    if skills:
                        for skill in skills.get('skillMatchStatuses', []):
                            skills_list.append(skill.get('skill', {}).get('name', 'unknown'))
                    
                    # Extract job URL
                    job_url = job_details.get("applyMethod", {}).get("com.linkedin.voyager.jobs.ComplexOnsiteApply", {}).get("easyApplyUrl", "")
                    if not job_url:
                        job_url = f"https://www.linkedin.com/jobs/view/{job_id}"

                    company_info = job_details.get("companyDetails", {}).get("com.linkedin.voyager.deco.jobs.web.shared.WebCompactJobPostingCompany", {}).get("companyResolutionResult", {})
                    company_name = company_info.get("name", "Unknown Company")
                    company_url = company_info.get("url", "")

                    # Extract posted date
                    listed_at_timestamp = job_details.get("listedAt")
                    posted_date = datetime.fromtimestamp(listed_at_timestamp / 1000, timezone.utc).strftime('%Y-%m-%d')


                    # Append job details with link
                    jobs_with_links.append({
                        "urn": job_urn,
                        "title": job_details["title"],
                        "company": company_name,
                        "location": job_details["formattedLocation"],
                        "company_url": company_url,
                        "job_link": job_url,
                        "posted_date": posted_date,
                        "skills": skills_list
                    })
                    existing_urns.append(job_urn)
                    if len(jobs_with_links) >= 10:
                        break

            offset += 10
            retries = 0 
            time.sleep(1)

            # Convert result to JSON for Nodejs
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            retries += 1
            time.sleep(5) 
    print(json.dumps(jobs_with_links))

# Run if executed from Node.js
if __name__ == "__main__":
    keywords = sys.argv[1]
    location = sys.argv[2]
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    offset = int(sys.argv[4]) if len(sys.argv) > 0 else 0
    experience = parse_list_arg(sys.argv[5])
    remote = parse_list_arg(sys.argv[6])
    job_type = parse_list_arg(sys.argv[7])
    listed_at = int(sys.argv[8]) 
    URNS = parse_list_arg(sys.argv[9])
    existing_urns = URNS if len(URNS) > 0 else []

    # print("keywords", keywords, type(keywords))
    # print("Experience:", experience)
    # print("Remote:", remote)
    # print("Job Type:", job_type)
    # print("listed_at", listed_at)
    # print("existing_urns", existing_urns, type(existing_urns))

    fetch_jobs(keywords, location, limit, offset, experience, remote, job_type, listed_at, existing_urns)
