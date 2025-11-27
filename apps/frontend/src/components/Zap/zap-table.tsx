import React, { useCallback, useEffect, useState } from "react";
import { ChevronRight, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { Zap } from "@/lib/types";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { ConfirmationDialog } from "./Confirmation-Dialog";
import useStore from "@/lib/store";
import { debounce } from "lodash";

export default function ZapTable({ zaps }: { zaps: Zap[] }) {
  const [zapToDelete, setZapToDelete] = useState<string | null>(null);
  const [localZapStatus, setLocalZapStatus] = useState<Record<string, boolean>>(
    zaps.reduce((acc, zap) => ({ ...acc, [zap.id]: zap.isActive }), {})
  );
  const {
    zap: { toggleZap, zapStatus },
    ui: { addToast },
  } = useStore();

  // Sync localZapStatus with zapStatus when zapStatus changes
  useEffect(() => {
    setLocalZapStatus((prev) =>
      zaps.reduce(
        (acc, zap) => ({
          ...acc,
          [zap.id]: zapStatus[zap.id] ?? zap.isActive,
        }),
        prev
      )
    );
  }, [zapStatus, zaps]);

  // Function to handle Zap toggle
  const handleToggleZap = useCallback(
    async (zapId: string, isActive: boolean) => {
      addToast("Loading...", "loading")
      try {
        await toggleZap(zapId, isActive);
      } catch (error) {
        console.error("Failed to toggle Zap:", error);
        setLocalZapStatus((prev) => ({ ...prev, [zapId]: !isActive })); // Revert on failure
        addToast("Failed to toggle Zap status.", "error");
      }
    },
    [toggleZap, addToast]
  );

  // Debounced toggle handler
  const debouncedToggleZap = useCallback(
    debounce((zapId: string, isActive: boolean) => {
      handleToggleZap(zapId, isActive);
    }, 2000, { leading: false, trailing: true }),
    [handleToggleZap]
  );

  // Handle switch toggle with local state
  const handleSwitchToggle = (zapId: string, checked: boolean) => {
    setLocalZapStatus((prev) => ({ ...prev, [zapId]: checked }));
    debouncedToggleZap(zapId, checked);
  };


  // Function to handle Zap deletion
  const handleDeleteZap = async (zapId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.delete(`/zap/${zapId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success("Zap deleted successfully!");

        setTimeout(() => {
          window.location.reload(); // Reload the page after a short delay
        }, 1000);
      } else {
        toast.error("Failed to delete Zap. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete Zap:", error);
      toast.error("Failed to delete Zap. Please try again.");
    } finally {
      setZapToDelete(null); // Close the confirmation dialog
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Workflow</TableHead>
            <TableHead></TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Running</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {zaps.map((zap) => (
            <TableRow key={zap.id}>
              <TableCell>
                <Button
                  onClick={() => setZapToDelete(zap.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </TableCell>
              <TableCell className="font-medium">
                {zap.trigger.type.name}
                {" -> "}
                {zap.actions.map(
                  (action, index) =>
                    action.type.name +
                    (index !== zap.actions.length - 1 ? " -> " : ""),
                )}
              </TableCell>
              <TableCell>
                <span className="flex gap-1">
                  <img
                    src={zap.trigger.type.image}
                    alt="trigger"
                    className="h-7 w-7"
                  />

                  {zap.actions.map((action) => (
                    <img
                      key={action.id}
                      src={action.type.image}
                      alt="action"
                      className="h-7 w-7"
                    />
                  ))}
                </span>
              </TableCell>
              <TableCell>
                {new Date(zap.createdAt)
                  .toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  .replace(",", "")}
              </TableCell>
              <TableCell className="text-right">
                <Switch
                  checked={localZapStatus[zap.id] ?? zap.isActive}
                  onCheckedChange={(checked) => handleSwitchToggle(zap.id, checked)}
                // onCheckedChange={
                //   (checked) => debouncedToggleZap(zap.id, checked)
                //   // handleToggleZap(zap.id, checked)
                // }
                />
              </TableCell>
              <TableCell>
                <Link href={`/flow/edit/${zap.id}`}>
                  <ChevronRight />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Confirmation Dialog */}
      {zapToDelete && (
        <ConfirmationDialog
          isOpen={!!zapToDelete}
          onClose={() => setZapToDelete(null)}
          onConfirm={() => handleDeleteZap(zapToDelete)}
          title="Delete Zap"
          message="Are you sure you want to delete this Zap?"
        />
      )}
    </>
  );
}
