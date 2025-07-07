"""
Main entry point for Indeed Job Scraper.
"""

# from indeed_scraper.cli import app
#
# if __name__ == "__main__":
#     app() 

import json
import sys
import os
import random
from indeed_scraper.cli import scrape_command
from indeed_scraper.logger import setup_logging, logger, JsonFormatter
from dotenv import load_dotenv
import pyautogui
from pyvirtualdisplay import Display
import Xlib.display

load_dotenv()

# proxy_list = os.getenv("PROXY")
# proxy = json.loads(proxy_list)
# random_index = random.randint(0, len(proxy) - 1)

if __name__ == "__main__":
    setup_logging(level="DEBUG", use_json=False, log_file="logs/scraper.log")
    # print("Starting")
    # try:
    #     disp = Display(visible=True, size=(1920, 1080), backend="xvfb", use_xauth=True)
    #     print("HERE 1")
    #     disp.start()
    #     print("Here 2")
    #     pyautogui._pyautogui_x11._display = Xlib.display.Display(os.environ['DISPLAY'])
    #     logger.info("Xvfb display started successfully")
    # except Exception as e:
    #     print("Not HERE PLEAASE")
    #     logger.error(f"Failed to start Xvfb display: {e}")
    #     print(json.dumps({"error": f"Failed to start Xvfb display: {e}"}))
    #     sys.exit(1)

    if len(sys.argv) == 2:
        # JSON mode for Node.js
        try:
            args = json.loads(sys.argv[1])
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON: {e}")
            print(json.dumps({"error": f"Invalid JSON: {e}"}))
            sys.exit(1)
    elif len(sys.argv) >= 3:
        # Manual testing mode
        try:
            args = {
                "job_title": sys.argv[1],
                "location": sys.argv[2],
                # "search_radius": int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] else 25,
                "max_pages": int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] else 3,
                "days_ago": int(sys.argv[5]) if len(sys.argv) > 5 and sys.argv[5] else 7,
                "work_setting": sys.argv[6] if len(sys.argv) > 6 and sys.argv[6] else None,
                "job_type": sys.argv[7] if len(sys.argv) > 7 and sys.argv[7] else None,
                "headless": False,
                "proxy": sys.argv[8] if len(sys.argv) > 8 and sys.argv[8] else "206.41.172.74:6634",#None
            }
            print("args", args)
        except ValueError as e:
            logger.error(f"Invalid argument format: {e}")
            print(json.dumps({"error": f"Invalid argument format: {e}"}))
            sys.exit(1)
    else:
        logger.error("Usage: python main.py <json_args> or python main.py <job_title> <location> [<search_radius> <max_pages> <days_ago> <work_setting> <job_type> <proxy>]")
        print(json.dumps({"error": "Usage: python main.py <json_args> or python main.py <job_title> <location> [<search_radius> <max_pages> <days_ago> <work_setting> <job_type> <proxy>]"}))
        sys.exit(1)

    try:
        jobs = scrape_command(
            query=args["job_title"],
            location=args["location"],
            # search_radius=args["search_radius"],
            max_pages=args["max_pages"],
            days_ago=args["days_ago"],
            work_setting=args["work_setting"],
            job_type=args["job_type"],
            headless=args["headless"],
            proxy=args["proxy"]
        )
        print(json.dumps([job.model_dump() for job in jobs], cls=JsonFormatter))
    except Exception as e:
        logger.error(f"Scrape failed: {e}")
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
