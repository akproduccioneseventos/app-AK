# Autenticación — AK Producciones

## Descripción general

La app usa **Firebase Authentication (Email/Password)** para proteger todas las rutas privadas.  
Solo los correos en la whitelist de administradores pueden ingresar.

---

## Configuración inicial en Firebase Console

### 1. Habilitar Email/Password

1. Ir a [Firebase Console](https://console.firebase.google.com/) → tu proyecto → **Authentication**
2. Pestaña **Sign-in method**
3. Habilitar **Email/Password** → Guardar

### 2. Crear el usuario administrador

1. **Authentication** → **Users** → **Add user**
2. Correo: `akproduccionessalto@gmail.com`
3. Contraseña: elegí una contraseña fuerte (mínimo 8 caracteres, letras y números)

### 3. Agregar el dominio autorizado

1. **Authentication** → **Settings** → **Authorized domains**
2. Agregar: `ak-producciones--presupuestador-ak-producciones.us-east4.hosted.app`
3. Si usás un dominio propio, agregarlo también aquí. Por ejemplo: `akproducciones.uy`

> **⚠️ Importante para dominio personalizado:** Si el login falla en `akproducciones.uy`,
> verificar que el dominio esté en la lista de dominios autorizados de Firebase Auth.
> Sin esto, Firebase rechaza las solicitudes de autenticación desde ese dominio.

---

## Variables de entorno

Copiá `.env.local.example` a `.env.local` y completá los valores:

```bash
cp .env.local.example .env.local
```

| Variable | Descripción | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key del proyecto Firebase | ✅ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain (ej: `tu-proyecto.firebaseapp.com`) | ✅ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto Firebase | ✅ |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket | ✅ |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | ✅ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID de Firebase | ✅ |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Emails admin separados por coma | ❌ (default: `akproduccionessalto@gmail.com`) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (para links de reset) | ❌ (default: `window.location.origin`) |

---

## Agregar más administradores en el futuro

1. En Firebase Console → **Authentication** → **Users**: crear el nuevo usuario
2. En `.env.local` (o variables de entorno de producción), agregar el correo a `NEXT_PUBLIC_ADMIN_EMAILS`:
   ```
   NEXT_PUBLIC_ADMIN_EMAILS=akproduccionessalto@gmail.com,otrocorreo@ejemplo.com
   ```
3. Redeploy (o reiniciar el servidor si es local)

---

## Flujo "Olvidé mi contraseña"

1. El usuario hace click en **¿Olvidaste tu contraseña?** en `/login`
2. Ingresa su correo
3. Firebase envía un email con enlace de restablecimiento
4. El enlace redirige al usuario de vuelta a `/login` para ingresar con la nueva contraseña

El enlace de reset apunta a la URL configurada en `NEXT_PUBLIC_APP_URL` (o el origen actual del navegador como fallback).

---

## Rutas protegidas

Las siguientes rutas requieren autenticación:

- `/` (home/dashboard)
- `/empresa` y subrutas
- `/fiestas` y subrutas
- `/presupuestos` y subrutas
- `/invoices` y subrutas
- `/customers` y subrutas
- Cualquier otra ruta no listada como pública

### Rutas públicas (sin autenticación)

- `/login`
- `/landing` y subrutas
- `/evento/*`
- `/invitacion/*`
- `/video-vida`
- `/feedback`
- `/portal`
- `/portal-cliente/*`
- `/simulador*`
- `/presentacion*`
- `/public/*`
- `/acceso-personal`
- `/proveedor`

---

## E2E Tests (Playwright)

Para ejecutar los tests E2E con autenticación, configurar las variables de entorno:

```bash
E2E_DEMO_EMAIL=akproduccionessalto@gmail.com \
E2E_DEMO_PASSWORD=tu_contraseña \
npm run test:e2e
```

O en GitHub Actions, guardar como Secrets:
- `E2E_DEMO_EMAIL`
- `E2E_DEMO_PASSWORD`

---

## Cambiar de dominio / Dominio personalizado

Si en el futuro comprás un dominio propio (ej: `akproducciones.uy`):

1. Conectar el dominio al hosting
2. Agregar en Firebase Console → **Authentication** → **Settings** → **Authorized domains**
3. Actualizar `NEXT_PUBLIC_APP_URL` en las variables de entorno de producción (opcional)

### ¿Por qué no se necesitan variables de entorno para el login?

La configuración de Firebase se resuelve automáticamente en tiempo de ejecución:

1. Si `NEXT_PUBLIC_FIREBASE_API_KEY` está configurado en el build → se usa ese valor.
2. Si no → la app intenta `/__/firebase/init.json` en el dominio actual (disponible en `*.hosted.app`).
3. Si eso falla (p. ej. en dominio personalizado) → se obtiene la config desde
   `https://ak-producciones--presupuestador-ak-producciones.us-east4.hosted.app/__/firebase/init.json`
   y se guarda en `localStorage` para evitar futuras peticiones cross-origin.

Esto significa que el login funciona en `akproducciones.uy`, `*.hosted.app` y `localhost`
**sin necesidad de configurar variables de entorno manualmente**.

> **Requisito imprescindible:** el dominio debe estar en la lista de **Authorized domains**
> de Firebase Auth (ver paso 3 arriba).
