# 160 - Costos: unidad de receta y confirmacion perdida

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.
Pedir su HEAD exacto y contrastar antes de programar, sin duplicar arreglos.

## Version, alcance y reparto

Codex113, 12/10/2026. HEAD probado
`0122997c0a7780e786fb1c818e912a5137b443fa`, PR1288 ABIERTA, rama
`codex/auditoria-97-ia-contexto-20261011`. Fuente compilada
`8fa5b56a2833938541a657dcd15ef88130d24b0e`: app sin cambios posteriores.
Main `99faf4eb061fa46341cfdde6f81b93b3bfb9c73c` coincide en insumos,
menus-catering y consumidor. Reproducido en entrega aislada, NO en Hosting.
Claude corrige comida/dinero/datos y compila; Codex revisa y documenta.
No cambiar ni reescribir catalogos/recetas reales automaticamente.

## P1: ajustar costo convierte 250 gramos en 250 kilos

Pantalla real `/empresa/insumos`, `InventarioInsumosContent/handleAdjustCosts`.
Fixture valido del modelo FullMenu/Ingredient: insumo por kg a100, recetas
de0.25kg y250g. Ambas representan la misma cantidad, costo25 por persona.
Son fixtures privados, NO afirmacion de que un menu real tenga esos valores.

Desde el navegador aplicar+10%: insumo110; receta0.25kg queda27.50, correcto.
La receta250g queda con `quantityPerPerson:"250"`, `unit:"kg"` y costo27500.
`conElInsumoNuevo` en `src/app/actions/menus-catering.ts`, lineas337-353,
copia la unidad de COMPRA del insumo sobre la unidad de cantidad de la receta,
sin convertir su cantidad. La recalculacion posterior multiplica250kg por110.
`aplicarInsumoEnMenus` consume esa funcion. No es solo un formato de pantalla:
SDK guarda27500 y el editor real del menu muestra COSTO P/P27500 frente27.5.
Se reprodujo en PC/celular; segunda etapa llega33500 en lugar33.5.

Corregir actualizacion conservando la magnitud fisica de la receta. El costo
unitario puede actualizarse sin reemplazar la unidad de receta. Si se decide
normalizar a la unidad de compra, convertir tambien la cantidad exactamente,
sin inventar conversion para unidades incompatibles. Mantener decision ya
registrada: avisar cuando no se sabe convertir, no multiplicar como si coincidieran.
No cambiar cantidades por persona ni precio de venta explicito por este arreglo.

Aceptacion: recetas equivalentes250g/0.25kg siguen equivalentes antes/despues
del ajuste y al guardar/reabrir; lo mismo con ml/l. No propagar a menus que
no usan el insumo. Conservar costos coherentes en el editor y compras relacionadas.
Probar tambien un cambio de unidad de compra con recipe historica existente.

## P1: repetir despues de perder la confirmacion aplica el porcentaje dos veces

`adjustAllInsumoCostsInterno`, lineas233-298 de `src/app/actions/insumos.ts`,
reusa porcentaje cuando quedaron MENUS pendientes, pero no identifica la
operacion ya completada cuya respuesta se perdio. `handleAdjustCosts`, lineas
119-134 del consumidor, envia solo porcentaje; un reintento se toma como ajuste nuevo.

Reproduccion con peticion real Next-Action desde Aplicar ajuste del+5%:

- PC: costo110; servidor terminaHTTP200, guarda116 (redondeo vigente) y luego
  se corta SOLO la respuesta. Pantalla Error al ajustar costos. Reintentar+5%
  termina en122, deberia conservar116 para la misma operacion.
- Celular:134 ->141 guardado, respuesta perdida; reintento termina148.

`route.fetch` deja guardar la accion real, lee el cuerpoHTTP200 antes del corte;
SDK verifica estado antes del reintento. No fue un fallo previo al envio ni
un segundo aumento solicitado deliberadamente. Ver IDs/costos/resultados113.

Corregir con identidad estable por ajuste, conservada entre envio y reintento,
y comprobacion atomica en servidor de operacion ya aplicada. Mantener el
mecanismo de menus pendientes: no volver a aplicar inventario al reconciliarlos.
Dos ajustes NUEVOS deliberados del mismo porcentaje deben seguir permitidos;
no deduplicar globalmente por porcentaje ni limitar negocios legitimos.
Cubrir dos operadores, doble toque y fallo entre inventario/menus/confirmacion.

## Evidencia y limites

`docs/evidencias/113-resultado.json`:14criterios,10PASS/4FAIL; dos familiasP1.
Cancelacion y transporte antes de envio no escriben; receta kg y stock correctos;
menu ajeno y precio de venta50 conservados. Consumos reales reabiertos PC/celular.
Correccion66 de menus pendientes EXISTE y no se reabre como ausente. Este borde
es HTTP200 COMPLETO perdido. Las pruebas unitarias antiguas no lo cubren por UI.
No certificar menus originales, presupuestos reales ni Hosting. No fusionar.
Actualizacion114: Codex implementa por autorizacion nueva; fuente e5f22b53.
14criterios nativos PC/Pixel7 PASS y tests de recibo/unidades: g/kg conservados,
costos correctos, respuesta perdida y cerrar/reabrir pestaña sin repetir porcentaje.
Recibo+ajuste atomicos y menus cercados ante reintento lento.114-aceptacion.json.
113 conserva fallo historico. Respaldo/restauracion de recibos queda pendiente
porque no figura en registro/mapa; no marcar toda costos limpia ni certificar app.

```comprobar
archivo: src/app/actions/menus-catering.ts
usa: conElInsumoNuevo en src/app/actions/menus-catering.ts
prueba: docs/evidencias/114-costos-probe.mjs

archivo: src/app/actions/insumos.ts
usa: adjustAllInsumoCosts en src/app/(app)/empresa/insumos/page.tsx
prueba: docs/evidencias/114-costos-probe.mjs
prueba: src/__tests__/ajuste-costos-recibo-atomico.test.ts
prueba: src/__tests__/insumo-receta-conserva-unidad.test.ts
```
