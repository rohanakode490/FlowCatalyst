import { useState } from "react";

const useWebhook = () => {
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [webhooks, setWebhooks] = useState<any[]>([]);

  const handleWebhookSelect = (webhook: any) => {
    setSelectedWebhook(webhook);
    setIsDialogOpen(false);
  };

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  return {
    webhooks,
    setWebhooks,
    selectedWebhook,
    isDialogOpen,
    handleWebhookSelect,
    openDialog,
    closeDialog,
  };
};

export default useWebhook;
