"""
Main entry point for Indeed Job Scraper.
"""

# from indeed_scraper.cli import app
#
# if __name__ == "__main__":
#     app() 

import json
import sys
from indeed_scraper.cli import scrape_command
from indeed_scraper.logger import CustomJSONEncoder
from dotenv import load_dotenv

load_dotenv()

proxy_list = os.getenv("PROXY")
proxy = json.loads(proxy_list)
random_index = random.randint(0, len(proxy) - 1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python main.py <json_args>"}))
        sys.exit(1)

    try:
        args = json.loads(sys.argv[1])
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {e}"}))
        sys.exit(1)

    try:
        jobs = scrape_command(
            query=args.get("job_title", ""),
            location=args.get("location", ""),
            search_radius=args.get("search_radius", 25),
            max_pages=args.get("max_pages", 3),
            days_ago=args.get("days_ago", 7),
            work_setting=args.get("work_setting", None),
            job_type=args.get("job_type", None),
            headless=args.get("headless", True),
            proxy=None # proxy[random_index]
        )
        print(json.dumps([job.model_dump() for job in jobs], cls=CustomJSONEncoder))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
