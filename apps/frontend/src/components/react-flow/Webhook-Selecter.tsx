import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import useStore from "@/lib/store";

// Define restricted triggers
const RESTRICTED_TRIGGERS = ["LinkedIn", "Indeed"];

interface WebhookSelectorProps {
  onSelect: (webhook: any) => void;
  type: "action" | "trigger";
}

function WebhookSelector({
  onSelect,
  type,
}: WebhookSelectorProps) {
  const {
    flow: { nodes, setTriggerName },
    webhook: { webhooks, fetchWebhooks },
    ui: { addToast },
  } = useStore();

  // Fetch available actions or triggers based on the type
  useEffect(() => {
    fetchWebhooks(type);
  }, [type, fetchWebhooks]);

  // Check if a trigger is restricted
  const isTriggerRestricted = (webhookName: string) => {
    if (type !== "trigger" || !RESTRICTED_TRIGGERS.includes(webhookName)) {
      return false;
    }
    // // For other restricted triggers, assume only one is allowed (extend logic as needed)
    // return false;
    // Check if a node with this trigger type already exists
    return nodes.some(
      (node) => node.data.name === webhookName && node.data.configured
    );
  };

  // Handle trigger selection
  const handleTriggerSelect = (webhook: any) => {
    if (isTriggerRestricted(webhook.name)) {
      addToast(`You can only have one ${webhook.name} trigger!`, "error");
      return;
    }
    onSelect(webhook);
    if (type === "trigger") {
      setTriggerName(webhook.metadata);
      // handleTriggerTypeChange(webhook.name, webhook.metadata);
    }
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4">
        {webhooks.map((webhook) => (
          <Button
            key={webhook.id}
            onClick={() => handleTriggerSelect(webhook)}
            className={`flex flex-row items-center justify-center p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${isTriggerRestricted(webhook.name)
              ? "opacity-50 cursor-not-allowed" // Visual indication
              : ""
              }`}
            disabled={isTriggerRestricted(webhook.name)}
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
