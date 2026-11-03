# Orden 266 — Devolución de la entrega 262-265: la Plataforma 360 (03/11/2026)

**Para Gemini.** Seguí sobre `gemini/orden-262-anuncio-al-simulador`, **después de `git pull`**: Claude subió arreglos.
**Una sola entrega, no fusiones.**

**Lo que ya está bien y no se toca:**

- el bot del anuncio;
- "¿Quién sos?" (Claude la dejó entre las direcciones públicas);
- el control de la pantalla gigante desde el celular, con el anuncio que llega a la pantalla;
- los dos operadores que no se pisan;
- el marco animado, el boomerang de la fotocabina y Vogue.

Tipos en cero y Jest en verde.

**Lo que falla está todo en la Plataforma 360.** Lo midió la corrida de Claude, dos veces.

## Bloque 1 — el video sale más largo de lo prometido

`tests/e2e/la-360-edita-sola.spec.ts`: una grabación de 10 s da un video final de **26,4 s**, y la orden pedía **entre 12 y
20 s**.

- Revisá `armarLineaDeTiempo360` (`src/lib/entretenimiento/edicion-360.ts`): que la cuenta de tramos dé entre 12 y 20 s
  para 10 a 15 s grabados.
- Revisá también que el armado del video en `plataforma-360/[fiestaId]/page.tsx` dibuje **a los cuadros por segundo de
  salida**. Si cada cuadro espera de más con `setTimeout`, el video se estira.
- La prueba de Jest (d) tiene que medir lo mismo que el navegador: si Jest da 20 y el navegador 26, la cuenta del
  navegador no es la de la función.

## Bloque 2 — se rompieron dos avisos que ya andaban

Estas pruebas andaban antes de la entrega y **no se tocan**. Se arregla la pantalla:

- `tests/e2e/90-lo-que-va-atras-dice-donde-quedo.spec.ts`, "Plataforma 360 con corte de red": tiene que aparecer "video
  guardado en este equipo" (o "quedó guardado"), y **nunca** "subido" ni "en la galería".
- La misma prueba, "con subida rechazada": tiene que aparecer el error, "contenido inapropiado" o "no se pudo publicar", y
  **no** "se sube sola".

Probablemente el armado nuevo tarda tanto que el aviso llega después de los 45 segundos, o el camino nuevo saltea
`handleVideoUpload` y sus avisos (`setAvisoDelMuro`, `setUploadError`). Fijate cuál es y arreglalo. Después de grabar, el
aviso tiene que aparecer en **menos de 40 segundos**.

## Al terminar

Corré `npx tsc --noEmit` y `npx jest --silent`, con cero errores. No subas `data/` ni `src/data/`.

```comprobar
prueba: tests/e2e/la-360-edita-sola.spec.ts
prueba: tests/e2e/90-lo-que-va-atras-dice-donde-quedo.spec.ts
```
