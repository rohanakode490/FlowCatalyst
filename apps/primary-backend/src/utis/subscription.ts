import { Prisma } from "@flowcatalyst/database";

export async function createFreeSubscription(
  prisma: Prisma.TransactionClient,
  userId: number,
) {
  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { name: "free" },
  });

  if (!freePlan) {
    console.error("Free subscription plan not configured");
  }

  // console.log("freePlan", freePlan, "\n\n");
  return prisma.subscription.create({
    //@ts-ignore
    data: {
      userId,
      planId: freePlan?.id,
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
