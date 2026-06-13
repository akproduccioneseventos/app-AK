# Autenticación — AK Producciones

## Descripción general

La app mantiene la contraseña principal en un **sistema propio basado en Firestore**.
Firebase Authentication se usa además para verificar el ingreso y la recuperación
con la cuenta Google autorizada.

La contraseña principal se almacena con **scrypt** en `app-settings/auth`.
Las cuentas y respuestas de seguridad del módulo de usuarios se mantienen separadas
en la colección `users` de Firestore.

---

## Primer acceso

No existe una contraseña predeterminada dentro del código. El acceso inicial debe
configurarse en Firestore, mediante `APP_PASSWORD` como emergencia del servidor,
o verificando el correo administrador autorizado con Google.

---

## Variables de entorno

La contraseña requiere Firestore. El acceso con Google también necesita Firebase Auth:

| Variable | Descripción | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto Firebase | ✅ |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key (para client-side Firestore si aplica) | ❌ |
| `FIREBASE_PROJECT_ID` | ID del proyecto (server-side Admin SDK) | ❌ (auto) |
| `FIREBASE_CLIENT_EMAIL` | Email de la cuenta de servicio | ❌ (GCP auto-detecta) |
| `FIREBASE_PRIVATE_KEY` | Clave privada de la cuenta de servicio | ❌ (GCP auto-detecta) |
| `AUTH_ALLOWED_EMAILS` | Correos autorizados para Google, separados por coma | ✅ |

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

1. Abrir **Olvide mi contraseña** en `/login`.
2. Escribir y repetir la nueva contraseña.
3. Elegir **Verificar Gmail y recuperar acceso**.
4. Google debe confirmar una cuenta incluida en `AUTH_ALLOWED_EMAILS`.
5. La app cambia la contraseña y crea la sesión en el mismo paso.

Como alternativas siguen disponibles el código enviado por correo, los códigos de
respaldo y las preguntas de seguridad.

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

La autorización real se almacena en la cookie firmada y `httpOnly` `ak_session`.
El valor del navegador con el mismo nombre solo ayuda a la interfaz y nunca se usa
como prueba de acceso en el servidor.

Para cerrar sesión: **Mi Cuenta → Cerrar Sesión** (limpia el localStorage).

## Configuración de Google

1. Habilitar el proveedor **Google** en Firebase Authentication.
2. Agregar el dominio `hosted.app` desplegado y el dominio personalizado a
   **Authentication > Settings > Authorized domains**.
3. Configurar `AUTH_ALLOWED_EMAILS`.
4. Mantener correctas las variables `NEXT_PUBLIC_FIREBASE_*` del proyecto web.

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
E2E_DEMO_EMAIL=akproduccionessalto@gmail.com \
E2E_DEMO_PASSWORD=AKproducciones2024 \
npm run test:e2e
```

O en GitHub Actions, guardar como Secrets:
- `E2E_DEMO_EMAIL` *(opcional — default: akproduccionessalto@gmail.com)*
- `E2E_DEMO_PASSWORD`

La mayoría de los tests inyectan una sesión directamente en `sessionStorage`
(función `injectAuthSession`) para evitar depender de credenciales reales.
Solo `02-login.spec.ts` prueba el flujo de login real.

---

## Estructura en Firestore

Colección `users`:

```json
{
  "email": "akproduccionessalto@gmail.com",
  "passwordHash": "sha256...",
  "role": "admin",
  "modules": ["all"],
  "securityQuestions": {
    "q1": { "question": "¿Nombre de tu primera mascota?", "answer": "sha256..." },
    "q2": { "question": "¿Tu color favorito?", "answer": "sha256..." },
    "q3": { "question": "¿Nombre de tu escuela?", "answer": "sha256..." }
  },
  "mustChangePassword": true,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```
