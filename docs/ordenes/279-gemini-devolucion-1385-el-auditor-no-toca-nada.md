# Orden 279 — Devolución de la 1385: el auditor de verdad no toca nada, y el programa baja liviano (11/11/2026)

**Para Gemini.** Seguí sobre tu misma rama `gemini/ordenes-273-a-277-entrega-completa` (`git pull`). **Una sola entrega,
sin fusionar.** Lo demás de la 1385 está bien encaminado: no lo rehagas. Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas
78 y 87.

## Lo que está bien y no se toca

El perfil `auditor`, `exigirQueSePuedaGuardar` en el guardado general, en el guardado genérico, en la base, en las
subidas, en WhatsApp, en Mercado Pago, en el publicador y en el gasto de IA; las claves tapadas en conexiones y
WhatsApp; el respaldo completo cerrado para el auditor; la tarjeta de Usuarios; y que el auditor no pueda crear ni
cambiar usuarios.

## Bloque 1 — Cerrar el acceso tiene que cerrarlo de verdad

**Hoy:** `cerrarAccesoAuditor` (`src/app/actions/auth.ts` ~1248) anota al auditor en una lista **en memoria**
(`listaAccesosAuditorCortados` en `src/lib/auth/session-token.ts`). La app corre en varios servidores y se reinicia
sola: en otro servidor, o después de un reinicio, la sesión del auditor (dura 7 días) **sigue entrando** aunque el dueño
lo haya cerrado.

**Qué se hace:** en `verifySession`, cuando el perfil es `auditor`, se lee su usuario en la base (`dbAdmin`, la misma
colección donde `abrirAccesoAuditor` lo guarda) y si `activo !== true` o tiene `cerradoEl`, la sesión no vale. Guardá el
resultado 60 segundos en memoria por usuario para no leer en cada pedido. Si la lectura falla, **no deja pasar**
(pregunta 78: lo roto da menos permisos). La lista en memoria puede quedar como atajo, pero no puede ser lo único.

## Bloque 2 — "Ver como el cliente" no deja al dueño actuar como el cliente

**Hoy:** `verifyPortalSession` (`src/lib/security/portal-session.ts` ~61) da por válida la sesión del portal de
**cualquier fiesta** si quien entra es el dueño o el auditor. Ese mismo control lo usan las acciones del portal que
**guardan**: firmar la constancia del contrato, aprobar pedidos, avisar un pago. Con eso, el dueño quedaría firmando
como si fuera el cliente.

**Qué se hace:** sacá a `dueno` de ese atajo; queda sólo `auditor`, que igual no puede guardar nada por el candado. Para
el dueño, el botón "Ver como el cliente" (`src/app/(app)/fiestas/[id]/centro/page.tsx` ~193 y
`src/app/(app)/fiestas/nueva/page.tsx` ~540) abre el portal con el enlace de la fiesta que ya existe, con su clave
(`/portal/c/<accessKey>`, el mismo que se le manda al cliente). Si la fiesta no tiene clave, el botón no aparece.

## Bloque 3 — El auditor tampoco manda mails ni toca el calendario de Google

**Hoy** quedaron sin candado, en `src/lib/google-workspace.ts`: `sendGoogleGmailMessage` (~642), `upsertGoogleCalendarEvent`
(~614), `upsertGoogleContact` (~381) y `borrarEventoDeLaAgenda` (~886). Con perfil de auditor se puede mandar un mail a
un cliente o crear un evento en su calendario.

**Qué se hace:** `await exigirQueSePuedaGuardar()` al principio de las cuatro.

## Bloque 4 — El programa que se baja pesa 95 MB porque lleva la carpeta de Python de tu computadora

**Hoy:** `public/descargas/ak-editor.zip` trae `ak-editor/.venv/` entero (3.287 archivos, 278 MB descomprimido). Eso es
la instalación de Python de tu máquina: no le sirve a otra computadora (la arma `instalar.bat`) y hace pesada la app.

**Qué se hace:** en `scripts/empaquetar-ak-editor.mjs`, dejá afuera `.venv`, `venv`, `__pycache__`, `*.pyc` y `pruebas/`.
Volvé a armar el zip (`npm run editor:empaquetar`) y sumá `herramientas/ak-editor/.venv/` a `.gitignore`.

## Pruebas

- `src/__tests__/el-auditor-cerrado-no-entra.test.ts`: con la base de mentira diciendo `activo: false`, `verifySession`
  de un auditor da `success: false` **aunque la lista en memoria esté vacía** (simula otro servidor); con la lectura
  fallando, también falso; con `activo: true`, verdadero.
- `src/__tests__/el-duenio-no-firma-como-cliente.test.ts`: `verifyPortalSession` con sesión de dueño y sin cookie del
  portal da `false`; con sesión de auditor, `true`.
- En `el-auditor-mira-y-no-toca` (o la prueba del auditor que ya trajiste), sumá: `sendGoogleGmailMessage` y
  `upsertGoogleCalendarEvent` con sesión de auditor tiran el error y **no llaman a `fetch`**.
- `src/__tests__/el-editor-baja-liviano.test.ts`: el zip pesa menos de 5 MB y no tiene ninguna entrada con `.venv/`.

```comprobar
no-usa: appSession.user?.perfil === 'dueno' en src/lib/security/portal-session.ts
usa: exigirQueSePuedaGuardar en src/lib/google-workspace.ts
usa: .venv en scripts/empaquetar-ak-editor.mjs
prueba: src/__tests__/el-auditor-cerrado-no-entra.test.ts
prueba: src/__tests__/el-duenio-no-firma-como-cliente.test.ts
prueba: src/__tests__/el-editor-baja-liviano.test.ts
```
