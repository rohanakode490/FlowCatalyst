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
      console.log("here")
      addToast("Please wait, loading trigger limits...", "loading");
      return;
    }
    if (isTriggerRestricted(webhook.name)) {
      const maxTriggers = userSubscription === "pro" ? 2 : 1
      console.log("Should be here")
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
                className={`w-full flex items-center justify-start p-3 border rounded-lg space-x-2
                  ${isDisabled ? "bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
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
