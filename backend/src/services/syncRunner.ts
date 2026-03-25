import type { PrismaClient } from '@prisma/client';
import { startOfDay, subDays } from 'date-fns';
import { decrypt } from '../utils/crypto';
import { HomeAssistantClient } from './homeAssistant';
import { buildDailySnapshots } from './snapshots';
import { recalculateLifetimeStats } from './stats';
import { env } from '../env';

export interface SyncRunnerParams {
  prisma: PrismaClient;
  connectionId: string;
  userId: string;
  type: 'IMPORT' | 'SYNC' | 'SCHEDULED';
  fromDate: Date;
  toDate: Date;
}

export const runSyncJob = async (params: SyncRunnerParams) => {
  const connection = await params.prisma.homeAssistantConnection.findUnique({
    where: { id: params.connectionId },
    include: { mapping: true }
  });
  if (!connection || connection.userId !== params.userId) {
    throw new Error('Connection not found');
  }
  if (!connection.mapping) {
    throw new Error('Sensor mapping required');
  }

  await params.prisma.homeAssistantConnection.update({
    where: { id: params.connectionId },
    data: { status: 'syncing' }
  });

  try {
    const token = decrypt(connection.accessTokenEncrypted);
    const client = new HomeAssistantClient(connection.baseUrl, token);

    const entityIds = [
      connection.mapping.stepsEntityId,
      connection.mapping.weightEntityId,
      connection.mapping.distanceEntityId,
      connection.mapping.activeMinutesEntityId,
      connection.mapping.caloriesEntityId
    ].filter(Boolean) as string[];

    const historyFrom = subDays(params.fromDate, 1);
    const history = await client.fetchHistory({
      from: historyFrom,
      to: params.toDate,
      entityIds
    });

    const snapshots = buildDailySnapshots({
      history,
      mapping: connection.mapping,
      from: historyFrom,
      to: params.toDate,
      defaultStepLengthMeters: env.DEFAULT_STEP_LENGTH_METERS
    });

    const actualStart = startOfDay(params.fromDate);
    const relevantSnapshots = snapshots.filter((snapshot) => snapshot.date >= actualStart);

    for (const snapshot of relevantSnapshots) {
      await params.prisma.dailyHealthSnapshot.upsert({
        where: {
          userId_connectionId_date: {
            userId: params.userId,
            connectionId: params.connectionId,
            date: startOfDay(snapshot.date)
          }
        },
        update: {
          steps: snapshot.steps,
          weight: snapshot.weight,
          distanceKm: snapshot.distanceKm,
          activeMinutes: snapshot.activeMinutes,
          calories: snapshot.calories,
          source: params.type.toLowerCase()
        },
        create: {
          userId: params.userId,
          connectionId: params.connectionId,
          date: startOfDay(snapshot.date),
          steps: snapshot.steps,
          weight: snapshot.weight,
          distanceKm: snapshot.distanceKm,
          activeMinutes: snapshot.activeMinutes,
          calories: snapshot.calories,
          source: params.type.toLowerCase()
        }
      });
    }

    await recalculateLifetimeStats(params.prisma, params.connectionId);

    await params.prisma.homeAssistantConnection.update({
      where: { id: params.connectionId },
      data: { lastSyncAt: new Date(), status: 'idle' }
    });

    return relevantSnapshots.length;
  } catch (error) {
    await params.prisma.homeAssistantConnection.update({
      where: { id: params.connectionId },
      data: { status: 'error' }
    });
    throw error;
  }
};
