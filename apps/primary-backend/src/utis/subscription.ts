import { Prisma } from "@flowcatalyst/database";

export async function createFreeSubscription(
  prisma: Prisma.TransactionClient,
  userId: number,
) {
  const basicPlan = await prisma.subscriptionPlan.findUnique({
    where: { name: "Basic" },
  });

  if (!basicPlan) {
    console.error("Basic subscription plan not configured");
  }

  // console.log("freePlan", freePlan, "\n\n");
  return prisma.subscription.create({
    //@ts-ignore
    data: {
      userId,
      planId: basicPlan?.id,
      status: "active",
      paymentMethod: "none",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(
        new Date().setMonth(new Date().getMonth() + 1),
      ),
      cancelAtPeriodEnd: false,
    },
  });
}
