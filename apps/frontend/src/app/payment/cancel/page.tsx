"use client";

import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function PaymentCancelPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
                <XCircle className="w-16 h-16 mx-auto text-red-500" />
                <h1 className="text-3xl font-bold">Payment Cancelled</h1>
                <p className="text-muted-foreground">
                    Your payment was cancelled. No charges were made.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => router.push("/")}>
                        Go Home
                    </Button>
                    <Button onClick={() => router.push("/pricing")}>View Pricing</Button>
                </div>
            </div>
        </div>
    );
}
