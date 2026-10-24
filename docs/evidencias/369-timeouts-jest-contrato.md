# 369 - Diagnostico de cinco timeouts Jest

## Alcance y evidencia
- Objetivo: explicar los cinco suites solicitados, sin volver a revisar la asercion 353.
- Baseline `3e45a4ac6b479f89605163168e31b37dc84f2d0f`; candidata `3f9460185143ef034dcd713e975d2a0af5e20f1a`.
- Evidencia de candidata: `docs/evidencias/364-jest-resultados.json`; QA estable indicado: `C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-363-3f-ccnKr1`.
- 364 es focal 33 casos: 21 pasan y 12 fallan; fixture blog ahora pasa. El JSON registra para los casos afectados timeout Jest de 5000 ms, no rechazo/assertion de comportamiento. No identifica la promesa/await que queda pendiente. No se reejecutó Jest.
- El estado de tanda identifica 3e como main/1360 y 3f como candidata 1353. La candidata ya tenía Jest 349 con 861 suites, 13 fallas (11 timeouts); no equivale a éxito. No extrapolarlo a los cinco diagnósticos individuales.

## Contraste de cambios
- Los cinco archivos de prueba no tienen diff directo 3e..3f. Hay cambios de producción transitivos, por lo que eso no exonera contrato ni demuestra causalidad.
- `src/lib/agentes/motor-agentes.ts` cambia en la candidata, entre otros, `ejecutarVigilantePublicidad`: escritura de `social-posts.json` pasa a `mutateGenericJsonArray`; cambia cálculo de presupuesto para gasto cero y agrega `consultarAsistenteAK`/`ejecutarAccionDeAgenteConReglas`. El diff prueba cambio, no que estos suites invoquen una ruta que espera para siempre.
- El suite `ia-86-agentes-publicidad-e-intervalo.test.ts` llama `motor.ejecutarAgentesAutonomos` y prueba `ejecutarAgenteManual('vigilante_publicidad')`; posible relación transitiva con `motor-agentes.ts`, aún no atribución. Inspeccionar mock exacto de `mutateGenericJsonArray` y consumidor real.
- `concurrencia-tareas-automaticas.test.ts`: falla reportada en caso de múltiples llamadas a `ponerAlDiaAlEntrar`, línea 82 del QA. Sin timeout stack de await, lock, promesa compartida o mock pendiente: causa sin resolver.
- `agentes-autonomos.test.ts`: los casos de perseguidor y cobrador expiran; no es evidencia de guardrail incorrecto. Determinar si su mock de IO/IA satisface los nuevos consumidores del motor.
- `cerebro-publicidad-meta.test.ts`: suite expirado según corrida focal; el JSON debe consultarse por nombre de caso y su stack completo antes de asociarlo a una dependencia. No imputar por proximidad temática.
- `orden-199-el-foco-vuelve-y-la-fecha-del-seguimiento.test.tsx`: timeout no prueba regresión de foco/fecha. Los cambios amplios de UI 3e..3f solo son candidatos si el stack/import del componente muestra una dependencia directa; aún no demostrado.
- `ia-86-agentes-publicidad-e-intervalo.test.ts`: registro JSON concreta timeouts al ejecutar Vigilante y al filtrar por intervalo/manual; son contratos afectados, pero ni timeout ni el cambio de presupuesto prueban fallo funcional. Fake timers deben verificarse por test y limpiar timers/promesas pendientes.

## Clasificacion
- **Probado:** candidata y baseline difieren; hay cambios transitivos de producción; 364 expiró suites/casos con el límite estándar; no se reporta assertion funcional para estos timeout.
- **Hipótesis:** incompatibilidad entre `mutateGenericJsonArray` y mocks/fixtures antiguos, promesa compartida de concurrencia sin resolver, dependencia UI transitiva, o fake timers que no drenan microtareas. No elegir una sin evidencia del consumidor/stack.
- **No probado:** que los cinco sean bugs de app, que sean solo lentitud de máquina, que todo timeout sea un fallo de timer, o que debilitar guardas/elevar timeout sea corrección.

## Diagnostico minimo para cerrar
1. Sobre el QA estable existente, extraer del JSON los `fullName`, `failureMessages` completos y módulos importados de los cinco suites; conservar SHA 3f. No ejecutar el conjunto ni cambiar guardas.
2. Para cada caso, seguir un único await desde el punto exacto al consumidor y al mock/fixture que lo atiende; comprobar si la promesa se resuelve. Para concurrencia, observar todas las llamadas y resolución compartida; para UI, identificar el componente y sus efectos; para fake timers, listar temporizadores activos y avance de microtareas.
3. Revisar solo los mismos símbolos/imports en 3e y 3f. Repetir únicamente el test que discrimina la causa en ambos worktrees/SHAs, con fixture idéntico y límite intacto. Si solo falla 3f, clasificar regresión candidata; si ambos, contrato/fixture previo o falla reproducible común; si no concluye, conservar como no atribuido.

## Comprobar
- archivo: `src/__tests__/concurrencia-tareas-automaticas.test.ts`, `src/__tests__/agentes-autonomos.test.ts`, `src/__tests__/cerebro-publicidad-meta.test.ts`, `src/__tests__/orden-199-el-foco-vuelve-y-la-fecha-del-seguimiento.test.tsx`, `src/__tests__/ia-86-agentes-publicidad-e-intervalo.test.ts`.
- usa: `ponerAlDiaAlEntrar`; `ejecutarAgentesAutonomos`/`ejecutarAgenteManual`; consumidores reales que los stack/imports de QA identifiquen (por confirmar, no inferir).
- prueba: 364 focal existente, 33 casos, 21 PASS/12 FAIL; discriminación baseline/candidata pendiente. No se ejecutó prueba nueva; no es aprobación ni validación de despliegue.
