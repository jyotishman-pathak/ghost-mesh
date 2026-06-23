import { PrismaClient } from '@prisma/client'

// Extend the globalThis type to include prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Export the singleton instance
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// In development, attach to globalThis to preserve the instance across hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}