# Evaluacion actualizada - 27/09/2026

Fuente: main `5e384c684c326dbcf79a12dae760ba4fe7e0b705`, PR 1234 fusionada.
No habia PR abiertas al consultar. Codex reviso el diff y las funciones modificadas;
no ejecuto nuevamente las pruebas de Claude ni el entorno completo por roles.

## Cerrado: despliegue del candidato actual

App Hosting check `108686049957`: completed / success, titulo Build succeeded.
`https://akproducciones.uy/api/health` identifica exactamente `5e384c684c326dbcf79a12dae760ba4fe7e0b705`,
compilada `2026-09-27T19:03:06.564Z`. Ya no corresponde decir que el despliegue ACTUAL
esta bloqueado por el fallo de PR 1233. La causa historica de ese fallo sigue sin log.

## Correcciones presentes, sin repetir su implementacion

- El entorno ahora prepara copia descartable, excluye `.env*` y comprueba las variables
  efectivas con el cargador de Next antes de arrancar.
- El helper de rescate distingue original publicada, subiendo, rechazada y sin confirmar;
  la cola registra su resultado antes de eliminar el elemento.
- Se revisaron las diferencias contra la PR 1233. No reutilizar sus sondas incompatibles
  como si probaran la interfaz nueva. Las pruebas ampliadas de Claude estan en el repo;
  esta tanda no afirma una nueva ejecucion por Codex.

## Observado en produccion

Dos consultas reales de health, misma version:
- 19:34:11 UTC, uptime 8: Firebase false.
- 19:34:41 UTC, uptime 38: Firebase true.

La comprobacion hace una lectura de Firestore con tope de 2000 ms. El resultado fue
transitorio en estas dos muestras; no demuestra una caida persistente ni permite
asegurar que todos los arranques funcionen. No cambiar memoria o timeouts a ciegas.
Instagram y Mercado Pago false en ambas consultas: solo evalua variables esperadas,
no una operacion con el proveedor. Gemini/Workspace/mail true tampoco prueban intercambio.

## Veredicto

Despliegue actualizado confirmado; mejoras presentes. Auditoria funcional completa
todavia NO certificada: faltan recorridos por rol y operaciones de integracion controladas.
El ensayo fisico del dueno queda AL FINAL, por su instruccion; no es motivo para frenar
las comprobaciones que pueda hacer Codex. No se hicieron escrituras de datos reales,
cobros, envios, cambios de app ni fusion.
