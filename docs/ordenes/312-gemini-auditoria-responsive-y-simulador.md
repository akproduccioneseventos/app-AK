# Orden 312 — Auditoría responsive y del simulador (auditor, 17/11/2026)

Informe del auditor externo del 17/11. Va en la **misma propuesta** que lo que falta de la 310 y la 311, rama nueva desde
`origin/main`. Leé `docs/ANTES-DE-ENTREGAR.md` y la habilidad `celular-primero` antes de tocar pantallas. Cada pantalla
tocada lleva su prueba de navegador a **320, 390 y 820 px** que mire que no haya desborde y que el texto se lea.

## Bloque 1 — Símbolos rotos en el simulador (S01) y el control que no los vio

- `src/app/simulador-de-presupuesto/page.tsx` líneas ~2453, ~2489 y ~2526: la estrella rota delante de `RECOMENDADO PRO` → sacala
  (ya hay ícono `Sparkles` al lado). Buscá en los cinco pasos cualquier otro símbolo roto.
- **Matafuego:** `npm run check:acentos` dio "bien" con esto adentro. Sumale el patrón de la estrella y
  comillas rotas) y comprobá que frena poniendo uno a propósito.

## Bloque 2 — El simulador con IA en el celular (R01)

`/simulador-ak`: a 390 px el campo de escribir queda cortado y el botón de enviar sale por la derecha; el botón flotante de
WhatsApp tapa la zona. La fila de escribir encoge (`min-w-0`, `flex-1`), el botón tiene su lugar, y el flotante sube o se
corre cuando el campo está a la vista. Probar con el teclado abierto (alto 500).

## Bloque 3 — Textos que no se leen (R02, R03)

- `/empresa/presentacion-led/configuracion`: títulos y descripciones claros sobre gris claro. Colores de texto explícitos.
- `/presentacion-led/portafolio`: título negro sobre negro y las tarjetas con 8/10/1 sin su etiqueta visible. Que se lean
  sin cambiar nada del contenido.

## Bloque 4 — Cabeceras que aplastan el título (R04, R05, R06, R07, R08)

Un componente de cabecera común que a lo angosto apila título/descripción arriba y botones abajo, y se usa en:
`/invoices` (buscador y filtro), `/alertas` (mensaje en frases, no palabra por palabra), `/settings/promos`, Gestión
Documental (botón Volver cortado), `/playbooks` (Boda Clásica: botones debajo del título), y en la fiesta
`resumen-planificacion` y el hub (importe y encabezado se cortan a 820 px con la barra lateral abierta). **No resolver
escondiendo con `overflow-hidden`.**

## Bloque 5 — El reloj del simulador no corre (S02) — REEMPLAZADO por la orden 314, bloque 5

El reloj **va y su texto no se toca** (decisión del dueño). Lo roto es que el auditor lo vio en 15:00 pasados 15 minutos.
Revisá `updateTimer` (línea ~429 de `src/app/simulador-de-presupuesto/page.tsx`): tiene que bajar segundo a segundo, llegar a
0:00 y quedarse ahí (no volver a 15:00 al recargar). Prueba con reloj falso de Playwright: a los 16 minutos dice 0:00.

## Bloque 6 — La fecha de la tarjeta de Eventos (D01)

La misma fiesta dice "15" en el cuadradito y "16 de diciembre" en el texto: la fecha `YYYY-MM-DD` se pasa por `new Date()` y
corre un día. Las dos partes de la tarjeta salen de la misma fecha local (`parseLocalDate` o equivalente ya existente).

## Barrido en toda la app

Hecho por Claude el 17/11:
- Estrella rota: 3 lugares, todos en el simulador → bloque 1. `check:acentos` no los veía.
- Cabeceras con título y botones en la misma fila sin apilar: las 7 pantallas del informe → bloque 4 (componente común).
- Fechas `YYYY-MM-DD` por `new Date()` en tarjetas: ya es la pregunta 70; nuevo caso en Eventos → bloque 6.
- El D02 (la DEMO incoherente) ya está en la orden 310 bloque 2 y la 311 bloque 8: no se repite acá.

```comprobar
usa: Sparkles en src/app/simulador-de-presupuesto/page.tsx
usa: updateTimer en src/app/simulador-de-presupuesto/page.tsx
```
