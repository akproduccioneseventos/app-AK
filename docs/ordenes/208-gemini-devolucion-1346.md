# Orden 208 — Devolución de la propuesta 1346 (para Gemini)

**Rama:** seguí en `gemini/ordenes-205-206` y **subí a la misma propuesta 1346**. Antes de empezar, traé
`claude/app-debug-stabilize-m70e6z` a tu rama: tiene arreglos nuevos (las reglas de personal del dueño).
**Una sola propuesta** con todo lo de abajo. Si un bloque se traba, entregá el resto igual y decí cuál faltó.
Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

## Qué estaba bien (no lo toques)

Compila, las 5.059 pruebas de Jest pasan y no hay acentos rotos. Están bien la voz en vivo (permisos antes
de la memoria de intentos), el WhatsApp del anuncio (deja el mensaje preparado y no lo manda) y el webhook
de Meta. **La orden 206 está hecha**: la marcaba a medias un renglón de comprobación que faltaba en la
orden, y ya lo agregué.

## Por qué vuelve

La verificación final frena por tres cosas, y la entrega no trae la orden 207.

## Bloque 1 — `paso-4-resumen.tsx` no se toca

`src/components/presupuestos/paso-4-resumen.tsx` no lo usa ninguna pantalla, y por eso el control frena
con "nadie lo llama". Dejá ese archivo **exactamente** como está en `claude/app-debug-stabilize-m70e6z`
(`git checkout origin/claude/app-debug-stabilize-m70e6z -- src/components/presupuestos/paso-4-resumen.tsx`).

## Bloque 2 — La realidad aumentada todavía no muestra ningún video

`src/app/evento/ar/[fiestaId]/page.tsx` tiene un `videoRef`, pero **no hay ningún `<video>` en la
pantalla**: cuando la cámara encuentra la invitación no aparece nada. Además nadie guarda el archivo `.mind`
ni el video, así que `mindTargetUrl` siempre sale vacío. Es el bloque 4 de la orden 189, que sigue a medias.

1. **Dónde se guarda.** En `src/types/fiesta.ts`, dentro de `InvitacionDigitalData` (~línea 611), agregá:
   ```ts
   realidadAumentada?: { imagenUrl?: string; videoUrl?: string; mindTargetUrl?: string };
   ```
   Es el **único** lugar. En `src/lib/social-fiesta/public-event.ts` (~103-115), leé primero
   `fiesta.invitacionDigital?.realidadAumentada` y sacá los `as any` de `arConfig` e `invitacionConfig`,
   que no los escribe nadie. Exponé `mindTargetUrl` y `arVideoUrl`, y que `tieneRealidadAumentada` sea
   verdadero **sólo** si están los dos.
2. **El panel.** En `src/components/invitacion/edit/SeccionCabecera.tsx` agregá una sección
   "Realidad aumentada" con dos `UploadButton`, como los que ya están en las líneas ~48 y ~57.
   - Uno para la imagen impresa. Si no suben ninguna, se usa `cabecera.imagenFondoUrl`.
   - Otro para el video.
   - Al guardar, se compila el `.mind` en el navegador con el compilador de MindAR
     (`mind-ar/dist/mindar-image.prod.js`, clase `Compiler`). Después se sube con el mismo mecanismo
     del `UploadButton` y se escribe `mindTargetUrl`.
   - Si la compilación falla, que lo diga en pantalla. Nada de pasos a mano.
3. **La pantalla del invitado.**
   - Un `<video ref={videoRef} src={fiesta.arVideoUrl} playsInline muted loop>` montado sobre el anclaje
     de MindAR, como textura con `THREE.VideoTexture` sobre un plano en `anchor.group`.
   - Se reproduce **sólo** en `onTargetFound` y se pausa en `onTargetLost`. Dejá un solo par de eventos:
     hoy están los del anclaje **y** los de `mindarThree.on`, y se disparan dos veces.
   - Si el `import('mind-ar/...')` falla, hoy no pasa nada. Tiene que mostrar el cartel de error, con
     `setCameraError`.

## Bloque 3 — Una prueba que mire el resultado

`tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts` **se borra**. Entra a `fiesta-demo-ar`, que no
existe, y sólo mira que un cartel no esté. Va en su lugar una prueba de Jest,
`src/__tests__/la-realidad-aumentada-muestra-el-video.test.tsx`. Simula `mind-ar` con un `MindARThree` de
mentira que guarda el anclaje y deja disparar `onTargetFound` a mano. Tiene que comprobar:

- Que antes de `onTargetFound` el video **no** se reprodujo (`play` no se llamó).
- Que después de `onTargetFound` sí, **una sola vez**, con el `src` del video de la fiesta.
- Que con `onTargetLost` se pausa.
- Que si el `import` de `mind-ar` falla, aparece el cartel de error.
- Que `toPublicSocialEvent` da `tieneRealidadAumentada: false` con sólo uno de los dos archivos, y `true`
  con los dos.

**Tiene que dar rojo con el código de hoy**, que no tiene `<video>`.

## Bloque 4 — La orden 207 entera

Está en `docs/ordenes/207-gemini-barrido-completo-de-las-26-preguntas.md`. `npm run ordenes?` la da 2 de
9. **No toques el bloque 7**: es una consulta al dueño y ya contestó, así que lo hizo Claude.

## Bloque 5 — La realidad aumentada sin el paquete `mind-ar` (Codex 184)

El paquete `mind-ar` trae `canvas`, que trae una versión de `tar` con un agujero conocido. Esa cadena
es sólo para usar MindAR desde el servidor, y acá no se usa. **Decisión de Claude:**

- Sacá `mind-ar` de `package.json` y regenerá `package-lock.json` con `npm install` (no a mano).
- Copiá de `mind-ar@1.2.5` (licencia MIT) estos cuatro archivos a `src/lib/vendor/mind-ar/`, sin
  cambiarlos: `dist/mindar-image-three.prod.js`, `dist/mindar-image.prod.js`,
  `dist/controller-mGt1s8dJ.js` y `dist/ui-fBadYuor.js`. Agregá también el `LICENSE`.
  - Importan `three` y `three/addons/renderers/CSS3DRenderer.js`, que la app ya tiene (`three` 0.169).
  - No traen `canvas`.
- La pantalla carga `import('@/lib/vendor/mind-ar/mindar-image-three.prod.js')` (`MindARThree`).
- El compilador del panel usa `Compiler` de `mindar-image.prod.js`.
- No toques `next.config.js`: todo se sirve desde la propia app.
- Prueba: `npm ls canvas` no lista nada, y la prueba del bloque 3 sigue verde.

## Bloque 6 — El mismo pedido de voz en dos servidores crea dos tareas (Codex 180)

En `src/app/api/asistente/voz-en-vivo/accion/route.ts`, el `Map` y la espera en memoria sólo cuidan
un servidor. Con dos, el reintento crea la tarea de nuevo.

- Guardá cada intento en `asistente-intentos-voz.json` con `mutateGenericJsonArray`
  (`src/lib/generic-json-store.ts`), que es una transacción. No es una colección, así que **no**
  uses `mutateDataItem`.
  - La clave es `${usuario.userId || usuario.email}:${accion}:${id}`.
  - Adentro de la transacción: si la clave ya existe en `en-curso` o `hecho`, no se agrega y se
    devuelve lo que está guardado. Si no existe, se agrega en `en-curso` y recién ahí se ejecuta.
  - Al terminar, otra transacción la pasa a `hecho`, con el resultado.
- Esperando confirmación: el pedido con `confirmado: true` pasa la clave de `esperando` a `en-curso`
  una sola vez, dentro de la transacción.
- Sin `id` no se deduplica: dos tareas pedidas a propósito son dos tareas.
- **Nunca** deduplicar por nombre, teléfono o fecha.
- Prueba en `src/__tests__/voz-un-intento-en-dos-servidores.test.ts`.
  - Dos copias del módulo, con `jest.isolateModules`, que comparten un almacén de mentira.
  - El almacén devuelve **una copia** en cada lectura y aplica `cambiar` dentro de una transacción
    simulada que relee y reintenta si cambió.
  - Mismo actor, id y carga en las dos copias → **una** tarea creada.
  - Tiene que dar rojo con el código de hoy.

## Bloque 7 — Dos mensajes de Meta a la vez en dos servidores pierden uno (Codex 180)

En `src/app/api/meta/webhook/route.ts`, ~líneas 116-129, el `AsyncMutex` cuida un solo servidor:
`readData` + `writeData` de `social-mensajes-directos.json` pisa al otro.

- Cambialo por `mutateGenericJsonArray('social-mensajes-directos.json', lista => …)`, que agrega los
  `mid` nuevos sobre la lista **actual** y devuelve `null` si no hay nada nuevo.
- Sacá el `AsyncMutex`.
- Conservá tal cual la firma `X-Hub-Signature-256`, el `mid` y el canal Instagram/Messenger.
- Prueba en `src/__tests__/meta-dos-mensajes-en-dos-servidores.test.ts`.
  - Mismo almacén con copias que en el bloque 6.
  - Dos `mid` distintos, en dos copias del módulo → los dos quedan guardados.

## Bloque 8 — El portal del proveedor queda cargando si se corta la señal (Codex 183, orden 209)

En `src/app/proveedor/acceso/[token]/page.tsx`, `loadAccess`: si `getProveedorByToken` **falla**
(rechaza) en vez de devolver `{success:false}`, la pantalla queda en blanco con la ruedita.

- Envolvé la llamada en `try/catch/finally`. En `finally` va `setLoading(false)`.
- En el `catch`, que diga *"No pudimos abrir tu acceso. Revisá la conexión y tocá Reintentar"*, con
  un botón que vuelva a llamar a `loadAccess`.
- Que no muestre "Acceso no disponible": eso es para el enlace vencido o revocado, y que no lo trate
  como vacío.
- Prueba en `src/__tests__/portal-proveedor-error-inicial.test.tsx`.
  - Monta la página con `getProveedorByToken` que rechaza: aparece el texto, desaparece la ruedita y
    Reintentar vuelve a llamar.
  - Con `{success:false}` sigue saliendo "Acceso no disponible".

## Qué NO tocar

Las reglas de personal (`src/lib/fiesta/personal-por-invitados.ts`), cobros, presupuestos, permisos ni el
ajuste anual.

```comprobar
usa: realidadAumentada en src/components/invitacion/edit/SeccionCabecera.tsx
usa: arVideoUrl en src/app/evento/ar/[fiestaId]/page.tsx
usa: realidadAumentada en src/lib/social-fiesta/public-event.ts
prueba: src/__tests__/la-realidad-aumentada-muestra-el-video.test.tsx
no-usa: "mind-ar" en package.json
archivo: src/lib/vendor/mind-ar/mindar-image-three.prod.js
usa: asistente-intentos-voz.json en src/app/api/asistente/voz-en-vivo/accion/route.ts
prueba: src/__tests__/voz-un-intento-en-dos-servidores.test.ts
usa: mutateGenericJsonArray en src/app/api/meta/webhook/route.ts
prueba: src/__tests__/meta-dos-mensajes-en-dos-servidores.test.ts
prueba: src/__tests__/portal-proveedor-error-inicial.test.tsx
```
