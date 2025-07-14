import sys
import os
import json
import logging
from dotenv import load_dotenv
from jobspy import scrape_jobs

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("scraper.log")]
)
logger = logging.getLogger(__name__)

proxies = os.getenv("PROXIES", "")

def parse_boolean_arg(arg):
    """Parse a string to boolean."""
    return arg.lower() == "true" if arg else False

def parse_string_arg(arg):
    """Parse a string argument, return empty string if None."""
    return arg if arg else ""

def parse_list_arg(arg):
    """Parse a JSON string or return empty list if invalid."""
    try:
        return json.loads(arg) if arg else []
    except json.JSONDecodeError:
        return []


def format_jobs(jobs):
    """Convert DataFrame to a list of dictionaries with specified fields."""
    # Define relevant columns for Indeed
    relevant_columns = [
        "id", "title", "company", "location",
        "job_url", "date_posted", "job_type", "skills"
    ]
    
    # Select only available columns
    available_columns = [col for col in relevant_columns if col in jobs.columns]
    jobs_filtered = jobs[available_columns].copy()

    # Replace None with null or empty string for JSON compatibility
    jobs_filtered = jobs_filtered.where(jobs_filtered.notnull(), None)
    
    # Convert to list of dictionaries
    jobs_list = jobs_filtered.to_dict(orient="records")
    
    # Clean up each job entry
    for job in jobs_list:
        for key, value in job.items():
            if value is None:
                # Use empty string for text fields
                job[key] = "" if key in ["title", "company", "location", "job_type", "skills"] else None
            if key == "date_posted" and value:
                job[key] = str(value)  # Ensure date is JSON-serializable
    
    return jobs_list

if __name__ == "__main__":
    try:
        # Parse command-line arguments with defaults
        search_term = parse_string_arg(sys.argv[1] if len(sys.argv) > 1 else "")
        location = parse_string_arg(sys.argv[2] if len(sys.argv) > 2 else "")
        country_indeed = parse_string_arg(sys.argv[3] if len(sys.argv) > 3 else "USA")
        results_wanted = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4].isdigit() else 20
        is_remote = parse_boolean_arg(sys.argv[5] if len(sys.argv) > 5 else "False")
        job_type = parse_string_arg(sys.argv[6] if len(sys.argv) > 6 else "")
        hours_old = int(sys.argv[7]) if len(sys.argv) > 7 and sys.argv[7].isdigit() else 24 * 7
        proxies = os.getenv("PROXIES", "")

        # Call JobSpy's scrape_jobs function
        jobs = scrape_jobs(
            site_name=["indeed"],
            search_term=search_term,
            location=location,
            country_indeed=country_indeed,
            results_wanted=results_wanted,
            is_remote=is_remote,
            job_type=job_type,
            hours_old=hours_old,
            # proxies=proxies
        )

        
        jobs_formatted = format_jobs(jobs)
        print(jobs_formatted)
        # Convert DataFrame to JSON-compatible format
        # jobs_json = jobs.to_dict(orient="records")
        #
        # # Output JSON to stdout
        # print(json.dumps({"success": True, "jobs": jobs_json}))

    except Exception as e:
        # Output error in JSON format for Node.js to parse
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

