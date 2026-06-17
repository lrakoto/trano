import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const r2 = new S3Client({
  region:   'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET     = 'trano-images';
export const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, ''); // e.g. https://pub-xxx.r2.dev

/** Strip the public URL prefix to recover the bucket key from a stored image URL. */
export function r2KeyFromUrl(url: string): string {
  return url.replace(`${PUBLIC_URL}/`, '');
}

/** Best-effort delete of one or more objects. Never throws — callers treat the
 *  DB record as the source of truth; a failed bucket delete only leaks storage. */
export async function deleteR2Objects(keys: string[]): Promise<void> {
  await Promise.all(
    keys.map((Key) =>
      r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key })).catch(() => {}),
    ),
  );
}
