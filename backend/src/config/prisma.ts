import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isConnectionError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes('Server has closed the connection') ||
    message.includes('Connection reset') ||
    message.includes('P1001') ||
    message.includes('P1017') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT')
  );
};

async function withDbRetry<T>(operation: () => Promise<T>, retries = 4): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isConnectionError(error) || attempt === retries) throw error;
      const waitMs = Math.min(1500 * attempt, 8000);
      console.warn(`[prisma] Transient DB error (attempt ${attempt}/${retries}). Retrying in ${waitMs}ms...`);
      await sleep(waitMs);
    }
  }
  throw lastError;
}

export const ensureDatabaseConnection = async (retries = 6) => {
  await withDbRetry(() => basePrisma.$queryRawUnsafe('SELECT 1'), retries);
};

const prisma = basePrisma.$extends({
  query: {
    $allOperations({ args, query }) {
      return withDbRetry(() => query(args));
    },
  },
});

export default prisma as unknown as PrismaClient;
