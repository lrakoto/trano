import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth';
import { listingRoutes } from './routes/listings';
import { userRoutes } from './routes/users';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });
  app.register(jwt, { secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod' });

  // Decorate with authenticate hook used by protected routes
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  app.register(authRoutes,    { prefix: '/auth' });
  app.register(listingRoutes, { prefix: '/listings' });
  app.register(userRoutes,    { prefix: '/users' });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
