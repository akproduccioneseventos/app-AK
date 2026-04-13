# Operaciones — Guía de Despliegue y Desarrollo

## Ejecución Local

### Requisitos previos

- Node.js 20+
- npm 10+
- Cuenta de Firebase con proyecto configurado
- API key de Google Gemini (para el Asistente AK)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/akproduccioneseventos/app-AK.git
cd app-AK

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales reales

# 4. Ejecutar en modo desarrollo
npm run dev

# 5. Abrir en el navegador
# → http://localhost:3000
```

### Con emuladores de Firebase

```bash
# Ejecutar Next.js + Firebase Emulators en paralelo
npm run dev:firebase
```

---

## Variables de Entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `GOOGLE_API_KEY` | Sí (para IA) | API key de Google Gemini para el Asistente AK |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Sí | API key de Firebase (lado cliente) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Sí | Dominio de autenticación de Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Sí | ID del proyecto Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Sí | Bucket de almacenamiento de Firebase |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sí | Sender ID de Firebase |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Sí | App ID de Firebase |
| `FIREBASE_PROJECT_ID` | Sí (server) | ID del proyecto Firebase (server-side) |
| `FIREBASE_CLIENT_EMAIL` | Sí (server) | Email de la cuenta de servicio Firebase |
| `FIREBASE_PRIVATE_KEY` | Sí (server) | Clave privada de la cuenta de servicio Firebase |
| `USE_FIREBASE_DATA` | No | `true` para habilitar escritura a Firestore |
| `NEXT_PUBLIC_APP_PASSWORD` | No | Contraseña de acceso a la app |

Ver `.env.example` para la lista completa.

---

## Despliegue

La aplicación se despliega en **Firebase App Hosting** con la configuración en `apphosting.yaml`.

```bash
# Build de producción
npm run build

# Deploy completo (build + functions + deploy)
npm run deploy
```

---

## Módulos Principales

| Módulo | Ruta | Descripción |
|---|---|---|
| **Dashboard** | `/` | Panel principal con KPIs y acceso rápido |
| **Presupuestos** | `/presupuestos` | Creación, edición y seguimiento de presupuestos |
| **Clientes** | `/customers` | CRUD completo de clientes |
| **Fiestas/Eventos** | `/fiestas/nueva` | Planificador completo de eventos |
| **Facturas** | `/invoices` | Gestión de facturación |
| **CRM** | `/contabilidad/crm` | Pipeline de ventas y leads |
| **Empresa** | `/empresa` | Info de empresa, empleados, proveedores |
| **Marketing** | `/marketing` | Generador de contenido para redes |
| **Asistente AK** | Widget flotante | Copiloto de IA con voz |
| **Simuladores** | `/simulador`, `/simulador-de-presupuesto` | Calculadoras de presupuesto |
| **Analytics** | `/analytics` | Dashboard ejecutivo con KPIs avanzados |

### Motor de Cálculos (`src/lib/calculations.ts`)

Funciones puras del motor de cálculo unificado:

- `getGuestCountForItem()` — Determina el universo de personas para cada servicio
- `calculateSuggestedQuantity()` — Calcula la cantidad sugerida según el método de cálculo
- `recalcularCostoItem()` — Calcula el importe total de cada línea del presupuesto

### Data Service (`src/lib/data-service.ts`)

- En **desarrollo:** dual-write (JSON local + Firestore en background)
- En **producción:** solo Firestore (filesystem es efímero en Vercel/Firebase Hosting)

### Logger (`src/lib/logger.ts`)

Logger centralizado con prefijo `[AK]`:
- `logger.info()` — siempre en servidor (Firebase Cloud Functions logs), solo en desarrollo en cliente
- `logger.warn()` — siempre
- `logger.error()` — siempre

---

## Testing

### Ejecutar tests

```bash
# Todos los tests
npm test

# Con verbose output
npm test -- --verbose

# Un archivo específico
npm test -- src/__tests__/calculations.test.ts

# Con coverage
npm test -- --coverage
```

### Estructura de tests

```
src/
├── __tests__/
│   ├── assistant-actions.test.ts   # Tests del handler de acciones del asistente
│   └── calculations.test.ts        # Tests del motor de cálculos
└── lib/
    └── __tests__/
        └── fiesta-progress.test.ts # Tests del progreso de planificación de fiestas
```

### Qué cubren los tests

| Suite | Tests | Cobertura |
|---|---|---|
| `calculations.test.ts` | 32 | Motor de cálculos: guest count, costos por método (fijo, porPersona, ratio, tramos), cantidad sugerida |
| `assistant-actions.test.ts` | 32 | Handler de acciones: 16 action types con data faltante, validación de importación (servicios vacíos/precio cero), manejo de errores de Gemini (403, 429, 404), catch-all para acciones desconocidas |
| `fiesta-progress.test.ts` | 39 | Progreso de planificación: cálculos de porcentaje, estados por área, alertas automáticas |

### Escribir nuevos tests

Los tests usan **Jest** con el transformer de Next.js (`next/jest`). El alias `@/` se mapea a `./src/` vía `moduleNameMapper` en `jest.config.js`.

Para testear Server Actions que dependen de módulos externos (IA, Firebase), usar `jest.mock()`:

```typescript
jest.mock('@/ai/flows/assistant-flow', () => ({
  chatWithAssistant: jest.fn(),
}));
```

---

## CI / Calidad

El pipeline de CI (`.github/workflows/ci.yml`) ejecuta en cada push a `main` y en PRs:

1. **Lint** — `npm run lint` (ESLint vía Next.js)
2. **Typecheck** — `npm run typecheck` (`tsc --noEmit`)
3. **Tests** — `npm test -- --passWithNoTests`
4. **Build** — `npm run build` (con variables de entorno dummy)

### Ejecutar localmente

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

---

## Troubleshooting

### El Asistente AK no responde

1. Verificar que `GOOGLE_API_KEY` está configurado en `.env.local`
2. Verificar que la API key tiene permisos para Gemini
3. Revisar la consola del servidor por errores `[AK]`

### Error 403 de Gemini

- La API key no tiene permisos o el proyecto fue bloqueado
- Verificar en [Google AI Studio](https://aistudio.google.com/app/apikey)
- El usuario verá: "No pude procesar tu mensaje en este momento"
- El servidor logueará el error completo

### Presupuesto importado sin servicios

- La extracción de servicios de la imagen/PDF no fue exitosa
- Verificar que la imagen sea legible y tenga precios claros
- El sistema NO crea presupuestos si no detecta servicios válidos (nombre ≠ "Servicio" y precio > 0)
- El usuario es guiado a cargar manualmente desde `/presupuestos/nuevo`

### Tests fallan localmente

```bash
# Limpiar cache de Jest
npx jest --clearCache

# Ejecutar un test específico con más detalle
npm test -- --verbose src/__tests__/calculations.test.ts
```

### Build falla

```bash
# Verificar errores de tipos
npm run typecheck

# Verificar lint
npm run lint
```
