# Guias de armado: fallo parcial y reintento - 2026-09-19
PR1209 e43260f068a751b5c6e2cc519db84e595c14c89f. Primera revision del reintento de aplicacion, no revalidacion de enlaces/identidad.
Historial consultado: identidad firmada y acceso por menu ya existen; no se pide repetirlos.
Codex audita; Claude valida persistencia/reintento y compila; Gemini adapta mensaje si corresponde.

## GUI01 P1: fallo posterior al guardado duplica tareas al reintentar
src/app/actions/playbooks.ts, applyPlaybookToFiesta:
primero saveFiesta agrega nuevasTareas; despues escribe playbook-aplicaciones.json.
Si este segundo guardado falla, devuelve success=false y tareasGeneradas=0 aunque ya creo las tareas. Reintentar vuelve a agregarlas sin reconocer la operacion anterior.
Consumidor real: src/app/(app)/playbooks/page.tsx, handleApply deja dialogo abierto ante result.success=false; applying vuelve a false y permite aplicar de nuevo.
Sonda con guia de una tarea: normal => una tarea PASS. Log falla => error/0 generadas, pero una persistida; reintento exitoso => dos tareas iguales FAIL.
Funciones reales por AST; sesion, guia y persistencia simuladas. No transaccion Firebase ni navegador real probados.
Correccion propuesta: operacion identificable e idempotente con estado parcial real, o transaccion adecuada si ambos cambios comparten almacenamiento. No eliminar el historial ni bloquear aplicaciones intencionales futuras sin decision del dueno.
Aceptacion pendiente: fallo del historial despues de guardar y reintento no duplican tareas; fallo de saveFiesta no registra exito; identidad real se conserva.

## Evidencia y limites
docs/evidencias/playbooks-sonda.cjs: 2 casos, 1 PASS/1 FAIL.
Con TypeScript disponible: node docs/evidencias/playbooks-sonda.cjs SNAPSHOT_ACTIONS_TS del SHA indicado.
No app modificada, build, merge ni tareas reales creadas. No certifica generacion de documentos/compras, fechas ni modulo completo.
Graphify local indisponible por ausencia del repo original; navegacion remota dirigida.
Se mantiene orden del dueno: terminar primera pasada de pendientes antes de verificar correcciones.
