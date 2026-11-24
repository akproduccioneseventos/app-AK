# Orden 340 — Una sola lista de modelos de Gemini, y la tarea diaria de Jules

**Para Gemini. Va en la misma propuesta que la 339 (el auditor robot), al final.** Rama `gemini/orden-339`. Antes de decir
"terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

## Por qué
El dueño pidió (23/11/2026) aprovechar lo gratis del ecosistema Google y alinear la IA que ya tiene la app. Claude midió que
la app nombra modelos en lugares sueltos, algunos viejos, y que uno llama a un modelo fijo **sin respaldo**: si Google lo
retira, esa función se apaga sin avisar.

## Bloque 1 — Un solo lugar con los modelos, siempre con respaldo
1. `src/lib/asistente/whatsapp-media.ts` ~93 llama directo a
   `.../models/gemini-2.5-flash:generateContent`. Pasarlo por la misma función con respaldos de modelo que ya usan
   `src/lib/social-media/clasificador-comentarios.ts` ~201 y `comments-backfill.ts` ~223 (buscá cuál es y usala).
2. Los modelos por omisión viven hoy en `src/ai/genkit.ts` ~17-25 (`DEFAULT_GEMINI_PRO_MODEL`, la lista de respaldo),
   `src/lib/asistente/voz-en-vivo.ts` ~136 y `src/lib/asistente/voz-gemini.ts` ~31. Que salgan de **un solo archivo**,
   `src/ai/modelos.ts`, con una lista por tarea (texto, imagen, voz, en vivo), del más nuevo al más viejo.
3. Sumar `gemini-4-hydrogen` **primero** en la lista de texto: según los precios publicados es el único Gemini 4 con capa
   gratis. **No** sumar Carbon, Argon ni Neon: son pagos. Nada nuevo que se pague por mes.
4. Si un modelo contesta "no existe / retirado", se pasa al siguiente y queda anotado en el registro de IA (sin cortar
   la función).

## Bloque 2 — La tarea diaria para Jules (sólo el texto; la activa el dueño)
Escribir `docs/jules/tarea-diaria.md`: el texto exacto de una tarea programada diaria para Jules (Google), con el plan
gratis (15 tareas por día). Qué tiene que hacer:
- Correr `npm run robot:todo` (orden 339) y tomar **un** rojo por vez, el de arriba de la lista.
- Arreglarlo en una rama `jules/robot-<fecha>` y abrir **una** propuesta. **Nunca** fusionar.
- No tocar plata, cobros, comida, permisos ni textos que ve el cliente: si el rojo es de eso, abrir la propuesta sólo con
  la explicación, sin código.
- Leer `CLAUDE.md`, `docs/ANTES-DE-ENTREGAR.md` y `docs/YA-RESUELTO.md` antes de tocar nada.

## Lo que NO hay que hacer
- No cambiar qué hace cada función de IA ni sus textos: sólo de dónde salen los modelos.
- No activar nada pago ni la búsqueda en Google desde la IA (en la capa gratis no está para Gemini 3 en adelante).

```comprobar
archivo: src/ai/modelos.ts
usa: gemini-4-hydrogen en src/ai/modelos.ts
no-usa: models/gemini-2.5-flash:generateContent en src/lib/asistente/whatsapp-media.ts
usa: ./modelos en src/ai/genkit.ts
archivo: docs/jules/tarea-diaria.md
prueba: src/__tests__/los-modelos-de-ia-tienen-respaldo.test.ts
```
