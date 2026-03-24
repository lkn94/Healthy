import type { FastifyInstance } from 'fastify';
import authRoutes from './modules/auth';
import connectionRoutes from './modules/connections';
import dashboardRoutes from './modules/dashboard';
import userRoutes from './modules/user';
import leaderboardRoutes from './modules/leaderboard';

export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes, { prefix: '/auth' });
  app.register(connectionRoutes, { prefix: '/connections' });
  app.register(dashboardRoutes, { prefix: '/dashboard' });
  app.register(userRoutes, { prefix: '/user' });
  app.register(leaderboardRoutes, { prefix: '/leaderboard' });
}
