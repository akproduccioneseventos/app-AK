# 🔥 Firebase - Guía de Integración y Migración

## Descripción General

La app AK Producciones utiliza **Firebase Firestore como única fuente de verdad** para todos los datos. Los archivos JSON en `src/data/` son solo una semilla inicial y un fallback de emergencia de lectura; **nunca se escriben en producción**.

- **Producción / App Hosting**: Firestore es la base de datos principal. El deploy se realiza via Firebase App Hosting (`apphosting.yaml`).
- **Desarrollo local**: Se pueden usar emuladores de Firebase (sin necesidad de credenciales reales).
- **Fallback de lectura**: Si Firestore no responde, `readData` puede leer JSON local como contingencia. Esto solo debe ocurrir en desarrollo o ante fallas temporales; nunca en producción estable.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                     App Next.js                      │
│                                                      │
│  writeData()  ──────────────► Firestore (único)      │
│                               (si falla → error)     │
│                                                      │
│  readData()   ──┬──► Firestore (fuente principal)    │
│                 └──► JSON local (fallback lectura)   │
│                      (solo si Firestore = null)      │
└─────────────────────────────────────────────────────┘
```

> ⚠️ El fallback JSON es de solo lectura. Sirve como contingencia para no romper
> la UI durante fallas temporales de Firestore. Nunca se escriben datos en JSON.

### Archivos clave

| Archivo | Descripción |
|---------|-------------|
| `src/lib/firebase/config.ts` | Configuración Firebase client-side |
| `src/lib/firebase/server.ts` | Firebase Admin SDK (server-side) |
| `src/lib/firebase/firestore.ts` | Helpers CRUD para Firestore |
| `src/lib/firebase/index.ts` | Re-exports centralizados |
| `src/lib/firebase-sync.ts` | Sincronización JSON → Firestore |
| `src/lib/data-service.ts` | Servicio de datos principal |
| `src/scripts/migrate-to-firebase.ts` | Script de migración JSON → Firestore |
| `apphosting.yaml` | Configuración de deploy (Firebase App Hosting) |

---

## Variables de Entorno

### Requeridas para Firebase

```env
# Project ID (OBLIGATORIO)
FIREBASE_PROJECT_ID=presupuestador-ak-producciones
NEXT_PUBLIC_FIREBASE_PROJECT_ID=presupuestador-ak-producciones

# Activar dual-write (OBLIGATORIO para Firebase)
USE_FIREBASE_DATA=true
```

### Credenciales (elegir UNA opción)

**Opción A: Archivo de credenciales de servicio** (recomendado para producción)
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

**Opción B: Variables individuales**
```env
FIREBASE_CLIENT_EMAIL=your-sa@presupuestador-ak-producciones.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Opción C: Entorno GCP / Firebase Studio** (sin credenciales adicionales)
```env
# Solo necesita FIREBASE_PROJECT_ID - el SDK se autentica automáticamente
```

### Emuladores (desarrollo local)

```env
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

---

## Desarrollo Local con Emuladores

### Requisitos
- Node.js 18+
- Java 21+ (para emuladores de Firebase)
- Firebase CLI (`npm install -g firebase-tools`)

### Pasos

1. **Iniciar emuladores:**
   ```bash
   npm run firebase:emulators
   ```

2. **En otra terminal, iniciar la app:**
   ```bash
   npm run dev
   ```

   O usar el script combinado (requiere `concurrently`):
   ```bash
   npm run dev:firebase
   ```

3. **Acceder al UI de emuladores:** http://localhost:4000
4. **Acceder a la app:** http://localhost:3000

### Migrar datos a emuladores

```bash
npm run firebase:migrate
```

### Verificar migración

```bash
npm run firebase:verify
```

### Migrar y verificar en un solo paso

```bash
npm run firebase:migrate:verify
```

---

## Colecciones en Firestore

### Colecciones principales (arrays)

| Colección | Archivo JSON | Descripción |
|-----------|-------------|-------------|
| `clientes` | `customers.json` | Clientes registrados |
| `servicios` | `servicios-empresa.json` | Catálogo de servicios |
| `empleados` | `empleados.json` | Personal de la empresa |
| `proveedores` | `proveedores.json` | Proveedores externos |
| `presupuestos` | `presupuestos.json` | Presupuestos de eventos |
| `prospectos` | `crm-leads.json` | Leads del CRM |
| `facturas` | `invoices.json` | Facturas emitidas |
| `roles` | `roles.json` | Roles de personal en eventos |
| `eventos` | `fiestas/*.json` | Eventos en planificación |
| `gastos_generales` | `gastos-generales.json` | Gastos generales |
| `activos_fijos` | `activos-fijos.json` | Inventario de activos fijos |
| `notificaciones` | `notifications.json` | Notificaciones del sistema |
| `insumos` | `insumos.json` | Insumos consumibles |
| `crm_stages` | `crm-stages.json` | Etapas del pipeline CRM |
| `fiestas_historicas` | `fiestas-historicas.json` | Historial de eventos |
| `menus_catering` | `menus-catering.json` | Menús de catering |
| `feedback` | `feedback.json` | Feedback de clientes |
| `invitacion_digital_templates` | `invitacion-digital-templates.json` | Templates de invitaciones |
| `itinerary_templates` | `itinerary-templates.json` | Templates de itinerarios |
| `salon_layout_templates` | `salon-layout-templates.json` | Templates de salones |
| `social_connections` | `social-connections.json` | Conexiones sociales |
| `task_templates` | `task-templates.json` | Templates de tareas |
| `testimonials` | `testimonials.json` | Testimonios |
| `accesos_personal` | `accesos-personal.json` | Accesos del personal |
| `price_adjustments` | `price-adjustments-history.json` | Historial de ajustes de precios |

### Colección `configuracion` (documentos individuales)

| Doc ID | Archivo JSON | Descripción |
|--------|-------------|-------------|
| `company-info` | `company-info.json` | Información de la empresa |
| `budget-display-settings` | `budget-display-settings.json` | Config de visualización de presupuestos |
| `invoice-template-settings` | `invoice-template-settings.json` | Config de plantillas de factura |
| `armado-rapido-config` | `armado-rapido-config.json` | Config de armado rápido |
| `bebidas-template` | `bebidas-template.json` | Template de bebidas |
| `reposteria-template` | `reposteria-template.json` | Template de repostería |
| `carga-operativa-master-template` | `carga-operativa-master-template.json` | Template maestro de carga operativa |
| `carga-operativa-templates` | `carga-operativa-templates.json` | Templates de carga operativa |
| `meeting-checklist-template` | `meeting-checklist-template.json` | Template de checklist de reuniones |

---

## Migración a Producción

### Paso 1: Obtener credenciales de servicio

1. Ir a [Firebase Console](https://console.firebase.google.com/project/presupuestador-ak-producciones)
2. Proyecto → Configuración → Cuentas de servicio
3. Generar nueva clave privada → Descargar JSON
4. Guardar el archivo de forma segura

### Paso 2: Configurar .env.local para producción

```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
# O usar las variables individuales FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY

USE_FIREBASE_DATA=true

# REMOVER las líneas de emuladores:
# FIRESTORE_EMULATOR_HOST=...
# FIREBASE_AUTH_EMULATOR_HOST=...
```

### Paso 3: Ejecutar migración contra Firestore real

```bash
npm run firebase:migrate:verify
```

### Paso 4: Verificar en Firebase Console

Ir a [Firestore Console](https://console.firebase.google.com/project/presupuestador-ak-producciones/firestore) y verificar que las colecciones tienen los datos correctos.

---

## Reglas de Seguridad

Las reglas están en `firestore.rules`. La configuración actual permite acceso abierto para desarrollo. **Para producción**, usar:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Desplegar reglas:
```bash
firebase deploy --only firestore:rules
```

---

## Troubleshooting

### "Firebase Admin SDK not initialized"
- Verificar que `FIREBASE_PROJECT_ID` esté configurado en `.env.local`
- Si usa emuladores, verificar que `FIRESTORE_EMULATOR_HOST` esté configurado

### "Firestore sync failed"
- El guardado en Firestore lanzará un error — no hay escritura silenciosa a JSON
- Verificar conexión a emuladores o credenciales de producción

### Los datos no aparecen en Firestore
- Verificar que `USE_FIREBASE_DATA=true` en `.env.local`
- Re-ejecutar la migración: `npm run firebase:migrate`

### Java 21 requerido para emuladores
- Los emuladores de Firebase requieren Java 21+
- Instalar: `sudo apt install openjdk-21-jre-headless`

---

## Resultado de la Migración (26/03/2026)

```
✅ Total documentos migrados: 298
📅 Fecha: 26/3/2026

Todas las colecciones verificadas: ✅ OK
- 27 colecciones de datos migradas
- 8 documentos de configuración migrados
- 0 errores
```
