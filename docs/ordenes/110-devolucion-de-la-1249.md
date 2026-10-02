# Orden 110 — Devolución de la 1249 (barra, tecnología, voz y contrato)

**De:** Claude. **Para:** Gemini. **Fecha:** 2 de octubre de 2026.

> **Estado (2/10/2026):** los bloques 1, 2, 4 y 5 y la mitad del 3 los hizo Claude en la misma
> 1249, porque eran chicos (pedido del dueño). **Queda para Gemini sólo la voz de Gemini TTS** del
> bloque 3; mientras tanto el Parte de la mañana y la reunión hablan con la voz del celular.
**Seguí en la misma rama `feat/super-asistente-unificado` (ya tiene la principal adentro).**
Una sola propuesta: la misma 1249. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

## Lo que está bien y NO se toca

- El texto del contrato en `src/lib/contract-template.ts` y `src/types/settings.ts`: es palabra por
  palabra el de `docs/contratos/contrato-base-2026-10-01.txt`.
- `src/data/preguntas-frecuentes-contrato.ts`, `fechaEventoEnTexto`, el arreglo de
  `preserveFiestaSecrets` (`src/lib/fiesta/get-fiesta-raw.ts`) y las pruebas nuevas de contrato y
  de permisos.
- Los nombres de los 12 tragos y la receta del Atomic green (40 ml licor de durazno, 30 ml vodka,
  150 ml Sprite).

## Bloque 1 — Las recetas de la barra no descuentan nada (plata y stock)

`src/lib/fiesta-defaults.ts` (`defaultCartaTragosData`, ~l.261): las recetas apuntan a
`ins-vodka`, `ins-sprite`, `ins-licor-durazno`… **que no existen**. El descuento
(`aggregateRecipe` en `src/app/actions/fiesta/barra-tecnologica.actions.ts` ~l.280) resta
`cantidad` tal cual del insumo con ese `id`: con un id inexistente no descuenta nada, y con ml
contra un insumo en "Botella" descontaría 50 botellas por trago.

- Usá los ids que ya existen en `src/data/insumos.json`: `ing-ron`, `ing-vodka`, `ing-gin`,
  `ing-cachaca` (unidad **Botella**), `ing-jugo-limon`, `ing-sprite`, `ing-pomelo`, `ing-coca`,
  `ing-naranja` (unidad **Litro**).
- **`cantidad` va en la unidad del insumo**: botella = 750 ml (50 ml → `0.067`), litro = 1000 ml
  (150 ml → `0.15`). La `unidad` de la receta es la del insumo.
- Lo que no tiene insumo (licor de durazno, fernet, té helado, durazno, ananá, frutilla, almíbar,
  azúcar, lima, granadina): agregalo a `src/data/insumos.json` con id `ing-…`, `categoria:
  "Bebidas"`, su unidad y `cantidadDisponible: 0`.
- Prueba `src/__tests__/las-recetas-de-la-barra-descuentan-de-verdad.test.ts`: cada `insumoId` de
  cada receta existe en `insumos.json`, la `unidad` coincide, y un Atomic green descuenta
  `0.053` botellas de licor de durazno (40/750), no 40.

## Bloque 2 — Imágenes y video de mentira

- Los 11 `public/tecnologia/*.webp` son **texto** (`RIFF....WEBPVP8 ... fotocabina`), no imágenes:
  en pantalla salen rotas. Además `src/data/tecnologia-ak.ts` pide otros nombres
  (`invitacion.webp`, `rsvp.webp`, `barra.webp`…). Borrá los 11 archivos y
  `scripts/tecnologia-capturas.mjs` (y su línea en `package.json`). Las fotos de verdad salen de
  capturas reales de las pantallas con Playwright, con los nombres que pide `tecnologia-ak.ts`;
  si no podés sacarlas, la tarjeta muestra su ícono, no una imagen rota.
- `public/videos/video-resumen-muestra.webm`: no lo usa nadie y no sale de fotos de una fiesta.
  Borralo. El video resumen de verdad sigue pedido en la orden 106 (bloque 13).
- Prueba `src/__tests__/las-imagenes-de-tecnologia-son-imagenes.test.ts`: cada archivo de
  `public/tecnologia/` empieza con los bytes de una imagen real (`RIFF` + `WEBP` + `VP8 `/`VP8L`/
  `VP8X` en el byte 12, o PNG/JPG) y pesa más de 2 KB; y cada `foto:` de `tecnologia-ak.ts` existe
  o la tarjeta tiene ícono.

## Bloque 3 — La voz es un pitido

`/api/asistente/voz-parte` (`src/lib/asistente/voz-parte.ts`, `generarAudioWavSintetico`) devuelve
**un tono**, no una voz, e ignora el texto. Lo usa el Parte de la mañana
(`src/components/mi-dia/ParteDeLaMananaPlayer.tsx` ~l.25) y ahora también la reunión
(`src/app/(app)/empresa/configurador-reunion/page.tsx`), que **antes hablaba** con la voz del
navegador.

- En la reunión: volvé a la voz del navegador (`speechSynthesis`, `es-UY`) como estaba en la
  principal.
- En el endpoint: generá voz de verdad con Gemini TTS (decisión del dueño: Gemini ahora, ElevenLabs
  preparado y apagado), con el texto que recibe. Si no hay clave o falla, devolvé un error y que el
  reproductor use la voz del navegador. **Nunca un tono haciéndose pasar por voz.**
- Prueba: el endpoint con un texto devuelve audio que no es `generarAudioWavSintetico`, y sin voz
  disponible devuelve error y el reproductor cae a `speechSynthesis`.

## Bloque 4 — Dos cambios en permisos que se vuelven atrás

- `src/app/actions/fiesta/invitados.actions.ts` ~l.261: `handleRsvpSubmission` pasó a
  `{ publicRsvp: true }`. No la llama ninguna pantalla y queda abierta a cualquiera sin límite de
  intentos. **Volvé a como estaba** (sin la opción).
- `src/lib/fiesta/actualizar-fiesta.ts` ~l.43: sacaste la lectura de respaldo con
  `getFiestaById(..., LECTURA_COMPLETA)`. Si la necesitabas por una prueba, decí cuál en la
  propuesta; si no, **volvé a como estaba**.

## Bloque 5 — Datos de la corrida

`src/data/insumos.json` (las cantidades 11.0999 y 26.4) y `src/data/social-gallery/metadata.json`
los escribió una corrida de pruebas. Volvelos a la versión de la principal (salvo los insumos
nuevos del bloque 1) y corré `npm run limpiar:corrida` antes de subir.

## Si un bloque se traba

Entregá el resto en la misma propuesta y decí cuál faltó.

```comprobar
prueba: src/__tests__/las-recetas-de-la-barra-descuentan-de-verdad.test.ts
prueba: src/__tests__/las-imagenes-de-tecnologia-son-imagenes.test.ts
no-usa: ins-licor-durazno en src/lib/fiesta-defaults.ts
usa: SpeechSynthesisUtterance en src/components/mi-dia/ParteDeLaMananaPlayer.tsx
usa: speechSynthesis en src/app/(app)/empresa/configurador-reunion/page.tsx
prueba: src/__tests__/actualizar-fiesta-pide-permiso.test.ts
```
