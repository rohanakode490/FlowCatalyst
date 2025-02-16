import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface WebhookSelectorProps {
  onSelect: (webhook: any) => void;
  type: "action" | "trigger";
  handleTriggerTypeChange?: (triggerId: string) => void;
}

function WebhookSelector({
  onSelect,
  type,
  handleTriggerTypeChange,
}: WebhookSelectorProps) {
  const [webhooks, setWebhooks] = useState<any[]>([]);

  // Fetch available actions or triggers based on the type
  useEffect(() => {
    const endpoint =
      type === "action" ? "/action/available" : "/trigger/available";
    api
      .get(endpoint)
      .then((response) => {
        setWebhooks(
          type === "action"
            ? response.data.availableActions
            : response.data.availableTriggers,
        );
      })
      .catch((error) => {
        console.error("Failed to fetch webhooks:", error);
      });
  }, [type]);

  // Handle trigger selection
  const handleTriggerSelect = (webhook: any) => {
    onSelect(webhook);
    if (type === "trigger" && handleTriggerTypeChange) {
      handleTriggerTypeChange(webhook.id);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4">
        {webhooks.map((webhook) => (
          <Button
            key={webhook.id}
            onClick={() => handleTriggerSelect(webhook)}
            className="flex flex-row items-center justify-center p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <img src={webhook.image} alt={webhook.name} className="w-9 h-9" />
            <span className="text-sm">{webhook.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export default WebhookSelector;
