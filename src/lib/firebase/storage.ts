// src/lib/firebase/storage.ts
// Server-side Firebase Storage helper using Firebase Admin SDK.
// Used to upload files to Firebase Storage and obtain public URLs.
'use server';

import admin from 'firebase-admin';

/**
 * Returns the Firebase Storage bucket, or null if not available.
 * Requires Firebase Admin SDK to be initialized (see server.ts).
 */
function getBucket(): admin.storage.Bucket | null {
  try {
    if (!admin.apps.length) return null;
    const bucketName =
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'presupuestador-ak-producciones'}.appspot.com`;
    return admin.storage().bucket(bucketName);
  } catch {
    return null;
  }
}

/**
 * Uploads a file buffer to Firebase Storage and returns its public URL.
 * Returns null if Firebase Storage is not available (falls back to caller).
 *
 * @param buffer     - File content as a Buffer
 * @param storagePath - Path inside the bucket (e.g. 'contracts/cust_123/contrato.pdf')
 * @param contentType - MIME type (e.g. 'application/pdf', 'image/jpeg')
 * @returns Public URL string on success, null if Storage is unavailable
 */
export async function uploadToStorage(
  buffer: Buffer,
  storagePath: string,
  contentType: string
): Promise<string | null> {
  const bucket = getBucket();
  if (!bucket) return null;

  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'presupuestador-ak-producciones'}.appspot.com`;

  try {
    const file = bucket.file(storagePath);
    await file.save(buffer, {
      contentType,
      metadata: { contentType },
    });
    // Make the file publicly readable
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;
    return publicUrl;
  } catch (error: any) {
    console.error(`[Storage] Error uploading ${storagePath}:`, error?.message ?? error);
    return null;
  }
}

/**
 * Deletes a file from Firebase Storage.
 * Silently ignores errors (e.g. file not found).
 *
 * @param storagePath - Path inside the bucket (e.g. 'contracts/cust_123/contrato.pdf')
 */
export async function deleteFromStorage(storagePath: string): Promise<void> {
  const bucket = getBucket();
  if (!bucket) return;

  try {
    // If the value is a full URL, extract the path component
    let resolvedPath = storagePath;
    if (storagePath.startsWith('https://storage.googleapis.com/')) {
      // URL format: https://storage.googleapis.com/{bucket}/{path}
      const withoutBase = storagePath.replace('https://storage.googleapis.com/', '');
      const slashIdx = withoutBase.indexOf('/');
      if (slashIdx !== -1) {
        resolvedPath = withoutBase.slice(slashIdx + 1);
      }
    }
    await bucket.file(resolvedPath).delete({ ignoreNotFound: true });
  } catch (error: any) {
    console.warn(`[Storage] Could not delete ${storagePath}:`, error?.message ?? error);
  }
}

/**
 * Returns true if Firebase Storage is configured and available.
 */
export function isStorageAvailable(): boolean {
  return getBucket() !== null;
}
