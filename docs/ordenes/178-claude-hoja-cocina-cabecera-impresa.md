# Orden 178 - Claude: conservar la identificacion al imprimir la hoja de cocina

**Destinatario:** Claude (comida y documento operativo). Codex solo audita.
**Estado:** reproducido, NO corregido por Codex. Prioridad P2.
**Fuente ejecutada:** `7230f9d02b32805952a185f704a0208bd5d643e6`, build QA135 aislado de esa fuente.
**NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE/GEMINI:** comprobar HEAD privado antes de programar. No repetir un arreglo ya presente alli.

## Recorrido y resultado observado

Evento ficticio, presupuesto ficticio de80adultos+15ninos+5adolescentes; cuatro platos. Abrir `/fiestas/nueva/catering/hoja-de-cocina?fiestaId=...` con sesion sintetica de equipo.

En pantalla aparecen el nombre del evento y las porciones correctas: entrada100, principal80, infantil20 y postre100. Cinco personas confirmadas con restriccion Celiaco; el invitado vegano pendiente no suma platos especiales. Recargar conserva esos resultados. El boton real llama a `window.print()`.

Al pasar al medio de impresion desaparece TODO el encabezado documental: titulo Hoja de cocina, nombre del evento, fecha y resumen de invitados/confirmados. La tabla de platos y las restricciones SI quedan: no es un PDF vacio ni un fallo de las cantidades. Reproducido en escritorio y Pixel7. Los dos PDF de Chromium contienen una pagina con las cantidades y Celiaco5, pero sin el nombre `Cocina y salon QA135` ni su cabecera. Captura visual y texto extraido coinciden.

## Causa contrastada en esta fuente

`src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx`, componente `HojaDeCocinaContenido`, usa un `<header>` para identificar la hoja.

`src/app/globals.css`, bloque `@media print`, oculta todos los `header` con `display:none !important` para quitar la navegacion. Tambien oculta la cabecera de este documento operativo.

## Correccion acotada y aceptacion

- Conservar en la salida impresa nombre/fecha/resumen del evento, sin reactivar cabeceras, menus o botones de navegacion de la app.
- Preferir una excepcion documental local y compatible con las convenciones de impresion existentes; no cambiar globalmente todos los encabezados sin revisar consumidores.
- No cambiar calculos de comida, invitados, permisos, presupuesto ni reglas financieras para arreglar la presentacion.
- En escritorio y390px: pagina con datos, recarga correcta, boton imprime; PDF A4 conserva cabecera y cantidades100/80/20/100, Celiaco5, sin controles de la app ni texto cortado. Revisar tambien un documento largo si se toca CSS global de impresion.
- Mantener el test exigente. No sustituir la cabecera por una aceptacion de cualquier mensaje de error, no quitar la asercion ni marcarla omitida.

## Evidencia

`docs/evidencias/135-kitchen-results.json` (se entrega comprimido), carpeta `135-kitchen-artifacts`: PDFs reales de Chromium, `cabecera-impresion.json` y capturas. La sonda original tambien se conserva en `135-core-results.json` comprimido y `135-core-original-spec.ts.gz`; la variante posterior captura el PDF antes de fallar la misma aceptacion, no cambia el resultado esperado.

```comprobar
archivo: src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx
usa: armarHojaDeCocina en src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx
prueba: tests/e2e/135-cocina-agenda-3d.spec.ts
```
