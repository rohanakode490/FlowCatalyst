// import { prismaClient } from "@flowcatalyst/database";
// import Stripe from "stripe";
//
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
//   apiVersion: "2025-02-24.acacia",
// });
//
// const getOrCreateCustomer = async (user: any): Promise<string> => {
//   if (user.stripeCustomerId) return user.stripeCustomerId;
//
//   const customer = await stripe.customers.create({
//     email: user.email,
//     name: user.name,
//     metadata: { userId: user.id },
//   });
//
//   await prismaClient.user.update({
//     where: { id: user.id },
//     data: { stripeCustomerId: customer.id },
//   });
//
//   return customer.id;
// };
//
// export const createStripeSubscription = async (user: any, plan: any) => {
//   const subscription = await stripe.subscriptions.create({
//     customer: await getOrCreateCustomer(user),
//     items: [{ price: plan.stripePriceId }],
//     payment_behavior: "default_incomplete",
//     expand: ["latest_invoice.payment_intent"],
//   });
//
//   const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
//   const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;
//
//   if (!paymentIntent?.next_action?.redirect_to_url?.url) {
//     throw new Error("Failed to create Stripe payment session");
//   }
//
//   return {
//     link: paymentIntent.next_action.redirect_to_url.url,
//     id: subscription.id,
//   };
// };
