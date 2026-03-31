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
  'cupones.json': 'cupones',
  'cupones-usage.json': 'cupones_usage',
  'price-adjustments-history.json': 'price_adjustments',
};

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
};

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
      await db.collection('configuracion').doc(configDocId).set({
        ...cleanData,
        _syncedAt: new Date().toISOString(),
      }, { merge: true });
      return;
    }

    // Array collection
    const collectionName = FILE_TO_COLLECTION[normalizedPath];
    if (collectionName && Array.isArray(data)) {
      const batchSize = 450;
      
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = db.batch();
        const chunk = data.slice(i, i + batchSize);
        
        for (const item of chunk) {
          if (item && item.id) {
            const ref = db.collection(collectionName).doc(String(item.id));
            const cleanData = { ...item };
            Object.keys(cleanData).forEach(key => {
              if (cleanData[key] === undefined) delete cleanData[key];
            });
            batch.set(ref, { ...cleanData, _syncedAt: new Date().toISOString() }, { merge: true });
          }
        }
        
        await batch.commit();
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
      await db.collection(dir).doc(docId).set({
        ...cleanData,
        _syncedAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (error) {
    logger.warn(`⚠️ Firestore sync failed for ${filePath}:`, error);
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