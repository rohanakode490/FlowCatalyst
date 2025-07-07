#!/usr/bin/env python3
"""Configuration settings for Indeed job scraper."""

from enum import Enum
from typing import Dict, List, Optional, ClassVar
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class WorkSetting(str, Enum):
    """Work settings for job filtering."""
    REMOTE = "remote"
    HYBRID = "hybrid"
    ONSITE = "onsite"


class JobType(str, Enum):
    """Job types for filtering."""
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    TEMPORARY = "temporary"
    TEMP_TO_HIRE = "temp-to-hire"


class DatabaseType(str, Enum):
    """Database type options."""
    SQLITE = "sqlite"
    SQL_SERVER = "sql_server"


class ScraperConfig(BaseSettings):
    """Configuration for the Indeed job scraper."""
    
    # Browser settings
    headless: bool = Field(False, description="Run browser in headless mode")
    browser_timeout: int = Field(30, description="Browser timeout in seconds")
    captcha_detection_threshold: int = Field(999, description="Consecutive failures before manual CAPTCHA prompt (high to rely on automated handling)")
    
    # Scraper settings
    # default_search_radius: int = Field(25, description="Default search radius in miles")
    default_max_pages: int = Field(3, description="Default number of pages to scrape")
    default_days_ago: int = Field(7, description="Default days ago for job posting filter")
    min_delay_seconds: float = Field(5.0, description="Minimum delay between requests to avoid CAPTCHAs")
    max_delay_seconds: float = Field(10.0, description="Maximum delay between requests to avoid CAPTCHAs")
    valid_days_ago: List[int] = Field([1, 3, 7, 14], description="Valid options for days ago filter")
    
    # Work setting filters
    work_setting_filters: Dict[str, str] = Field(
        {
            "remote": "&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11",
            "hybrid": "&sc=0kf%3Aattr(DSQF7)%3B",
            "onsite": ""  # No specific filter for onsite/in-person
        },
        description="Work setting filters for Indeed URL"
    )
    
    # Job type filters
    job_type_filters: Dict[str, str] = Field(
        {
            "full-time": "&sc=0kf%3Aattr(CF3CP)%3B", 
            "part-time": "&sc=0kf%3Aattr(75GKK)%3B",
            "contract": "&sc=0kf%3Aattr(NJXCK)%3B",
            "temporary": "&sc=0kf%3Aattr(4HKF7)%3B",
            "temp-to-hire": "&sc=0kf%3Aattr(7SBAT)%3B"
        },
        description="Job type filters for Indeed URL"
    )
    
    # Selectors - stored as class variables for easy access
    JOB_CARD_SELECTOR: ClassVar[str] = "div.job_seen_beacon, div.tapItem, [data-testid='jobListing']"
    job_card_selector: ClassVar[str] = "div.job_seen_beacon, div.tapItem, [data-testid='jobListing']"
    # JOB_CARD_SELECTOR: ClassVar[str] = "div.job_seen_beacon"
    # job_card_selector: ClassVar[str] = "div.job_seen_beacon"
    NEXT_PAGE_SELECTOR: ClassVar[str] = "a[data-testid='pagination-page-next']"
    next_page_selector: ClassVar[str] = "a[data-testid='pagination-page-next']"
    
    # Field selectors within job cards
    # JOB_FIELD_SELECTORS: ClassVar[Dict[str, List[tuple]]] = {
    #     'title': [("css selector", "h2.jobTitle > span[title]")],
    #     'company': [("css selector", "span.companyName")],
    #     'location': [("css selector", "div.companyLocation")],
    #     'salary': [("css selector", "div.salary-snippet-container")],
    #     'job_type': [("css selector", "div.metadataContainer span.attribute_snippet")],
    #     'work_setting': [("css selector", "div.metadataContainer span.attribute_snippet[data-work-setting]")],
    #     'link': [("css selector", "a.jcs-JobTitle")]
    # }
    JOB_FIELD_SELECTORS: ClassVar[Dict[str, List[tuple]]] = {
        'title': [("css selector", "a.jcs-JobTitle"), ("css selector", "h2.jobTitle span[title]")],
        'company': [("css selector", "[data-testid='company-name']"), ("css selector", "span.companyName")],
        'location': [("css selector", "[data-testid='text-location']"), ("css selector", "div.companyLocation")],
        'salary': [("css selector", "div[class*='salary-snippet-container']"), ("css selector", "div.salary-snippet-container")],
        'job_type': [("css selector", "div[data-testid='job-type-info']"), ("css selector", "div.metadataContainer span.attribute_snippet")],
        'work_setting': [("css selector", "div[data-testid='work-setting-info']"), ("css selector", "div.metadataContainer span.attribute_snippet[data-work-setting]")],
        'link': [("css selector", "a.jcs-JobTitle"), ("css selector", "h2.jobTitle a")]
    }
    
    # def is_sqlite(self) -> bool:
    #     """Check if using SQLite database."""
    #     return self.db_type == DatabaseType.SQLITE or self.db_sqlite_path is not None
    
    # def get_db_connection_string(self) -> str:
    #     """Generate database connection string based on configuration."""
    #     if self.is_sqlite():
    #         return f"sqlite:///{self.db_sqlite_path}"
        
    #     # SQL Server connection
    #     driver_formatted = self.db_driver.replace(" ", "+") if self.db_driver else ""
    #     server = self.db_server or ""
        
    #     # Escape server name if it contains a single backslash but not a double backslash
    #     if '\\' in server and '\\\\' not in server:
    #         server = server.replace('\\', '\\\\')
            
    #     return f"mssql+pyodbc://{server}/{self.db_name}?driver={driver_formatted}&trusted_connection=yes"
    
    model_config = SettingsConfigDict(
        env_prefix="INDEED_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow"  # Allow extra fields from env vars
    )


# Global configuration instance
config = ScraperConfig()
