import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-unused-vars
  var prisma: PrismaClient | undefined
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
export type { PrismaClient }