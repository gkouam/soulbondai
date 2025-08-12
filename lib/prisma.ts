import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma with better connection handling
const prismaClientOptions = {
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  errorFormat: "minimal" as const,
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions)

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Ensure the database connection is established
export async function ensureDbConnected() {
  try {
    await prisma.$connect()
  } catch (error) {
    console.error("Failed to connect to database:", error)
    throw error
  }
}