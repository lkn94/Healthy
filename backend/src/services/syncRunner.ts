import type { PrismaClient } from '@prisma/client';
import { startOfDay } from 'date-fns';
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

    const history = await client.fetchHistory({
      from: params.fromDate,
      to: params.toDate,
      entityIds
    });

    const snapshots = buildDailySnapshots({
      history,
      mapping: connection.mapping,
      from: params.fromDate,
      to: params.toDate,
      defaultStepLengthMeters: env.DEFAULT_STEP_LENGTH_METERS
    });

    for (const snapshot of snapshots) {
      const targetDate = startOfDay(snapshot.date);
      const existing = await params.prisma.dailyHealthSnapshot.findUnique({
        where: {
          userId_connectionId_date: {
            userId: params.userId,
            connectionId: params.connectionId,
            date: targetDate
          }
        }
      });

      const payload = {
        userId: params.userId,
        connectionId: params.connectionId,
        date: targetDate,
        steps: snapshot.steps,
        weight: snapshot.weight,
        distanceKm: snapshot.distanceKm,
        activeMinutes: snapshot.activeMinutes,
        calories: snapshot.calories,
        source: params.type.toLowerCase()
      };

      if (!existing) {
        await params.prisma.dailyHealthSnapshot.create({ data: payload });
        continue;
      }

      const hasNewData =
        (snapshot.steps ?? 0) > 0 ||
        typeof snapshot.weight === 'number' ||
        typeof snapshot.distanceKm === 'number' ||
        typeof snapshot.activeMinutes === 'number' ||
        typeof snapshot.calories === 'number';

      if (!hasNewData) {
        continue;
      }

      await params.prisma.dailyHealthSnapshot.update({
        where: { id: existing.id },
        data: payload
      });
    }

    await recalculateLifetimeStats(params.prisma, params.connectionId);

    await params.prisma.homeAssistantConnection.update({
      where: { id: params.connectionId },
      data: { lastSyncAt: new Date(), status: 'idle' }
    });

    return snapshots.length;
  } catch (error) {
    await params.prisma.homeAssistantConnection.update({
      where: { id: params.connectionId },
      data: { status: 'error' }
    });
    throw error;
  }
};
