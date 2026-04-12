# Guía de Operación — AK Producciones

## Desarrollo local

### Requisitos previos

- Node.js 20+
- npm 9+

### Iniciar la app

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales necesarias

# 3. Ejecutar en desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`.

### Con Firebase Emulators

```bash
npm run dev:firebase
```

## Variables de entorno necesarias

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `GOOGLE_API_KEY` | Clave de API de Google para Genkit/Gemini | Sí (para IA) |
| `NEXT_PUBLIC_FIREBASE_*` | Configuración de Firebase (apiKey, authDomain, projectId, etc.) | Sí |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Service account JSON para Firebase Admin | Sí (producción) |

Ver `.env.example` para la lista completa.

## Pruebas

### Ejecutar tests

```bash
# Todos los tests
npm test

# Tests en modo watch
npm test -- --watch

# Test específico
npm test -- --testPathPattern=assistant
```

### Estructura de tests

```
src/__tests__/              → Tests de acciones del servidor y utilidades
src/lib/__tests__/          → Tests de funciones de cálculo y lógica de negocio
```

## Verificación de flujos críticos

### Asistente AK

1. Abrir la app y hacer clic en el botón flotante del Asistente AK
2. Enviar un mensaje de texto → debe responder sin errores
3. Adjuntar una imagen de un presupuesto → debe intentar extraer datos
4. Si la IA no está disponible → debe mostrar "No pude procesar tu mensaje"

### Presupuestos

1. Ir a /presupuestos/nuevo y crear un presupuesto
2. Verificar que se guarda correctamente
3. Verificar que se puede generar PDF

### Importación de presupuesto

1. Usar el asistente para importar desde foto
2. Verificar que NO se crean presupuestos vacíos
3. Si la extracción falla, verificar que el mensaje es claro

## Linting y tipos

```bash
# Lint
npm run lint

# Verificar tipos TypeScript
npm run typecheck
# o
npx tsc --noEmit
```

## Build de producción

```bash
npm run build
npm start
```

## CI/CD

El workflow de CI (`.github/workflows/ci.yml`) ejecuta automáticamente:

1. `npm ci` — Instalar dependencias
2. `npm run lint` — Verificar estilo de código
3. `npx tsc --noEmit` — Verificar tipos TypeScript
4. `npm test -- --passWithNoTests` — Ejecutar tests
5. `npm run build` — Build de producción

Se ejecuta en cada push a `main` y en cada pull request.

## Troubleshooting por módulo

### Asistente AK
- **Error 403**: La clave de API de Gemini no tiene permisos. Verificar `GOOGLE_API_KEY` en el panel de despliegue.
- **"No pude procesar tu mensaje"**: Error temporal de la IA. Los logs del servidor tendrán el detalle técnico.
- **Presupuestos vacíos**: El sistema ahora valida servicios antes de crear. Si persiste, revisar logs con prefijo `[AK] [Asistente AK]`.

### Firebase
- **Error de conexión**: Verificar las variables de entorno de Firebase
- **Permisos**: Todas las operaciones usan Firebase Admin SDK (server-side)

### Build
- **Errores de tipos**: Ejecutar `npx tsc --noEmit` para ver los errores detallados
- **Errores de lint**: Ejecutar `npm run lint` y corregir los warnings/errors
