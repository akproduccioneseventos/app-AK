# PARA GEMINI - Orden 179: devolución de la entrega 176/177 + la IA gratis más nueva + hoja de cocina (178)

**Arrancá de la rama `claude/app-debug-stabilize-m70e6z`** (no de main): ahí ya están juntas tu entrega
de las órdenes 176/177, la PR 1325 y los arreglos de Claude. **Una sola propuesta contra main**, que
incluya también la orden 178. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` **y corré las
pruebas de navegador de abajo**: tu entrega anterior traía la línea base sin regenerar y 12 pruebas viejas
rotas, y la frenó la verificación.

## Bloque 1 - Lo que está roto de verdad

- **Hero: los tres campos del verificador de fecha tienen letra menor a 16 px** y el celular hace zoom
  al tocarlos. `src/components/landing/HeroSection.tsx` ~255, ~272 y el de invitados
  (`hero-verificador-tipo`, `hero-verificador-mes`, `hero-verificador-invitados`): poné `text-base`
  (16 px) en los tres `select`/`input`. Las etiquetas pueden seguir chicas. Lo marca
  `tests/e2e/anda-en-el-celular.spec.ts` (~68).
- **El control de tildes mira sólo una lista elegida a mano** (`ARCHIVOS_A_CONTROLAR` en
  `src/__tests__/la-app-escribe-con-tildes.test.ts`). La orden 176 pedía recorrer **todo** `src/app`,
  `src/components`, `src/lib` y `src/data`. Cambialo para que recorra esas carpetas (con las exclusiones
  de la orden 176) y arreglá lo que aparezca. Ejemplo que se escapó: `'Espejo magico'` en
  `src/lib/zona-digital-adolescentes.ts` ~35.

## Bloque 2 - Pruebas viejas que esperan textos que cambiaron A PROPÓSITO

Se actualiza la prueba, no la app. Una línea cada una:

- `tests/e2e/50-tecnologia-app-fiesta-demo.spec.ts` ~68: el botón "Consultar para mi fiesta" pasó a
  **"Consultar disponibilidad por WhatsApp"**; tiene que seguir apuntando a `wa.me`.
- `tests/e2e/la-portada-espera-sin-cajas-grises.spec.ts` ~27 y ~47: "Historias en movimiento" ya no existe
  (galería unificada). Que espere el título que tiene hoy `GaleriaUnificadaSection.tsx` (~61) y la pestaña
  "Videos de fiestas reales". Mantené la idea de la prueba: los títulos vienen en la primera entrega del
  servidor y no hay cajas grises.
- `tests/e2e/la-portada-no-dice-cero.spec.ts` ~14: la regla `/0\/7/` da falso aviso con clases como
  `bg-red-950/70`. Cambiala por una que mire texto visible: `/>\s*0\/7\b/`.
- `tests/e2e/la-vidriera-de-la-tecnologia.spec.ts` ~51 y ~68: "Fotocabina Digital" → **"Fotocabina Impresa"**.
- `tests/e2e/pantallas-con-iconos-react19.spec.ts` ~99: "Organizacion sin marear" → "Organización sin
  marear"; ~135: "Bogue / Boomerang" → "Vogue / Boomerang" (y "Espejo magico" → "Espejo mágico" si lo
  corregís en el bloque 1).
- `tests/e2e/public-smoke.spec.ts` ~85: el texto alternativo pasó a
  "Fiestas de 15, producción de AK Producciones".
- `tests/e2e/touchpix-camara-y-recuerdo-con-imagen.spec.ts` ~170: "La camara no esta entregando imagen" →
  "La cámara no está entregando imagen".
- **`tests/e2e/layout-baseline.spec.ts`**: la portada cambió a propósito; regenerá su línea base como
  indica ese archivo (la orden 177 ya lo pedía y no se hizo).

## Bloque 3 - La IA gratis más nueva (decisión del dueño, 16/10/2026: "al más avanzado pero el que no se paga")

Hoy todo usa `gemini-3.6-flash`, gratis. El más nuevo gratis es **`gemini-3.8-flash`**. Los "Pro" y
Gemini 4 "Argon" son pagos: **no se usan**.

- `apphosting.yaml` ~86-107: las cinco variables `GEMINI_MODEL`, `GEMINI_MODEL_FAST`, `GEMINI_MODEL_PRO`,
  `GEMINI_MODEL_MARKETING`, `GEMINI_MODEL_COMMERCIAL` pasan a `"googleai/gemini-3.8-flash"`. No toques
  memoria, instancias ni nada más de ese archivo.
- `src/ai/genkit.ts`:
  - ~18 `DEFAULT_GEMINI_PRO_MODEL` → `'googleai/gemini-flash-latest'`, y ~20
    `DEFAULT_GEMINI_PRO_FALLBACK_MODEL` → `'googleai/gemini-3.6-flash'`. Que ningún valor por defecto
    sea un modelo pago.
  - ~22-27 `DEFAULT_GEMINI_FALLBACK_MODELS`: sacá `'googleai/gemini-2.0-flash'` (Google lo apagó) y dejá
    `gemini-flash-latest`, `gemini-3.8-flash`, `gemini-3.6-flash` y `gemini-2.5-flash`, en ese orden.
    Así, si el 3.8 no contesta, la app vuelve sola al 3.6.
- `src/app/actions/settings.ts` ~644 `GEMINI_CONNECTION_MODELS`: agregá `'gemini-3.8-flash'` primero.
- Actualizá `src/ai/genkit.test.ts` a los nuevos valores, y agregá una comprobación: **ningún modelo por
  defecto ni de respaldo contiene "pro" ni "argon"**.
- No toques el tope de gasto (`hayPresupuestoParaIA`) ni los modelos de voz y de imagen.

## Bloque 4 - Orden 178 (hoja de cocina impresa)

Hacé la orden 178 tal como está escrita, en esta misma propuesta.

## Qué NO tocar

Las cifras (+200, +7, "Clientes satisfechos"), la palabra "congelar", los textos de las reseñas, el
Encargado (`src/lib/multiagent/encargado.ts`: Claude volvió atrás el cambio de permisos a propósito), y la
ruta `/evento/bogue/`.

```comprobar
usa: text-base en src/components/landing/HeroSection.tsx
usa: gemini-3.8-flash en apphosting.yaml
usa: gemini-3.8-flash en src/ai/genkit.ts
no-usa: googleai/gemini-2.0-flash en src/ai/genkit.ts
no-usa: googleai/gemini-2.5-pro en src/ai/genkit.ts
usa: gemini-3.8-flash en src/app/actions/settings.ts
usa: Fotocabina Impresa en tests/e2e/la-vidriera-de-la-tecnologia.spec.ts
usa: Vogue / Boomerang en tests/e2e/pantallas-con-iconos-react19.spec.ts
no-usa: Historias en movimiento en tests/e2e/la-portada-espera-sin-cajas-grises.spec.ts
no-usa: ARCHIVOS_A_CONTROLAR en src/__tests__/la-app-escribe-con-tildes.test.ts
prueba: src/ai/genkit.test.ts
prueba: tests/e2e/anda-en-el-celular.spec.ts
prueba: tests/e2e/layout-baseline.spec.ts
```
