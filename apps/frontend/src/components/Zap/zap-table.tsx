import React from "react";
import { ChevronRight } from "lucide-react";
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

//TODO: 1. Replace "zap.action.type.name" with their respective logos
//      2. Add functionality to the switch

export default function ZapTable({ zaps }: { zaps: Zap[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Last Edit</TableHead>
          <TableHead className="text-right">Running</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {zaps.map((zap) => (
          <TableRow key={zap.id}>
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
              <Link href={"/zap/" + zap.id}>
                <ChevronRight />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
