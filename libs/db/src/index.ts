import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  templateforgePrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.templateforgePrisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.templateforgePrisma = prisma;
}

export * from '@prisma/client';
