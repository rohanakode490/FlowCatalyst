import { AppCard } from "@/components/ui/app-card";

const POPULAR_APPS = [
  {
    name: "Gmail",
    description: "Connect with Gmail to automate your workflow",
  },
  {
    name: "Slack",
    description: "Connect with Slack to automate your workflow",
  },
  {
    name: "Google Calendar",
    description: "Connect with Google Calendar to automate your workflow",
  },
  {
    name: "Trello",
    description: "Connect with Trello to automate your workflow",
  },
  {
    name: "Dropbox",
    description: "Connect with Dropbox to automate your workflow",
  },
  {
    name: "Twitter",
    description: "Connect with Twitter to automate your workflow",
  },
];

export function IntegrationsSection() {
  return (
    <section className="py-20 mt-[100px]">
      <div className="container px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Popular Integrations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POPULAR_APPS.map((app) => (
            <AppCard key={app.name} {...app} />
          ))}
        </div>
      </div>
    </section>
  );
}
