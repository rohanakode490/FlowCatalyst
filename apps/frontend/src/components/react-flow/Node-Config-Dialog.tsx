import React, { Dispatch, SetStateAction } from "react";
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
  setTriggerName: Dispatch<SetStateAction<Record<string, any>>>;
  onTriggerTypeChange?: (triggerId: string) => Promise<void>; // Add a prop to determine if it's an action or trigger
}

export const NodeConfigDialog = ({
  isOpen,
  onClose,
  onSelectWebhook,
  isAction,
  setTriggerName,
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
              console.log("webhook", webhook);
              // setTriggerName(webhook.id);
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
