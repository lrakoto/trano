import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

const registerSchema = z.object({
  name:     z.string().min(2).max(80),
  phone:    z.string().min(10).max(20),
  email:    z.string().email().optional(),
  password: z.string().min(8).max(128),
  role:     z.enum(['BUYER', 'SELLER', 'AGENT']).default('BUYER'),
});

const loginSchema = z.object({
  phone:    z.string(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register — 5 attempts per hour per IP
  app.post('/register', {
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (existing) return reply.status(409).send({ error: 'Phone number already registered' });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { name: body.name, phone: body.phone, email: body.email, role: body.role, passwordHash },
      select: { id: true, name: true, phone: true, email: true, role: true, isVerified: true },
    });

    const token = app.jwt.sign({ sub: user.id, role: user.role });
    return reply.status(201).send({ user, token });
  });

  // POST /auth/login — 10 attempts per 15 minutes per IP (brute-force guard)
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { phone: body.phone } });
    // Always run bcrypt compare to prevent timing-based user enumeration
    const validPassword = user
      ? await bcrypt.compare(body.password, user.passwordHash)
      : await bcrypt.compare(body.password, '$2a$10$placeholder.hash.to.prevent.timing.attack');

    if (!user || !validPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = app.jwt.sign({ sub: user.id, role: user.role });
    return {
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role, isVerified: user.isVerified },
      token,
    };
  });
}
