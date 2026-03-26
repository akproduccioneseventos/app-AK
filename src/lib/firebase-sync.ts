/**
 * @fileOverview Firebase Firestore sync module.
 * Handles background synchronization of JSON data to Firestore collections.
 * Used by data-service.ts for dual-write capability.
 */
'use server';

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

  try {
    // Config file → single document in 'configuracion'
    const configDocId = CONFIG_FILES[filePath];
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
    const collectionName = FILE_TO_COLLECTION[filePath];
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
    }
  } catch (error) {
    console.warn(`⚠️ Firestore sync failed for ${filePath}:`, error);
  }
}