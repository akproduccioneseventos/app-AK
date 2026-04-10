// src/lib/firebase/storage.ts
// Server-side Firebase Storage utilities using the Admin SDK.
'use server';

import admin from 'firebase-admin';
import path from 'path';

const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  'presupuestador-ak-producciones.firebasestorage.app';

/**
 * Returns the Firebase Storage bucket instance, or null if unavailable.
 */
function getBucket(): ReturnType<ReturnType<typeof admin.storage>['bucket']> | null {
  try {
    if (!admin.apps.length) return null;
    return admin.storage().bucket(STORAGE_BUCKET);
  } catch {
    return null;
  }
}

/**
 * Check whether Firebase Storage is configured and available.
 */
export function isStorageAvailable(): boolean {
  return getBucket() !== null;
}

/**
 * Upload a buffer to Firebase Storage.
 *
 * @param buffer      File contents as a Buffer.
 * @param storagePath Destination path inside the bucket (e.g. "contracts/cust_123/file.pdf").
 * @param contentType MIME type of the file (e.g. "application/pdf", "image/jpeg").
 * @param isPublic    When true the file is made publicly readable and a public URL is returned.
 *                    When false (default) a signed URL valid for 7 days is returned.
 * @returns           The public or signed URL of the uploaded file.
 */
export async function uploadToStorage(
  buffer: Buffer,
  storagePath: string,
  contentType: string,
  isPublic: boolean = false
): Promise<string> {
  const bucket = getBucket();
  if (!bucket) throw new Error('Firebase Storage no está disponible.');

  const file = bucket.file(storagePath);

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  if (isPublic) {
    await file.makePublic();
    return `https://storage.googleapis.com/${STORAGE_BUCKET}/${storagePath}`;
  }

  // Return a signed URL valid for 7 days
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  return signedUrl;
}

/**
 * Delete a file from Firebase Storage.
 *
 * @param urlOrPath Full public/signed URL or the raw storage path (e.g. "contracts/cust_123/file.pdf").
 */
export async function deleteFromStorage(urlOrPath: string): Promise<void> {
  const bucket = getBucket();
  if (!bucket) return; // If Storage is not available, skip silently

  let storagePath = urlOrPath;

  // Extract the path component from a full URL if needed
  if (urlOrPath.startsWith('https://')) {
    try {
      const url = new URL(urlOrPath);
      // Handle signed URLs (path is after the bucket name) and public URLs
      // Public: https://storage.googleapis.com/<bucket>/<path>
      // Signed: https://storage.googleapis.com/<bucket>/<path>?X-Goog-...
      storagePath = url.pathname.replace(`/${STORAGE_BUCKET}/`, '').replace(/^\//, '');
      // If still looks like a full path (signed URL may have extra segments), clean it
      if (storagePath.includes(STORAGE_BUCKET)) {
        storagePath = storagePath.split(STORAGE_BUCKET + '/')[1] || storagePath;
      }
    } catch {
      // If URL parsing fails, use as-is
    }
  }

  try {
    await bucket.file(storagePath).delete();
  } catch (err: any) {
    // Ignore "not found" errors — file may have already been deleted
    if (err?.code !== 404) {
      console.warn(`[Storage] Could not delete ${storagePath}:`, err?.message ?? err);
    }
  }
}

/**
 * Generate a fresh signed URL for an existing file in Storage.
 *
 * @param storagePath Raw path inside the bucket.
 * @param expiresInMs How long the URL should be valid (default: 7 days).
 */
export async function getSignedUrl(
  storagePath: string,
  expiresInMs: number = 7 * 24 * 60 * 60 * 1000
): Promise<string | null> {
  const bucket = getBucket();
  if (!bucket) return null;

  try {
    const [url] = await bucket.file(storagePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMs,
    });
    return url;
  } catch {
    return null;
  }
}

/**
 * Extract the storage path from a full Firebase Storage URL.
 * Returns the original string if parsing fails.
 */
export function extractStoragePath(urlOrPath: string): string {
  if (!urlOrPath.startsWith('https://')) return urlOrPath;
  try {
    const url = new URL(urlOrPath);
    return url.pathname.replace(`/${STORAGE_BUCKET}/`, '').replace(/^\//, '').split('?')[0];
  } catch {
    return urlOrPath;
  }
}
