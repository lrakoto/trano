import { FastifyInstance } from 'fastify';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

const s3 = new S3Client({
  region:   'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET      = 'trano-images';
const PUBLIC_URL  = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, ''); // e.g. https://pub-xxx.r2.dev

const ALLOWED_MIME: Record<string, string> = {
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

    const ext = ALLOWED_MIME[data.mimetype];
    if (!ext) {
      data.file.resume();
      return reply.status(400).send({ error: 'Only JPEG, PNG, or WebP images are allowed' });
    }

    const key = `listings/${id}/${crypto.randomUUID()}${ext}`;

    try {
      await new Upload({
        client: s3,
        params: {
          Bucket:      BUCKET,
          Key:         key,
          Body:        data.file,
          ContentType: data.mimetype,
        },
      }).done();
    } catch {
      return reply.status(500).send({ error: 'Upload failed' });
    }

    const image = await prisma.listingImage.create({
      data: {
        listingId: id,
        url:       `${PUBLIC_URL}/${key}`,
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

    // Extract R2 key from stored URL and delete from bucket
    try {
      const key = image.url.replace(`${PUBLIC_URL}/`, '');
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    } catch { /* ignore — DB record still gets removed */ }

    await prisma.listingImage.delete({ where: { id: imageId } });
    return reply.status(204).send();
  });
}
