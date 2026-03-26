// src/lib/firebase/firestore.ts
// Firestore CRUD helpers for server-side operations
import { dbAdmin } from './server';

// ============================================================
// Collection names (centralized for consistency)
// ============================================================
export const COLLECTIONS = {
  CLIENTES: 'clientes',
  EVENTOS: 'eventos',
  PRESUPUESTOS: 'presupuestos',
  EMPLEADOS: 'empleados',
  PROVEEDORES: 'proveedores',
  SERVICIOS: 'servicios',
  PROSPECTOS: 'prospectos',
  FACTURAS: 'facturas',
  ROLES: 'roles',
  CONFIGURACION: 'configuracion',
  NOTIFICACIONES: 'notificaciones',
  GASTOS_GENERALES: 'gastos_generales',
  ACTIVOS_FIJOS: 'activos_fijos',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

// ============================================================
// Helper: Check if Firestore is available
// ============================================================
function getDb() {
  if (!dbAdmin) {
    console.warn('Firestore is not available. Firebase Admin SDK may not be initialized.');
    return null;
  }
  return dbAdmin;
}

// ============================================================
// CREATE - Add a new document
// ============================================================
export async function createDocument<T extends Record<string, any>>(
  collection: CollectionName,
  data: T,
  customId?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const db = getDb();
  if (!db) return { success: false, error: 'Firestore not available' };

  try {
    const docData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (customId) {
      await db.collection(collection).doc(customId).set(docData);
      return { success: true, id: customId };
    } else {
      const docRef = await db.collection(collection).add(docData);
      return { success: true, id: docRef.id };
    }
  } catch (error: any) {
    console.error(`Error creating document in ${collection}:`, error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// READ - Get a single document by ID
// ============================================================
export async function getDocument<T>(
  collection: CollectionName,
  docId: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  const db = getDb();
  if (!db) return { success: false, error: 'Firestore not available' };

  try {
    const docSnap = await db.collection(collection).doc(docId).get();
    if (!docSnap.exists) {
      return { success: false, error: 'Document not found' };
    }
    return { success: true, data: { id: docSnap.id, ...docSnap.data() } as T };
  } catch (error: any) {
    console.error(`Error getting document from ${collection}:`, error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// READ - Get all documents from a collection
// ============================================================
export async function getAllDocuments<T>(
  collection: CollectionName,
  options?: {
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    limit?: number;
    where?: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[];
  }
): Promise<{ success: boolean; data?: T[]; error?: string }> {
  const db = getDb();
  if (!db) return { success: false, error: 'Firestore not available' };

  try {
    let query: FirebaseFirestore.Query = db.collection(collection);

    // Apply where filters
    if (options?.where) {
      for (const filter of options.where) {
        query = query.where(filter.field, filter.op, filter.value);
      }
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'asc');
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
    return { success: true, data };
  } catch (error: any) {
    console.error(`Error getting documents from ${collection}:`, error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// UPDATE - Update a document by ID
// ============================================================
export async function updateDocument<T extends Record<string, any>>(
  collection: CollectionName,
  docId: string,
  data: Partial<T>
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  if (!db) return { success: false, error: 'Firestore not available' };

  try {
    await db.collection(collection).doc(docId).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error: any) {
    console.error(`Error updating document in ${collection}:`, error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// DELETE - Delete a document by ID
// ============================================================
export async function deleteDocument(
  collection: CollectionName,
  docId: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  if (!db) return { success: false, error: 'Firestore not available' };

  try {
    await db.collection(collection).doc(docId).delete();
    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting document from ${collection}:`, error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// BATCH - Perform multiple operations atomically
// ============================================================
export async function batchWrite(
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: CollectionName;
    docId: string;
    data?: Record<string, any>;
  }>
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  if (!db) return { success: false, error: 'Firestore not available' };

  try {
    const batch = db.batch();
    const now = new Date().toISOString();

    for (const op of operations) {
      const ref = db.collection(op.collection).doc(op.docId);

      switch (op.type) {
        case 'create':
          batch.set(ref, { ...op.data, createdAt: now, updatedAt: now });
          break;
        case 'update':
          batch.update(ref, { ...op.data, updatedAt: now });
          break;
        case 'delete':
          batch.delete(ref);
          break;
      }
    }

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error('Error in batch write:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// UTILITY: Check if Firestore is connected and operational
// ============================================================
export async function checkFirestoreConnection(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    // Try a lightweight read to verify connectivity
    await db.collection('_health_check').limit(1).get();
    return true;
  } catch (error) {
    console.error('Firestore connection check failed:', error);
    return false;
  }
}
