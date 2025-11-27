import { PrismaClient } from "@prisma/client";

export type PrismaTransactionalClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

const globalForPrisma = global as unknown as { prismaClient: PrismaClient };

export const prismaClient = globalForPrisma.prismaClient || new PrismaClient();

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prismaClient = prismaClient;
