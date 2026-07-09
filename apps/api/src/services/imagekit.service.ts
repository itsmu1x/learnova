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
  return Boolean(env.IMAGEKIT_PRIVATE_KEY && env.IMAGEKIT_PUBLIC_KEY);
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
