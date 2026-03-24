import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { encrypt, decrypt } from '../../utils/crypto';
import { completeJob, findActiveJob, startJob } from '../../services/jobs';
import { startOfDay } from 'date-fns';
import { runSyncJob } from '../../services/syncRunner';
import { HomeAssistantClient } from '../../services/homeAssistant';

const connectionBodySchema = z.object({
  name: z.string().min(2),
  baseUrl: z.string().url(),
  accessToken: z.string().min(10)
});

const mappingBodySchema = z.object({
  stepsEntityId: z.string().min(3),
  weightEntityId: z.string().optional(),
  distanceEntityId: z.string().optional(),
  activeMinutesEntityId: z.string().optional()
});

const importBodySchema = z.object({
  fromDate: z.string().datetime()
});

const getUserId = (request: FastifyRequest) => request.user.id;

export default async function connectionRoutes(app: FastifyInstance) {
  const requireConnection = async (id: string, userId: string) => {
    const connection = await app.prisma.homeAssistantConnection.findFirst({
      where: { id, userId },
      include: { mapping: true }
    });
    if (!connection) {
      throw app.httpErrors.notFound('Connection not found');
    }
    return connection;
  };

  const createHaClient = (connection: { baseUrl: string; accessTokenEncrypted: string }) => {
    const token = decrypt(connection.accessTokenEncrypted);
    return new HomeAssistantClient(connection.baseUrl, token);
  };

  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const connections = await app.prisma.homeAssistantConnection.findMany({
      where: { userId },
      include: { mapping: true, lifetimeStat: true }
    });
    return {
      connections: connections.map(({ accessTokenEncrypted, ...rest }) => rest)
    };
  });

  app.post('/', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const body = connectionBodySchema.parse(request.body);

    const connection = await app.prisma.homeAssistantConnection.create({
      data: {
        userId,
        name: body.name,
        baseUrl: body.baseUrl,
        accessTokenEncrypted: encrypt(body.accessToken)
      }
    });

    const { accessTokenEncrypted, ...safe } = connection;
    return { connection: safe };
  });

  app.delete('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    await requireConnection(id, userId);
    await app.prisma.homeAssistantConnection.delete({ where: { id } });
    return { success: true };
  });

  app.post('/:id/test', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const connection = await requireConnection(id, userId);
    const client = createHaClient(connection);
    await client.testConnection();
    return { success: true };
  });

  app.get('/:id/entities', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const connection = await requireConnection(id, userId);
    const client = createHaClient(connection);
    const entities = await client.listEntities();
    return { entities };
  });

  app.post('/:id/mapping', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    await requireConnection(id, userId);
    const body = mappingBodySchema.parse(request.body);

    const mapping = await app.prisma.sensorMapping.upsert({
      where: { connectionId: id },
      update: body,
      create: {
        connectionId: id,
        ...body
      }
    });

    return { mapping };
  });

  app.post('/:id/import', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    await requireConnection(id, userId);
    const body = importBodySchema.parse(request.body);

    const fromDate = startOfDay(new Date(body.fromDate));
    const toDate = new Date();

    const activeJob = await findActiveJob(app.prisma, id);
    if (activeJob) {
      return reply.status(409).send({ message: 'Sync already running' });
    }

    const job = await startJob(app.prisma, id, 'IMPORT');

    try {
      const days = await runSyncJob({
        prisma: app.prisma,
        connectionId: id,
        userId,
        type: 'IMPORT',
        fromDate,
        toDate
      });
      await completeJob(app.prisma, job.id, { success: true, importedDays: days });
      return { success: true, importedDays: days };
    } catch (error) {
      await completeJob(app.prisma, job.id, {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Import failed'
      });
      if (error instanceof Error && error.message === 'Sensor mapping required') {
        throw app.httpErrors.badRequest(error.message);
      }
      throw error;
    }
  });

  app.post('/:id/sync', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    const connection = await requireConnection(id, userId);

    const fromDate = connection.lastSyncAt
      ? startOfDay(connection.lastSyncAt)
      : startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const toDate = new Date();

    const activeJob = await findActiveJob(app.prisma, id);
    if (activeJob) {
      return reply.status(409).send({ message: 'Sync already running' });
    }

    const job = await startJob(app.prisma, id, 'SYNC');

    try {
      const days = await runSyncJob({
        prisma: app.prisma,
        connectionId: id,
        userId,
        type: 'SYNC',
        fromDate,
        toDate
      });
      await completeJob(app.prisma, job.id, { success: true, importedDays: days });
      return { success: true, importedDays: days };
    } catch (error) {
      await completeJob(app.prisma, job.id, {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Sync failed'
      });
      if (error instanceof Error && error.message === 'Sensor mapping required') {
        throw app.httpErrors.badRequest(error.message);
      }
      throw error;
    }
  });

  app.get('/:id/sync-status', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };
    await requireConnection(id, userId);
    const job = await app.prisma.syncJob.findFirst({
      where: { connectionId: id },
      orderBy: { startedAt: 'desc' }
    });
    return { job };
  });
}
