import React from "react";
import { Button } from "@/components/ui/button";

// Mock data for available webhooks/zaps
const webhooks = [
  {
    name: "Slack",
    logo: "/slack-logo.png",
    defaultFormData: { channel: "", message: "" },
  },
  {
    name: "Google Sheets",
    logo: "/google-sheets-logo.png",
    defaultFormData: { spreadsheetId: "", range: "" },
  },
  {
    name: "Trello",
    logo: "/trello-logo.png",
    defaultFormData: { boardId: "", listName: "" },
  },
  // Add more webhooks as needed
];

function WebhookSelector({ onSelect }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {webhooks.map((webhook) => (
          <Button
            key={webhook.name}
            onClick={() => onSelect(webhook)}
            className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <img
              src={webhook.logo}
              alt={webhook.name}
              className="w-12 h-12 mb-2"
            />
            <span className="text-sm">{webhook.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export default WebhookSelector;
