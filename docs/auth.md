# Autenticación — AK Producciones

## Descripción general

La app usa un **sistema de autenticación propio** basado en Firestore.  
**No depende de Firebase Auth**, lo que hace que funcione en cualquier dominio
(`akproducciones.uy`, `*.hosted.app`, `localhost`) sin configuración adicional.

Las credenciales (contraseñas) se almacenan **hasheadas con scrypt**
en la colección `users` de Firestore.

---

## Login

El login pide **solo la contraseña** (sin correo electrónico).  
El sistema busca en todos los usuarios de Firestore si alguno tiene esa contraseña y, si hay match, inicia sesión con ese usuario.

---

## Primer acceso

Al primer uso de la app (cuando no existe ningún usuario en Firestore), se crea
automáticamente el usuario administrador:

- **Correo:** configurado via variable de entorno `ADMIN_BOOTSTRAP_EMAIL`
- **Contraseña:** configurada via variable de entorno `ADMIN_BOOTSTRAP_PASSWORD` *(temporal — cambiala desde el perfil)*
- **Rol:** `admin` (acceso total)

---

## Variables de entorno

| Variable | Descripción | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto Firebase | ✅ |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key (para client-side Firestore si aplica) | ❌ |
| `FIREBASE_PROJECT_ID` | ID del proyecto (server-side Admin SDK) | ❌ (auto) |
| `FIREBASE_CLIENT_EMAIL` | Email de la cuenta de servicio | ❌ (GCP auto-detecta) |
| `FIREBASE_PRIVATE_KEY` | Clave privada de la cuenta de servicio | ❌ (GCP auto-detecta) |
| `ADMIN_BOOTSTRAP_EMAIL` | Email del usuario admin (secreto de Firebase) | ✅ |
| `ADMIN_BOOTSTRAP_PASSWORD` | Contraseña del admin (secreto de Firebase) | ✅ |
| `ADMIN_FORCE_RESET` | Si es `"true"` o `"1"`, resetea la contraseña del admin al hacer login | ❌ |

---

## Reset de emergencia

Si te quedás bloqueado (olvidaste la contraseña), podés recuperar el acceso sin tocar código:

### Pasos

1. Ir a la [consola de Firebase](https://console.firebase.google.com/) → **App Hosting → Secrets**
2. Actualizar el secreto `admin-bootstrap-password` con la nueva contraseña deseada.
3. En `apphosting.yaml`, cambiar `ADMIN_FORCE_RESET` a `"true"`:
   ```yaml
   - variable: ADMIN_FORCE_RESET
     value: "true"
     availability:
       - RUNTIME
   ```
4. Hacer **redeploy** (push al repositorio o redeploy manual desde Firebase Console).
5. Intentar hacer login con la nueva contraseña. El sistema detectará `ADMIN_FORCE_RESET=true` y reseteará la contraseña del admin al valor del secreto `admin-bootstrap-password`.
6. **Importante:** Después del reset exitoso, volver a cambiar `ADMIN_FORCE_RESET` a `"false"` en `apphosting.yaml` y hacer redeploy para que no se resetee en cada login.

### Notas

- La contraseña **nunca** está en el código — siempre se lee del secreto de Firebase.
- El reset marca `mustChangePassword: true`, por lo que el sistema pedirá cambiar la contraseña después del primer login.
- Si el usuario admin no existe, el reset se ignora silenciosamente.

---

## Gestión de usuarios

El usuario **admin** puede:

1. Ir a **Mi Cuenta → Gestión de Usuarios** (o navegar a `/admin/usuarios`)
2. **Crear usuarios**: correo + contraseña + rol + módulos accesibles
3. **Editar permisos**: cambiar rol y módulos de cada usuario
4. **Restablecer contraseñas**
5. **Eliminar usuarios**

---

## Sesión del usuario

La sesión se almacena en `localStorage` con la clave `ak_producciones_auth_session`.
El token tiene el formato `btoa('ak_auth_<userId>_<timestamp>')`.

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
- `/perfil` — Cambiar contraseña
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

## Estructura en Firestore

Colección `users`:

```json
{
  "email": "akproduccionessalto@gmail.com",
  "passwordHash": "scrypt:<salt>:<hash>",
  "role": "admin",
  "modules": ["all"],
  "securityQuestions": {},
  "mustChangePassword": true,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```
