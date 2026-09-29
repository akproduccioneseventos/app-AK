# Auditoría — gasto de mantenimiento y ficha del activo, PR #1240

Fecha: 2026-09-28
HEAD candidato: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Estado: PR abierta. Revisión estática de la candidata; no verificado en producción y Codex no ejecutó pruebas.
Área sensible: dinero/contabilidad. No cambiar reglas ni importes sin Claude/dueño.

## P1 — El historial del activo y el gasto contable se confirman como si fueran una sola operación, pero se guardan por separado

En `src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx`, símbolo `handleAnotarMantenimiento`, se llama `saveGastoGeneral` y luego se actualiza solo el estado local del formulario. La acción real `src/app/actions/gastos.ts:saveGastoGeneral` puede responder `{success:false,error}` por validación, sin lanzar excepción. El llamador ignora ese resultado y muestra “Gasto registrado” igualmente. Después la ficha del activo se persiste en una segunda acción, `saveActivoFijo`, al pulsar “Guardar Cambios”.

Consecuencias verificables por el flujo:
- Si la acción devuelve `success:false`, el gasto no está en contabilidad, pero la pantalla guarda el historial/costo del activo y anuncia éxito.
- Si el gasto sí se crea y falla el guardado posterior del activo, queda el gasto contable sin el correspondiente registro actualizado en el activo.
- Repetir la operación tras ese fallo puede crear otro gasto, pues cada llamada asigna un ID nuevo; no hay clave de idempotencia visible en este flujo.

Impacto: contabilidad y ficha del activo pueden divergir, o el usuario puede recibir una confirmación falsa. La sincronización de gastos debe resolverla Claude por la asignación del proyecto.

Recomendación: tratar el resultado `success` antes de anunciar éxito; definir una operación consistente (acción transaccional/idempotente o un estado de reconciliación recuperable) que no cree gasto duplicado al reintentar. Deshabilitar doble envío mientras procesa. Pruebas con respuesta `success:false`, excepción, gasto guardado + guardado del activo fallido, y doble clic/reintento; comprobar la vista contable y la ficha después de recargar.

## Verificación

Inspeccionados el consumidor `handleAnotarMantenimiento`, el submit `handleSubmit`, y la acción real `saveGastoGeneral`. Esto es análisis del flujo por código, no reproducción dinámica. No se ejecutaron pruebas, no se escribió en libros reales ni se generaron gastos reales.
