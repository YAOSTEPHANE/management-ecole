import { PrismaClient } from '@prisma/client';

// Singleton pattern pour éviter plusieurs instances de PrismaClient
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaLogQueries =
  process.env.PRISMA_LOG_QUERIES === 'true' || process.env.PRISMA_LOG_QUERIES === '1';

const prismaLogLevel =
  process.env.NODE_ENV === 'development'
    ? prismaLogQueries
      ? (['query', 'error', 'warn'] as const)
      : (['error', 'warn'] as const)
    : (['error'] as const);

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: [...prismaLogLevel],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;

