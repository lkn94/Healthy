import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';

const settingsSchema = z.object({
  showOnLeaderboard: z.boolean()
});

const profileSchema = z.object({
  displayName: z.string().min(2)
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
});

export default async function userRoutes(app: FastifyInstance) {
  app.get('/settings', { preHandler: [app.authenticate] }, async (request) => {
    const user = await app.prisma.user.findUnique({ where: { id: request.user.id } });
    if (!user) {
      throw app.httpErrors.notFound('User not found');
    }
    return {
      showOnLeaderboard: user.showOnLeaderboard,
      displayName: user.displayName
    };
  });

  app.patch('/settings', { preHandler: [app.authenticate] }, async (request) => {
    const body = settingsSchema.parse(request.body);
    const updated = await app.prisma.user.update({
      where: { id: request.user.id },
      data: { showOnLeaderboard: body.showOnLeaderboard }
    });
    return { showOnLeaderboard: updated.showOnLeaderboard };
  });

  app.patch('/profile', { preHandler: [app.authenticate] }, async (request) => {
    const body = profileSchema.parse(request.body);
    const updated = await app.prisma.user.update({
      where: { id: request.user.id },
      data: { displayName: body.displayName }
    });
    return { displayName: updated.displayName };
  });

  app.patch('/password', { preHandler: [app.authenticate] }, async (request) => {
    const body = passwordSchema.parse(request.body);
    const user = await app.prisma.user.findUnique({ where: { id: request.user.id } });
    if (!user) {
      throw app.httpErrors.notFound('User not found');
    }
    const valid = await argon2.verify(user.passwordHash, body.currentPassword);
    if (!valid) {
      throw app.httpErrors.badRequest('Aktuelles Passwort ist falsch');
    }
    const newHash = await argon2.hash(body.newPassword);
    await app.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });
    return { success: true };
  });
}
