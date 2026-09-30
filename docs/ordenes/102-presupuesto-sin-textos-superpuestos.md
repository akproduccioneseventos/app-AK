# 102 - El nombre no tapa los datos del presupuesto

30/09/2026. Gemini: maquetacion. Claude: conservar importes y compilar conjunto.
Sumar a la tanda existente, sin PR ni despliegue solo por esta orden.

## Contraste

Main: 62dcb2cb4df718a81c3654028199e49628367d8c.
PR1246 HEAD: 70b016ece91b8e82e7b2054061a8c8f2af072e19.
src/lib/budget/simulator-budget-pdf.ts tiene el mismo blob en ambos: e11edb97dd939d874f95f39b2f1ee11b75616886.
Clasificacion: reproducido con generador real de main; misma fuente en tanda. No descarga por navegador observada.

## P2 - Nombre completo superpuesto con Invitados

Se genero un PDF con createSimulatorBudgetPdf real (jsPDF), 45 servicios ficticios, 120 personas y fecha2028.
clientName = Maria Fernanda Rodriguez y Juan Sebastian Fernandez.
Pagina1: texto de nombre se dibuja desde x42mm sin ancho maximo ni salto. Termina x125.1215mm.
La etiqueta INVITADOS empieza x112mm: se superponen 13.1215mm, confirmado en imagen renderizada.
Fuente: bloque de datos de cliente en lineas 228-249.
Consumidor real: downloadSimulatorBudgetPdf en src/app/simulador-de-presupuesto/page.tsx:1123 (import86).

Conservar nombre completo, pero dividir lineas/ajustar distribucion y altura del bloque. Aplicar limites tambien a paquete y evento; no recortar el nombre ni tapar campos adyacentes.
No cambiar precios, proyecciones, regalos, condiciones ni accion comercial.

## Lo que SI funciono en este caso

Tres paginas A4, numeracion1/3-3/3, 45 renglones visibles, sin corte de tabla; regalos marcados incluidos.
Precio vigente40000, por persona333 redondeado, ajuste2027=44000 y2028=48400 en bloque separado.
Terminos30dias y enlace presentes en ultima pagina.
Solo es esta fixture, no todas las combinaciones ni igualdad con la pantalla real.
Sin window en Node: no se ejercito carga del logo; no marcarlo como defecto.
Poppler emitio avisos de fuentes ajenas al documento; la fuente Helvetica se renderizo y se inspeccionaron las tres imagenes.

## Prueba reproducible

docs/evidencias/sonda-pdf-2026-09-30.cjs
node ruta/sonda-pdf-2026-09-30.cjs ruta/al/checkout
Genera budget-62dcb2c-audit.pdf al lado de la sonda, con datos ficticios.
Renderizar las paginas y revisar nombre/invitados/paquete, tabla y pie.
La prueba existente simulator-budget-pdf.render.test.ts PASO en la tanda amplia pero solo comprueba mas de1pagina, tamano A4 y >8000bytes: no prueba ausencia de solapamiento pese al nombre del test.
Extender esa prueba con nombre largo, paquete largo y comprobacion de limites; no agregar otro test que solo busque cadenas.
No hay codigo de producto corregido por Codex. Devolver evidencia visual del arreglo sobre SHA preciso.

```comprobar
archivo: src/lib/budget/simulator-budget-pdf.ts
usa: downloadSimulatorBudgetPdf en src/app/simulador-de-presupuesto/page.tsx
prueba: src/lib/budget/simulator-budget-pdf.render.test.ts (EXISTE; ampliacion visual PENDIENTE)
```
