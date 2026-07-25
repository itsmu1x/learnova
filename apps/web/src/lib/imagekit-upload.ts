import { apiFetch } from './api';

export interface ImageKitAuth {
  configured: boolean;
  token?: string;
  expire?: number;
  signature?: string;
  publicKey?: string;
  urlEndpoint?: string;
  message?: string;
}

export async function getImageKitAuth(): Promise<ImageKitAuth> {
  return apiFetch<ImageKitAuth>('/uploads/imagekit/auth');
}

/**
 * Direct browser → ImageKit upload using server-signed auth params.
 * Returns the permanent CDN URL. Accepts images and common document types.
 */
export async function uploadFileToImageKit(
  file: File,
  folder = '/learnova/uploads',
): Promise<string> {
  const auth = await getImageKitAuth();
  if (!auth.configured || !auth.token || !auth.signature || !auth.publicKey || !auth.expire) {
    throw new Error(auth.message || 'Image uploads are not configured. Set ImageKit env vars on the API.');
  }

  const body = new FormData();
  body.append('file', file);
  body.append('fileName', file.name || `file-${Date.now()}`);
  body.append('publicKey', auth.publicKey);
  body.append('signature', auth.signature);
  body.append('expire', String(auth.expire));
  body.append('token', auth.token);
  body.append('folder', folder);
  body.append('useUniqueFileName', 'true');

  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body,
  });

  const json = (await res.json().catch(() => null)) as { url?: string; message?: string } | null;
  if (!res.ok || !json?.url) {
    throw new Error(json?.message || 'Upload failed');
  }
  return json.url;
}

/** @deprecated Prefer uploadFileToImageKit — kept for existing image callers. */
export async function uploadImageToImageKit(
  file: File,
  folder = '/learnova/thumbnails',
): Promise<string> {
  return uploadFileToImageKit(file, folder);
}
