# Auditoria 81 - automatizaciones y limites de cierre

## Retest de la entrega nueva - 9/10/2026

Main avanzo durante la auditoria a `1b57abbec5162402cc30269cc276398707b28d55`, PR 1271/1272.
Se contrasto el diff antes de ordenar correcciones. No habia PR abierta al reconsultar.
Siete suites de Claude / 22 pruebas aprobaron en ese SHA (7.001 s), resultado durable
`81-retest-claude.json`. No repetir los arreglos de cron sin sesion, cache/saldo del parte,
transaccion con envio fuera del callback o revision web que ahora pide paginas y titulos.

Dos defectos pendientes reproducidos sobre el main nuevo:

- Publicacion manual concurrente: `publishPostInternal` (consumidor `publicarPosteoAhoraAction` en
  `src/app/actions/social-media.ts`) queda fuera del reclamo de cron. Esperado un envio,
  observado dos; `81-publicacion-retest.json`. La sonda TikTok del mismo archivo SI pasa.
- Recordatorio de invitados: dos GET autorizados del mismo dia, permiso interno correcto,
  crean dos filas. Falta clave deduplicadora de fiesta/invitado/momento.
  `81-invitados-reintento.test.ts` y `81-invitados-retest.json`, fallo esperado.

Conservados como limites, no como errores nuevos reproducidos: estado final del publishId
TikTok no se consulta en una corrida posterior; integracion real aun sin comprobar.
El mapa de dependencias del contador sigue sin incluir los tres archivos listados abajo.
Orden 131 actualizada: SOLO lo pendiente, criterios originales identificados como historico.

Recorridos de mural/captura/entrega: ver informe separado. Los archivos afectados no cambian
entre ambos SHA; el build y navegador corresponden a `497ee725`, no al main nuevo completo.

## Primera base - conservar el origen, no repetir como hallazgos actuales

Commit auditado: `497ee725cb4d8cce6d1c97422fd674cbbe86c051` (main, 9/10/2026).
Area: redes, tareas automaticas, plata, asistente y permisos. No se aprueba ningun area
entera a partir de este barrido focalizado. No habia PR abierta al contrastar.
Responsables y aceptacion: orden 131. Recontrastar la tanda antes de programar.

## Pruebas ejecutadas

Cinco suites Jest, 30 pruebas, aprobaron (18.054 s):
`recordatorios-de-pago`, `la-invitacion-no-abierta-se-recuerda-sola`,
`tiktok-no-canta-victoria-antes`, `social-wall-guest-boundary`, `social-wall-content-safety`,
todas en `src/__tests__/` con sufijo `.test.ts`.
Esto NO cubre los casos nuevos de cron sin cookie, reintento de Firestore ni segunda
inicializacion de TikTok. Una prueba aprobada no invalida una sonda distinta reproducida.

Dos sondas nuevas de la funcion real de publicacion FALLAN (6.228 s) sobre la misma base:

1. AUTO81-TIKTOK-PROCESSING P1: dos cron seguidos inicializan el mismo post dos veces,
   incluso habiendo guardado el `publishId` pendiente. Esperado 1 envio, observado 2.
2. AUTO81-PUBLICACION-CONCURRENTE P1: dos solicitudes simultaneas de Facebook entregan
   el mismo post dos veces. Esperado 1 llamada al proveedor, observado 2.

Persistencia y proveedores son simulados con copias separadas por lectura; no se publico
en redes reales. Funcion bajo prueba: `publishPostInternal` / `procesarPosteosProgramados`.
Archivo y resultado durable: `81-publicacion-sondas.test.ts`, `81-publicacion-resultados.json`.
Comando reproducible desde raiz (estas sondas estan fuera de la seleccion normal de Jest):

```powershell
node node_modules/jest/bin/jest.js --runInBand --runTestsByPath docs/evidencias/81-publicacion-sondas.test.ts --testMatch="**/docs/evidencias/81-publicacion-sondas.test.ts"
```

La barrera de la sonda de concurrencia se libera independientemente de que haya uno o
dos envios: una correccion no queda colgada por esperar el segundo envio prohibido.
Son demostraciones de defecto, NO correcciones. Falta regression con persistencia real.

## Hallazgos de codigo, sin sonda nueva ejecutada

- AUTO81-CUOTAS P1: token interno admitido al entrar, pero `getInvoices` pide sesion otra
  vez. Ruta de recordatorios sin cookie no puede completar el escaneo de cuotas.
- AUTO81-INVITACION-RETRY P1: envio Gmail/Meta y creacion de mensajes aleatorios dentro
  de callback de transaccion reintentable; una respuesta externa no se revierte con ella.
  Riesgo condicional al uso Firestore. Falta forzar reintento sobre el emulador.
- AUTO81-INVITADOS-AUTH P1: cron guarda mensaje sin token interno, ignora fallo de CRM
  y devuelve OK. No es prueba de mensajes enviados o no enviados en el servidor real.
- AUTO81-PARTE-MANANA P1: cron sin cookie convierte lecturas protegidas fallidas en [],
  cachea resumen incompleto; saldo resta tambien pendientes. No afirmar lista siempre vacia,
  porque otras fuentes pueden seguir aportando datos. Falta sonda de cache/estados.
- AUTO81-SEO-APROBACION-FICTICIA P2: la revision declara paginas optimas recorriendo una
  lista, sin pedir pagina/canonical. No demuestra fallo de una pagina real de produccion;
  demuestra que el certificado no comprueba lo que dice. Falta sonda 404/red fallida.

Rutas, consumidores, cambios pedidos y criterios exactos: orden 131. No hay acceso a las
variables reales del servidor: la posible puerta abierta si CRON_SECRET falta es condicion,
no vulnerabilidad observada en produccion. No aflojar permisos para hacer pasar las pruebas.

## Contador de cierre: cobertura insuficiente

`docs/codex/areas.json` y `scripts/codex-limpio.mjs` no cubren al menos estos archivos:
`src/lib/presencia-digital/publicador.ts`, `src/lib/data-service.ts`,
`src/components/presupuestos/budget-share-dock.tsx`. Cambiar esas dependencias no invalida
por prefijo una area previamente limpia. El contador no es certificado exhaustivo.
Estado registrado al mirar: 9 con-hallazgos y 5 sin-revisar, ninguna limpia; no significa
que no existan otras pruebas historicas. No se modifico para aparentar aprobaciones.

## Descartado

La sospecha de recibos del empleado cruzados se descarto: `getRecibosFirmadosByEmpleado`
filtra el empleado antes de elegir fiesta. No reportar ese falso positivo como error.
Tampoco rehacer el arreglo existente que evita marcar TikTok Publicado mientras PROCESSING.

## Entorno

La consola y el navegador se recuperaron. El launcher existente fallo con EPERM al crear
symlink de node_modules en Windows. `81-windows-aislado.mjs` agrega solo para la copia
temporal una junction equivalente y estrictamente acotada. No modifica produccion ni
agrega dependencias. Compilacion aislada completada con avisos, servidor 3300 y emuladores
Firestore 8085 / Storage 9195. Resultado final de recorridos se registra aparte.
