/**
 * @fileOverview Firebase-aware data service.
 * 
 * This module provides a wrapper that attempts to read/write from Firestore first,
 * falling back to local JSON files if Firestore is unavailable.
 * 
 * This enables a gradual migration where the app works with both backends.
 */
'use server';

import { readData as readJsonData, writeData as writeJsonData } from './data-service';

// Mapping of JSON file names to Firestore collection names
const FILE_TO_COLLECTION: Record<string, string> = {
  'customers.json': 'clientes',
  'servicios-empresa.json': 'servicios',
  'empleados.json': 'empleados',
  'proveedores.json': 'proveedores',
  'presupuestos.json': 'presupuestos',
  'crm-leads.json': 'prospectos',
  'invoices.json': 'facturas',
  'roles.json': 'roles',
  'gastos-generales.json': 'gastos_generales',
  'activos-fijos.json': 'activos_fijos',
  'notifications.json': 'notificaciones',
  'insumos.json': 'insumos',
  'crm-stages.json': 'crm_stages',
  'fiestas-historicas.json': 'fiestas_historicas',
  'menus-catering.json': 'menus_catering',
  'price-adjustments-history.json': 'price_adjustments',
  'feedback.json': 'feedback',
  'historial-fiestas.json': 'historial_fiestas',
  'invitacion-digital-templates.json': 'invitacion_digital_templates',
  'itinerary-templates.json': 'itinerary_templates',
  'salon-layout-templates.json': 'salon_layout_templates',
  'social-connections.json': 'social_connections',
  'social-posts.json': 'social_posts',
  'task-templates.json': 'task_templates',
  'testimonials.json': 'testimonials',
  'accesos-personal.json': 'accesos_personal',
  'cupones.json': 'cupones',
  'cupones-usage.json': 'cupones_usage',
};

// Config files that map to single documents in 'configuracion' collection
const CONFIG_FILES: Record<string, string> = {
  'company-info.json': 'company-info',
  'budget-display-settings.json': 'budget-display-settings',
  'invoice-template-settings.json': 'invoice-template-settings',
  'armado-rapido-config.json': 'armado-rapido-config',
  'bebidas-template.json': 'bebidas-template',
  'reposteria-template.json': 'reposteria-template',
  'carga-operativa-master-template.json': 'carga-operativa-master-template',
  'carga-operativa-templates.json': 'carga-operativa-templates',
  'meeting-checklist-template.json': 'meeting-checklist-template',
  'whatsapp-settings.json': 'whatsapp-settings',
  'whatsapp-templates.json': 'whatsapp-templates',
};

// In production (Firebase App Hosting), NEXT_PUBLIC_FIREBASE_PROJECT_ID is always defined
const USE_FIREBASE =
  process.env.USE_FIREBASE_DATA === 'true' ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== undefined;

// Timeout for Firestore operations to prevent serverless function timeouts (503 errors)
const FIRESTORE_TIMEOUT_MS = 8000;

/**
 * Wraps a promise with a timeout. Rejects with an error if the timeout is exceeded.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Attempts to get Firestore admin instance. Returns null if unavailable.
 */
async function getFirestoreDb() {
  if (!USE_FIREBASE) return null;
  
  try {
    const { dbAdmin } = await withTimeout(import('./firebase/server'), FIRESTORE_TIMEOUT_MS);
    return dbAdmin;
  } catch {
    return null;
  }
}

/**
 * Read data - tries Firestore first (if enabled), falls back to JSON.
 */
export async function readData<T>(filePath: string, defaultValue: T): Promise<T> {
  const db = await getFirestoreDb();
  
  if (db) {
    try {
      // Check if it's a config file
      const configDocId = CONFIG_FILES[filePath];
      if (configDocId) {
        const doc = await withTimeout(
          db.collection('configuracion').doc(configDocId).get(),
          FIRESTORE_TIMEOUT_MS
        );
        if (doc.exists) {
          const data = doc.data();
          // Remove migration metadata
          if (data) {
            delete data._migratedAt;
            delete data._source;
          }
          return (data || defaultValue) as T;
        }
        return defaultValue;
      }

      // Check if it's an array collection
      const collectionName = FILE_TO_COLLECTION[filePath];
      if (collectionName) {
        const snapshot = await withTimeout(
          db.collection(collectionName).get(),
          FIRESTORE_TIMEOUT_MS
        );
        if (!snapshot.empty) {
          const docs = snapshot.docs.map(doc => {
            const data = doc.data();
            delete data._migratedAt;
            delete data._source;
            return { ...data, id: doc.id };
          });
          return docs as T;
        }
        return defaultValue;
      }
    } catch (error) {
      console.warn(`⚠️ Firestore read failed for ${filePath}, falling back to JSON:`, error);
    }
  }

  // Fallback to JSON
  try {
    return await readJsonData<T>(filePath, defaultValue);
  } catch {
    return defaultValue;
  }
}

/**
 * Write data - writes to both Firestore and JSON for dual-write consistency.
 */
export async function writeData<T>(
  filePath: string,
  data: T,
  sortFn?: (a: any, b: any) => number
): Promise<void> {
  const db = await getFirestoreDb();

  // Always write to JSON (primary source of truth until full migration)
  try {
    await writeJsonData(filePath, data, sortFn);
  } catch (err) {
    console.warn(`⚠️ JSON file write failed for ${filePath} (read-only filesystem?):`, err);
    // Continue to Firestore write below
  }

  // Also write to Firestore if available
  if (db) {
    try {
      const configDocId = CONFIG_FILES[filePath];
      if (configDocId && data && typeof data === 'object' && !Array.isArray(data)) {
        await db.collection('configuracion').doc(configDocId).set({
          ...(data as any),
          _updatedAt: new Date().toISOString(),
        }, { merge: true });
        return;
      }

      const collectionName = FILE_TO_COLLECTION[filePath];
      if (collectionName && Array.isArray(data)) {
        // For array data, we need to sync: delete removed docs, update/add existing
        const snapshot = await db.collection(collectionName).get();
        const existingIds = new Set(snapshot.docs.map(d => d.id));
        const newIds = new Set((data as any[]).map(item => item.id).filter(Boolean));

        // Batch operations
        const batchSize = 450;
        const items = data as any[];
        
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = db.batch();
          const chunk = items.slice(i, i + batchSize);
          
          for (const item of chunk) {
            if (item.id) {
              const ref = db.collection(collectionName).doc(String(item.id));
              const cleanData = { ...item };
              Object.keys(cleanData).forEach(key => {
                if (cleanData[key] === undefined) delete cleanData[key];
              });
              batch.set(ref, { ...cleanData, _updatedAt: new Date().toISOString() }, { merge: true });
            }
          }
          
          await batch.commit();
        }

        // Delete docs that are no longer in the array
        const toDelete = [...existingIds].filter(id => !newIds.has(id));
        if (toDelete.length > 0) {
          for (let i = 0; i < toDelete.length; i += batchSize) {
            const batch = db.batch();
            const chunk = toDelete.slice(i, i + batchSize);
            for (const id of chunk) {
              batch.delete(db.collection(collectionName).doc(id));
            }
            await batch.commit();
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Firestore write failed for ${filePath}:`, error);
      // Don't throw - JSON write already succeeded
    }
  }
}