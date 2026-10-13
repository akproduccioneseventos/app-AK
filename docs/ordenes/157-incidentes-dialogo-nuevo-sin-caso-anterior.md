# 157 - Nueva incidencia no debe reutilizar el caso ya guardado

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.
Antes de programar, comprobar el HEAD exacto de esa tanda y descartar lo ya corregido.

## Version y reparto

- Auditoria111, 12/10/2026. PR1288 ABIERTA; rama
  `codex/auditoria-97-ia-contexto-20261011`, HEAD probado
  `39704d5c9f64c4914310be2b040c1a9b073c502f`.
- Fuente compilada `8fa5b56a2833938541a657dcd15ef88130d24b0e`;
  desde ese SHA no hay cambios de app. Main contrastado
  `99faf4eb061fa46341cfdde6f81b93b3bfb9c73c`.
- Los archivos afectados coinciden con ese main. Reproducido en la entrega
  visible del entorno aislado; NO comprobado en Hosting ni en la tanda privada.
- Codex documenta, Gemini lleva esta pantalla no sensible; Claude verifica y
  compila el conjunto. No ampliar permisos, editar dinero ni fusionar por esta orden.
- No repetir152-156 mientras se programan. Esta orden no inicia otra IA.

## Un defecto P2, dos reproducciones

En PC y Pixel7:

1. Abrir `/incidentes?fiestaId=<evento ficticio>`.
2. Pulsar Nueva Incidencia y completar titulo, responsable y descripcion.
3. Registrar; se cierra el dialogo y Firestore contiene el nuevo caso.
4. Sin recargar, pulsar Nueva Incidencia otra vez.
5. El dialogo vuelve con el titulo y la descripcion del caso YA GUARDADO.

La persona tiene que borrar manualmente la incidencia anterior para empezar otra.
Eso facilita registrar un caso equivocado. NO se envio un segundo formulario y
NO se afirma que se hayan creado duplicados en esta prueba.

Evidencia: `docs/evidencias/111-operaciones.json`, criterio
`incident-new-dialog-after-success-is-new`, FAIL en ambos contextos;
capturas `111-new-incident-desktop.png` y `111-new-incident-mobile.png`.

## Causa verificada y correccion acotada

Archivo real `src/app/(app)/incidentes/page.tsx`, consumidor `IncidentesContent`.
`handleCrear` cierra el dialogo y llama `load` despues de success; no reinicia
`form`. El boton Nueva Incidencia solo llama `setNuevaDialogOpen(true)`.

Preparar un caso NUEVO despues de guardar correctamente, sin conservar titulo,
descripcion, plan y seguimiento del anterior. Mantener el contexto fiestaId.
No imponer cambios de responsable, categorias o borradores cancelados sin revisar
la politica existente/aprobacion del dueno. NO vaciar el formulario cuando falla
el guardado: ese borrador se conserva y el reintento ya funciona.

## Aceptacion que falta ejecutar sobre la correccion

- PC y celular: guardar A, abrir Nueva Incidencia sin recargar; titulo/descripcion
  del caso A no aparecen en el caso B; fiestaId sigue correcto.
- Completar B distinto y guardar: dos casos distintos, no reutilizacion accidental.
- Rechazar solo createIncidente: aviso visible, borrador conservado; reintento
  guarda una sola vez. Esta regresion paso en111 y debe conservarse.
- No modificar el consumidor de actualizaciones: el fallo conserva la nota y el
  reintento guarda una sola actualizacion, comprobado en111.

Actualizacion114: Codex corrige por autorizacion nueva; fuente e5f22b53.
Sonda actual PC/Pixel7 PASS: nuevo caso limpio, borrador fallido y contexto
conservados, dos casos distintos. Ver114-aceptacion.json; no reimplementar.
Sonda111 conservada como fallo historico; Hosting no verificado.

```comprobar
archivo: src/app/(app)/incidentes/page.tsx
usa: IncidentesContent en src/app/(app)/incidentes/page.tsx
prueba: docs/evidencias/114-incidentes-probe.mjs
```
