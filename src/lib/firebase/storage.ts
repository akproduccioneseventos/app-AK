// src/lib/firebase/storage.ts
// Server-side Firebase Storage helper using Firebase Admin SDK.
// Used to upload files to Firebase Storage and obtain public URLs or signed URLs.
'use server';

import admin from 'firebase-admin';

/** Resolves the Firebase Storage bucket name from environment variables. */
function resolveBucketName(): string {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'presupuestador-ak-producciones'}.appspot.com`
  );
}

/**
 * Returns the Firebase Storage bucket, or null if not available.
 * Requires Firebase Admin SDK to be initialized (see server.ts).
 */
function getBucket(): admin.storage.Bucket | null {
  try {
    if (!admin.apps.length) return null;
    return admin.storage().bucket(resolveBucketName());
  } catch {
    return null;
  }
}

/**
 * Uploads a file buffer to Firebase Storage.
 *
 * For public files (gallery images, social media assets): set `isPublic = true`.
 * This makes the file publicly readable and returns a stable public URL.
 *
 * For sensitive files (contracts, budgets, invoices): omit `isPublic` or pass `false`.
 * A long-lived signed URL (10 years) is generated instead, keeping the file private.
 *
 * Returns null if Firebase Storage is not available (falls back to caller).
 *
 * @param buffer      - File content as a Buffer
 * @param storagePath  - Path inside the bucket (e.g. 'contracts/cust_123/contrato.pdf')
 * @param contentType  - MIME type (e.g. 'application/pdf', 'image/jpeg')
 * @param isPublic     - If true, makes the file publicly readable. Default: false (signed URL)
 * @returns URL string on success, null if Storage is unavailable
 */
export async function uploadToStorage(
  buffer: Buffer,
  storagePath: string,
  contentType: string,
  isPublic = false
): Promise<string | null> {
  const bucket = getBucket();
  if (!bucket) return null;

  try {
    const file = bucket.file(storagePath);
    await file.save(buffer, {
      contentType,
      metadata: { contentType },
    });

    if (isPublic) {
      await file.makePublic();
      return `https://storage.googleapis.com/${resolveBucketName()}/${storagePath}`;
    } else {
      // Generate a long-lived signed URL (10 years) for private/sensitive files
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
      });
      return signedUrl;
    }
  } catch (error: any) {
    console.error(`[Storage] Error uploading ${storagePath}:`, error?.message ?? error);
    return null;
  }
}

/**
 * Deletes a file from Firebase Storage.
 * Silently ignores errors (e.g. file not found).
 *
 * @param storageUrlOrPath - Full Storage URL / signed URL, or path inside the bucket
 */
export async function deleteFromStorage(storageUrlOrPath: string): Promise<void> {
  const bucket = getBucket();
  if (!bucket) return;

  try {
    // If the value is a full URL, extract the path component
    let resolvedPath = storageUrlOrPath;
    if (storageUrlOrPath.startsWith('https://storage.googleapis.com/')) {
      // Public URL format: https://storage.googleapis.com/{bucket}/{path}
      const withoutBase = storageUrlOrPath.replace('https://storage.googleapis.com/', '');
      const slashIdx = withoutBase.indexOf('/');
      if (slashIdx !== -1) {
        resolvedPath = withoutBase.slice(slashIdx + 1);
      }
    } else if (storageUrlOrPath.startsWith('https://storage.googleapis.com') || storageUrlOrPath.startsWith('https://firebasestorage.googleapis.com')) {
      // Signed URL — extract path from URL query params is complex; use bucket metadata instead
      // In this case, we skip deletion (signed URL paths are hard to reverse without the original path)
      console.warn(`[Storage] Cannot delete from signed URL; store original storagePath for deletion.`);
      return;
    }
    await bucket.file(resolvedPath).delete({ ignoreNotFound: true });
  } catch (error: any) {
    console.warn(`[Storage] Could not delete ${storageUrlOrPath}:`, error?.message ?? error);
  }
}

/**
 * Returns true if Firebase Storage is configured and available.
 */
export function isStorageAvailable(): boolean {
  return getBucket() !== null;
}

