import { PrismaClient } from '@prisma/client'

// Validate DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasourceUrl: databaseUrl
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
