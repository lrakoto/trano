import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export const r2 = new S3Client({
  region:   'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  // R2 does not support the SDK's default full-object CRC32 checksum.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET     = 'trano-images';
export const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, ''); // e.g. https://pub-xxx.r2.dev

export async function queueR2Deletion(tx: Prisma.TransactionClient, images: { url: string }[]) {
  const keys = images
    .map(({ url }) => url.match(/(?:^|\/)(listings\/[^/]+\/[\w-]+\.(?:jpg|png|webp|heic|heif))$/)?.[1])
    .filter((key): key is string => key !== undefined);
  if (keys.length > 0) {
    await tx.r2Deletion.createMany({ data: keys.map((key) => ({ key })), skipDuplicates: true });
  }
}

// Claim work with a retry time before talking to R2. Another instance can
// retry after that time if the request fails or the process stops mid-delete.
export function startR2DeletionWorker(app: FastifyInstance) {
  let running: Promise<void> | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  const run = () => {
    if (running) return;
    running = (async () => {
      const pending = await prisma.r2Deletion.findMany({
        where: { nextAttemptAt: { lte: new Date() } },
        orderBy: { nextAttemptAt: 'asc' },
        take: 25,
      });
      await Promise.all(pending.map(async ({ key, nextAttemptAt }) => {
        const claim = await prisma.r2Deletion.updateMany({
          where: { key, nextAttemptAt },
          data: { nextAttemptAt: new Date(Date.now() + 5 * 60_000) },
        });
        if (!claim.count) return;
        try {
          await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }), {
            abortSignal: AbortSignal.timeout(20_000),
          });
          await prisma.r2Deletion.deleteMany({ where: { key } });
        } catch (err) {
          app.log.warn({ err }, 'R2 deletion will be retried');
        }
      }));
    })().catch((err) => app.log.error({ err }, 'R2 cleanup worker failed'))
      .finally(() => { running = undefined; });
  };

  app.addHook('onListen', async () => {
    timer = setInterval(run, 30_000);
    timer.unref();
    run();
  });
  app.addHook('onClose', async () => {
    clearInterval(timer);
    await running;
  });
}
