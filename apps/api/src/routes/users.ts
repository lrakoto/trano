import { FastifyInstance, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { queueR2Deletion } from '../lib/r2';
import { listingViewerId, publicListingWhere } from '../lib/moderation';

const deleteAccountSchema = z.object({ password: z.string().min(1).max(128) });

async function authenticatedUserId(request: FastifyRequest) {
  try {
    const { sub } = await request.jwtVerify<{ sub?: unknown }>();
    if (typeof sub === 'string' && sub) return sub;
  } catch {
    // The account routes reply with 401 for missing or invalid credentials.
  }
}

export async function userRoutes(app: FastifyInstance) {
  // Suspended users can still access their own account settings and delete their account.
  app.get('/me', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (request, reply) => {
    const userId = await authenticatedUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, phone: true, email: true,
        whatsappPhone: true, role: true, isVerified: true,
        profilePicture: true, createdAt: true,
      },
    });
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });
    return user;
  });

  app.delete('/me', { config: { rateLimit: { max: 10, timeWindow: '1 hour' } } }, async (request, reply) => {
    const userId = await authenticatedUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { password } = deleteAccountSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!user) return reply.status(204).send();
    if (!await bcrypt.compare(password, user.passwordHash)) {
      return reply.status(403).send({ error: 'Incorrect password' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      await tx.$queryRaw`
        SELECT "id" FROM "Listing" WHERE "ownerId" = ${userId}
        OR "id" IN (SELECT "listingId" FROM "Report" WHERE "reporterId" = ${userId} AND NOT "resolved")
        ORDER BY "id" FOR UPDATE
      `;
      const images = await tx.listingImage.findMany({
        where: { listing: { ownerId: userId } },
        select: { url: true },
      });
      await queueR2Deletion(tx, images);
      await tx.$executeRaw`
        UPDATE "Listing"
        SET "reportCount" = GREATEST(0, "reportCount" - 1),
            "updatedAt" = GREATEST("updatedAt" + INTERVAL '1 millisecond', clock_timestamp() AT TIME ZONE 'UTC')
        WHERE "ownerId" <> ${userId}
        AND "id" IN (SELECT "listingId" FROM "Report" WHERE "reporterId" = ${userId} AND NOT "resolved")
      `;
      await tx.user.deleteMany({ where: { id: userId } });
    });
    return reply.status(204).send();
  });

  app.get('/me/listings', { onRequest: [app.authenticate], config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (request) => {
    const userId = (request.user as { sub: string }).sub;
    return prisma.listing.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { order: 'asc' }, take: 1 } },
    });
  });

  // GET /users/:id/listings — public listings for a given user
  app.get('/:id/listings', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (request) => {
    const { id } = request.params as { id: string };
    return prisma.listing.findMany({
      where: { ...publicListingWhere(await listingViewerId(request)), ownerId: id },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { order: 'asc' }, take: 1 } },
    });
  });
}
