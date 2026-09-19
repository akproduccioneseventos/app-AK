# Reserva de regalos - 2026-09-19
PR1209 e43260f068a751b5c6e2cc519db84e595c14c89f. Alcance nuevo: respuesta de reserva no disponible. No repetido REG01 ni permisos previamente documentados.
Registro consultado: claimGift aparece por permisos heredados de saveFiesta; no se cuestiona ni repite esa auditoria.
Codex revisa; Claude debe validar cambio de datos/reserva y Gemini el mensaje de invitacion; Claude compila. No se inicio otra IA.

## REG02 P1: reserva confirmada sin asignar el regalo
src/app/actions/fiesta/regalos.actions.ts, claimGift, con updateFiestaData:
si el regalo ya esta reclamado o no existe, el map no cambia nada, guarda la fiesta y devuelve success=true.
Consumidor real verificado: src/components/invitacion/templates/GraziaTemplate.tsx, handleClaimGift muestra "Regalo Reservado" cuando res.success. El chequeo gift.isClaimed del cliente no resuelve una pestaña vieja abierta antes de otra reserva.
Sonda secuencial sin carreras: regalo libre -> Beto asignado PASS; regalo de Ana -> Beto recibe success=true pero sigue Ana FAIL; ID ausente -> success=true FAIL.
No es prueba de permisos ni de perdida por concurrencia: lectura y guardado simulados, funciones claimGift/updateFiestaData reales extraidas por AST.
Correccion propuesta: resultado explicito no disponible/no encontrado sin guardado inutil; consumidor debe mostrarlo y refrescar lista. Resolver reserva atomica del mismo regalo con control de version/transaccion, sin debilitar permisos existentes.
Aceptacion pendiente: dos invitados al mismo regalo, solo uno confirmado; pestaña desactualizada y regalo eliminado avisan; fallo real de guardado no confirma. La concurrencia distribuida todavia NO fue probada.

## Evidencia y limites
docs/evidencias/reserva-regalo-sonda.cjs: 3 casos, 1 PASS/2 FAIL.
Con TypeScript disponible: node docs/evidencias/reserva-regalo-sonda.cjs SNAPSHOT_ACTIONS_TS del SHA indicado.
Sin navegador autenticado, Firestore real, reservas reales, build, merge ni cambios de app.
Graphify local no disponible por ausencia del repo original; navegacion remota dirigida. No certificado de modulo completo.
