import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';

const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2)
});

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export default async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerBodySchema.parse(request.body);

    const existing = await app.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.status(400).send({ message: 'Email already registered' });
    }

    const passwordHash = await argon2.hash(body.password);
    const user = await app.prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        displayName: body.displayName
      }
    });

    const token = app.jwt.sign({
      id: user.id,
      email: user.email,
      displayName: user.displayName
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt
      }
    });
  });

  app.post('/login', async (request, reply) => {
    const body = loginBodySchema.parse(request.body);
    const user = await app.prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const valid = await argon2.verify(user.passwordHash, body.password);
    if (!valid) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const token = app.jwt.sign({
      id: user.id,
      email: user.email,
      displayName: user.displayName
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt
      }
    });
  });

  app.get('/me', { preHandler: [app.authenticate] }, async (request) => {
    const userId = request.user.id;
    const user = await app.prisma.user.findUnique({ where: { id: userId } });
    return {
      user: user ? {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt
      } : null
    };
  });
}
