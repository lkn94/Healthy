import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const settingsSchema = z.object({
  showOnLeaderboard: z.boolean()
});

export default async function userRoutes(app: FastifyInstance) {
  app.get('/settings', { preHandler: [app.authenticate] }, async (request) => {
    const user = await app.prisma.user.findUnique({ where: { id: request.user.id } });
    if (!user) {
      throw app.httpErrors.notFound('User not found');
    }
    return { showOnLeaderboard: user.showOnLeaderboard };
  });

  app.patch('/settings', { preHandler: [app.authenticate] }, async (request) => {
    const body = settingsSchema.parse(request.body);
    const updated = await app.prisma.user.update({
      where: { id: request.user.id },
      data: { showOnLeaderboard: body.showOnLeaderboard }
    });
    return { showOnLeaderboard: updated.showOnLeaderboard };
  });
}
