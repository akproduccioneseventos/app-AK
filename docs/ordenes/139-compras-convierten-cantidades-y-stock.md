# 139 - Compras: convertir los numeros, no solamente la clave

NO CONTRASTADO CON LA TANDA DE PROGRAMACION LOCAL NO SUBIDA.
Responsable: Claude (comida, insumos y dinero). Codex entrega evidencia.
Fuente ejecutada: `2aac14e290b20945bd984a0c5e2ffdbe50eb853c`.
Main contrastado: `0af74652ebdf4c813b9eb443c358d51bc24542d7`.
No habia PR abiertas al contrastar. El delta de main cambia permisos de borrar/
archivar fiestas, no estos consumidores. Antes de programar, contrastar la copia
local de Claude y no rehacer una correccion que ya exista alli.

## Fallo P1 reproducido: COM88-UNIDADES

Recorrido REAL de la pantalla de compras, presupuesto y recetas ficticios en
Firestore demo, sin modificar ingredientes ni gastos del negocio:

- Un adulto; dos platos del mismo presupuesto aceptado.
- Mismo ingrediente y proveedor: 200 g en una receta y 2 kg en la otra.
- Catalogo de insumos: unidad kg, precio 100 UYU/kg, stock cero.
- Esperado: necesidad total 2.20 kg, con coste compatible con esa cantidad y
  con la regla de compra/redondeo que ya aprobo el dueno.
- Observado: UNA fila `202.00 G`, inversion `$20`. No es una espera agotada:
  se capturo el renglon y la pantalla antes de exigir el valor esperado.

Raw: `docs/evidencias/88-e2e-compartir-compras-original.json`, caso compras.
Sonda ejecutada: `88-compras-unidad-consumidor.spec.ts`, copiada desde evidencias
a tests/e2e en TEMP validado. SDK real emulado, consumidor sin interceptar acciones.

## Por que sobrevivio a las pruebas anteriores

`claveDeConsolidado` normaliza g/kg a la misma clave, PERO `loadData` suma las
cantidades originales: 200 + 2. La prueba de septiembre verifica que el helper
convierte bien y que ambas pantallas contienen el nombre de la clave. No ejecuta
el calculo de la pantalla. Por eso puede dar verde con este resultado incorrecto.
La otra pantalla, resumen-planificacion, tiene la misma suma de numeros crudos
en fuente; su navegador NO se reprodujo aqui. Contrastar y aceptar ambos resultados.

## Correccion acotada y criterios de aceptacion

1. En lista-compras y resumen-planificacion, convertir cantidad, unidad de stock
   y unidad del coste ANTES de sumar/restar. El precio obtenido del catalogo esta
   expresado en la unidad del catalogo, no necesariamente la de la receta.
2. Reutilizar los helpers existentes en `src/lib/compras/unidades.ts`. No basta
   importar sus nombres. No mezclar unidades desconocidas ni asumir una conversion
   entre peso y volumen sin datos. Mantener pedidos fijos separados de recetas.
3. Respetar la regla de compra/redondeo aprobada: no introducir otra forma de
   comprar o pagar, ni recalcular automaticamente presupuestos historicos.
4. Probar resultado de AMBAS pantallas: g/kg y kg/g con orden inverso; ml/l;
   stock en unidad distinta; coste con unidad de origen; adultos y menores;
   unidades desconocidas separadas. Cantidad/necesidad, faltante, coste y texto
   enviado/copiado al proveedor deben coincidir, sin enviar mensajes reales.
5. Agregar regresion de consumidor con el caso entregado: debe fallar con el
   codigo actual y pasar tras el arreglo. Conservar las pruebas anteriores, pero
   no usarlas como reemplazo de esta comprobacion integrada.

NO cerrado, NO corregido por esta orden. Sin cambio productivo ni fusion de Codex.

```comprobar
archivo: src/lib/compras/unidades.ts
usa: claveDeConsolidado en src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx
prueba: docs/evidencias/88-compras-unidad-consumidor.spec.ts
prueba: src/__tests__/compras-suman-en-la-misma-unidad.test.ts
usa: consolidarCompras en src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx
usa: consolidarCompras en src/app/(app)/fiestas/nueva/resumen-planificacion/page.tsx
```
