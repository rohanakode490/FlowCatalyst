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
        />
      </DialogContent>
    </Dialog>
  );
};
