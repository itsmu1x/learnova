import { createHmac, randomUUID } from 'node:crypto';
import { getEnv } from '@learnova/config';
import { InternalError } from '@learnova/shared';

export interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

export function isImageKitConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.IMAGEKIT_PRIVATE_KEY && env.IMAGEKIT_PUBLIC_KEY && env.IMAGEKIT_URL_ENDPOINT);
}

/**
 * Produces the signed auth params the client SDK needs to upload directly to
 * ImageKit. Signing happens server-side so the private key never reaches the
 * browser. This mirrors ImageKit's documented HMAC-SHA1 scheme.
 */
export function getImageKitAuthParams(): ImageKitAuthParams {
  const env = getEnv();
  if (!isImageKitConfigured()) {
    throw new InternalError('ImageKit is not configured');
  }
  const token = randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 60 * 30;
  const signature = createHmac('sha1', env.IMAGEKIT_PRIVATE_KEY)
    .update(token + expire)
    .digest('hex');
  return {
    token,
    expire,
    signature,
    publicKey: env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
  };
}

/**
 * Server-side upload from a remote URL (e.g. Mux thumbnail). ImageKit fetches
 * the source and returns a permanent public CDN URL.
 */
export async function uploadImageFromUrl(
  sourceUrl: string,
  fileName: string,
  folder = '/learnova/video-thumbs',
): Promise<string> {
  const env = getEnv();
  if (!isImageKitConfigured()) {
    throw new InternalError('ImageKit is not configured');
  }

  const body = new FormData();
  body.append('file', sourceUrl);
  body.append('fileName', fileName);
  body.append('folder', folder);
  body.append('useUniqueFileName', 'true');

  const auth = Buffer.from(`${env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64');
  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}` },
    body,
  });

  const json = (await res.json().catch(() => null)) as { url?: string; message?: string } | null;
  if (!res.ok || !json?.url) {
    throw new InternalError(json?.message ?? 'ImageKit upload failed');
  }
  return json.url;
}
