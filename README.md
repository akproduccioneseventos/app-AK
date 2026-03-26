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
- **Base de datos:** Firebase Firestore (con fallback a JSON local)
- **Autenticación:** Firebase Auth
- **IA:** Google Genkit
- **Gráficos:** Recharts

## 🔥 Firebase

La aplicación soporta dual-write (JSON local + Firestore). Ver `.env.example` para configuración.

Para migrar datos existentes a Firestore:
```bash
npx tsx src/scripts/migrate-to-firebase.ts
```

## 📖 Documentación

- **Variables de entorno:** `.env.example`
- **Estructura Firestore:** `docs/firestore-collections.md`
- **Historial de cambios:** Ver `/home/ubuntu/CAMBIOS_COMPLETOS.md`
