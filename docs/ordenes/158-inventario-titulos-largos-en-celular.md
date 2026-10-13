# 158 - Editores de inventario: titulo largo desborda en celular

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.
Antes de programar, contrastar el HEAD exacto de esa tanda y no duplicar arreglos.

## Version y reparto

- Auditoria111, 12/10/2026; HEAD probado
  `39704d5c9f64c4914310be2b040c1a9b073c502f`, PR1288 ABIERTA.
  Rama `codex/auditoria-97-ia-contexto-20261011`.
- Fuente app `8fa5b56a2833938541a657dcd15ef88130d24b0e`; solo docs/pruebas
  posteriores. Ambos consumidores coinciden con main
  `99faf4eb061fa46341cfdde6f81b93b3bfb9c73c`.
- Clasificacion: reproducido en la entrega visible aislada; NO Hosting ni tanda privada.
- Gemini corrige SOLO disposicion visual; Claude compila. Codex revisa.
  Costos, existencias, unidades, permisos y almacenamiento NO cambian.

## Defecto P2 de una misma familia en dos pantallas

Rutas reales:

- `/empresa/activos-fijos/<id>/editar`, `EditarActivoFijoPage`, en
  `src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx`.
- `/empresa/insumos/<id>/editar`, `EditarInsumoPage`, en
  `src/app/(app)/empresa/insumos/[id]/editar/page.tsx`.

Ambos titulos colocan el nombre completo en una fila flex junto a Volver, sin
disposicion que contenga palabras largas. Los nombres ficticios usados tienen
entre55y61 caracteres. El formulario acepto nombres del mismo formato en las
rondas de inventario; los pares exactos de esta comparacion se sembraron por SDK
en el emulador privado. No se inyecto HTML/CSS.

Comparacion con el mismo Pixel7 de412px:

- Nombre corto: scrollWidth412/clientWidth412; prueba de alcanzabilidad de
  Guardar Cambios pasa (sin enviar nada).
- Nombre largo en activo: scrollWidth544/clientWidth412, desborde132px.
- Nombre largo en insumo: scrollWidth603/clientWidth412, desborde191px.
- Con nombres largos, el click de prueba no alcanza Guardar: otros campos
  interceptan la coordenada. Esto se reprodujo tambien con scroll previo.
- En PC1440px ambos casos conservan el ancho correcto y pasan el click de prueba.

`docs/evidencias/111-titulos.json` conserva nombre, medidas, trial/error de cada
variante. Capturas `111-asset-title-{short,long}-mobile.png` y
`111-ingredient-title-{short,long}-mobile.png`. NO se afirma un fallo fisico
reproducido en todos los telefonos: fue Chromium emulado Pixel7.

Con nombres habituales, guardar/reabrir, stock decimal2.5Kg, fallo de red,
borrador conservado, reintento y reporte SI pasaron en111. No rehacer esas acciones.

## Correccion propuesta y aceptacion pendiente

Dar al titulo y a sus padres flex un ancho reducible, cortes de palabra seguros
y disposicion movil que permita envolver/reubicar Volver. Mantener legibilidad,
nombre accesible y ambos botones completos. NO esconder el desborde globalmente,
recortar todo el nombre, imponer maximo nuevo ni bajar todo el zoom para taparlo.

Probar ambos editores con los nombres exactos de111-titulos.json, nombres cortos,
PC/celular; scrollWidth no supera clientWidth salvo tolerancia de redondeo.
Guardar/Volver accesibles por pulsacion normal, sin force ni dispatch artificial.
Mantener unidades/decimales y los reintentos; no modificar calculos para pasar UX.

Actualizacion114: fuente e5f22b53,4criterios PASS con8muestras PC/Pixel7.
Titulos contenidos, Guardar/Volver pulsados realmente; stock/unidad/nombre
persistidos y reabiertos. Ver114-aceptacion.json. Sonda111 conserva el fallo;
la inicial114 click-trial no se confunde con guardado real. No Hosting ni merge.

```comprobar
archivo: src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx
usa: EditarActivoFijoPage en src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx
archivo: src/app/(app)/empresa/insumos/[id]/editar/page.tsx
usa: EditarInsumoPage en src/app/(app)/empresa/insumos/[id]/editar/page.tsx
prueba: docs/evidencias/114-titulos-probe.mjs
```
