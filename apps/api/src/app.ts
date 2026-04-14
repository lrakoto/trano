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

  app.get('/privacy', async (_req, reply) => {
    reply.type('text/html; charset=utf-8');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy — Trano</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 680px; margin: 40px auto; padding: 0 20px; color: #111; line-height: 1.7; }
    h1   { color: #1A2B24; }
    h2   { color: #1A2B24; margin-top: 32px; }
    a    { color: #E8A000; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p><strong>Last updated: April 14, 2026</strong></p>
  <p>Trano ("we", "our", or "us") operates the Trano mobile application. This page explains what information we collect, how we use it, and your rights.</p>

  <h2>Information We Collect</h2>
  <ul>
    <li><strong>Account data:</strong> name, phone number, and optional email address provided at registration.</li>
    <li><strong>Listing data:</strong> property details, description, price, location coordinates, and WhatsApp contact number that you voluntarily submit.</li>
    <li><strong>Device location:</strong> only when you choose to use the "Use my location" feature to pin a listing. We do not track your location in the background.</li>
  </ul>

  <h2>How We Use Your Information</h2>
  <ul>
    <li>To create and display your listings to other users of the app.</li>
    <li>To authenticate your account securely.</li>
    <li>We do not sell your data to third parties.</li>
    <li>We do not use your data for advertising.</li>
  </ul>

  <h2>Data Storage</h2>
  <p>Your data is stored on servers located in Germany (Hetzner). Passwords are hashed using bcrypt and never stored in plain text. Authentication tokens expire after 24 hours.</p>

  <h2>Your Rights</h2>
  <p>You may request deletion of your account and all associated data by contacting us at <a href="mailto:hello@trano.app">hello@trano.app</a>. We will action all requests within 30 days.</p>

  <h2>Children</h2>
  <p>Trano is not directed at children under 13. We do not knowingly collect data from children.</p>

  <h2>Changes</h2>
  <p>We may update this policy. Continued use of the app after changes constitutes acceptance.</p>

  <h2>Contact</h2>
  <p>Questions? Email <a href="mailto:hello@trano.app">hello@trano.app</a></p>
</body>
</html>`;
  });

  return app;
}
