import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import useStore from "@/lib/store";

// Define restricted triggers
const RESTRICTED_TRIGGERS = ["LinkedinTrigger", "IndeedTrigger"];

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
    user: { userSubscription, userTriggers, loadingTriggers, fetchUserTriggers },
  } = useStore();

  // Fetch available actions or triggers based on the type
  useEffect(() => {
    fetchWebhooks(type);
    if (type === "trigger") {
      fetchUserTriggers();
    }
  }, [type, fetchWebhooks, fetchUserTriggers]);

  // Check if a trigger is restricted
  const isTriggerRestricted = (webhookName: string) => {
    if (type !== "trigger" || !RESTRICTED_TRIGGERS.includes(webhookName)) {
      return false;
    }
    // Count triggers in current flow
    const currentFlowTriggerCount = nodes.filter(
      (node) => node.data.name === webhookName && node.data.configured
    ).length;

    // Get total trigger count for user (including other flows)
    const totalTriggerCount = (userTriggers[webhookName] || 0) + currentFlowTriggerCount;

    // Subscription limits (default to 1 if userSubscription is null)
    const maxTriggers = userSubscription === "pro" ? 2 : 1;
    return totalTriggerCount >= maxTriggers;
  };

  // Handle trigger selection
  const handleTriggerSelect = (webhook: any) => {
    if (loadingTriggers) {
      addToast("Please wait, loading trigger limits...", "loading");
      return;
    }
    if (isTriggerRestricted(webhook.name)) {
      const maxTriggers = userSubscription === "pro" ? 2 : 1
      addToast(`Only ${maxTriggers} ${webhook.name} trigger(s) allowed!`, "error");;
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

        {webhooks.map((webhook) => {
          const isDisabled = isTriggerRestricted(webhook.name) || loadingTriggers;
          return (
            <div
              key={webhook.id}
              onClick={() => handleTriggerSelect(webhook)}
              className={`w-full ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <Button
                className={`w-full flex items-center justify-center p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isDisabled}
              >
                <img src={webhook.image} alt={webhook.name} className="w-8 h-8 rounded-full" />
                <span className="text-sm font-medium">{webhook.name}</span>
              </Button>
            </div>
          );
        })}
      </div>
    </div >
  );
}

export default WebhookSelector;
