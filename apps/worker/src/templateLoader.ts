import fs from "fs";
import path from "path";

// Load template from file
export function loadTemplate(templateName: string): string {
  const templatePath = path.join(__dirname, `${templateName}.html`);
  return fs.readFileSync(templatePath, "utf-8");
}

// Replace placeholders in the template with job data
export function renderTemplate(template: string, jobs: any[]): string {
  return template.replace(
    /{{#each jobs}}([\s\S]*?){{\/each}}/g,
    (_, content) => {
      return jobs
        .map((job) => {
          const skill =
            job.skills.length > 0
              ? job.skills
                  .map((skill: string) => {
                    return `<li>${skill}</li>`;
                  })
                  .join(" ")
              : "Unknown";

          // Replace job fields
          let jobContent = content
            .replace(/\{\{title\}\}/g, job.title)
            .replace(/\{\{company\}\}/g, job.company)
            .replace(/\{\{location\}\}/g, job.location)
            .replace(/\{\{posted_date\}\}/g, job.posted_date)
            .replace(/\{\{job_link\}\}/g, job.job_link)
            .replace(/\{\{company_url\}\}/g, job.company_url)
            .replace(/{{this}}/g, skill);

          return jobContent;
        })
        .join("");
    },
  );
}
