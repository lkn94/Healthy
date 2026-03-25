import type { FastifyInstance } from 'fastify';
import { recalculateLifetimeStats } from './stats';

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
