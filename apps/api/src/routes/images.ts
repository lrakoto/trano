import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';

export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

const BASE_URL = process.env.BASE_URL ?? 'https://api.trano.app';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
};

export async function imageRoutes(app: FastifyInstance) {
  // POST /listings/:id/images — owner only, max 10 images per listing
  app.post('/:id/images', {
    onRequest: [app.authenticate],
    config:    { rateLimit: { max: 30, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { id }   = request.params as { id: string };
    const userId   = (request.user as any).sub as string;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing)                   return reply.status(404).send({ error: 'Listing not found' });
    if (listing.ownerId !== userId) return reply.status(403).send({ error: 'Forbidden' });

    const imageCount = await prisma.listingImage.count({ where: { listingId: id } });
    if (imageCount >= 10) {
      return reply.status(400).send({ error: 'Max 10 images per listing' });
    }

    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    if (!ALLOWED_MIME.includes(data.mimetype)) {
      // drain the stream to avoid hanging
      data.file.resume();
      return reply.status(400).send({ error: 'Only JPEG, PNG, or WebP images are allowed' });
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    const ext      = EXT_MAP[data.mimetype] ?? '.jpg';
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    try {
      await pipeline(data.file, fs.createWriteStream(filePath));
    } catch {
      // clean up partial file
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return reply.status(500).send({ error: 'Upload failed' });
    }

    const image = await prisma.listingImage.create({
      data: {
        listingId: id,
        url:       `${BASE_URL}/uploads/${filename}`,
        order:     imageCount,
      },
    });

    return reply.status(201).send(image);
  });

  // DELETE /listings/:id/images/:imageId — owner only
  app.delete('/:id/images/:imageId', {
    onRequest: [app.authenticate],
    config:    { rateLimit: { max: 20, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { id, imageId } = request.params as { id: string; imageId: string };
    const userId          = (request.user as any).sub as string;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing)                   return reply.status(404).send({ error: 'Not found' });
    if (listing.ownerId !== userId) return reply.status(403).send({ error: 'Forbidden' });

    const image = await prisma.listingImage.findUnique({ where: { id: imageId } });
    if (!image || image.listingId !== id) {
      return reply.status(404).send({ error: 'Image not found' });
    }

    // Delete file from disk (best-effort)
    try {
      const filename = path.basename(new URL(image.url).pathname);
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch { /* ignore */ }

    await prisma.listingImage.delete({ where: { id: imageId } });
    return reply.status(204).send();
  });
}
