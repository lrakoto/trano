import type { Prisma } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { prisma } from './prisma';

export async function listingViewerId(request: FastifyRequest): Promise<string | undefined> {
  if (!request.headers.authorization) return;

  let claims: { sub?: unknown };
  try {
    claims = await request.jwtVerify<{ sub?: unknown }>();
  } catch {
    return;
  }
  if (typeof claims.sub !== 'string' || !claims.sub) return;

  const viewer = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, isSuspended: true },
  });
  if (viewer && !viewer.isSuspended) return viewer.id;
}

export function publicListingWhere(viewerId?: string): Prisma.ListingWhereInput {
  return {
    status: 'ACTIVE',
    isModerated: false,
    owner: {
      isSuspended: false,
      ...(viewerId && {
        blockedBy: { none: { blockerId: viewerId } },
        blockedUsers: { none: { blockedId: viewerId } },
      }),
    },
  };
}

export async function lockListing(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM "Listing" WHERE id = ${id} FOR UPDATE`;
  return tx.listing.findUnique({ where: { id } });
}
