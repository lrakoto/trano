import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export async function userRoutes(app: FastifyInstance) {
  // GET /users/me — current user profile (auth required)
  app.get('/me', { onRequest: [app.authenticate], config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (request) => {
    const userId = (request.user as any).sub as string;
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, phone: true, email: true,
        whatsappPhone: true, role: true, isVerified: true,
        profilePicture: true, createdAt: true,
      },
    });
  });

  // GET /users/:id/listings — public listings for a given user
  app.get('/:id/listings', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (request) => {
    const { id } = request.params as { id: string };
    return prisma.listing.findMany({
      where: { ownerId: id, status: { not: 'INACTIVE' } },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { order: 'asc' }, take: 1 } },
    });
  });
}
