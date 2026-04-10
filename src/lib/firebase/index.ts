// src/lib/firebase/index.ts
// Re-export all Firebase utilities

export { dbAdmin, authAdmin, verifyIdToken, isFirebaseAvailable } from './server';
export {
  COLLECTIONS,
  createDocument,
  getDocument,
  getAllDocuments,
  updateDocument,
  deleteDocument,
  batchWrite,
  checkFirestoreConnection,
  type CollectionName,
} from './firestore';
export {
  uploadToStorage,
  deleteFromStorage,
  getSignedUrl,
  extractStoragePath,
  isStorageAvailable,
} from './storage';
