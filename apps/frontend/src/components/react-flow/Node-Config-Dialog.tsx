import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WebhookSelector from "@/components/react-flow/Webhook-Selecter";

interface NodeConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWebhook: (webhook: any) => void;
  isAction: boolean;
  onTriggerTypeChange?: (triggerId: string) => Promise<void>; // Add a prop to determine if it's an action or trigger
}

export const NodeConfigDialog = ({
  isOpen,
  onClose,
  onSelectWebhook,
  isAction,
  onTriggerTypeChange,
}: NodeConfigDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a Webhook/Zap</DialogTitle>
        </DialogHeader>
        <WebhookSelector
          onSelect={(webhook) => {
            onSelectWebhook(webhook);
            if (onTriggerTypeChange && !isAction) {
              onTriggerTypeChange(webhook.id);
            }
          }}
          type={isAction ? "action" : "trigger"}
          onTriggerTypeChange={onTriggerTypeChange}
        />
      </DialogContent>
    </Dialog>
  );
};
