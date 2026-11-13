import type { Prisma } from '@prisma/client';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { queueR2Deletion } from '../lib/r2';
import { listingViewerId, lockListing, publicListingWhere } from '../lib/moderation';

const REGION_VALUES = [
  'ANALAMANGA', 'VAKINANKARATRA', 'ITASY', 'BONGOLAVA', 'MATSIATRA_AMBONY',
  'AMORON_I_MANIA', 'IHOROMBE', 'ATSIMO_ATSINANANA', 'ATSINANANA', 'ANALANJIROFO',
  'ALAOTRA_MANGORO', 'BOENY', 'SOFIA', 'BETSIBOKA', 'MELAKY', 'ATSIMO_ANDREFANA',
  'ANDROY', 'ANOSY', 'MENABE', 'DIANA', 'SAVA', 'VATOVAVY_FITOVINANY',
] as const;

const createListingSchema = z.object({
  title:            z.string().min(5),
  description:      z.string().min(20),
  priceMga:         z.number().int().positive(),
  priceUsdSnapshot: z.number().optional(),
  listingType:      z.enum(['RENT', 'SALE']),
  propertyType:     z.enum(['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL']),
  bedrooms:         z.number().int().min(0).optional(),
  bathrooms:        z.number().int().min(0).optional(),
  areaSqm:          z.number().positive().optional(),
  addressFreeform:  z.string().min(5),
  city:             z.string().min(2),
  region:           z.enum(REGION_VALUES),
  latitude:         z.number().min(-90).max(90),
  longitude:        z.number().min(-180).max(180),
  whatsappContact:  z.string().nullable().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
const querySchema = paginationSchema.extend({
  region:       z.enum(REGION_VALUES).optional(),
  listingType:  z.enum(['RENT', 'SALE']).optional(),
  propertyType: z.enum(['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL']).optional(),
  minPrice:     z.coerce.number().int().safe().nonnegative().optional(),
  maxPrice:     z.coerce.number().int().safe().nonnegative().optional(),
  sort:         z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
});

const ownerSummary = { id: true, name: true, isVerified: true, role: true } as const;

function currentUser(request: FastifyRequest) {
  return request.user as { sub: string; role: string };
}

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (currentUser(request).role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Forbidden' });
  }
}

export async function listingRoutes(app: FastifyInstance) {
  // GET /listings — paginated, filterable list (150 req/min per IP)
  app.get('/', { config: { rateLimit: { max: 150, timeWindow: '1 minute' } } }, async (request) => {
    const { page, pageSize, region, listingType, propertyType, minPrice, maxPrice, sort } =
      querySchema.parse(request.query);

    const where = publicListingWhere(await listingViewerId(request));
    if (region)       where.region       = region;
    if (listingType)  where.listingType  = listingType;
    if (propertyType) where.propertyType = propertyType;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.priceMga = {};
      if (minPrice !== undefined) where.priceMga.gte = BigInt(minPrice);
      if (maxPrice !== undefined) where.priceMga.lte = BigInt(maxPrice);
    }

    const orderBy =
      sort === 'price_asc'  ? { priceMga: 'asc'  as const } :
      sort === 'price_desc' ? { priceMga: 'desc' as const } :
                              { createdAt: 'desc' as const };

    const [data, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          owner: { select: ownerSummary },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  });

  app.get('/saved', {
    onRequest: [app.authenticate],
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
  }, async (request) => {
    const { ids } = z.object({
      ids: z.string().max(2100)
        .transform((value) => value.split(','))
        .pipe(z.array(z.string().min(1).max(40)).min(1).max(50)),
    }).parse(request.query);

    return prisma.listing.findMany({
      where: { id: { in: ids }, ...publicListingWhere(currentUser(request).sub) },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        owner: { select: ownerSummary },
      },
    });
  });

  // GET /listings/:id — full detail (150 req/min per IP)
  app.get('/:id', { config: { rateLimit: { max: 150, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const viewerId = await listingViewerId(request);
    const visible = publicListingWhere(viewerId);
    const listing = await prisma.listing.findFirst({
      where: viewerId ? { id, OR: [visible, { ownerId: viewerId }] } : { id, ...visible },
      include: {
        images: { orderBy: { order: 'asc' } },
        owner: { select: { ...ownerSummary, whatsappPhone: true } },
      },
    });
    if (!listing) return reply.status(404).send({ error: 'Listing not found' });
    return listing;
  });

  // Create a private draft. The mobile client submits it after saving its photos.
  app.post('/', {
    onRequest: [app.authenticate],
    config:    { rateLimit: { max: 20, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { draftKey, ...body } = createListingSchema.extend({
      draftKey: z.string().regex(/^[\w-]{1,80}$/).optional(),
    }).parse(request.body);
    const userId = currentUser(request).sub;
    const result = await prisma.$transaction(async (tx) => {
      const [owner] = await tx.$queryRaw<{ isSuspended: boolean }[]>
        `SELECT "isSuspended" FROM "User" WHERE id = ${userId} FOR UPDATE`;
      if (!owner || owner.isSuspended) return { status: 403, body: { error: 'Forbidden' } };

      if (draftKey) {
        const existing = await tx.listing.findUnique({
          where: { ownerId_draftKey: { ownerId: userId, draftKey } },
          include: { images: true },
        });
        if (existing) return { status: 200, body: existing };
      }

      const listingCount = await tx.listing.count({
        where: { ownerId: userId, status: { in: ['ACTIVE', 'UNDER_REVIEW'] } },
      });
      if (listingCount >= 10) {
        return { status: 429, body: { error: 'Active or pending listing limit reached (10 max)' } };
      }

      const listing = await tx.listing.create({
        data: { ...body, draftKey, priceMga: BigInt(body.priceMga), ownerId: userId, status: 'UNDER_REVIEW' },
        include: { images: true },
      });
      return { status: 201, body: listing };
    });
    return reply.status(result.status).send(result.body);
  });

  // PATCH /listings/:id — edit (owner only)
  app.patch('/:id', {
    onRequest: [app.authenticate],
    config:    { rateLimit: { max: 20, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { priceMga, ...body } = createListingSchema.partial().parse(request.body);
    const result = await prisma.$transaction(async (tx) => {
      const userId = currentUser(request).sub;
      const [owner] = await tx.$queryRaw<{ isSuspended: boolean }[]>
        `SELECT "isSuspended" FROM "User" WHERE id = ${userId} FOR UPDATE`;
      if (!owner || owner.isSuspended) return { status: 403, body: { error: 'Forbidden' } };
      const listing = await lockListing(tx, id);
      if (!listing) return { status: 404, body: { error: 'Listing not found' } };
      if (listing.ownerId !== userId) return { status: 403, body: { error: 'Forbidden' } };

      if (listing.status !== 'ACTIVE' && listing.status !== 'UNDER_REVIEW') {
        const listingCount = await tx.listing.count({
          where: { ownerId: userId, status: { in: ['ACTIVE', 'UNDER_REVIEW'] } },
        });
        if (listingCount >= 10) {
          return { status: 429, body: { error: 'Active or pending listing limit reached (10 max)' } };
        }
      }

      const updated = await tx.listing.update({
        where: { id },
        data: {
          ...body,
          priceMga: priceMga === undefined ? undefined : BigInt(priceMga),
          status: 'UNDER_REVIEW',
          reviewReadyAt: null,
        },
        include: { images: true },
      });
      return { status: 200, body: updated };
    });
    return reply.status(result.status).send(result.body);
  });

  app.post('/:id/submit', {
    onRequest: [app.authenticate],
    config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await prisma.$transaction(async (tx) => {
      const listing = await lockListing(tx, id);
      if (!listing) return { status: 404, body: { error: 'Listing not found' } };
      if (listing.ownerId !== currentUser(request).sub) {
        return { status: 403, body: { error: 'Forbidden' } };
      }
      if (listing.status === 'ACTIVE') return { status: 204 };
      if (listing.status !== 'UNDER_REVIEW') {
        return { status: 409, body: { error: 'Edit the listing before submitting it for review' } };
      }
      if (!listing.reviewReadyAt) {
        await tx.listing.update({ where: { id }, data: { reviewReadyAt: new Date() } });
      }
      return { status: 204 };
    });
    return reply.status(result.status).send(result.body);
  });

  // DELETE /listings/:id — remove (owner only)
  app.delete('/:id', {
    onRequest: [app.authenticate],
    config:    { rateLimit: { max: 10, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await prisma.$transaction(async (tx) => {
      const listing = await lockListing(tx, id);
      if (!listing) return { status: 404, body: { error: 'Listing not found' } };
      if (listing.ownerId !== currentUser(request).sub) {
        return { status: 403, body: { error: 'Forbidden' } };
      }
      const images = await tx.listingImage.findMany({ where: { listingId: id }, select: { url: true } });
      await queueR2Deletion(tx, images);
      await tx.listing.delete({ where: { id } });
      return { status: 204 };
    });
    return reply.status(result.status).send(result.body);
  });

  // POST /listings/:id/report — flag a listing (auth required)
  app.post('/:id/report', {
    onRequest: [app.authenticate],
    config:    { rateLimit: { max: 30, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = z.object({ reason: z.string().trim().min(5).max(500) }).parse(request.body);
    const userId = currentUser(request).sub;
    const result = await prisma.$transaction(async (tx) => {
      const [reporter] = await tx.$queryRaw<{ isSuspended: boolean }[]>
        `SELECT "isSuspended" FROM "User" WHERE id = ${userId} FOR SHARE`;
      if (!reporter || reporter.isSuspended) return { status: 403, body: { error: 'Forbidden' } };
      const listing = await lockListing(tx, id);
      if (listing?.ownerId === userId) return { status: 403, body: { error: 'Forbidden' } };

      const existing = await tx.report.findUnique({
        where: { listingId_reporterId: { listingId: id, reporterId: userId } },
        select: { id: true, resolvedAt: true },
      });
      if (existing && (!existing.resolvedAt || !listing?.moderatedAt || listing.moderatedAt <= existing.resolvedAt)) {
        return { status: 409, body: { error: 'Already reported' } };
      }

      const visible = await tx.listing.findFirst({ where: { id, ...publicListingWhere(userId) }, select: { id: true } });
      if (!visible || !listing) return { status: 404, body: { error: 'Listing not found' } };

      const reportCount = listing.reportCount + 1;
      if (existing) {
        await tx.report.update({
          where: { id: existing.id },
          data: { reason, resolved: false, resolvedAt: null, createdAt: new Date() },
        });
      } else {
        await tx.report.create({ data: { listingId: id, reporterId: userId, reason } });
      }
      await tx.listing.update({
        where: { id },
        data: {
          reportCount,
          ...(reportCount >= 5 && { status: 'UNDER_REVIEW', reviewReadyAt: new Date(), isModerated: true }),
        },
      });
      return { status: 200, body: { success: true } };
    });
    return reply.status(result.status).send(result.body);
  });

  app.get('/blocked-users', {
    onRequest: [app.authenticate],
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
  }, async (request) => {
    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: currentUser(request).sub },
      orderBy: { createdAt: 'desc' },
      select: { blocked: { select: { id: true, name: true } } },
    });
    return blocks.map(({ blocked }) => blocked);
  });

  app.post('/:id/block-owner', {
    onRequest: [app.authenticate],
    config: { rateLimit: { max: 30, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const blockerId = currentUser(request).sub;
    const listing = await prisma.listing.findUnique({ where: { id }, select: { ownerId: true } });
    if (!listing) return reply.status(404).send({ error: 'Listing not found' });
    if (listing.ownerId === blockerId) return reply.status(403).send({ error: 'Forbidden' });

    await prisma.userBlock.createMany({
      data: [{ blockerId, blockedId: listing.ownerId }],
      skipDuplicates: true,
    });
    return reply.status(204).send();
  });

  app.delete('/blocked-users/:userId', {
    onRequest: [app.authenticate],
    config: { rateLimit: { max: 30, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    await prisma.userBlock.deleteMany({ where: { blockerId: currentUser(request).sub, blockedId: userId } });
    return reply.status(204).send();
  });

  app.get('/moderation/queue', {
    onRequest: [app.authenticate, requireAdmin],
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
  }, async (request) => {
    const { page, pageSize } = paginationSchema.parse(request.query);
    const where: Prisma.ListingWhereInput = {
      OR: [
        { status: 'UNDER_REVIEW', reviewReadyAt: { not: null } },
        { status: { in: ['ACTIVE', 'UNDER_REVIEW'] }, reports: { some: { resolved: false } } },
      ],
    };
    const [data, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: [{ reviewReadyAt: { sort: 'asc', nulls: 'first' } }, { updatedAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          owner: { select: { id: true, name: true, isSuspended: true } },
          images: { orderBy: { order: 'asc' } },
          reports: { where: { resolved: false }, orderBy: { createdAt: 'asc' } },
        },
      }),
      prisma.listing.count({ where }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  });

  app.patch('/moderation/:listingId', {
    onRequest: [app.authenticate, requireAdmin],
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { listingId } = request.params as { listingId: string };
    const { action, updatedAt } = z.object({
      action: z.enum(['approve', 'remove']),
      updatedAt: z.string().datetime(),
    }).parse(request.body);
    const result = await prisma.$transaction(async (tx) => {
      const listing = await lockListing(tx, listingId);
      if (!listing) return { status: 404, body: { error: 'Listing not found' } };

      const ready = listing.status === 'UNDER_REVIEW' && listing.reviewReadyAt !== null;
      const reported = listing.reportCount > 0;
      const canDecide = ready || (reported && (action === 'remove' || listing.status === 'ACTIVE'));
      if (!canDecide || listing.updatedAt.getTime() !== Date.parse(updatedAt)) {
        return { status: 409, body: { error: 'The listing changed or is no longer awaiting review' } };
      }
      if (action === 'approve') {
        const owner = await tx.user.findUnique({ where: { id: listing.ownerId }, select: { isSuspended: true } });
        if (owner?.isSuspended) return { status: 409, body: { error: 'The owner is suspended' } };
      }

      const now = new Date();
      const approved = action === 'approve';
      if (!approved) {
        const images = await tx.listingImage.findMany({
          where: { listingId },
          select: { url: true },
        });
        await queueR2Deletion(tx, images);
        await tx.listingImage.deleteMany({ where: { listingId } });
      }
      await tx.report.updateMany({
        where: { listingId, resolved: false },
        data: { resolved: true, resolvedAt: now },
      });
      const updated = await tx.listing.update({
        where: { id: listingId },
        data: {
          status: approved ? 'ACTIVE' : 'INACTIVE',
          isModerated: !approved,
          moderatedAt: ready || !approved ? now : listing.moderatedAt,
          reviewReadyAt: null,
          reportCount: 0,
        },
      });
      return { status: 200, body: updated };
    });
    return reply.status(result.status).send(result.body);
  });

  app.patch('/moderation/users/:userId', {
    onRequest: [app.authenticate, requireAdmin],
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { isSuspended } = z.object({ isSuspended: z.boolean() }).parse(request.body);
    const result = await prisma.user.updateMany({
      where: { id: userId, role: { not: 'ADMIN' } },
      data: { isSuspended },
    });
    if (!result.count) return reply.status(404).send({ error: 'User not found' });
    return reply.status(204).send();
  });
}
