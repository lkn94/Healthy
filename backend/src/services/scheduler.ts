import type { FastifyInstance } from 'fastify';
import cron from 'node-cron';
import { startOfDay, subDays } from 'date-fns';
import { env } from '../env';
import { findActiveJob, startJob, completeJob } from './jobs';
import { runSyncJob } from './syncRunner';

export const registerSchedulers = (app: FastifyInstance) => {
  cron.schedule(`*/${env.SYNC_INTERVAL_MINUTES} * * * *`, async () => {
    const connections = await app.prisma.homeAssistantConnection.findMany();
    for (const connection of connections) {
      const active = await findActiveJob(app.prisma, connection.id);
      if (active) continue;
      const job = await startJob(app.prisma, connection.id, 'SCHEDULED');
      try {
        const fromDate = connection.lastSyncAt
          ? startOfDay(connection.lastSyncAt)
          : subDays(startOfDay(new Date()), 1);
        const toDate = startOfDay(new Date());
        const days = await runSyncJob({
          prisma: app.prisma,
          connectionId: connection.id,
          userId: connection.userId,
          type: 'SCHEDULED',
          fromDate,
          toDate
        });
        await completeJob(app.prisma, job.id, { success: true, importedDays: days });
      } catch (error) {
        await completeJob(app.prisma, job.id, {
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Scheduled sync failed'
        });
        app.log.error({ err: error }, 'Scheduled sync failed');
      }
    }
  });

  cron.schedule('5 0 * * *', async () => {
    const connections = await app.prisma.homeAssistantConnection.findMany();
    for (const connection of connections) {
      const active = await findActiveJob(app.prisma, connection.id);
      if (active) continue;
      const job = await startJob(app.prisma, connection.id, 'SCHEDULED');
      try {
        const toDate = startOfDay(new Date());
        const fromDate = subDays(toDate, 1);
        const days = await runSyncJob({
          prisma: app.prisma,
          connectionId: connection.id,
          userId: connection.userId,
          type: 'SCHEDULED',
          fromDate,
          toDate
        });
        await completeJob(app.prisma, job.id, { success: true, importedDays: days });
      } catch (error) {
        await completeJob(app.prisma, job.id, {
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Midnight sync failed'
        });
        app.log.error({ err: error }, 'Midnight sync failed');
      }
    }
  });
};
