import { useState } from "react";

const useWebhook = () => {
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleWebhookSelect = (webhook) => {
    setSelectedWebhook(webhook);
    setIsDialogOpen(false);
  };

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  return {
    selectedWebhook,
    isDialogOpen,
    handleWebhookSelect,
    openDialog,
    closeDialog,
  };
};

export default useWebhook;
