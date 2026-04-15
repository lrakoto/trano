import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

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
  whatsappContact:  z.string().optional(),
});

const querySchema = z.object({
  page:         z.coerce.number().default(1),
  pageSize:     z.coerce.number().max(50).default(20),
  region:       z.enum(REGION_VALUES).optional(),
  listingType:  z.enum(['RENT', 'SALE']).optional(),
  propertyType: z.enum(['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL']).optional(),
  minPrice:     z.coerce.number().optional(),
  maxPrice:     z.coerce.number().optional(),
  sort:         z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
});

export async function listingRoutes(app: FastifyInstance) {
  // GET /listings — paginated, filterable list (150 req/min per IP)
  app.get('/', { config: { rateLimit: { max: 150, timeWindow: '1 minute' } } }, async (request) => {
    const { page, pageSize, region, listingType, propertyType, minPrice, maxPrice, sort } =
      querySchema.parse(request.query);

    const where: any = { status: 'ACTIVE', isModerated: false };
    if (region)       where.region       = region;
    if (listingType)  where.listingType  = listingType;
    if (propertyType) where.propertyType = propertyType;
    if (minPrice || maxPrice) {
      where.priceMga = {};
      if (minPrice) where.priceMga.gte = BigInt(minPrice);
      if (maxPrice) where.priceMga.lte = BigInt(maxPrice);
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
          owner: { select: { id: true, name: true, isVerified: true, role: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  });

  // GET /listings/:id — full detail (150 req/min per IP)
  app.get('/:id', { config: { rateLimit: { max: 150, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        owner: {
          select: { id: true, name: true, isVerified: true, role: true, whatsappPhone: true },
        },
      },
    });
    if (!listing) return reply.status(404).send({ error: 'Listing not found' });
    return listing;
  });

  // POST /listings — create (auth required, max 10 active listings per user)
  app.post('/', {
    onRequest: [app.authenticate],
    config:    { rateLimit: { max: 20, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const body   = createListingSchema.parse(request.body);
    const userId = (request.user as any).sub as string;

    const activeCount = await prisma.listing.count({
      where: { ownerId: userId, status: 'ACTIVE' },
    });
    if (activeCount >= 10) {
      return reply.status(429).send({ error: 'Active listing limit reached (10 max)' });
    }

    const listing = await prisma.listing.create({
      data: { ...body, priceMga: BigInt(body.priceMga), ownerId: userId },
      include: { images: true },
    });
    return reply.status(201).send(listing);
  });

  // PATCH /listings/:id — edit (owner only)
  app.patch('/:id', {
    onRequest: [app.authenticate],
    config:    { rateLimit: { max: 20, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { id }   = request.params as { id: string };
    const userId   = (request.user as any).sub as string;
    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing)              return reply.status(404).send({ error: 'Not found' });
    if (existing.ownerId !== userId) return reply.status(403).send({ error: 'Forbidden' });

    const body    = createListingSchema.partial().parse(request.body);
    const updated = await prisma.listing.update({
      where:   { id },
      data:    { ...body, ...(body.priceMga != null ? { priceMga: BigInt(body.priceMga) } : {}) },
      include: { images: true },
    });
    return updated;
  });

  // DELETE /listings/:id — remove (owner only)
  app.delete('/:id', {
    onRequest: [app.authenticate],
    config:    { rateLimit: { max: 10, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { id }   = request.params as { id: string };
    const userId   = (request.user as any).sub as string;
    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing)                   return reply.status(404).send({ error: 'Not found' });
    if (existing.ownerId !== userId) return reply.status(403).send({ error: 'Forbidden' });
    await prisma.listing.delete({ where: { id } });
    return reply.status(204).send();
  });

  // POST /listings/:id/report — flag a listing (auth required)
  app.post('/:id/report', {
    onRequest: [app.authenticate],
    config:    { rateLimit: { max: 30, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { id }     = request.params as { id: string };
    const { reason } = z.object({ reason: z.string().min(5).max(500) }).parse(request.body);
    const userId     = (request.user as any).sub as string;

    // Prevent the same user from reporting the same listing twice
    const alreadyReported = await prisma.report.findFirst({
      where: { listingId: id, reporterId: userId },
    });
    if (alreadyReported) {
      return reply.status(409).send({ error: 'Already reported' });
    }

    const [, updated] = await prisma.$transaction([
      prisma.report.create({ data: { listingId: id, reporterId: userId, reason } }),
      prisma.listing.update({
        where: { id },
        data:  { reportCount: { increment: 1 } },
      }),
    ]);

    // Auto-quarantine after 5 reports — pending admin review
    if (updated.reportCount >= 5) {
      await prisma.listing.update({
        where: { id },
        data:  { isModerated: true },
      });
    }

    return { success: true };
  });
}
