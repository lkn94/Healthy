import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { env } from '../env';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DB_URL
    }
  }
});

export default fp(async (fastify) => {
  await prisma.$connect();
  try {
    await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL;');
  } catch (error) {
    fastify.log.warn({ err: error }, 'Failed to enable WAL mode');
  }

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
