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

## Qué NO tocar

Las reglas de personal (`src/lib/fiesta/personal-por-invitados.ts`), cobros, presupuestos, permisos ni el
ajuste anual.

```comprobar
usa: realidadAumentada en src/components/invitacion/edit/SeccionCabecera.tsx
usa: arVideoUrl en src/app/evento/ar/[fiestaId]/page.tsx
usa: realidadAumentada en src/lib/social-fiesta/public-event.ts
prueba: src/__tests__/la-realidad-aumentada-muestra-el-video.test.tsx
```
