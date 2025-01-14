import React, { useState } from "react";
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

//TODO: 1. Replace "zap.action.type.name" with their respective logos
//      2. Add functionality to the switch

export default function ZapTable({ zaps }: { zaps: Zap[] }) {
  const [zapToDelete, setZapToDelete] = useState<string | null>(null);

  console.log("zapToDelete", zapToDelete);
  // Function to handle Zap deletion
  const handleDeleteZap = async (zapId: string) => {
    try {
      const response = await api.delete(`/zap/${zapId}`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });
      console.log(response);

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
            <TableHead></TableHead>
            <TableHead>Name</TableHead>
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
                {zap.trigger.type.name}{" "}
                {zap.actions.map((action) => action.type.name + " ")}
              </TableCell>
              <TableCell>{zap.id}</TableCell>
              <TableCell>Dec 26, 2024</TableCell>
              <TableCell className="text-right">
                <Switch />
              </TableCell>
              <TableCell>
                <Link href={`/flow/edit/${zap.id}`}>
                  <ChevronRight className="bg-red-900" />
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
