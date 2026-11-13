import { FastifyInstance } from 'fastify';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { lockListing } from '../lib/moderation';
import { r2, BUCKET, PUBLIC_URL, queueR2Deletion } from '../lib/r2';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

export async function imageRoutes(app: FastifyInstance) {
  // POST /listings/:id/images — owner only, max 10 images per listing
  app.post('/:id/images', {
    onRequest: [app.authenticate],
    config:    { rateLimit: { max: 30, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { sub: userId } = request.user as { sub: string };
    const uploadId = z.string().regex(/^[\w-]{1,80}$/).optional().parse(request.headers['x-upload-id']);
    const imageId = uploadId
      ? createHash('sha256').update(id).update(':').update(uploadId).digest('hex')
      : randomUUID();

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { _count: { select: { images: true } } },
    });
    if (!listing) return reply.status(404).send({ error: 'Listing not found' });
    if (listing.ownerId !== userId) return reply.status(403).send({ error: 'Forbidden' });

    const existing = await prisma.listingImage.findUnique({ where: { id: imageId } });
    if (existing) {
      const duplicate = await request.file();
      if (duplicate) await duplicate.toBuffer();
      return reply.status(200).send(existing);
    }
    if (listing.status !== 'UNDER_REVIEW' || listing.reviewReadyAt) {
      return reply.status(409).send({ error: 'Edit the listing before adding photos' });
    }
    if (listing._count.images >= 10) {
      return reply.status(400).send({ error: 'Max 10 images per listing' });
    }
    if (!PUBLIC_URL) return reply.status(503).send({ error: 'Image storage is unavailable' });

    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    const ext = ALLOWED_MIME[data.mimetype];
    if (!ext) {
      data.file.resume();
      return reply.status(400).send({ error: 'Only JPEG, PNG, WebP, HEIC, or HEIF images are allowed' });
    }

    const body = await data.toBuffer();
    if (!body.length) return reply.status(400).send({ error: 'Empty image' });
    const key = `listings/${id}/${randomUUID()}${ext}`;
    const url = `${PUBLIC_URL}/${key}`;

    try {
      await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: data.mimetype,
      }), { abortSignal: AbortSignal.timeout(30_000) });
    } catch (err) {
      request.log.warn({ err }, 'Image upload failed');
      return reply.status(500).send({ error: 'Upload failed' });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const current = await lockListing(tx, id);
        const duplicate = await tx.listingImage.findUnique({ where: { id: imageId } });
        if (duplicate) {
          await queueR2Deletion(tx, [{ url }]);
          return { status: 200, body: duplicate };
        }
        if (!current || current.ownerId !== userId || current.status !== 'UNDER_REVIEW'
          || current.reviewReadyAt || current.updatedAt.getTime() !== listing.updatedAt.getTime()) {
          await queueR2Deletion(tx, [{ url }]);
          return { status: 409, body: { error: 'The listing changed while the photo was uploading' } };
        }

        const photos = await tx.listingImage.aggregate({
          where: { listingId: id },
          _count: true,
          _max: { order: true },
        });
        if (photos._count >= 10) {
          await queueR2Deletion(tx, [{ url }]);
          return { status: 400, body: { error: 'Max 10 images per listing' } };
        }

        const image = await tx.listingImage.create({
          data: { id: imageId, listingId: id, url, order: (photos._max.order ?? -1) + 1 },
        });
        return { status: 201, body: image };
      });
      return reply.status(result.status).send(result.body);
    } catch (err) {
      // A failed commit can have an ambiguous outcome. Delete the uploaded object
      // only once we've verified that no listing image references it.
      try {
        await prisma.$transaction(async (tx) => {
          if (!await tx.listingImage.findFirst({ where: { id: imageId, url } })) {
            await queueR2Deletion(tx, [{ url }]);
          }
        });
      } catch (cleanupError) {
        request.log.error({ err: cleanupError }, 'Could not schedule cleanup of uploaded image');
      }
      throw err;
    }
  });

  // DELETE /listings/:id/images/:imageId — owner only
  app.delete('/:id/images/:imageId', {
    onRequest: [app.authenticate],
    config:    { rateLimit: { max: 20, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { id, imageId } = request.params as { id: string; imageId: string };
    const { sub: userId } = request.user as { sub: string };
    const result = await prisma.$transaction(async (tx) => {
      const listing = await lockListing(tx, id);
      if (!listing) return { status: 404, body: { error: 'Listing not found' } };
      if (listing.ownerId !== userId) return { status: 403, body: { error: 'Forbidden' } };

      const image = await tx.listingImage.findFirst({ where: { id: imageId, listingId: id } });
      if (!image) return { status: 204 };
      if (listing.status !== 'UNDER_REVIEW' || listing.reviewReadyAt) {
        return { status: 409, body: { error: 'Edit the listing before deleting photos' } };
      }

      await queueR2Deletion(tx, [image]);
      await tx.listingImage.delete({ where: { id: imageId } });
      return { status: 204 };
    });
    return reply.status(result.status).send(result.body);
  });
}
