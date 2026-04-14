import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { authRoutes } from './routes/auth';
import { listingRoutes } from './routes/listings';
import { userRoutes } from './routes/users';

export function buildApp() {
  const app = Fastify({ logger: true });

  // ── CORS ─────────────────────────────────────────────────────────────────
  // In production set origin to your actual domain(s)
  app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? true,
  });

  // ── JWT (24 h expiry) ─────────────────────────────────────────────────────
  app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
    sign:   { expiresIn: '24h' },
  });

  // ── Rate limiting ─────────────────────────────────────────────────────────
  // global: false — each route opts in explicitly so per-route limits are
  // guaranteed (global:true in v10 does not correctly override per-route).
  app.register(rateLimit, {
    global:      false,
    errorResponseBuilder: () => ({
      error:   'Too Many Requests',
      message: 'Slow down — try again shortly',
    }),
  });

  // ── Auth hook ─────────────────────────────────────────────────────────────
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // ── Zod validation errors → 400 ──────────────────────────────────────────
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      const first = err.issues[0];
      return reply.status(400).send({
        error:   'Validation error',
        message: first ? `${first.path.join('.')}: ${first.message}` : 'Invalid input',
      });
    }
    app.log.error(err);
    reply.status(err.statusCode ?? 500).send({ error: err.message ?? 'Internal server error' });
  });

  app.register(authRoutes,    { prefix: '/auth' });
  app.register(listingRoutes, { prefix: '/listings' });
  app.register(userRoutes,    { prefix: '/users' });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
