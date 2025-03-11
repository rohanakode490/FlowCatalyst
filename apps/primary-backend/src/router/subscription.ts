// import { Router } from "express";
// import { authMiddleware } from "../middleware";
// import { createStripeSubscription } from "../services/stripe";
// import { createCashfreeOrder } from "../services/cashfree";
// import { prismaClient } from "@flowcatalyst/database";
//
// const router = Router();
//
// router.post("/", authMiddleware, async (req: any, res: any) => {
//   try {
//     const { planId, paymentMethod } = req.body;
//     const userId = req.user.id;
//     const [user, plan] = await Promise.all([
//       prismaClient.user.findUnique({ where: { id: userId } }),
//       prismaClient.subscriptionPlan.findUnique({ where: { id: planId } }),
//     ]);
//
//     if (!plan || !plan.stripePriceId) {
//       return res.status(401).json({ error: "Plan not available" });
//     }
//
//     let paymentLink: string;
//     let transactionId: string;
//     if (paymentMethod === "stripe") {
//       const { link, id } = await createStripeSubscription(user, plan);
//       paymentLink = link;
//       transactionId = id;
//     } else {
//       const cashfreeResponse = await createCashfreeOrder(user, plan);
//       paymentLink = cashfreeResponse.payment_link;
//       transactionId = cashfreeResponse.order_id;
//     }
//
//     const newSubscription = await prismaClient.subscription.create({
//       data: {
//         userId,
//         planId: plan.id,
//         status: "pending",
//         paymentMethod,
//         currentPeriodStart: new Date(Date.now()),
//         currentPeriodEnd: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
//       },
//     });
//
//     await prismaClient.payment.create({
//       data: {
//         subscriptionId: newSubscription.id,
//         amount: plan.price,
//         currency: plan.currency,
//         paymentMethod,
//         transactionId,
//         status: "pending",
//       },
//     });
//
//     res.json({ paymentLink });
//   } catch (error) {
//     console.error("Subscription error:", error);
//     res.status(501).json({ error: "Subscription failed" });
//   }
// });
//
// export const subscriptionsRouter = router;
