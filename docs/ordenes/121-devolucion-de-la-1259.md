# Orden 121 — Devolución de la propuesta 1259 (orden 117): el tótem de bienvenida de verdad

**6 de octubre de 2026.** Para Gemini. **Una sola propuesta, en la MISMA rama
`feat/orden-117-video-invitados`** (traé primero lo que subió Claude: `git pull`). Si un bloque se
traba, entregá el resto igual en la misma propuesta y decí cuál faltó.

Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste.

## Lo que ya arregló Claude en la rama (NO tocar)

- `actualizarFiesta` volvió a no tener la opción `portalClient`: no hace falta, porque
  `requireFiestaWriteAccess` ya deja pasar la sesión del portal del cliente. **No la vuelvas a
  agregar**: era un atajo que saltaba el permiso.
- La importación de `AvisoDeDatos` estaba mal (`legales` → `legal`): no compilaba.
- Se sacó `presupuestar_prospecto` de `src/lib/asistente/por-whatsapp.ts`: armaba un presupuesto
  basura (100 adultos, "15 Años", sin servicios) a nombre del celular del equipo. **No se vuelve a
  agregar.**
- Se sacaron los datos de corrida que se habían subido (`data/notifications.json`,
  `src/data/notifications.json`).
- `obtenerVideoBienvenidaTotem` en `src/app/actions/videos-invitados.ts` está bien: se usa tal cual.

## Bloque 1 — El tótem de bienvenida con cámara (lo que pedía la orden 117 y no llegó)

La entrega puso el tótem en `src/app/evento/totem/[fiestaId]/page.tsx` con un campo oculto para
lectores de hardware. **El salón no tiene lector: tiene una tablet o una tele con cámara.**

1. **Mové** `src/app/evento/totem/[fiestaId]/page.tsx` a
   `src/app/evento/bienvenida/[fiestaId]/page.tsx` (`git mv`). No se mezcla con
   `src/app/evento/totem/[fiestaId]/[totemId]/`, que es el otro tótem (fotos al muro).
2. **Cámara con `html5-qrcode`**, igual que `src/app/evento/accesos/[fiestaId]/page.tsx`
   (importación dinámica en la línea ~149, lectura del enlace en las líneas ~84-110: saca
   `fiestaId`, `guestId` y `token` de los parámetros del enlace del QR). Copiá ese parseo; si el
   `fiestaId` del QR no es el de la pantalla, cartel "Este QR es de otra fiesta" y vuelve sola.
   Cámara frontal por defecto. Si no hay cámara o se niega el permiso, cartel claro ("Esta pantalla
   necesita la cámara. Tocá acá para darle permiso") con botón para reintentar; el campo oculto
   para lector puede quedar como respaldo.
3. **Pantalla de espera:** fondo de la fiesta, nombre del agasajado y, en grande, **"¡Bienvenidos!
   Acercá el QR de tu invitación"** con una flecha animada hacia la cámara. Pantalla prendida con
   `usePantallaPrendida()`.
4. **Al leer un QR bueno:** llamar `obtenerVideoBienvenidaTotem(fiestaId, guestId, token)`.
   Mostrar **"¡Hola, {guestName}!"**, confeti, y **el número de mesa** (`tableNumber` del invitado,
   tipo en `src/types/invitado.ts` línea 24). Para eso, agregá `tableNumber` a lo que devuelve
   `obtenerVideoBienvenidaTotem` (sólo eso, nada más del invitado). Si hay `videoUrl`, se
   reproduce con sonido; si no hay, se queda con el saludo y la mesa.
5. **Vuelve sola** a la pantalla de espera al terminar el video, o a los 12 segundos si no hay
   video. Un QR malo: "No reconocimos este QR, probá de nuevo" y vuelve a los 4 segundos.
6. **El tótem NO marca la llegada del invitado.** Eso lo sigue haciendo la recepción.
7. **Botón en el panel de entretenimiento** (`src/app/(app)/fiestas/nueva/entretenimiento/page.tsx`):
   "Abrir tótem de bienvenida", que abre `/evento/bienvenida/{fiestaId}` en pestaña nueva.

**Prueba de navegador** `tests/e2e/el-totem-de-bienvenida.spec.ts`, que mire el RESULTADO:
- Sin QR, se ve "Acercá el QR".
- Con un QR bueno (inyectado por el campo de respaldo o llamando al manejador de lectura): se ve
  "¡Hola, {nombre}!" **y** el número de mesa del invitado de prueba.
- Con un QR de otra fiesta o con token malo: se ve el cartel de error y **no** se ve "¡Hola".
- A los segundos vuelve a "Acercá el QR".
Tiene que poder fallar: si se borra el saludo o la mesa de la pantalla, la prueba se pone en rojo.

## Bloque 2 — El interruptor del video para invitados

`clientPortalSettings.videosParaInvitadosActivo` lo leen el portal y el tótem, pero **nadie lo
puede prender**: la función no se puede usar nunca.

En `src/app/(app)/fiestas/nueva/portal-cliente/page.tsx`, debajo del interruptor "Habilitar Portal
del Cliente" (línea ~819-831), un `Switch` igual con el texto **"Video para cada invitado"** y la
ayuda "El cliente sube videos y cada invitado ve el suyo en su invitación y en el tótem de
bienvenida". Guarda en `portalSettings.videosParaInvitadosActivo` con el mismo botón de guardar
(`handleSavePortalSettings`). Sumá un caso a una prueba existente o nueva que compruebe que al
prenderlo y guardar, el valor queda en `true`.

## Bloque 3 — Nada de datos de corrida

Antes de subir: `npm run limpiar:corrida` y `git add` con los archivos nombrados. Nunca `-a` ni
`-A`.

```comprobar
archivo: src/app/evento/bienvenida/[fiestaId]/page.tsx
usa: obtenerVideoBienvenidaTotem en src/app/evento/bienvenida/[fiestaId]/page.tsx
usa: html5-qrcode en src/app/evento/bienvenida/[fiestaId]/page.tsx
usa: Acercá el QR en src/app/evento/bienvenida/[fiestaId]/page.tsx
usa: tableNumber en src/app/evento/bienvenida/[fiestaId]/page.tsx
usa: tableNumber en src/app/actions/videos-invitados.ts
usa: /evento/bienvenida/ en src/app/(app)/fiestas/nueva/entretenimiento/page.tsx
usa: videosParaInvitadosActivo en src/app/(app)/fiestas/nueva/portal-cliente/page.tsx
no-usa: presupuestar_prospecto en src/lib/asistente/por-whatsapp.ts
no-usa: portalClient en src/lib/fiesta/actualizar-fiesta.ts
prueba: tests/e2e/el-totem-de-bienvenida.spec.ts
```
