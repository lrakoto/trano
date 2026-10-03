import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { authRoutes } from './routes/auth';
import { listingRoutes } from './routes/listings';
import { userRoutes } from './routes/users';
import { imageRoutes } from './routes/images';

export function buildApp() {
  const app = Fastify({ logger: true });

  // ── CORS ─────────────────────────────────────────────────────────────────
  // In production set origin to your actual domain(s)
  app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? true,
  });

  // ── Multipart (image uploads, 8 MB limit) ────────────────────────────────
  app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024 } });

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
  app.register(imageRoutes,   { prefix: '/listings' });

  app.get('/health', async () => ({ status: 'ok' }));

  // ── Public pages: landing, privacy policy, support ──────────────────────
  // Plain HTML served by the API so trano.app / api.trano.app have the pages
  // the App Store listing links to (privacy policy URL, support URL).
  const page = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Trano</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 680px; margin: 40px auto; padding: 0 20px; color: #111; line-height: 1.7; }
    h1   { color: #1A2B24; }
    h2   { color: #1A2B24; margin-top: 32px; }
    a    { color: #E8A000; }
    .brand { font-weight: 800; color: #1A2B24; font-size: 2rem; }
    .muted { color: #555550; }
  </style>
</head>
<body>
${body}
  <p class="muted" style="margin-top:48px;font-size:0.85rem;"><a href="/">Trano</a> · <a href="/privacy">Privacy</a> · <a href="/support">Support</a></p>
</body>
</html>`;

  app.get('/', async (_req, reply) => {
    reply.type('text/html; charset=utf-8');
    return page('Home', `
  <p class="brand">Trano</p>
  <p>Fampiharana fitadiavana trano any Madagasikara.<br/>
  <span class="muted">A real-estate app for Madagascar: browse homes, land and rentals by city, and contact owners on WhatsApp.</span></p>
  <p>Available on the App Store for iPhone.</p>`);
  });

  app.get('/support', async (_req, reply) => {
    reply.type('text/html; charset=utf-8');
    return page('Support', `
  <h1>Support</h1>
  <p>Questions, problems or feedback about the Trano app? Email <a href="mailto:hello@trano.app">hello@trano.app</a> and we will get back to you.</p>
  <h2>Delete your account</h2>
  <p>Email <a href="mailto:hello@trano.app">hello@trano.app</a> from the phone number on your account and we will delete your account, your listings and their photos within 30 days.</p>
  <h2>Report a listing</h2>
  <p>Use the report button on a listing in the app. Listings reported several times are taken down for review automatically.</p>`);
  });

  app.get('/privacy', async (_req, reply) => {
    reply.type('text/html; charset=utf-8');
    return page('Privacy Policy', `
  <h1>Privacy Policy</h1>
  <p><strong>Last updated: October 3, 2026</strong></p>
  <p>Trano ("we", "our", or "us") operates the Trano mobile application. This page explains what information we collect, how we use it, and your rights.</p>

  <h2>Information We Collect</h2>
  <ul>
    <li><strong>Account data:</strong> name, phone number, and optional email address provided at registration.</li>
    <li><strong>Listing data:</strong> property details, description, price, photos, location coordinates, and WhatsApp contact number that you voluntarily submit.</li>
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
  <p>Account and listing data are stored on servers operated by Render in Frankfurt, Germany. Listing photos are stored with Cloudflare R2. Passwords are hashed using bcrypt and never stored in plain text. Authentication tokens expire after 24 hours.</p>

  <h2>Your Rights</h2>
  <p>You may request deletion of your account and all associated data by contacting us at <a href="mailto:hello@trano.app">hello@trano.app</a>. We will action all requests within 30 days.</p>

  <h2>Children</h2>
  <p>Trano is not directed at children under 13. We do not knowingly collect data from children.</p>

  <h2>Changes</h2>
  <p>We may update this policy. Continued use of the app after changes constitutes acceptance.</p>

  <h2>Contact</h2>
  <p>Questions? Email <a href="mailto:hello@trano.app">hello@trano.app</a></p>`);
  });

  return app;
}
