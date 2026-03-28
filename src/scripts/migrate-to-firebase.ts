/**
 * Script de Migración: JSON Local → Firebase Firestore
 * =====================================================
 * 
 * Este script migra todos los datos de archivos JSON locales (src/data/)
 * a las colecciones correspondientes de Firebase Firestore.
 * 
 * USO:
 *   npx tsx src/scripts/migrate-to-firebase.ts
 * 
 * PRERREQUISITOS:
 *   - Variables de entorno de Firebase configuradas en .env.local
 *   - Firebase Admin SDK configurado (src/lib/firebase/server.ts)
 *   - Acceso a Firestore habilitado
 * 
 * COLECCIONES MIGRADAS:
 *   - clientes (customers.json)
 *   - servicios (servicios-empresa.json)
 *   - empleados (empleados.json)
 *   - proveedores (proveedores.json)
 *   - presupuestos (presupuestos.json)
 *   - prospectos (crm-leads.json)
 *   - facturas (invoices.json)
 *   - roles (roles.json)
 *   - eventos (fiestas/*.json)
 *   - configuracion (varios archivos de config)
 *   - gastos_generales (gastos-generales.json)
 *   - activos_fijos (activos-fijos.json)
 *   - notificaciones (notifications.json)
 */

import * as fs from 'fs';
import * as path from 'path';

// We need to set up the environment before importing Firebase
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    const eqIndex = trimmedLine.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmedLine.substring(0, eqIndex).trim();
    const value = trimmedLine.substring(eqIndex + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

// Log emulator status
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`📡 Usando Firestore Emulator en: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

// ============================================
// Helper Functions
// ============================================

function readJsonFile<T>(fileName: string, defaultValue: T): T {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.trim()) return defaultValue;
    return JSON.parse(content) as T;
  } catch (error) {
    console.warn(`⚠️  Error leyendo ${fileName}:`, error);
    return defaultValue;
  }
}

function readFiestasFromDirectory(): any[] {
  const fiestasDir = path.join(DATA_DIR, 'fiestas');
  if (!fs.existsSync(fiestasDir)) return [];
  
  const files = fs.readdirSync(fiestasDir).filter(f => f.endsWith('.json'));
  const fiestas: any[] = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(fiestasDir, file), 'utf-8');
      if (content.trim()) {
        const fiesta = JSON.parse(content);
        if (fiesta && fiesta.id) fiestas.push(fiesta);
      }
    } catch (error) {
      console.warn(`⚠️  Error leyendo fiesta ${file}:`, error);
    }
  }
  return fiestas;
}

// ============================================
// Migration Data Definitions
// ============================================

interface MigrationTask {
  collectionName: string;
  sourceFile: string;
  data: any[];
  isArray: boolean;
  configKey?: string; // For config docs that go as a single doc in 'configuracion'
}

function prepareMigrationTasks(): MigrationTask[] {
  const tasks: MigrationTask[] = [];

  // 1. Clientes
  const customers = readJsonFile<any[]>('customers.json', []);
  tasks.push({ collectionName: 'clientes', sourceFile: 'customers.json', data: customers, isArray: true });

  // 2. Servicios
  const servicios = readJsonFile<any[]>('servicios-empresa.json', []);
  tasks.push({ collectionName: 'servicios', sourceFile: 'servicios-empresa.json', data: servicios, isArray: true });

  // 3. Empleados
  const empleados = readJsonFile<any[]>('empleados.json', []);
  tasks.push({ collectionName: 'empleados', sourceFile: 'empleados.json', data: empleados, isArray: true });

  // 4. Proveedores
  const proveedores = readJsonFile<any[]>('proveedores.json', []);
  tasks.push({ collectionName: 'proveedores', sourceFile: 'proveedores.json', data: proveedores, isArray: true });

  // 5. Presupuestos
  const presupuestos = readJsonFile<any[]>('presupuestos.json', []);
  tasks.push({ collectionName: 'presupuestos', sourceFile: 'presupuestos.json', data: presupuestos, isArray: true });

  // 6. Prospectos (CRM Leads)
  const leads = readJsonFile<any[]>('crm-leads.json', []);
  tasks.push({ collectionName: 'prospectos', sourceFile: 'crm-leads.json', data: leads, isArray: true });

  // 7. Facturas
  const invoices = readJsonFile<any[]>('invoices.json', []);
  tasks.push({ collectionName: 'facturas', sourceFile: 'invoices.json', data: invoices, isArray: true });

  // 8. Roles
  const roles = readJsonFile<any[]>('roles.json', []);
  tasks.push({ collectionName: 'roles', sourceFile: 'roles.json', data: roles, isArray: true });

  // 9. Eventos (Fiestas)
  const fiestas = readFiestasFromDirectory();
  tasks.push({ collectionName: 'eventos', sourceFile: 'fiestas/*.json', data: fiestas, isArray: true });

  // 10. Gastos Generales
  const gastos = readJsonFile<any[]>('gastos-generales.json', []);
  tasks.push({ collectionName: 'gastos_generales', sourceFile: 'gastos-generales.json', data: gastos, isArray: true });

  // 11. Activos Fijos
  const activos = readJsonFile<any[]>('activos-fijos.json', []);
  tasks.push({ collectionName: 'activos_fijos', sourceFile: 'activos-fijos.json', data: activos, isArray: true });

  // 12. Notificaciones
  const notifications = readJsonFile<any[]>('notifications.json', []);
  tasks.push({ collectionName: 'notificaciones', sourceFile: 'notifications.json', data: notifications, isArray: true });

  // 13. Insumos
  const insumos = readJsonFile<any[]>('insumos.json', []);
  tasks.push({ collectionName: 'insumos', sourceFile: 'insumos.json', data: insumos, isArray: true });

  // 14. CRM Stages
  const stages = readJsonFile<any[]>('crm-stages.json', []);
  tasks.push({ collectionName: 'crm_stages', sourceFile: 'crm-stages.json', data: stages, isArray: true });

  // 15. Fiestas Históricas
  const historicas = readJsonFile<any[]>('fiestas-historicas.json', []);
  tasks.push({ collectionName: 'fiestas_historicas', sourceFile: 'fiestas-historicas.json', data: historicas, isArray: true });

  // 16. Menús Catering
  const menus = readJsonFile<any[]>('menus-catering.json', []);
  tasks.push({ collectionName: 'menus_catering', sourceFile: 'menus-catering.json', data: menus, isArray: true });

  // 17. Feedback
  const feedback = readJsonFile<any[]>('feedback.json', []);
  tasks.push({ collectionName: 'feedback', sourceFile: 'feedback.json', data: feedback, isArray: true });

  // 18. Historial Fiestas
  const historialFiestas = readJsonFile<any[]>('historial-fiestas.json', []);
  tasks.push({ collectionName: 'historial_fiestas', sourceFile: 'historial-fiestas.json', data: historialFiestas, isArray: true });

  // 19. Invitación Digital Templates
  const invitacionTemplates = readJsonFile<any[]>('invitacion-digital-templates.json', []);
  tasks.push({ collectionName: 'invitacion_digital_templates', sourceFile: 'invitacion-digital-templates.json', data: invitacionTemplates, isArray: true });

  // 20. Itinerary Templates
  const itineraryTemplates = readJsonFile<any[]>('itinerary-templates.json', []);
  tasks.push({ collectionName: 'itinerary_templates', sourceFile: 'itinerary-templates.json', data: itineraryTemplates, isArray: true });

  // 21. Salon Layout Templates
  const salonTemplates = readJsonFile<any[]>('salon-layout-templates.json', []);
  tasks.push({ collectionName: 'salon_layout_templates', sourceFile: 'salon-layout-templates.json', data: salonTemplates, isArray: true });

  // 22. Social Connections
  const socialConnections = readJsonFile<any[]>('social-connections.json', []);
  tasks.push({ collectionName: 'social_connections', sourceFile: 'social-connections.json', data: socialConnections, isArray: true });

  // 23. Social Posts
  const socialPosts = readJsonFile<any[]>('social-posts.json', []);
  tasks.push({ collectionName: 'social_posts', sourceFile: 'social-posts.json', data: socialPosts, isArray: true });

  // 24. Task Templates
  const taskTemplates = readJsonFile<any[]>('task-templates.json', []);
  tasks.push({ collectionName: 'task_templates', sourceFile: 'task-templates.json', data: taskTemplates, isArray: true });

  // 25. Testimonials
  const testimonials = readJsonFile<any[]>('testimonials.json', []);
  tasks.push({ collectionName: 'testimonials', sourceFile: 'testimonials.json', data: testimonials, isArray: true });

  // 26. Accesos Personal
  const accesos = readJsonFile<any[]>('accesos-personal.json', []);
  tasks.push({ collectionName: 'accesos_personal', sourceFile: 'accesos-personal.json', data: accesos, isArray: true });

  // 27. Price Adjustments History
  const priceAdj = readJsonFile<any[]>('price-adjustments-history.json', []);
  tasks.push({ collectionName: 'price_adjustments', sourceFile: 'price-adjustments-history.json', data: priceAdj, isArray: true });

  return tasks;
}

// Config documents - single objects stored as docs in 'configuracion' collection
function prepareConfigDocs(): { docId: string; sourceFile: string; data: any }[] {
  const configs: { docId: string; sourceFile: string; data: any }[] = [];

  const configFiles: { docId: string; file: string }[] = [
    { docId: 'company-info', file: 'company-info.json' },
    { docId: 'budget-display-settings', file: 'budget-display-settings.json' },
    { docId: 'invoice-template-settings', file: 'invoice-template-settings.json' },
    { docId: 'armado-rapido-config', file: 'armado-rapido-config.json' },
    { docId: 'bebidas-template', file: 'bebidas-template.json' },
    { docId: 'reposteria-template', file: 'reposteria-template.json' },
    { docId: 'carga-operativa-master-template', file: 'carga-operativa-master-template.json' },
    { docId: 'carga-operativa-templates', file: 'carga-operativa-templates.json' },
    { docId: 'meeting-checklist-template', file: 'meeting-checklist-template.json' },
  ];

  for (const { docId, file } of configFiles) {
    const data = readJsonFile<any>(file, null);
    if (data !== null && Object.keys(data).length > 0) {
      configs.push({ docId, sourceFile: file, data });
    }
  }

  return configs;
}

// ============================================
// Main Migration Function
// ============================================

async function migrate() {
  console.log('🚀 Iniciando migración de datos JSON → Firebase Firestore...\n');

  // Dynamically import firebase admin
  let admin: any;
  try {
    admin = await import('firebase-admin');
    
    // Initialize if needed
    if (admin.default.apps.length === 0) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.default.initializeApp({ credential: admin.default.credential.applicationDefault() });
      } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        admin.default.initializeApp({
          credential: admin.default.credential.cert({
            projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      } else if (projectId) {
        admin.default.initializeApp({ projectId });
      } else {
        throw new Error('No se encontraron credenciales de Firebase. Configura .env.local');
      }
    }
  } catch (error: any) {
    console.error('❌ Error inicializando Firebase Admin:', error.message);
    console.log('\n📝 Asegúrate de tener las variables de entorno correctas en .env.local');
    process.exit(1);
  }

  const db = admin.default.firestore();
  const migrationTasks = prepareMigrationTasks();
  const configDocs = prepareConfigDocs();

  let totalDocsMigrated = 0;
  let totalErrors = 0;

  // Migrate array-based collections
  for (const task of migrationTasks) {
    if (task.data.length === 0) {
      console.log(`⏭️  ${task.collectionName} (${task.sourceFile}): Sin datos, omitiendo.`);
      continue;
    }

    console.log(`📦 Migrando ${task.collectionName} (${task.data.length} docs) desde ${task.sourceFile}...`);
    
    let successCount = 0;
    let errorCount = 0;

    // Use batched writes (max 500 per batch)
    const batchSize = 450;
    let autoIdCounter = 0;
    for (let i = 0; i < task.data.length; i += batchSize) {
      const batch = db.batch();
      const chunk = task.data.slice(i, i + batchSize);

      // Pre-compute docIds so both the batch and the individual fallback use the same IDs
      const chunkWithIds = chunk.map(item => {
        autoIdCounter++;
        const docId = item.id || `auto_${Date.now()}_${autoIdCounter}_${Math.random().toString(36).substring(2, 9)}`;
        return { item, docId };
      });

      for (const { item, docId } of chunkWithIds) {
        const docRef = db.collection(task.collectionName).doc(String(docId));
        
        // Add migration metadata
        const docData = {
          ...item,
          _migratedAt: new Date().toISOString(),
          _source: 'json-migration',
        };

        // Remove undefined values (Firestore doesn't accept undefined)
        Object.keys(docData).forEach(key => {
          if (docData[key] === undefined) delete docData[key];
        });

        batch.set(docRef, docData, { merge: true });
      }

      // Attempt batch commit with one retry
      let committed = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          await batch.commit();
          successCount += chunk.length;
          committed = true;
          break;
        } catch (batchError: any) {
          if (attempt < 2) {
            console.warn(`  ⚠️  Reintentando batch para ${task.collectionName} (intento ${attempt})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          } else {
            console.error(`  ❌ Error en batch para ${task.collectionName}:`, batchError.message);
          }
        }
      }

      // Fallback: commit documents individually when batch fails after retries
      if (!committed) {
        let individualSuccess = 0;
        let individualFail = 0;
        for (const { item, docId } of chunkWithIds) {
          const docRef = db.collection(task.collectionName).doc(String(docId));
          const docData = {
            ...item,
            _migratedAt: new Date().toISOString(),
            _source: 'json-migration',
          };
          Object.keys(docData).forEach(key => {
            if (docData[key] === undefined) delete docData[key];
          });
          try {
            await docRef.set(docData, { merge: true });
            individualSuccess++;
          } catch (docError: any) {
            console.error(`    ❌ Error guardando doc ${docId} en ${task.collectionName}:`, docError.message);
            individualFail++;
          }
        }
        successCount += individualSuccess;
        errorCount += individualFail;
      }
    }

    console.log(`  ✅ ${successCount} migrados | ${errorCount > 0 ? `❌ ${errorCount} errores` : 'Sin errores'}`);
    totalDocsMigrated += successCount;
    totalErrors += errorCount;
  }

  // Migrate config documents
  if (configDocs.length > 0) {
    console.log(`\n📦 Migrando documentos de configuración (${configDocs.length} docs)...`);
    
    const batch = db.batch();
    for (const config of configDocs) {
      const docRef = db.collection('configuracion').doc(config.docId);
      const docData = {
        ...config.data,
        _migratedAt: new Date().toISOString(),
        _source: 'json-migration',
      };

      // Remove undefined values
      Object.keys(docData).forEach(key => {
        if (docData[key] === undefined) delete docData[key];
      });

      batch.set(docRef, docData, { merge: true });
    }

    // Attempt batch commit with one retry
    let configCommitted = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await batch.commit();
        console.log(`  ✅ ${configDocs.length} configuraciones migradas`);
        totalDocsMigrated += configDocs.length;
        configCommitted = true;
        break;
      } catch (batchError: any) {
        if (attempt < 2) {
          console.warn(`  ⚠️  Reintentando batch de configuraciones (intento ${attempt})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        } else {
          console.error(`  ❌ Error migrando configuraciones en batch:`, batchError.message);
        }
      }
    }

    // Fallback: migrate config documents individually when batch fails after retries
    if (!configCommitted) {
      console.log(`  🔄 Intentando migración individual de configuraciones...`);
      let configSuccess = 0;
      let configFail = 0;
      for (const config of configDocs) {
        const docRef = db.collection('configuracion').doc(config.docId);
        const docData = {
          ...config.data,
          _migratedAt: new Date().toISOString(),
          _source: 'json-migration',
        };
        Object.keys(docData).forEach(key => {
          if (docData[key] === undefined) delete docData[key];
        });
        try {
          await docRef.set(docData, { merge: true });
          configSuccess++;
        } catch (docError: any) {
          console.error(`    ❌ Error guardando configuración "${config.docId}":`, docError.message);
          configFail++;
        }
      }
      console.log(`  ✅ ${configSuccess} configuraciones migradas | ${configFail > 0 ? `❌ ${configFail} errores` : 'Sin errores'}`);
      totalDocsMigrated += configSuccess;
      totalErrors += configFail;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(60));
  console.log(`✅ Total documentos migrados: ${totalDocsMigrated}`);
  if (totalErrors > 0) console.log(`❌ Total errores: ${totalErrors}`);
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-ES')}`);
  console.log('='.repeat(60));

  if (totalErrors === 0) {
    console.log('\n🎉 ¡Migración completada exitosamente!');
  } else {
    console.log('\n⚠️  Migración completada con errores. Revisar los mensajes anteriores.');
  }
}

// ============================================
// Verification Function
// ============================================

async function verify() {
  console.log('\n🔍 Verificando datos migrados...\n');

  let admin: any;
  try {
    admin = await import('firebase-admin');
    if (admin.default.apps.length === 0) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
      if (projectId) {
        admin.default.initializeApp({ projectId });
      } else {
        throw new Error('Firebase no inicializado');
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  const db = admin.default.firestore();
  const migrationTasks = prepareMigrationTasks();

  console.log('+' + '-'.repeat(30) + '+' + '-'.repeat(12) + '+' + '-'.repeat(12) + '+' + '-'.repeat(10) + '+');
  console.log('| ' + 'Colección'.padEnd(28) + ' | ' + 'JSON'.padEnd(10) + ' | ' + 'Firestore'.padEnd(10) + ' | ' + 'Estado'.padEnd(8) + ' |');
  console.log('+' + '-'.repeat(30) + '+' + '-'.repeat(12) + '+' + '-'.repeat(12) + '+' + '-'.repeat(10) + '+');

  for (const task of migrationTasks) {
    try {
      const snapshot = await db.collection(task.collectionName).count().get();
      const firestoreCount = snapshot.data().count;
      const jsonCount = task.data.length;
      const status = firestoreCount >= jsonCount ? '✅ OK' : '⚠️ DIFF';
      
      console.log(
        '| ' + task.collectionName.padEnd(28) + 
        ' | ' + String(jsonCount).padEnd(10) + 
        ' | ' + String(firestoreCount).padEnd(10) + 
        ' | ' + status.padEnd(8) + ' |'
      );
    } catch (error) {
      console.log(
        '| ' + task.collectionName.padEnd(28) + 
        ' | ' + String(task.data.length).padEnd(10) + 
        ' | ' + 'ERROR'.padEnd(10) + 
        ' | ' + '❌'.padEnd(8) + ' |'
      );
    }
  }

  console.log('+' + '-'.repeat(30) + '+' + '-'.repeat(12) + '+' + '-'.repeat(12) + '+' + '-'.repeat(10) + '+');
}

// ============================================
// CLI Entry Point
// ============================================

const args = process.argv.slice(2);
const command = args[0] || 'migrate';

if (command === 'verify') {
  verify().catch(console.error);
} else {
  migrate()
    .then(() => {
      if (args.includes('--verify')) {
        return verify();
      }
    })
    .catch(console.error);
}
