# AK Producciones - Sistema de Gestión de Eventos

Aplicación web para gestión integral de eventos y fiestas, desarrollada con Next.js 14, TypeScript y Firebase.

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales de Firebase

# 3. Ejecutar en desarrollo
npm run dev

# 4. Build de producción
npm run build && npm start
```

## 📋 Módulos Principales

- **Dashboard** — Vista general con KPIs, eventos próximos, calendario
- **CRM/Prospectos** — Pipeline de ventas con gestión de leads
- **Clientes** — Gestión de clientes con contratos vinculados
- **Fiestas/Eventos** — Planificación completa de eventos (catering, decoración, música, etc.)
- **Presupuestos** — Creación y seguimiento de presupuestos
- **Empleados** — Gestión de personal y roles
- **Contabilidad** — Flujo de caja, gastos, facturas
- **Configuración** — Templates, ajustes de precios, backups

## 🔧 Stack Técnico

- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS + Radix UI
- **Base de datos:** Firebase Firestore (con fallback a JSON local en desarrollo)
- **Autenticación:** Sistema propio (scrypt + cookies de sesión firmadas con HMAC). No usa Firebase Auth.
- **IA:** Google Genkit
- **Gráficos:** Recharts

## 🔥 Firebase

La aplicación usa Firestore como base de datos principal, accedida exclusivamente a través del
Firebase Admin SDK (Server Actions). Las reglas de Firestore bloquean todo acceso cliente
(`allow read, write: if false`). En desarrollo se soporta dual-write (JSON local + Firestore).

Para migrar datos existentes a Firestore:
```bash
npx tsx src/scripts/migrate-to-firebase.ts
```

## ✅ Calidad

```bash
npm run typecheck
npm run lint
npm test
npx playwright test   # E2E (requiere ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD)
```

## 📖 Documentación

- **Variables de entorno:** `.env.example`
- **Autenticación:** `docs/auth.md`
- **Estructura Firestore:** `docs/firestore-collections.md`
