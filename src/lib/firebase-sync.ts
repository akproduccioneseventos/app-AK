/**
 * @fileOverview Firebase Firestore sync module.
 * Handles background synchronization of JSON data to Firestore collections.
 * Used by data-service.ts for dual-write capability.
 */
'use server';

import * as logger from './logger';

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
  'menus.json': 'menus',
  'feature-flags.json': 'feature_flags',
  'galeria-publica.json': 'galeria_publica',
  'coupons.json': 'coupons',
  'crm-meetings.json': 'crm_meetings',
  'scheduled-messages.json': 'scheduled_messages',
  'automatizaciones-alertas.json': 'automatizaciones_alertas',
  'playbooks.json': 'playbooks',
  'recursos-multi-evento.json': 'recursos_multi_evento',
  '_backup-snapshots.json': 'backup_snapshots',
  'cupones.json': 'cupones',
  'cupones-usage.json': 'cupones_usage',
  'catalogo-fotos.json': 'catalogo_fotos',
};

const CONFIG_FILES: Record<string, string> = {
  'app-settings.json': 'app-settings',
  'company-info.json': 'company-info',
  'contract-settings.json': 'contract-settings',
  'whatsapp-settings.json': 'whatsapp-settings',
  'whatsapp-templates.json': 'whatsapp-templates',
  'ai-assistant-settings.json': 'ai-assistant-settings',
  'budget-display-settings.json': 'budget-display-settings',
  'invoice-template-settings.json': 'invoice-template-settings',
  'armado-rapido-config.json': 'armado-rapido-config',
  'bebidas-template.json': 'bebidas-template',
  'reposteria-template.json': 'reposteria-template',
  'carga-operativa-master-template.json': 'carga-operativa-master-template',
  'carga-operativa-templates.json': 'carga-operativa-templates',
  'meeting-checklist-template.json': 'meeting-checklist-template',
};

const MAX_RETRIES = 2;
const isDev = process.env.NODE_ENV === 'development';

async function withRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0 && isDev) {
        logger.info(`✅ [Firebase Sync] ${context} — exitoso en intento ${attempt + 1}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1000ms
        if (isDev) {
          logger.warn(`🔄 [Firebase Sync] ${context} — intento ${attempt + 1} falló, reintentando en ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Synchronize data written to a JSON file to the corresponding Firestore collection.
 * This is called asynchronously from data-service.ts writeData() when USE_FIREBASE_DATA=true.
 */
export async function syncToFirestore(filePath: string, data: any): Promise<void> {
  let db: FirebaseFirestore.Firestore;

  try {
    const { dbAdmin } = await import('./firebase/server');
    if (!dbAdmin) return;
    db = dbAdmin;
  } catch {
    return; // Firebase not available
  }

  const normalizedPath = filePath.replace(/\\/g, '/');

  try {
    // Config file → single document in 'configuracion'
    const configDocId = CONFIG_FILES[normalizedPath];
    if (configDocId && data && typeof data === 'object' && !Array.isArray(data)) {
      const cleanData = { ...data };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) delete cleanData[key];
      });
      await withRetry(() => db.collection('configuracion').doc(configDocId).set({
        ...cleanData,
        _syncedAt: new Date().toISOString(),
      }, { merge: true }), `config: ${configDocId}`);
      return;
    }

    // Array collection
    const collectionName = FILE_TO_COLLECTION[normalizedPath];
    if (collectionName && Array.isArray(data)) {
      const batchSize = 450;
      const getItemDocId = (item: any): string | null => {
        if (!item || typeof item !== 'object') return null;
        if (item.id !== undefined && item.id !== null && String(item.id).trim() !== '') return String(item.id);
        if (item.name !== undefined && item.name !== null && String(item.name).trim() !== '') return String(item.name);
        return null;
      };

      // Delete orphaned documents (those that no longer exist in the array)
      const existingSnapshot = await db.collection(collectionName).get();
      const existingIds = new Set(existingSnapshot.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.id));
      const newIds = new Set(data.map(getItemDocId).filter((id): id is string => Boolean(id)));
      const toDelete = [...existingIds].filter((id: string) => !newIds.has(id));
      if (toDelete.length > 0) {
        for (let i = 0; i < toDelete.length; i += batchSize) {
          const deleteBatch = db.batch();
          toDelete.slice(i, i + batchSize).forEach((id: string) => {
            deleteBatch.delete(db.collection(collectionName).doc(id));
          });
          await withRetry(() => deleteBatch.commit(), `delete orphans: ${collectionName} (batch ${Math.floor(i/batchSize)+1})`);
        }
        if (isDev) {
          logger.info(`🗑️ [Firebase Sync] "${collectionName}" — ${toDelete.length} documento(s) huérfano(s) eliminado(s).`);
        }
      }

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = db.batch();
        const chunk = data.slice(i, i + batchSize);
        
        for (const item of chunk) {
          const docId = getItemDocId(item);
          if (!docId) continue;
          const ref = db.collection(collectionName).doc(docId);
          const cleanData = { ...item };
          Object.keys(cleanData).forEach(key => {
            if (cleanData[key] === undefined) delete cleanData[key];
          });
          batch.set(ref, { ...cleanData, _syncedAt: new Date().toISOString() }, { merge: true });
        }
        
        await withRetry(() => batch.commit(), `collection: ${collectionName} (batch ${Math.floor(i/batchSize)+1})`);
      }
      return;
    }

    // Individual document file (e.g., fiestas/fiesta_xxx.json, archive/fiesta_archivada_xxx.json)
    const pathParts = normalizedPath.split('/');
    if (pathParts.length === 2 && data && typeof data === 'object' && !Array.isArray(data)) {
      const [dir, filename] = pathParts;
      if (!filename.endsWith('.json')) return;
      const docId = filename.replace('.json', '');
      const cleanData = { ...data };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) delete cleanData[key];
      });
      await withRetry(() => db.collection(dir).doc(docId).set({
        ...cleanData,
        _syncedAt: new Date().toISOString(),
      }, { merge: true }), `doc: ${dir}/${docId}`);
    }
    if (isDev) {
      const target = FILE_TO_COLLECTION[normalizedPath] || CONFIG_FILES[normalizedPath] || normalizedPath;
      logger.info(`✅ [Firebase Sync] "${target}" sincronizado correctamente.`);
    }
  } catch (error: unknown) {
    const collectionName = FILE_TO_COLLECTION[normalizedPath] || CONFIG_FILES[normalizedPath] || normalizedPath;
    logger.warn(`⚠️ [Firebase Sync] Falló la sincronización de "${collectionName}" después de ${MAX_RETRIES + 1} intentos.`);
    logger.warn(`   Motivo: ${error instanceof Error ? error.message : error}`);
    logger.warn(`   ℹ️ Los datos JSON locales NO fueron afectados y están seguros.`);
  }
}

/**
 * Read data from Firestore for a given file path.
 * Returns null if no data is found or Firebase is unavailable.
 */
export async function readFromFirestore(filePath: string): Promise<any> {
  let db: FirebaseFirestore.Firestore;

  try {
    const { dbAdmin } = await import('./firebase/server');
    if (!dbAdmin) return null;
    db = dbAdmin;
  } catch {
    return null; // Firebase not available
  }

  const normalizedPath = filePath.replace(/\\/g, '/');

  try {
    // Config file → read from 'configuracion' collection
    const configDocId = CONFIG_FILES[normalizedPath];
    if (configDocId) {
      const doc = await db.collection('configuracion').doc(configDocId).get();
      if (doc.exists) {
        const data = doc.data();
        if (data) delete data._syncedAt;
        return data || null;
      }
      return null;
    }

    // Array collection → read all docs and return as array
    const collectionName = FILE_TO_COLLECTION[normalizedPath];
    if (collectionName) {
      const snapshot = await db.collection(collectionName).get();
      if (snapshot.empty) return null;
      return snapshot.docs.map(doc => {
        const data = doc.data();
        delete data._syncedAt;
        return data;
      });
    }

    // Individual document file (e.g., fiestas/fiesta_xxx.json)
    const pathParts = normalizedPath.split('/');
    if (pathParts.length === 2) {
      const [dir, filename] = pathParts;
      if (!filename.endsWith('.json')) return null;
      const docId = filename.replace('.json', '');
      const doc = await db.collection(dir).doc(docId).get();
      if (doc.exists) {
        const data = doc.data();
        if (data) delete data._syncedAt;
        return data || null;
      }
    }

    return null;
  } catch (error) {
    logger.warn(`⚠️ Firestore read failed for ${filePath}:`, error);
    return null;
  }
}

/**
 * List all documents from a Firestore collection and return them as an array.
 * Omits the internal `_syncedAt` property from each document.
 */
export async function listCollectionFromFirestore(collectionName: string): Promise<any[]> {
  try {
    const { dbAdmin } = await import('./firebase/server');
    if (!dbAdmin) return [];
    const snapshot = await dbAdmin.collection(collectionName).get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => {
      const data = doc.data();
      delete data._syncedAt;
      return data;
    });
  } catch (error) {
    logger.warn(`⚠️ Firestore listCollection failed for "${collectionName}":`, error);
    return [];
  }
}
