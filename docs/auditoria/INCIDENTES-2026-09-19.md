# Incidentes: actualizacion frente a resolucion - 2026-09-19
PR1209 e43260f068a751b5c6e2cc519db84e595c14c89f. Alcance nuevo, no repetidos arreglos/tiempos de espera ya registrados.
Historial consultado: incidentes ya tienen enlaces y conTopeDeEspera. No se pide rehacerlos.
Codex documenta; Claude valida persistencia/concurrencia y compila; Gemini ajusta interfaz si se requiere. Sin ejecucion delegada afirmada.
Graphify local no disponible por ausencia del repo original; navegacion remota dirigida.

## INC01 P1: actualizacion se pierde al resolver simultaneamente
src/app/actions/incidents.ts, addActualizacionIncidente y resolverIncidente leen array completo, lo modifican y llaman writeData.
Consumidor real src/app/(app)/incidentes/page.tsx: handleGuardarActualizacion y handleResolver, con mensajes de exito.
Sonda: comentario de Ana y resolucion concurrentes parten de la misma lectura. Ambas respuestas success=true, estado final Resuelto y 0 comentarios. Control secuencial: Resuelto y 1 comentario.
Funciones reales extraidas por AST; readData/writeData simulados como snapshot/reemplazo de array. No Firebase real ni prueba distribuida: demostrarlo tambien con persistencia real antes del cierre.
Consecuencia de negocio: se pierde lo que hizo el equipo para solucionar el problema aunque le dijeron guardado.
Correccion propuesta: actualizacion atomica por incidente conservando comentarios/estado actuales; no un candado solo local si hay varias instancias. Reutilizar patron existente seguro. No cambiar politica de cierre ni permisos.
Aceptacion pendiente: comentario/resolucion simultaneos, dos comentarios y dos incidentes diferentes, fallo de guardado; ninguna confirmacion falsa ni perdida. Registrar SHA y evidencia al corregir.

## Resultado y limites
docs/evidencias/incidentes-sonda.cjs: 2 casos, 1 PASS/1 FAIL.
Con TypeScript disponible: node docs/evidencias/incidentes-sonda.cjs SNAPSHOT_ACTIONS_TS del SHA indicado.
Sin browser, Firebase real, build, merge ni cambio de app. No certifica incidentes completos ni app. No se revalidan arreglos hasta completar primera pasada de pendientes, por orden del dueno.
