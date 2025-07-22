"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WebhookSelector from "@/components/react-flow/Webhook-Selecter";
import api from "@/lib/api";
import useStore from "../../lib/store";

interface NodeConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWebhook: (webhook: any) => void;
  isAction: boolean | undefined;
  handleTriggerTypeChange?: (triggerId: string) => void;
}

export const NodeConfigDialog = ({
  isOpen,
  onClose,
  onSelectWebhook,
  isAction,
  handleTriggerTypeChange,
}: NodeConfigDialogProps) => {
  const [hasLinkedInTrigger, setHasLinkedInTrigger] = useState(false);

  const {
    flow: { setTriggerName },
  } = useStore();

  // Check for existing LinkedIn trigger
  useEffect(() => {
    if (!isOpen || isAction === true) return;

    const checkLinkedInTrigger = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get(`/trigger-response/hasLinkedInTrigger`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setHasLinkedInTrigger(response.data.hasLinkedInTrigger);
      } catch (error) {
        console.error("Failed to check LinkedIn trigger:", error);
      }
    };

    checkLinkedInTrigger();
  }, [isOpen, isAction]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a Webhook/Zap</DialogTitle>
        </DialogHeader>
        <WebhookSelector
          onSelect={(webhook) => {
            onSelectWebhook(webhook);
            if (
              handleTriggerTypeChange &&
              isAction === false &&
              webhook.metadata.githubEventType !== undefined
            ) {
              setTriggerName(webhook.metadata);
              handleTriggerTypeChange(webhook.metadata.githubEventType);
            }
          }}
          type={isAction === true ? "action" : "trigger"}
          handleTriggerTypeChange={handleTriggerTypeChange}
          hasLinkedInTrigger={hasLinkedInTrigger}
        />
      </DialogContent>
    </Dialog>
  );
};
