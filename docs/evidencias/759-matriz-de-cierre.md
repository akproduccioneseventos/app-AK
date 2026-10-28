# Matriz mecanica de cierre: contabilidad, contratos y PR1370

28/10/2026. Mapa de causas y evidencia ya registrada; no es aprobacion contable,
contractual, legal ni de permisos. No se programo ni fusiono nada en esta tarea.

## Contexto y alcance

Las ordenes 250-252 y evidencias 735, 738 y 746 fueron consultadas en el
checkout `codex/697-auditoria-automatismos-20261026`, HEAD
`f87cf0ba95e4cf9c837d0b6d4353bd4904b7b8be`. No es el `main` `0abe9199` ni PR1370
`90cc18b5` declarados en esas notas; el director proporciono los metadatos
remotos iniciales, aun sin el contraste final de la cabeza de Claude.
Por tanto este documento indexa el registro previo: no certifica que las causas
sigan presentes o resueltas en la cabeza actual de Claude.

El contraste posterior del director esta en `759-contraste-cierre.md` y su
manifiesto JSON. Ese contraste, no este indice mecanico, determina el estado actual.

## Matriz de causas

| ID | Causa registrada | Responsable de seguimiento | Archivo y consumidor real ya registrado | Prueba previa reutilizable y alcance |
| --- | --- | --- | --- | --- |
| AK-CODEX-732-COMISION-NO-LLEGA-AL-REPORTE | Comisiones confirmadas ausentes de reporte y analiticas | Claude (dinero/contabilidad) | `src/app/actions/reportes.ts` -> `getProfitAndLossData` en `src/app/(app)/empresa/contabilidad/reportes/page.tsx`; `src/app/actions/analytics.ts` -> `getAnalyticsData` en `src/app/analytics/page.tsx` | Sonda 732: fixture MercadoPago aprobado 100000/comision 3000; comparativa 97000 y reporte/analiticas 100000; control comision cero. Reutilizar contra misma fuente. No cubre proveedor externo, webhook HTTP ni duplicacion de gasto por otras vias. Focal sugerida `src/__tests__/contabilidad-concilia-comisiones-senas-y-fechas.test.ts` quedo PROPUESTA/PENDIENTE en orden250. |
| AK-CODEX-732-PROVEEDOR-FECHA-EVENTO-VS-PAGO | Periodo filtra costos por fecha del evento, no consistentemente el movimiento por fecha de pago | Claude (dinero/contabilidad) | `src/app/actions/reportes.ts` -> `getProfitAndLossData`; consumidor visual de reporte en `src/app/(app)/empresa/contabilidad/reportes/page.tsx` | Sonda 732 con `agregarPagoProveedor`: pago 21/10 omitido para evento 20/09 y pago 21/09 incluido para evento 20/10; mismo mes control correcto. Reutilizar solo para misma fuente y politica mostrada. La decision caja/devengo/atribucion sigue del dueno. Focal conjunta de orden250 pendiente, no ejecutada. |
| AK-CODEX-732-SENA-SIN-PRESUPUESTO-NO-REPORTA | Seña cobrada sin presupuesto existe en libro pero no aparece como ingreso conciliado en reporte | Claude (dinero/contabilidad) | `src/app/actions/reportes.ts` -> `getProfitAndLossData`; flujo productor observado `registerBookingDeposit`; consumidor de reporte en `src/app/(app)/empresa/contabilidad/reportes/page.tsx` | Sonda 732: seña independiente 1000, libro 1000 y reporte 0; control espejado en presupuesto suma una sola vez. No decide clasificacion contable ni prueba dinero real. Focal conjunta de orden250 pendiente, no ejecutada. |
| AK-CODEX-737-FAQ-AJUSTE-SALDO | FAQ dice 15% sobre saldo restante, distinto del ajuste sobre presupuesto base usado por contrato/motor | Claude (dinero/condiciones; redaccion de FAQ) | `src/data/preguntas-frecuentes-contrato.ts` -> `PREGUNTAS_FRECUENTES_DEL_CONTRATO` en `src/app/portal-cliente/[id]/page.tsx`; el dictamen 738 registra tambien motor/base `src/lib/contract-template.ts` | Sonda 737: base 100000, firma 2026, evento 2027, pago 50000; motor da saldo 65000 frente a 57500 inferido de FAQ. 736: 13 suites/70 casos PASS, incluyendo marcadores/portal/FAQ, pero no equivale a cierre de esta contradiccion. `src/__tests__/faq-ajuste-anual-coincide-con-contrato.test.ts` pendiente en orden251. No alterar politica ni contratos firmados sin decision expresa. |
| AK-CODEX-741-ACTUALIZAR-FIESTA-RPC-SIN-FRONTERA | Accion acepta opciones internas y devuelve datos sensibles; variante operador reproduce tambien el problema | Claude (permisos/frontera/datos) | `src/app/actions/fiesta/fiesta.actions.ts` -> `actualizarFiesta` en `src/app/admin/ventas/page.tsx`; helper `src/lib/fiesta/actualizar-fiesta.ts` | Sonda 741 en dictamen746: personal no asignado con flag pudo vaciar cuotas y leer clave ficticia; operador asignado sin flag tambien; control personal sin opcion rechaza. Reutilizar 745 candado (1 suite/3 PASS) solo para guardas cubiertas: expresamente no cubre la frontera completa nueva. Conservar comentario4394845311 y ampliar variante, no duplicarlo. |
| AK-CODEX-741-LOGIN-EMITE-VERSION-ANTERIOR | Inicio de sesion emite version 1 aunque usuario guardado tiene version 2 | Claude (sesion/permisos/datos) | `src/app/actions/auth.ts` -> `loginUser` en `src/app/login/page.tsx`; validacion siguiente por `requireSession` | Sonda 741: clave correcta/version2 da login success, cookie version1 y rechazo en siguiente sesion; version1 control entra. Reutilizar caso de `src/__tests__/una-sesion-vieja-se-corta.test.ts` solo si el test/fixture y fuente no cambiaron; la orden252 la nombra, pero no afirma que sea prueba nueva ejecutada. |
| AK-CODEX-741-ADMIN-ACEPTA-COOKIE-REVOCADA | Mutacion administrativa acepta cookie cuya version/perfil vigente ya rechazo la guarda general | Claude (sesion/permisos/datos) | `src/app/actions/auth.ts` -> `adminResetUserPassword` en `src/app/(app)/admin/usuarios/page.tsx` | Sonda 741: `requireSession` rechaza cookie revocada, `adminResetUserPassword` aun cambia clave/version de otro usuario. Prueba propuesta `src/__tests__/admin-no-acepta-cookie-revocada.test.ts` en orden252: pendiente; no tratar como corrida previa. Revisar otras mutaciones solo segun el alcance ya indicado, no declarar cobertura total. |
| AK-CODEX-741-DOS-BAJAS-DEJAN-CERO-DUENOS | Dos bajas concurrentes pasan lecturas separadas y dejan cero duenos | Claude (permisos/concurrencia) | `src/app/actions/auth.ts` -> `updateUserModules` en el consumidor de administracion de usuarios; orden252 tambien requiere revisar borrados autorizados | Sonda 741 con intercalado de dos lecturas sobre copias: ambas acciones success y quedan cero; caso individual de ultimo dueno rechaza. No prueba SDK ni dos procesos/servidores reales. `src/__tests__/dos-bajas-conservan-un-dueno.test.ts` pendiente. El cierre previo explicitamente no cubre exclusion entre asignar y borrar. |
| AK-CODEX-741-SENA-EXISTENTE-NO-GUARDA | Edicion autorizada de fiesta que ya esta en estado Seña se rechaza como si fuese transicion nueva | Claude (flujo asociado a cobros/estado; segun asignacion de dinero) | `src/lib/fiesta/actualizar-fiesta.ts` -> `actualizarFiesta` en `src/app/actions/fiesta-actual.ts` | Sonda 741: musica en fiesta ya Seña falla y no guarda; control Cotizado guarda. Reutilizar esa reproduccion si la fuente coincide; prueba focal de `src/__tests__/una-pantalla-vieja-del-duenio-no-pisa-cuotas.test.ts` se propone en orden252 y no consta ejecutada para este ID. Respetar caminos de cobro/transicion existentes. |
| AK-CODEX-743-HISTORICOS-FACTURA-DE-OTRA-CARGA | Fallback por HIST + ultimos cinco permite compartir factura de carga ajena entre presupuestos | Claude (dinero/facturas/datos) | `src/app/actions/invoices.ts` -> `getInvoicesByPresupuestoId` en `src/app/actions/historicos.ts`; productor probado `processHistoricRecord` | Sonda 743: cargas A/B con distinto importe y mismo sufijo `abcde` terminan compartiendo factura A; sufijos distintos control generan dos. `src/__tests__/la-carga-historica-no-duplica.test.ts` propuesta en orden252, pendiente. Los 49 originales de 740 y 3 controles de 745 no cubren esta variante; no se probo documento/cobro real ni SDK. |

## Cierres previos que no abarcan todo

- Contabilidad: 735 registra 50 suites/304 casos originales unicos con los perfiles
  descritos, pero mantiene las tres causas 732 sin corregir. No es cierre contable
  general; tampoco valida proveedor/SDK real ni resuelve politica de periodo.
- Contratos: 736 registra 70/70 PASS en su alcance; 737 reproduce una inconsistencia
  de FAQ que sigue abierta en 738. Los PASS no homologan cada contrato/PDF ni
  certifican firma, identidad, impuestos o cumplimiento legal.
- Leyes y condiciones: los puntos de 251/738 son asuntos para abogado/contador y
  decisiones del dueno, no defectos automaticamente demostrados ni aprobaciones de
  Codex. Esta matriz no aprueba dinero, permisos, contratos ni leyes.
- PR1370: 746 registra 52 originales PASS en 10 suites y seis causas en sondas;
  no significa que las seis esten corregidas. UI de 743 no inicio por falta de RTL
  y 744 quedo inconclusa; no cuentan como aceptacion de interfaz.
- Concurrencia de duenos: el doble controlado reproduce el intercalado, pero el
  propio dictamen dice que no demuestra exclusividad real entre procesos/SDK.
- Los IDs de sesiones/cobros de 252 son recuperacion de hallazgos previos 247/249,
  no seis causas enteramente nuevas. Respetar comentarios existentes y no duplicar
  esas reparaciones.

## Reutilizacion y limites de contraste

No repetir pruebas ni SDK por fuente igual, conforme al pedido. Reutilizar los
resultados anteriores solo despues de confirmar que la fuente destino es la misma;
si cambio, retestar el delta pertinente y distinguir evidencia local de validacion
de la cabeza actual. Las propuestas de test marcadas pendientes arriba siguen
pendientes hasta que exista registro de ejecucion. La igualdad de blobs de 735/738
solo abarca archivos/manifiestos enumerados; las notas declaran privados posteriores
no contrastados. En esta tarea el HEAD local difiere de `main`/PR anotados y la nueva
cabeza de Claude no fue consultada.
