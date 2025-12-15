import express from "express";
import { prismaClient } from "@flowcatalyst/database";
import crypto from "crypto";
import { authMiddleware } from "../middleware";
import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";

const router = express.Router();
const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment:
    process.env.NODE_ENV === "production" ? "live_mode" : "test_mode",
});

const webhook = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_SECRET!);

// GET /api/pricing - Get all active pricing plans
router.get("/pricing", async (req, res) => {
  try {
    const plans = await prismaClient.subscriptionPlan.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        price: true,
        interval: true,
        features: true,
        dodoPriceId: true,
      },
    });

    res.json({ plans });
  } catch (error) {
    console.error("Pricing error:", error);
    res.status(500).json({ error: "Failed to load pricing plans" });
  }
});

// POST /api/v1/subscription - Create subscription
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { planName } = req.body;
    //@ts-ignore
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = await prismaClient.subscriptionPlan.findUnique({
      where: { name: planName },
    });

    if (!plan || !plan.active) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check for existing active subscription
    const existingSub = await prismaClient.subscription.findFirst({
      where: { userId, status: "active" },
    });

    if (existingSub) {
      return res.status(400).json({
        error: "You already have an active subscription",
      });
    }

    // Handle free plan
    if (plan.price === 0) {
      const subscription = await prismaClient.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: "active",
          paymentMethod: "dodopayments",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            Date.now() + 100 * 365 * 24 * 60 * 60 * 1000,
          ),
        },
      });

      return res.json({
        success: true,
        message: "Free plan activated",
        subscription,
      });
    }

    // Create or get DodoPay customer
    let dodoCustomerId = user.dodoCustomerId;

    if (!dodoCustomerId) {
      const customer = await dodoClient.customers.create({
        email: user.email,
        name: user.name,
      });

      dodoCustomerId = customer.customer_id;

      await prismaClient.user.update({
        where: { id: userId },
        data: { dodoCustomerId },
      });
    }

    // Create checkout session
    const checkoutSession = await dodoClient.checkoutSessions.create({
      customer: {
        email: user.email,
        name: user.name,
        customer_id: dodoCustomerId,
      },
      product_cart: [
        {
          product_id: plan.dodoPriceId!,
          quantity: 1,
        },
      ],
      return_url: `${process.env.FRONTEND_URL}/payment/callback`,
      metadata: {
        userId: userId.toString(),
        planId: plan.id,
        planName: plan.name,
      },
    });

    // Store session for verification
    await prismaClient.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "incomplete",
        paymentMethod: "dodopayments",
        dodoSubscriptionId: checkoutSession.session_id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      sessionId: checkoutSession.session_id,
      paymentLink: checkoutSession.checkout_url,
    });
  } catch (error: any) {
    console.error("Subscription error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create subscription" });
  }
});

// GET /api/v1/subscription/status - Get current subscription
router.get("/status", async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const subscription = await prismaClient.subscription.findFirst({
      where: {
        userId,
        status: { in: ["active", "trialing", "past_due"] },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return res.json({
        subscription: null,
        message: "No active subscription",
      });
    }

    res.json({ subscription });
  } catch (error) {
    console.error("Status error:", error);
    res.status(500).json({ error: "Failed to get subscription status" });
  }
});

// POST /api/v1/subscription/cancel - Cancel subscription
router.post("/cancel", async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const subscription = await prismaClient.subscription.findFirst({
      where: { userId, status: "active" },
    });

    if (!subscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    if (subscription.dodoSubscriptionId) {
      await dodoClient.subscriptions.update(subscription.dodoSubscriptionId, {
        cancel_at_next_billing_date: true,
      });
    }

    await prismaClient.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Subscription will cancel at period end",
      periodEnd: subscription.currentPeriodEnd,
    });
  } catch (error: any) {
    console.error("Cancel error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/subscription/verify - Verify payment session
router.get("/verify", async (req, res) => {
  try {
    const { session_id } = req.query;
    //@ts-ignore
    const userId = req.id;

    if (!session_id) {
      return res.status(400).json({ error: "Session ID required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const session = await dodoClient.checkoutSessions.retrieve(
      session_id as string,
    );

    if (session.payment_status === "succeeded") {
      const subscription = await prismaClient.subscription.findFirst({
        where: { userId, dodoSubscriptionId: session_id as string },
      });

      if (subscription && subscription.status === "incomplete") {
        await prismaClient.subscription.update({
          where: { id: subscription.id },
          data: { status: "active" },
        });
      }

      return res.json({ success: true, status: "completed" });
    }

    res.json({ success: false, status: session.payment_status });
  } catch (error: any) {
    console.error("Verify error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/subscription/webhook - Handle DodoPay webhooks
router.post("/webhook", authMiddleware, async (req, res) => {
  try {
    const rawBody = req.body.toString();

    // Verify webhook using standardwebhooks
    const headers = {
      "webhook-id": (req.headers["webhook-id"] as string) || "",
      "webhook-signature": (req.headers["webhook-signature"] as string) || "",
      "webhook-timestamp": (req.headers["webhook-timestamp"] as string) || "",
    };

    await webhook.verify(rawBody, headers);

    const event = JSON.parse(rawBody);

    // Log event
    await prismaClient.webhookEvent.create({
      data: {
        provider: "dodopayments",
        eventType: event.event_type,
        payload: event,
      },
    });

    console.log("Webhook received:", event.event_type);

    // Handle events
    switch (event.event_type) {
      case "payment.succeeded":
        await handlePaymentSuccess(event.data);
        break;
      case "payment.failed":
        await handlePaymentFailed(event.data);
        break;
      case "subscription.created":
        await handleSubscriptionCreated(event.data);
        break;
      case "subscription.updated":
        await handleSubscriptionUpdated(event.data);
        break;
      case "subscription.canceled":
        await handleSubscriptionCancelled(event.data);
        break;
      case "subscription.renew":
        await handleSubscriptionRenewed(event.data);
        break;
      default:
        console.log(`Unhandled event: ${event.event_type}`);
    }

    await prismaClient.webhookEvent.updateMany({
      where: {
        provider: "dodopayments",
        eventType: event.event_type,
        processed: false,
      },
      data: { processed: true },
    });

    res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);

    await prismaClient.webhookEvent
      .create({
        data: {
          provider: "dodopayments",
          eventType: "error",
          payload: { error: error.message },
          processed: false,
          processingError: error.message,
        },
      })
      .catch(console.error);

    res.status(400).json({ error: error.message });
  }
});

// Webhook handlers
async function handlePaymentSuccess(data: any) {
  const { metadata, payment_id, subscription_id } = data;

  if (!metadata?.userId) {
    console.error("No userId in metadata");
    return;
  }

  const userId = parseInt(metadata.userId);

  try {
    let subscription = await prismaClient.subscription.findFirst({
      where: {
        OR: [
          { dodoSubscriptionId: subscription_id },
          { userId, status: "incomplete" },
        ],
      },
    });

    if (subscription) {
      await prismaClient.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "active",
          dodoSubscriptionId:
            subscription_id || subscription.dodoSubscriptionId,
        },
      });

      await prismaClient.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: data.total_amount || 0,
          currency: data.currency || "USD",
          paymentMethod: "dodopayments",
          transactionId: payment_id,
          status: "succeeded",
        },
      });

      console.log(`Activated subscription for user ${userId}`);
    }
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
}

async function handlePaymentFailed(data: any) {
  const { metadata, payment_id } = data;

  if (!metadata?.userId) return;

  const userId = parseInt(metadata.userId);

  const subscription = await prismaClient.subscription.findFirst({
    where: { userId, status: { in: ["active", "incomplete"] } },
  });

  if (subscription) {
    await prismaClient.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: data.total_amount || 0,
        currency: data.currency || "USD",
        paymentMethod: "dodopayments",
        transactionId: payment_id,
        status: "failed",
        failureReason: data.failure_message,
      },
    });
  }
}

async function handleSubscriptionCreated(data: any) {
  const { subscription_id, customer, metadata } = data;

  if (!customer?.customer_id) return;

  const user = await prismaClient.user.findUnique({
    where: { dodoCustomerId: customer.customer_id },
  });

  if (!user) return;

  await prismaClient.subscription.upsert({
    where: { dodoSubscriptionId: subscription_id },
    update: { status: "active" },
    create: {
      userId: user.id,
      planId: metadata?.planId || "default",
      status: "active",
      paymentMethod: "dodopayments",
      dodoSubscriptionId: subscription_id,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}

async function handleSubscriptionUpdated(data: any) {
  const { subscription_id, status } = data;

  await prismaClient.subscription.updateMany({
    where: { dodoSubscriptionId: subscription_id },
    data: { status: mapDodoStatus(status) },
  });
}

async function handleSubscriptionCancelled(data: any) {
  const { subscription_id } = data;

  await prismaClient.subscription.updateMany({
    where: { dodoSubscriptionId: subscription_id },
    data: {
      status: "canceled",
      canceledAt: new Date(),
    },
  });
}

async function handleSubscriptionRenewed(data: any) {
  const { subscription_id, payment_id, total_amount, currency } = data;

  const subscription = await prismaClient.subscription.findFirst({
    where: { dodoSubscriptionId: subscription_id },
  });

  if (subscription) {
    await prismaClient.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: total_amount || 0,
        currency: currency || "USD",
        paymentMethod: "dodopayments",
        transactionId: payment_id,
        status: "succeeded",
      },
    });

    await prismaClient.subscription.update({
      where: { id: subscription.id },
      data: {
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
}

function mapDodoStatus(dodoStatus: string): string {
  const statusMap: Record<string, string> = {
    active: "active",
    canceled: "canceled",
    cancelled: "canceled",
    past_due: "past_due",
    trialing: "trialing",
    incomplete: "incomplete",
    paused: "paused",
  };
  return statusMap[dodoStatus] || "active";
}

export const subscriptionsRouter = router;
