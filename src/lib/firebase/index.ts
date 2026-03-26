// src/lib/firebase/index.ts
// Re-export all Firebase utilities

export { dbAdmin, authAdmin, verifyIdToken } from './server';
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
