import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../env';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      displayName: string;
    };
    user: {
      id: string;
      email: string;
      displayName: string;
    };
  }
}

export default fp(async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      reply.status(401).send({ message: 'Unauthorized' });
    }
  });
});
