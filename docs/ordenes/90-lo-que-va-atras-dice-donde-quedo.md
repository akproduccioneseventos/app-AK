# Orden 90 — Lo que se hace "atrás" dice dónde quedó de verdad

**Para Gemini. UNA SOLA PROPUESTA con los dos bloques.** Arrancá de la versión principal
actualizada. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md` (sobre todo la pregunta 16)
y corré tus pruebas. Si un bloque se traba, entregá el otro en la misma propuesta y decí cuál faltó.

**De dónde sale:** Codex encontró en la cabina con IA (devolución 89) que un trabajo en segundo
plano anunciaba "en la galería" aunque la foto no se subiera, y leía el invitado de la pantalla
cuando ya era el siguiente. Se arregló ahí con `terminarTrabajoIA` y `avisoDelDestino`
(`src/lib/touchpix/terminar-trabajo-ia.ts`). Es la pregunta 27 de `docs/COMO-AUDITAR.md`. Esta
orden barre las demás estaciones con esa pregunta.

**Modelo a copiar:** `src/lib/touchpix/terminar-trabajo-ia.ts` y cómo lo usa
`src/app/evento/touchpix/[fiestaId]/page.tsx` (`procesarTrabajoIA`). No lo cambies: se reusa.

## Bloque 1 — Barrido: el cartel final sale del resultado real

**Dónde mirar:** las estaciones que suben fotos o videos y tienen cola del equipo
(`saveOfflineMedia`):
- `src/app/evento/fotocabina/[fiestaId]/page.tsx` (~líneas 905 y 996);
- `src/app/evento/plataforma-360/[fiestaId]/page.tsx` (~609 y 674);
- `src/app/evento/bogue/[fiestaId]/page.tsx` (~794);
- `src/app/evento/espejo-magico/[fiestaId]/page.tsx` (~925);
- `src/app/evento/buzon/[fiestaId]/page.tsx` (~1080);
- `src/app/evento/video-vida/[fiestaId]/page.tsx` (~63 y ~100).

**Qué cuenta como hallazgo**, en cada camino de subida (bien, sin señal, rechazo del servidor, sin
lugar en el equipo):
1. Un cartel o `toast` que dice "subida", "en la galería" o "lista" **sin haber mirado** que
   `success` fue `true`.
2. Un cartel de "guardada en el equipo" que sale aunque `saveOfflineMedia` haya fallado. La
   fotocabina (~905) ya lo hace bien: copiá esa forma.
3. Un rechazo por regla (lo que `classifyOfflineUploadError` en
   `src/lib/offline/offline-upload-policy.ts` da como `permanent`) que igual se manda a la cola
   del equipo para reintentar para siempre.
4. Un trabajo que termina después de un `await` largo (grabación, render, IA) y lee `guestId`, el
   consentimiento o el nombre **del estado de la pantalla** en vez de una copia tomada al empezar.

**Qué NO cuenta:** los carteles de "subiendo…" mientras se espera, ni los que ya dependen del
resultado. **No cambies los textos que andan bien**; sólo los que mienten.

**Cómo se arregla:** con `terminarTrabajoIA` si el camino es subir, y si falla guardar en el
equipo; si no encaja, con la misma idea: el cartel se elige **después**, según dónde quedó.

## Bloque 2 — La prueba que lo mira

`tests/e2e/90-lo-que-va-atras-dice-donde-quedo.spec.ts`: en la **fotocabina** y el **360**, con
la subida cortada (`route.abort('internetdisconnected')` sobre el POST de subida), la pantalla dice
que quedó en el equipo y **nunca** "subida" ni "galería". Con la subida rechazada (responder
`{success:false,error:'Contenido inapropiado'}`), no dice "se sube sola".
**Rompela a propósito:** si el cartel se muestra sin mirar el resultado, se tiene que poner en rojo.

## Qué NO tocar

- Nada de `src/app/actions/**` ni la cola (`src/lib/offline/offline-sync-manager.ts`,
  `offline-db.ts`).
- La barra y lo que descuente botellas: es plata, de Claude. Si ves algo ahí, **listalo en la
  propuesta y no lo arregles**.
- La cabina con IA (`touchpix`): ya está hecha.

```comprobar
# Bloque 1
usa: saveOfflineMedia en src/app/evento/fotocabina/[fiestaId]/page.tsx
# Bloque 2
prueba: tests/e2e/90-lo-que-va-atras-dice-donde-quedo.spec.ts
```
