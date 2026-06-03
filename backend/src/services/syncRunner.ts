import type { PrismaClient } from '@prisma/client';
import { decrypt } from '../utils/crypto';
import { HomeAssistantClient, type HaStateEntity, type HistoryResponse } from './homeAssistant';
import { buildDailySnapshots } from './snapshots';
import { resolveStepWrite } from './snapshotWrites';
import { recalculateLifetimeStats } from './stats';
import { env } from '../env';
import { getDayLabelsBetween, getZonedDayBounds, getZonedDayLabel } from './timezone';

export interface SyncRunnerParams {
  prisma: PrismaClient;
  connectionId: string;
  userId: string;
  type: 'IMPORT' | 'SYNC' | 'SCHEDULED';
  fromDate: Date;
  toDate: Date;
  fromDayLabel?: string;
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
    const timeZone = await client.fetchTimeZone();

    const entityIds = [
      connection.mapping.stepsEntityId,
      connection.mapping.weightEntityId,
      connection.mapping.distanceEntityId,
      connection.mapping.activeMinutesEntityId,
      connection.mapping.caloriesEntityId
    ].filter(Boolean) as string[];

    const historyMap = new Map<string, HaStateEntity[]>();
    const firstDayLabel = params.fromDayLabel ?? getZonedDayLabel(params.fromDate, timeZone);
    const lastDayLabel = getZonedDayLabel(params.toDate, timeZone);
    const dayLabels = getDayLabelsBetween(firstDayLabel, lastDayLabel);

    for (const dayLabel of dayLabels) {
      const { start, end } = getZonedDayBounds(dayLabel, timeZone);
      const chunkHistory = await client.fetchHistory({
        from: start,
        to: end,
        entityIds
      });

      for (const series of chunkHistory) {
        if (!series.length) continue;
        const entityId = series[0].entity_id;
        if (!historyMap.has(entityId)) {
          historyMap.set(entityId, []);
        }
        historyMap.get(entityId)!.push(...series);
      }
    }

    const mergedHistory: HistoryResponse = [];
    for (const entries of historyMap.values()) {
      entries.sort((a, b) => new Date(a.last_changed).getTime() - new Date(b.last_changed).getTime());
      mergedHistory.push(entries);
    }

    const snapshots = buildDailySnapshots({
      history: mergedHistory,
      mapping: connection.mapping,
      dayLabels,
      timeZone,
      defaultStepLengthMeters: env.DEFAULT_STEP_LENGTH_METERS
    });

    const todayLabel = getZonedDayLabel(new Date(), timeZone);

    for (const snapshot of snapshots) {
      const targetDate = snapshot.date;
      const targetLabel = targetDate.toISOString().split('T')[0];
      const existing = await params.prisma.dailyHealthSnapshot.findUnique({
        where: {
          userId_connectionId_date: {
            userId: params.userId,
            connectionId: params.connectionId,
            date: targetDate
          }
        }
      });

      const writeDecision = resolveStepWrite({
        existing,
        snapshot,
        targetLabel,
        todayLabel,
        syncType: params.type
      });

      if (!writeDecision.shouldWrite) {
        continue;
      }

      const payload = {
        userId: params.userId,
        connectionId: params.connectionId,
        date: targetDate,
        steps: writeDecision.steps,
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
