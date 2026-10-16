# PARA GEMINI - Orden 178: los documentos impresos conservan su cabecera (hoja de cocina, contratos, recibos y 18 más)

**Una sola propuesta.** Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md`. Arrancá de la
versión principal de hoy. (Codex la había dirigido a Claude; por la regla del dueño del 15/10/2026
programa Gemini.)

## Camino exacto (lo verificó Claude)

- `src/app/globals.css` ~418, dentro de `@media print`, oculta **todo** `header` (y `nav`, `aside`,
  `button`, `[role="banner"]`) con `display: none !important`, para sacar la navegación de la app al
  imprimir. **No toques esa regla**: la usan todos los documentos.
- `src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx`, componente `HojaDeCocinaContenido`
  (~25): la cabecera del documento (título "Hoja de cocina", nombre del evento, fecha y resumen de
  invitados) está en un `<header className="mb-6 border-b-2 border-slate-900 pb-4">` (~118 a ~128). Por
  eso desaparece al imprimir.
- **No es sólo la hoja de cocina (lo confirmó Claude el 16/10/2026, a partir de la auditoría de Gemini):**
  21 documentos imprimibles ponen su cabecera (logo, título, cliente, fecha) en un `<header>`, y salen
  impresos sin ella. Entre ellos, **los contratos y los recibos de sueldo**. La lista:
  `customers/reporte`, `empresa/activos-fijos/reporte`, `empresa/insumos/reporte`, `empresa/menus/reporte`,
  `empresa/servicios/reporte`, `fiestas/nueva/carga-operativa/pdf`, `fiestas/nueva/catering/hoja-de-cocina`,
  `fiestas/nueva/decoracion/pdf`, `fiestas/nueva/gestion-costos-rentabilidad/reporte`,
  `fiestas/nueva/gestion-documental/{cambio-fecha,cancelacion-parcial,contrato-salon,contrato-servicio}`,
  `fiestas/nueva/itinerario/pdf`, `fiestas/nueva/musica/pdf`, `fiestas/nueva/personal/recibos`,
  `fiestas/nueva/resumen-imprimible`, `presupuestos/reporte`, `proveedores/reporte` (todos bajo
  `src/app/(app)/`), más `src/app/evento/impresion/[fiestaId]/page.tsx` y
  `src/app/portal/[fiestaId]/contrato/page.tsx`.
- **El arreglo, uno para todos:**
  1. En `src/app/globals.css` ~418, cambiá `header,` por `header:not(.cabecera-documento),` (lo demás de
     esa línea queda igual).
  2. En cada uno de los 21 archivos, al `<header>` **que es la cabecera del documento** (el que tiene
     logo, título o datos del cliente) agregale la clase `cabecera-documento`. Si en un archivo hay otro
     `<header>` que es una barra de botones o navegación, ése **no** lleva la clase.
  3. La barra de la app (`app-shell`, `main-nav`) no se toca: sigue sin salir al imprimir.
- **No toques** los cálculos (`armarHojaDeCocina`), los textos legales, los importes ni los botones de imprimir.

## Prueba

`src/__tests__/la-hoja-de-cocina-se-imprime-con-cabecera.test.tsx`: recorre los 21 archivos y comprueba que cada uno tiene un `<header` con `cabecera-documento`, y que en
`globals.css` la regla de impresión dice `header:not(.cabecera-documento)`. Además, una prueba de
navegador que emule impresión (`page.emulateMedia({ media: 'print' })`) en la hoja de cocina y en el
contrato del portal, y compruebe que el nombre del evento se ve. Nombrá la ruta
`/fiestas/nueva/catering/hoja-de-cocina`. La prueba de Codex `docs/evidencias/135-cocina-agenda-3d.spec.ts`
corre sólo en su copia de pruebas aislada: Codex la repite después.

---

## Lo que encontró Codex (auditoría 135)


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
prueba: docs/evidencias/135-cocina-agenda-3d.spec.ts
usa: cabecera-documento en src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx
usa: cabecera-documento en src/app/(app)/fiestas/nueva/gestion-documental/contrato-servicio/page.tsx
usa: cabecera-documento en src/app/(app)/fiestas/nueva/personal/recibos/page.tsx
usa: header:not(.cabecera-documento) en src/app/globals.css
prueba: PENDIENTE src/__tests__/la-hoja-de-cocina-se-imprime-con-cabecera.test.tsx
```
