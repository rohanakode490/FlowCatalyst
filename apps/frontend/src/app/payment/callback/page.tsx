"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import useStore from "@/lib/store";

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const {
        ui: { addToast },
    } = useStore();

    const [status, setStatus] = useState<"verifying" | "success" | "failed">(
        "verifying",
    );

    useEffect(() => {
        const sessionId = searchParams.get("session_id");
        const paymentStatus = searchParams.get("payment_status");

        if (paymentStatus === "succeeded") {
            verifyPayment(sessionId);
        } else if (paymentStatus === "failed") {
            setStatus("failed");
            addToast("Payment failed", "error");
        } else if (sessionId) {
            verifyPayment(sessionId);
        } else {
            addToast("Invalid payment session", "error");
            router.push("/pricing");
        }
    }, [searchParams, router]);

    const verifyPayment = async (sessionId: string | null) => {
        if (!sessionId) {
            setStatus("failed");
            return;
        }

        try {
            const response = await api.get(
                `/subscription/verify?session_id=${sessionId}`,
            );

            if (response.data.success) {
                setStatus("success");
                addToast("Subscription activated!", "success");
                setTimeout(() => router.push("/workflows"), 2000);
            } else {
                setStatus("failed");
                addToast("Payment verification failed", "error");
            }
        } catch (error: any) {
            console.error("Verification error:", error);
            setStatus("failed");
            addToast("Failed to verify payment", "error");
        }
    };

    if (status === "verifying") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                    <p className="text-lg">Verifying your payment...</p>
                </div>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                    <h1 className="text-3xl font-bold">Payment Successful!</h1>
                    <p className="text-muted-foreground">
                        Your subscription has been activated. Redirecting to dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
                <XCircle className="w-16 h-16 mx-auto text-red-500" />
                <h1 className="text-3xl font-bold">Payment Failed</h1>
                <p className="text-muted-foreground">
                    There was an issue processing your payment. Please try again.
                </p>
                <Button onClick={() => router.push("/pricing")}>Back to Pricing</Button>
            </div>
        </div>
    );
}
