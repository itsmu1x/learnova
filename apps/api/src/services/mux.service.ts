import Mux from '@mux/mux-node';
import { getEnv } from '@learnova/config';
import { InternalError } from '@learnova/shared';

let client: Mux | null = null;

export function isMuxConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.MUX_TOKEN_ID && env.MUX_TOKEN_SECRET);
}

function getMux(): Mux {
  const env = getEnv();
  if (!isMuxConfigured()) throw new InternalError('Mux is not configured');
  if (!client) {
    client = new Mux({ tokenId: env.MUX_TOKEN_ID, tokenSecret: env.MUX_TOKEN_SECRET });
  }
  return client;
}

export interface MuxDirectUpload {
  uploadId: string;
  uploadUrl: string;
}

/**
 * Creates a Mux direct upload URL. The instructor's browser uploads the raw file
 * straight to Mux — it never touches our servers. Assets are created with a
 * signed playback policy when signing keys are configured.
 */
export async function createDirectUpload(title: string): Promise<MuxDirectUpload> {
  const env = getEnv();
  const mux = getMux();
  const useSignedPlayback = Boolean(env.MUX_SIGNING_KEY_ID && env.MUX_SIGNING_KEY_PRIVATE_KEY);

  const upload = await mux.video.uploads.create({
    cors_origin: env.WEB_URL,
    new_asset_settings: {
      playback_policy: [useSignedPlayback ? 'signed' : 'public'],
      passthrough: title.slice(0, 255),
    },
  });

  if (!upload.id || !upload.url) {
    throw new InternalError('Mux direct upload creation failed');
  }

  return { uploadId: upload.id, uploadUrl: upload.url };
}

/** Resolves the Mux asset id once the direct upload has finished. */
export async function resolveUploadAssetId(uploadId: string): Promise<string | null> {
  const mux = getMux();
  const upload = await mux.video.uploads.retrieve(uploadId);
  return upload.asset_id ?? null;
}

export type MuxAssetStatus = 'preparing' | 'ready' | 'errored';

export async function getAssetStatus(assetId: string): Promise<MuxAssetStatus> {
  const mux = getMux();
  const asset = await mux.video.assets.retrieve(assetId);
  return asset.status as MuxAssetStatus;
}

export async function getAssetPlaybackId(assetId: string): Promise<string | null> {
  const mux = getMux();
  const asset = await mux.video.assets.retrieve(assetId);
  return asset.playback_ids?.[0]?.id ?? null;
}

const THUMB_PARAMS: Record<string, string> = { time: '1', width: '1280' };

/** Unsigned Mux Image API URL (works when the playback policy is public). */
export function muxThumbnailUrl(playbackId: string): string {
  const q = new URLSearchParams(THUMB_PARAMS);
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?${q.toString()}`;
}

/**
 * Returns a fetchable Mux thumbnail URL. When signing keys are configured the
 * asset uses a signed policy, so the URL includes a short-lived thumbnail JWT.
 */
export async function getMuxThumbnailFetchUrl(playbackId: string): Promise<string> {
  const env = getEnv();
  const base = muxThumbnailUrl(playbackId);
  if (!env.MUX_SIGNING_KEY_ID || !env.MUX_SIGNING_KEY_PRIVATE_KEY) return base;

  const mux = getMux();
  const token = await mux.jwt.signPlaybackId(playbackId, {
    keyId: env.MUX_SIGNING_KEY_ID,
    keySecret: env.MUX_SIGNING_KEY_PRIVATE_KEY,
    expiration: '1h',
    type: 'thumbnail',
    params: THUMB_PARAMS,
  });
  return `${base}&token=${token}`;
}

export interface MuxPlayback {
  playbackId: string;
  token: string | null;
}

/**
 * Returns a signed playback JWT for the Mux player. Direct stream URLs are never
 * exposed — clients use `playbackId` + `token` with `@mux/mux-player`.
 */
export async function getSignedPlayback(assetId: string): Promise<MuxPlayback> {
  const env = getEnv();
  const mux = getMux();
  const asset = await mux.video.assets.retrieve(assetId);
  const playbackId = asset.playback_ids?.[0]?.id;
  if (!playbackId) throw new InternalError('Mux asset has no playback ID yet');

  if (env.MUX_SIGNING_KEY_ID && env.MUX_SIGNING_KEY_PRIVATE_KEY) {
    const token = await mux.jwt.signPlaybackId(playbackId, {
      keyId: env.MUX_SIGNING_KEY_ID,
      keySecret: env.MUX_SIGNING_KEY_PRIVATE_KEY,
      expiration: '2h',
      type: 'video',
    });
    return { playbackId, token };
  }

  return { playbackId, token: null };
}
