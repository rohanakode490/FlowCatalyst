"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WebhookSelector from "@/components/react-flow/Webhook-Selecter";
import api from "@/lib/api";

interface NodeConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWebhook: (webhook: any) => void;
  isAction: boolean;
  setTriggerName: Dispatch<SetStateAction<Record<string, any>>>;
  handleTriggerTypeChange?: (triggerId: string) => void;
}

export const NodeConfigDialog = ({
  isOpen,
  onClose,
  onSelectWebhook,
  isAction,
  setTriggerName,
  handleTriggerTypeChange,
}: NodeConfigDialogProps) => {
  const [hasLinkedInTrigger, setHasLinkedInTrigger] = useState(false);

  // Check for existing LinkedIn trigger
  useEffect(() => {
    if (!isOpen || isAction) return;

    const checkLinkedInTrigger = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("token", token);
        const response = await api.get(`/trigger-response/hasLinkedInTrigger`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("res", response);
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
              !isAction &&
              webhook.metadata.githubEventType !== undefined
            ) {
              setTriggerName(webhook.metadata);
              handleTriggerTypeChange(webhook.metadata.githubEventType);
            }
          }}
          type={isAction ? "action" : "trigger"}
          handleTriggerTypeChange={handleTriggerTypeChange}
          hasLinkedInTrigger={hasLinkedInTrigger}
        />
      </DialogContent>
    </Dialog>
  );
};
