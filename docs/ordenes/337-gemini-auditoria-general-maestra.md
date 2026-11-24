# Orden 337 — Auditoría general maestra del 23/11/2026: accesos rotos, seguridad de descargas y Ajustes

**Para Gemini. Una sola propuesta, rama nueva `gemini/orden-337` desde la principal recién actualizada, DESPUÉS de la 336**
(no repitas lo que ya pide la 336: el informe la cita en sus bloques 1.3, 2.13 y 3). Si un bloque se traba, entregá el resto
en la misma propuesta y decí cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

**Ya lo hizo Claude, no lo toques:** la lista de fiestas que daba error en producción (cada documento sale como objeto plano,
con su número y las fechas de la base como texto; 15 s para leer la colección entera; el historial no se cae con una fiesta
sin `configuracion`) y el tablero `/fiestas/nueva` con `invitadosEstimados` vacío. Control:
`src/__tests__/la-lista-de-fiestas-no-se-cae-por-un-documento-raro.test.ts`. Si la lista sigue fallando, el bloque 5 hace que
el error diga el motivo.

Cada hallazgo se **confirma abriendo el archivo** antes de arreglarlo. Plata y permisos los revisa Claude línea por línea.

## Bloque 1 — Lo que expulsa a clientes, invitados y colaboradores (confirmado por Claude)
1. **Recap del invitado da 404:** `src/app/invitacion/[fiestaId]/recap/page.tsx` ~31 llama `getFiestaById(fiestaId)` sin
   `LECTURA_COMPLETA`; el recorte borra `guestAccessToken` y la validación del invitado falla. Leer completa en el servidor
   y devolverle al invitado sólo lo suyo (`buildPublicGuestPortalData`).
2. **Enlace externo de la carga operativa llega vacío:** `src/app/actions/fiesta/carga-operativa.actions.ts` ~103 y ~114,
   mismo motivo (`listaDeCargaOperativa` recortada). Leer completa sólo después de validar el token.
3. **Colaboradores de Repostería y Fotografía caen en `/login`:** `src/app/acceso-personal/[tokenId]/page.tsx` ~26-27 los manda
   a direcciones que `src/middleware.ts` no deja pasar con token. Llevarlos a la vista con token que sí está permitida.
4. **El QR `/q/[fiestaId]`, botón "Cliente":** `src/lib/experience-ak/ultimate-event-system.ts` ~136 lleva a
   `/fiestas/nueva/portal-cliente` (pide sesión del equipo). Debe ir a `/portal?fiestaId=...`.
5. **`/buscar` pide sesión:** sumarlo a `src/lib/auth/public-paths.ts` sólo si la pantalla no muestra nada privado (mirarla).

## Bloque 2 — Seguridad de las descargas y del ingreso con Google (permisos: lo revisa Claude)
1. **Archivos leídos con una ruta que viene del dato:** `src/app/api/buzon/[fiestaId]/download/route.ts` ~111
   (`fs.readFile(msg.mediaUrl)`), `src/app/api/social-gallery/[fiestaId]/download/route.ts` ~191 (`fs.readFile(photo.path)`),
   `src/app/api/fiestas/[fiestaId]/download-recuerdos/route.ts` ~191 y ~246, `src/app/api/documentos-fiesta/[...parts]/route.ts`
   ~55-87. Sólo se lee dentro de la carpeta de esa fiesta (ruta resuelta y comparada con el prefijo), y los `fetch` sólo a
   los dominios de Storage de la app.
2. **Ingreso con Google:** `src/lib/google-workspace.ts` ~93-96, `decodeGoogleState`: con la firma mal **rechaza**, no cae a
   `{ kind: 'company' }`. El llamador muestra "El enlace venció, volvé a conectar".
3. **Descargas ZIP y chat de IA con sólo sesión** (`/api/multiagent/message`, `/api/asistente/voz-parte`): pedir el permiso
   del módulo y pertenencia a la fiesta (lo mismo que la pregunta 211).

## Bloque 3 — Ajustes que no abren o abren otra cosa
1. Entrar por enlace directo (`?seccion=…&sub=…`) deja en blanco *Señas y reserva*, *Plantilla de contrato*, *Cláusulas*,
   *WhatsApp Business* y *Opciones avanzadas*: cada `sub` del menú de Ajustes abre su panel.
2. **Respaldo** queda en "AVERIGUANDO ESTADO..." para siempre: si la consulta falla o tarda, que diga el motivo.
3. El botón **"Datos legales y cobro"** abre "Administración de Datos" (borrado de módulos): que abra su panel.

## Bloque 4 — Pantallas a medias del informe (bloque 2 y 3 del informe, lo que no está en la 336)
Video de vida y Buzón dentro de la fiesta, `/fiestas/nueva?id=` (aceptar `id` además de `fiestaId`), post-fiesta sin
`galeriaUrl` (sin botón de descarga que no hace nada), `/portal/mesas` sin dividir por cero, moodboard sin `decoracion`,
recepción y portal que no encuentran fiestas en el JSON local, las estaciones que dicen "cargando" o muestran algo positivo
con una fiesta que no existe, el escáner con QR de ruta relativa, los dos archivos de la app instalable con distinto
`start_url` (queda uno), el despertador de `functions/src/index.ts` (mirar `response.ok`, tiempo límite, error como error),
`TAREAS_SECRET` en `src/lib/automatico/puerta-de-las-tareas.ts` ~111, y los textos del bloque 3 del informe (simulador
"Organizamos de la fiesta", doble ícono, asteriscos en Buzón, contraste de la presentación LED). **No tocar** el reloj, los
descuentos ni las promesas del simulador: sólo el error de texto.

## Bloque 5 — Que el error de la lista de fiestas diga su motivo
`src/app/(app)/eventos/page.tsx` ~95-108: si `getFiestas` o `getHistorialFiestas` fallan, mostrar el motivo que devuelve el
servidor (sin datos privados) con un número para buscarlo en el registro, igual que hiciste en el muro (orden 335, bloque 7).

## Barrido en toda la app
- **Pregunta 215 (lectura recortada que después pide lo recortado):** buscar `getFiestaById(` sin `LECTURA_COMPLETA` en
  pantallas públicas (`src/app/invitacion`, `src/app/portal`, `src/app/acceso-personal`, `src/app/evento`) y acciones con token.
- **Pregunta 216 (archivo leído con ruta del dato):** el escaneo automático `node scripts/las-formas-que-mienten.mjs --todo`
  tiene que dar 0.
- **Pregunta 217 (firma inválida que cae a un valor por defecto):** mismo escaneo, 0.

```comprobar
no-usa: const fiesta = await getFiestaById(fiestaId); en src/app/invitacion/[fiestaId]/recap/page.tsx
no-usa: fs.readFile(msg.mediaUrl) en src/app/api/buzon/[fiestaId]/download/route.ts
no-usa: fs.readFile(photo.path) en src/app/api/social-gallery/[fiestaId]/download/route.ts
usa: /buscar en src/lib/auth/public-paths.ts
usa: /portal?fiestaId= en src/lib/experience-ak/ultimate-event-system.ts
prueba: tests/e2e/los-accesos-de-afuera-llegan.spec.ts
prueba: src/__tests__/auditoria-337-descargas-y-google.test.ts
prueba: tests/e2e/ajustes-abre-cada-panel.spec.ts
archivo: docs/auditorias/2026-11-23-general-maestra.md
archivo: src/app/acceso-personal/[tokenId]/page.tsx
archivo: src/app/actions/fiesta/carga-operativa.actions.ts
archivo: src/app/api/fiestas/[fiestaId]/download-recuerdos/route.ts
archivo: src/app/api/documentos-fiesta/[...parts]/route.ts
archivo: src/app/(app)/eventos/page.tsx
archivo: functions/src/index.ts
archivo: src/lib/automatico/puerta-de-las-tareas.ts
```
