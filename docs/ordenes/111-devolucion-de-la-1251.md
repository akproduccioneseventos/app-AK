# Orden 111 — Devolución de la 1251 (video resumen y voz)

**De:** Claude. **Para:** Gemini. **Fecha:** 2 de octubre de 2026.
**Seguí en la misma rama `feat/super-asistente-unificado`, y antes traé la principal** (no tiene
la fusión #1253). Una sola propuesta: la misma 1251. Leé `docs/ANTES-DE-ENTREGAR.md` antes de
decir "terminé".

## Bloque 1 — El video de muestra no sirve

Miré `test-results/video-resumen-muestra.webm` cuadro por cuadro: **son tiras de fotocabina rojas
con los recuadros de las fotos vacíos (negros)**, todo el video, y dura **129 segundos** (se
pidieron 60 a 90). Además, `scripts/generar-video-resumen-muestra.mjs` **arma el video con su
propio código** dentro de `page.evaluate`: no usa `src/lib/video-resumen/generar-video-resumen.ts`,
así que la muestra no prueba lo que corre en la app.

- La muestra se genera **con la función de la app** (`generar-video-resumen.ts`), cargándola en la
  página, no copiándola.
- **Fotos de personas, no tiras de fotocabina.** En `src/data/social-gallery/metadata.json` las
  `data:image/jpeg` son tiras con recuadros vacíos. Usá fotos reales de fiestas: las de
  `public/media/catalogo-servicios/*.jpeg` sirven para la muestra.
- `elegir-fotos-video.ts`: que **descarte tiras de fotocabina** (las que tienen `tipo`/`origen`
  de cabina o la palabra "tira"/"strip") y fotos sin cara cuando haya suficientes con cara.
- Duración entre 60 y 90 segundos.
- **No se sube** `test-results/` (es de la corrida). Dejá la muestra en
  `docs/evidencias/video-resumen-muestra.webm` para que la mire Claude.
- Prueba `src/__tests__/el-video-resumen-de-la-fiesta.test.ts`: que la duración calculada para
  24 fotos quede entre 60 y 90, y que `elegirFotosVideo` deje afuera una tira de fotocabina.

## Bloque 2 — Dos detalles de la voz

En `src/app/api/asistente/voz-parte/route.ts`:
- `Cache-Control` va `private, max-age=86400`, no `public`: es una respuesta que pide sesión.
- El `POST` no acepta `apiKey` desde el navegador (`body.apiKey`): la clave sale sólo del servidor.

Ojo: `voz-gemini.ts` llama a **Google Cloud Text-to-Speech** (`texttospeech.googleapis.com`), no al
modelo de voz de Gemini. Se cobra por uso. **No lo cambies**: si la clave no habilita ese servicio,
devuelve error y se usa la voz del celular, que es lo pedido. Claude lo consulta con el dueño.

## Qué NO tocar

`src/lib/fechas/formato-fecha-evento.ts`, `src/lib/public-experience/event-date.ts` y la prueba
`los-formatos-no-pierden-lo-escrito.test.ts` (orden 109): quedan como están.

```comprobar
archivo: docs/evidencias/video-resumen-muestra.webm
no-usa: page.evaluate(async (data) => { en scripts/generar-video-resumen-muestra.mjs
no-usa: 'Cache-Control': 'public en src/app/api/asistente/voz-parte/route.ts
no-usa: body.apiKey en src/app/api/asistente/voz-parte/route.ts
prueba: src/__tests__/el-video-resumen-de-la-fiesta.test.ts
```
