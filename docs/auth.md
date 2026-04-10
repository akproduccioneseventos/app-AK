# Autenticación — AK Producciones

## Descripción general

La app usa un **sistema de autenticación propio** basado en Firestore.  
**No depende de Firebase Auth**, lo que hace que funcione en cualquier dominio
(`akproducciones.uy`, `*.hosted.app`, `localhost`) sin configuración adicional.

Las credenciales (contraseñas y respuestas de seguridad) se almacenan **hasheadas con scrypt**
en la colección `users` de Firestore.

---

## Primer acceso

Al primer uso de la app (cuando no existe ningún usuario en Firestore), se crea
automáticamente el usuario administrador usando variables de entorno:

- **Correo:** valor de `ADMIN_BOOTSTRAP_EMAIL` (default: `admin@akproducciones.uy`)
- **Contraseña:** valor de `ADMIN_BOOTSTRAP_PASSWORD` (obligatoria)
- **Rol:** `admin` (acceso total)

> ⚠️ NUNCA escribas la contraseña en el código fuente. Configurala como variable de entorno.
> Después del primer login, cambiala desde el perfil.

---

## Variables de entorno

Solo se requieren las variables de Firestore (ya NO se necesita Firebase Auth):

| Variable | Descripción | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto Firebase | ✅ |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key (para client-side Firestore si aplica) | ❌ |
| `FIREBASE_PROJECT_ID` | ID del proyecto (server-side Admin SDK) | ❌ (auto) |
| `FIREBASE_CLIENT_EMAIL` | Email de la cuenta de servicio | ❌ (GCP auto-detecta) |
| `FIREBASE_PRIVATE_KEY` | Clave privada de la cuenta de servicio | ❌ (GCP auto-detecta) |
| `SESSION_SECRET` | Secreto para firmar cookies de sesión | ✅ |
| `ADMIN_BOOTSTRAP_EMAIL` | Email del admin inicial | ❌ (default: admin@akproducciones.uy) |
| `ADMIN_BOOTSTRAP_PASSWORD` | Contraseña del admin inicial | ✅ (solo primer uso) |

---

## Gestión de usuarios

El usuario **admin** puede:

1. Ir a **Mi Cuenta → Gestión de Usuarios** (o navegar a `/admin/usuarios`)
2. **Crear usuarios**: correo + contraseña + rol + módulos accesibles
3. **Editar permisos**: cambiar rol y módulos de cada usuario
4. **Restablecer contraseñas**
5. **Eliminar usuarios**

---

## Flujo "Olvidé mi contraseña"

1. Click en **¿Olvidaste tu contraseña?** en `/login`
2. Ingresar correo
3. Responder las 3 preguntas de seguridad configuradas
4. Si son correctas → crear nueva contraseña
5. Si son incorrectas → mostrar error

---

## Preguntas de seguridad

Cada usuario puede configurar sus 3 preguntas de seguridad desde **Mi Perfil** (`/perfil`):

1. ¿Nombre de tu primera mascota?
2. ¿Tu color favorito?
3. ¿Nombre de tu escuela?

Las respuestas se guardan **hasheadas** en Firestore (no texto plano).
Las comparaciones son insensibles a mayúsculas/minúsculas.

---

## Sesión del usuario

La sesión se almacena en `localStorage` con la clave `ak_producciones_auth_session`.
El token tiene el formato `btoa('ak_auth_<userId>_<timestamp>')`.

Adicionalmente, el login establece una cookie HTTP-only firmada (`ak_session`) que
es verificada por el middleware de Next.js y los Server Actions.

Para cerrar sesión: **Mi Cuenta → Cerrar Sesión** (limpia el localStorage).

---

## Rutas protegidas

Las siguientes rutas requieren autenticación:

- `/` (home/dashboard)
- `/empresa` y subrutas
- `/fiestas` y subrutas
- `/presupuestos` y subrutas
- `/invoices` y subrutas
- `/customers` y subrutas
- `/perfil` — Cambiar contraseña y preguntas de seguridad
- `/admin/usuarios` — Gestión de usuarios (solo admin)
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
E2E_DEMO_EMAIL=admin@akproducciones.uy \
E2E_DEMO_PASSWORD=<tu-contraseña-segura> \
npm run test:e2e
```

O en GitHub Actions, guardar como Secrets:
- `E2E_DEMO_EMAIL` *(opcional — default: admin@akproducciones.uy)*
- `E2E_DEMO_PASSWORD`

La mayoría de los tests inyectan una sesión directamente en `sessionStorage`
(función `injectAuthSession`) para evitar depender de credenciales reales.
Solo `02-login.spec.ts` prueba el flujo de login real.

---

## Estructura en Firestore

Colección `users`:

```json
{
  "email": "admin@akproducciones.uy",
  "passwordHash": "scrypt:<salt>:<hash>",
  "role": "admin",
  "modules": ["all"],
  "securityQuestions": {
    "q1": { "question": "¿Nombre de tu primera mascota?", "answer": "scrypt:<salt>:<hash>" },
    "q2": { "question": "¿Tu color favorito?", "answer": "scrypt:<salt>:<hash>" },
    "q3": { "question": "¿Nombre de tu escuela?", "answer": "scrypt:<salt>:<hash>" }
  },
  "mustChangePassword": true,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```
