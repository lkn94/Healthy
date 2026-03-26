import type { FastifyInstance } from 'fastify';
import { startOfDay, subDays, addDays } from 'date-fns';
import fs from 'fs';
import path from 'path';
import { recalculateLifetimeStats } from './stats';
import { runSyncJob } from './syncRunner';

const HISTORY_MARKER_PATH = path.resolve(__dirname, '../../data/.history_rebuilt');

const normalizeSnapshotDistances = async (app: FastifyInstance) => {
  const snapshots = await app.prisma.dailyHealthSnapshot.findMany({
    where: { distanceKm: { gt: 500 } },
    select: { id: true, distanceKm: true, connectionId: true }
  });

  if (!snapshots.length) {
    return new Set<string>();
  }

  const affectedConnections = new Set<string>();

  for (const snapshot of snapshots) {
    const normalized = Number(((snapshot.distanceKm ?? 0) / 1000).toFixed(2));
    await app.prisma.dailyHealthSnapshot.update({
      where: { id: snapshot.id },
      data: { distanceKm: normalized }
    });
    affectedConnections.add(snapshot.connectionId);
  }

  return affectedConnections;
};

export const runDataMaintenance = async (app: FastifyInstance) => {
  try {
    if (!fs.existsSync(HISTORY_MARKER_PATH)) {
      const success = await rebuildHistoricalSnapshots(app);
      if (success) {
        fs.writeFileSync(HISTORY_MARKER_PATH, new Date().toISOString());
      }
    }

    await rebuildRecentSnapshots(app);
    const affectedConnections = await normalizeSnapshotDistances(app);
    const allConnections = await app.prisma.homeAssistantConnection.findMany({
      select: { id: true }
    });

    const uniqueConnectionIds = new Set<string>([...affectedConnections, ...allConnections.map((c) => c.id)]);

    for (const connectionId of uniqueConnectionIds) {
      await recalculateLifetimeStats(app.prisma, connectionId);
    }
  } catch (error) {
    app.log.error({ err: error }, 'Data maintenance failed');
  }
};

const rebuildRecentSnapshots = async (app: FastifyInstance) => {
  const connections = await app.prisma.homeAssistantConnection.findMany({
    select: { id: true, userId: true }
  });
  if (!connections.length) return;

  const toDate = new Date();
  const fromDate = subDays(startOfDay(toDate), 4);

  for (const connection of connections) {
    try {
      await runSyncJob({
        prisma: app.prisma,
        connectionId: connection.id,
        userId: connection.userId,
        type: 'SCHEDULED',
        fromDate,
        toDate
      });
    } catch (error) {
      app.log.warn({ err: error, connectionId: connection.id }, 'Failed to rebuild recent snapshots');
    }
  }
};

const rebuildHistoricalSnapshots = async (app: FastifyInstance) => {
  const connections = await app.prisma.homeAssistantConnection.findMany({
    select: { id: true, userId: true }
  });
  if (!connections.length) return true;

  const chunkSize = 7; // days per chunk
  const now = new Date();

  for (const connection of connections) {
    const firstSnapshot = await app.prisma.dailyHealthSnapshot.findFirst({
      where: { connectionId: connection.id },
      orderBy: { date: 'asc' }
    });
    if (!firstSnapshot) {
      continue;
    }

    let cursor = startOfDay(firstSnapshot.date);
    while (cursor < now) {
      const chunkEndDate = addDays(cursor, chunkSize - 1);
      const toDate = chunkEndDate < now ? chunkEndDate : now;
      try {
        await runSyncJob({
          prisma: app.prisma,
          connectionId: connection.id,
          userId: connection.userId,
          type: 'SCHEDULED',
          fromDate: cursor,
          toDate
        });
      } catch (error) {
        app.log.warn(
          { err: error, connectionId: connection.id },
          'Failed to rebuild historical chunk'
        );
        return false;
      }
      cursor = addDays(startOfDay(chunkEndDate), 1);
    }
  }

  return true;
};
