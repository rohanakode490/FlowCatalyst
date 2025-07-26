"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WebhookSelector from "@/components/react-flow/Webhook-Selecter";
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
}: NodeConfigDialogProps) => {
  const {
    flow: { setTriggerName, handleTriggerTypeChange },
  } = useStore();

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
              handleTriggerTypeChange(webhook.name, webhook.metadata);
            }
          }}
          type={isAction === true ? "action" : "trigger"}
        />
      </DialogContent>
    </Dialog>
  );
};
