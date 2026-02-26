import path from "path";
import { spawn } from "child_process";

export const runLinkedinScraper = (
  keywords: string[],
  location: string,
  limit: number,
  offset: number,
  experience: string[],
  remote: boolean,
  jobType: string[],
  listed_at: string,
  existingUrns: string[]
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    // Correct path after refactor: src/scrapers/python/linkedin/linkedin-scraper.py
    const scriptPath = path.join(__dirname, "python", "linkedin", "linkedin-scraper.py");
    const pythonCommand = process.env.VIRTUAL_ENV ? `${process.env.VIRTUAL_ENV}/bin/python` : "python";
    const args = [
      scriptPath,
      keywords.join(" OR ") || "",
      location,
      limit.toString(),
      offset.toString(),
      JSON.stringify(experience),
      JSON.stringify(remote),
      JSON.stringify(jobType),
      listed_at,
      JSON.stringify(existingUrns),
    ];
    const pythonProcess = spawn(pythonCommand, args);
    let output = "";
    pythonProcess.stdout.on("data", (data) => (output += data.toString()));
    pythonProcess.stderr.on("data", (data) => console.error(`Python error: ${data}`));
    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject("Failed to parse Python output");
        }
      } else {
        reject(`Python script exited with code ${code}`);
      }
    });
  });
};

export const runIndeedScraper = (
  searchTerm: string,
  location: string,
  country: string,
  resultsWanted: number,
  isRemote: boolean,
  jobType: string,
  hoursOld: number
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    // Correct path after refactor: src/scrapers/python/indeed/indeed-scraper.py
    const scriptPath = path.join(__dirname, "python", "indeed", "indeed-scraper.py");
    const pythonCommand = process.env.VIRTUAL_ENV ? `${process.env.VIRTUAL_ENV}/bin/python` : "python3";
    const args = [
      scriptPath,
      searchTerm,
      location,
      country,
      resultsWanted.toString(),
      isRemote.toString(),
      jobType,
      hoursOld.toString(),
    ];
    const pythonProcess = spawn(pythonCommand, args);
    let output = "";
    pythonProcess.stdout.on("data", (data) => (output += data.toString()));
    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject("Failed to parse Python output");
        }
      } else {
        reject(`Python script exited with code ${code}`);
      }
    });
  });
};
