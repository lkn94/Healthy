import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { env } from './env';
import prismaPlugin from './plugins/prisma';
import authPlugin from './plugins/auth';
import { registerRoutes } from './routes';
import { registerSchedulers } from './services/scheduler';
import { runDataMaintenance } from './services/maintenance';

const buildServer = () => {
  const app = Fastify({
    logger: true
  });

  app.register(sensible);
  app.register(cors, {
    origin: true,
    credentials: true
  });

  app.register(prismaPlugin);
  app.register(authPlugin);
  app.register(registerRoutes, { prefix: '/api' });

  const staticDir = path.join(__dirname, '../public');
  if (fs.existsSync(staticDir)) {
    app.register(staticPlugin, {
      root: staticDir,
      prefix: '/' // serve frontend assets
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api')) {
        reply.status(404).send({ message: 'Not Found' });
      } else {
        reply.type('text/html').sendFile('index.html');
      }
    });
  }

  app.after(() => {
    registerSchedulers(app);
    runDataMaintenance(app);
  });

  return app;
};

const server = buildServer();

const start = async () => {
  try {
    await server.listen({ port: env.APP_PORT, host: '0.0.0.0' });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export default server;
