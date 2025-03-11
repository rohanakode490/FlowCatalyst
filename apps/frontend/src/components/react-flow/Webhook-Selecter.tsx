import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import useWebhook from "@/hooks/Webhook";

interface WebhookSelectorProps {
  onSelect: (webhook: any) => void;
  type: "action" | "trigger";
  handleTriggerTypeChange?: (triggerId: string) => void;
  hasLinkedInTrigger?: boolean;
}

function WebhookSelector({
  onSelect,
  type,
  handleTriggerTypeChange,
  hasLinkedInTrigger,
}: WebhookSelectorProps) {
  const { webhooks, setWebhooks } = useWebhook();

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
    console.log("webhook", webhook);
    if (
      type === "trigger" &&
      webhook.name === "LinkedIn" &&
      hasLinkedInTrigger
    ) {
      alert("You can only have one LinkedIn trigger!");
      return;
    }
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
            className={`flex flex-row items-center justify-center p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
              type === "trigger" &&
              webhook.name === "LinkedIn" &&
              hasLinkedInTrigger
                ? "opacity-50 cursor-not-allowed" // Visual indication
                : ""
            }`}
            disabled={
              type === "trigger" &&
              webhook.name === "LinkedIn" &&
              hasLinkedInTrigger // Actual disable
            }
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
