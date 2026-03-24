import type { PrismaClient, SyncJob } from '@prisma/client';

export const findActiveJob = (prisma: PrismaClient, connectionId: string) =>
  prisma.syncJob.findFirst({
    where: { connectionId, status: 'RUNNING' },
    orderBy: { startedAt: 'desc' }
  });

export const startJob = async (
  prisma: PrismaClient,
  connectionId: string,
  type: string
): Promise<SyncJob> => {
  return prisma.syncJob.create({
    data: {
      connectionId,
      type,
      status: 'RUNNING'
    }
  });
};

export const completeJob = async (
  prisma: PrismaClient,
  jobId: string,
  data: { success: boolean; importedDays?: number; errorMessage?: string }
) => {
  await prisma.syncJob.update({
    where: { id: jobId },
    data: {
      status: data.success ? 'SUCCESS' : 'FAILED',
      finishedAt: new Date(),
      importedDays: data.importedDays ?? 0,
      errorMessage: data.errorMessage
    }
  });
};
