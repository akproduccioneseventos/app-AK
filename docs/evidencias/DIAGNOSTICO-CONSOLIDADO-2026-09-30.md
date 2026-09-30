# Diagnostico consolidado de auditoria - 2026-09-30

## Actualizacion posterior: barrido restante y PDF real

Esta seccion actualiza el alcance del informe que sigue. La auditoria integral de uso NO queda aprobada.

- Completadas las 496 suites unitarias restantes: 2923 pruebas aprobadas, 0 fallidas, 0 omitidas. Se excluyeron expresamente las 33 suites previamente aprobadas, sin sumarlas otra vez.
- Primera corrida:492 suites aprobadas/4 fallidas por falta de metadatos Git en el ZIP. Se repitieron solo esas4 con indice externo del SHA exacto:4 suites/8 pruebas aprobadas. No eran defectos de la app.
- Hubo un intento de reintento mas amplio que se interrumpio al incluir una prueba que crea su propio repositorio; NO se usa como evidencia. El reintento final incluyo solamente los4 controles de lectura Git. HEAD del checkout auxiliar permanecio c383f0181f6a20d2573ca58e3bb4225a4f61cbcb. No cambio de rama ni merge.
- Red real bloqueada a nivel sockets, sin credenciales de proveedor heredadas. Avisos de metadatos bloqueados no se trataron como defecto; es validacion aislada con mocks, no integraciones reales.
- Fuente verificada nuevamente despues de correr:2060 archivos de src/tests/scripts coinciden con arbol GitHub. No codigo de producto modificado.
- Manifest por archivo: docs/evidencias/unitarias-restantes-2026-09-30.json, commit ea4b2d19008fd975be556ee1b1f4b284badd18c7; subido y releido. Incluye 496 rutas y resultados para no repetirlas.
- PDF generado con funcion REAL createSimulatorBudgetPdf:45 servicios/3paginas, numeracion y tablas revisadas visualmente mediante Poppler, precio/proyeccion separados. No es comparacion pantalla-descarga ni carga del logo.
- NUEVO P2 confirmado: nombre completo del cliente invade INVITADOS13.1215mm. Orden102 (9b9021095aa4bcd26452e6ffad77775f6762dd8f), misma fuente main/PR1246. Sonda generadora adjunta (1d92f0a1035e7b4560cb0f1ef2c3bd286b8692ed). Ya son CUATRO defectos confirmados contando100/101, no tres.
- El test PDF existente paso porque solo verifica paginas/tamano/peso. La inspeccion visual detecto lo que esa prueba no mide.
- Los 19 historicos NO se conciliaron: el archivo original descargado contiene data/presupuestos.json y src/data/presupuestos.json vacios (3bytes), mas una fixture e2e. No hay conector Firestore disponible. No usar fixtures sembradas para afirmar que los19 reales estan bien.

Quedan fuera de este barrido: interaccion real de todos los roles, estetica completa, correspondencia foto/menu del catalogo real, CRM/cita/descarga desde pantalla, datos historicos reales, proveedores conectados y despliegue candidato. La restriccion CUA sigue vigente; no se eludio con otro navegador o Playwright.
Las ordenes100/101/102 se corrigen en la tanda existente; no hay que volver a inventariar ni ejecutar estas496 suites por una nota documental.

## Veredicto anterior (conservar contexto)

NO aprobado todavia para publicacion por Codex. No es certificado de cero errores.
Este cierre agrupa la revision de codigo/pruebas ejecutable en este entorno.
La auditoria integral de uso sigue incompleta: no convertir limites de prueba en fallos de la app ni en aprobaciones.
No hace falta pedir al dueno otro "continua" para programar las ordenes ya entregadas: el reparto vigente sigue aplicando, pero subir una orden NO inicia otra IA.

## Version y trazabilidad

- Main 62dcb2cb4df718a81c3654028199e49628367d8c, reconfirmado por GitHub CLI.
- PR1246 abierta, HEAD 70b016ece91b8e82e7b2054061a8c8f2af072e19, base claude/revision-entrega-96-98.
- Snapshot obtenido del archivo de GitHub de main. Verificacion por hashes Git contra arbol remoto completo: 2060 archivos en src/tests/scripts (excluye src/data), cero diferencias.
- Esto resuelve la duda de procedencia expresada por los subagentes al no encontrar .git en el ZIP. Identidad de fuente NO demuestra comportamiento.
- No se compilo, fusiono ni modifico codigo de producto. Las sondas son herramientas externas de auditoria.

## Hallazgos confirmados y entregados

| Prioridad | Caso | Evidencia | Destino |
| --- | --- | --- | --- |
| P1 | Token de invitado entra en argumento de Analytics | Componente real con gtag simulado; token ficticio visible en page_path. No trafico real observado | Orden100, commit 6aa62e2545680e7720aba856798637bc48e8cf12 |
| P1 | Dos guardados simultaneos pierden un chat o perfil de aprendizaje | Dos respuestas, un registro persistido con lecturas concurrentes; fuente/almacenamiento contrastados | Orden101, commit ac95d9d05995a5d15a80b4a3b56df64450d712fa |
| P2 | El secretario completa una tarea distinta del ID indicado | ID comida + texto comun completa salon; coincidencia ambigua tambien escribe | Misma orden101 |

Son revalidaciones de 100/111/112 historicos, no tres problemas descubiertos desde cero.
Los archivos causantes estan tambien en el HEAD de PR1246. No se pide rehacer los arreglos revertidos de Gemini.
Sonda portable de los ultimos dos: docs/evidencias/sonda-multiagente-2026-09-30.cjs, commit 1cf95b2e6279fd237b738d602d38e7a1bfbc2be7.
Las ordenes y la sonda se descargaron de GitHub despues de subir y su contenido coincide.

## Pruebas ejecutadas en esta tanda

Todas contra el snapshot verificado. Jest con --runInBand; no servicios reales.
31 suites / 148 pruebas aprobadas con rutas identificadas abajo.
No se suman ejecuciones previas ni se convierten pruebas estructurales en recorridos de usuario.

### Principal: 22 suites, 104 pruebas

- Multiagente: 2 suites/7 pruebas: el-secretario-hace-tres-cosas-mas.test.ts; multiagent-chat-scope.test.ts.
- Dinero/comida: 6/42: la-contabilidad-no-miente.test.ts; dos-cobros-a-la-vez-no-se-pisan.test.ts; un-cobro-no-se-cuenta-dos-veces.test.ts; payment-summary.test.ts; saldo-con-ajuste.test.ts; la-lista-de-compras-no-suma-gramos-con-kilos.test.ts.
- Planificacion/privacidad/respaldos: 9/39: backup.test.ts; backup-upload.test.ts; backup-status-states.test.ts; el-respaldo-no-miente.test.ts; la-fiesta-no-viaja-entera-a-quien-no-es-del-equipo.test.ts; el-calendario-no-mueve-la-fiesta-equivocada.test.ts; la-decoracion-llega-al-cliente-como-es.test.ts; las-reuniones-no-pisan-lo-del-equipo.test.ts; la-planificacion-no-pierde-lo-que-guarda.test.ts.
- Integraciones: 5/16: google-workspace-email.test.ts; youtube-sube-el-video.test.ts; tiktok-no-canta-victoria-antes.test.ts; whatsapp-webhook-security.test.ts; instagram-production-integrity.test.ts.

Todas las rutas anteriores bajo src/__tests__/.
Comando por grupo: node ./node_modules/jest/bin/jest.js --runInBand --silent --runTestsByPath seguido de las rutas indicadas.
Mezcla de comprobacion de fuente y comportamiento con mocks. Las pruebas del secretario PASAN aun con los casos de la sonda fallidos: cobertura insuficiente, no contradiccion.

### Agente economico ventas: 9 suites, 44 pruebas

Rutas bajo src/__tests__/, extension .test.ts:
public-simulator-package-flow; public-simulator-identity-boundary; public-simulator-funnel; public-simulator-bootstrap-fallback; la-web-no-muestra-ni-pierde-lo-que-no-debe; la-fiesta-vende-la-proxima; simulator-sales-presentation; simulator-conversion-engine; crm-concurrency-boundary.
Comando informado: npx jest --runInBand --silent --runTestsByPath con esas rutas.
Resultado recibido del agente, no repetido por el principal.
Limitaciones: consulta por telefono devuelve hasta 20 presupuestos; la prueba de identidad es estructural, no demuestra persistencia de varios presupuestos.
Observacion de calidad del test: busca '20' como limite y puede encontrar el limite de resultados aunque el rate limit sea 12/hora; no es bug de negocio confirmado.
No cambia la decision de permitir varios presupuestos al mismo telefono.

### Evidencia adicional, no sumada al total trazable

Agente de entretenimiento informo 6 suites/35 pruebas aprobadas de cola/stock/captura/offline/mural, sin lista final completa de rutas.
Se solicito detalle; al retomar, agente devolvio not_found. No se inventan rutas ni se usa como cierre reproducible.
La segunda tarea delegada de integraciones no devolvio resultado; por eso las 5 suites explicitadas arriba las ejecuto el principal. No se atribuye ningun resultado invisible.

## Lo ya cerrado que no debe reprogramarse

- Portal cliente: pendientes respetan showCatering/showInvitados/showFinancials; 3 pruebas estructurales aprobadas en tanda anterior. No implica aislamiento completo probado en navegador.
- Controles rojos de GitHub por facturacion: NO defecto de producto y fuera de esta investigacion.
- QR por nombre y proveedores atendiendo varias fiestas: decisiones del dueno; no cambiar.
- Codigo Gemini 95-98 revertido segun YA-RESUELTO: no tratar esa entrega vieja como publicada.
- Recuento Astra/Luna en RECUENTO-ASTRA-LUNA-2026-09-29.md conserva evidencia historica; no descartar ni repetir por nombre de modelo.

## Matriz pendiente de cierre real

| Frente | Que falta demostrar, sin rehacer codigo existente |
| --- | --- |
| Organizador/cliente/invitado | Sesiones separadas, guardar-recargar, acceso cruzado denegado y dos fiestas sin mezcla |
| Simulador comun | Recorrido hasta descarga; varios presupuestos mismo telefono conservados; paquete/menu/regalos/extras coherentes al cambiar |
| Simulador IA | Conversacion completa, fallo/reintento y presupuesto/CRM final, separado del simulador comun |
| PDF | Comparacion visual con pantalla, paginas numeradas, sin recortes/zoom, totales e items iguales; archivo >5KB no basta |
| Dinero historico | Conciliacion de los 19 originales contra importes/vinculos/fechas, solo lectura; no afirmada por tests ficticios |
| Entretenimiento software | Captura-resultado-entrega-siguiente, desconexion, dos dispositivos, moderacion y pedido-bar-stock observable |
| Integraciones | Credenciales/configuracion reales y flujo autorizado de extremo a extremo; mocks no prueban proveedores |
| Visual/rendimiento | PC/movil/totem, imagen-menu correcto, acciones visibles, movimiento reducido y medidas comparables |
| Candidato/publicacion | Claude adjunta compilacion y pruebas del SHA final; comprobar que ese SHA es el servido |

No son nueve errores confirmados: son criterios aun sin evidencia suficiente de cierre.
No volver a ejecutar toda la app por cada documento. Aportar evidencia vigente o ejecutar SOLO lo faltante.
Rutas E2E existentes verificadas: tests/e2e/simulator-budget-journey.spec.ts, tests/e2e/81-roles-y-pedidos-sin-duplicados.spec.ts y tests/e2e/trabajos-completos.spec.ts.
La ultima no acredita recorrido IA completo: sus cuatro casos son portada, Club, montos y contenido publico.

## Bloqueo concreto de este entorno

La pestaña local del entorno aislado no pudo seleccionarse mediante CUA: "The requested URL protocol is not allowed. Allowed protocols: http:, https:".
La herramienta prohibio rodearlo por otra superficie/ejecucion indirecta. Se respeto esa politica.
El servidor dev habia iniciado y sembrado su fixture (1 prueba), pero eso NO prueba pantallas.
No se hizo una corrida Playwright alternativa para eludir la restriccion. Claude puede aportar sus resultados independientes del entorno que ya tiene.
Las acciones no disponibles no se maquillan como aprobadas ni como error de la aplicacion.

## Proximo cierre, sin nuevas mejoras de alcance

Claude: corregir 100/101, agregar regresiones de comportamiento, compilar candidato conjunto y dejar SHA/log.
Gemini: terminar su tanda existente sin reabrir decisiones comerciales ni agregar funciones.
Codex: contrastar correccion y evidencias del candidato; no hay aprobacion integral mientras la matriz anterior carezca de resultados.
Dueno conserva fusion. No se genero una PR adicional ni se fusiono nada.
