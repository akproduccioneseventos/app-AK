# Auditoria 82 - continuar pendientes, sin rehacer los cinco arreglos de 80/81

Fecha: 9/10/2026. Main `1b57abbec5162402cc30269cc276398707b28d55`.
HEAD documental al iniciar: `a7715164c09e17178bc00b3b31be95d9772e8f3a`.
Rama: `codex/auditoria-81-validada-20261009`, PR 1273. No fusionada.
Codex audita y documenta; no se modifico codigo de la app. Sin build nuevo.
Se reutilizo la copia compilada aislada `497ee725` y emuladores demo locales.
No se expusieron credenciales ni se escribieron datos reales o a proveedores.

## Aceptacion focalizada, no certificado de area completa

| Area | Resultado de esta tanda | Limite |
|---|---|---|
| Portal cliente | 10 E2E aprobadas: mensaje enviado y conservado al recargar; evento de hoy no concluido; asistente y WhatsApp separados en 360/660/1280 px, PC/movil | No prueba todas las operaciones del portal ni entrega externa de mensajes |
| Invitado | 4 E2E aprobadas: feedback y RSVP recuperan controles y conservan campos tras cortar POST, PC/movil | No reemplaza todos los permisos entre dos eventos ni envio real de invitaciones |
| Espejo | 2 E2E desktop aprobadas: consentimiento requerido bloquea captura; al aceptar habilita; ajuste desactivado no pregunta | Camara sintetica; no captura/impresion fisica. Dos casos mobile omitidos por el test original |
| Barra | 4 E2E reforzadas aprobadas, PC/movil: pedido NUEVO se cancela y persiste; pedido PREPARANDO no ofrece cancelar/cambiar | Una sonda NUEVA de corte de cancelacion falla: BAR82-CANCEL |
| Estaciones | 2 E2E desktop existentes aprobadas: 360/Bogue llegan a compartir mostrando marca; buzon abre sin error tecnico | El test del buzon NO mide la cuenta regresiva aunque su titulo lo diga; el de marca NO verifica bytes/descarga del video ni hardware |
| Contrato, portal, espejo | 9 suites / 41 tests unitarios aprobados sobre codigo main actual | Helpers, mocks y algunas comprobaciones de presencia; no son firma real, asesoria legal, Gemini real ni E2E de todas las funciones |

Total aprobado adicional: **63 tests** (41 unitarios + 22 de navegador, incluidos
los dos de estaciones). No sumar los retests del mismo caso como funciones nuevas.

Original UI: `82-e2e-portales-original.json`: 16 pasan, 4 fallan, 2 omitidas.
Los cuatro fallos son semilla de barra incompatible con emuladores: el lector
prioriza la coleccion `bar_drink_orders`, pero el test solo escribia
`fiesta.others.barraTecnologica.orders`. No se clasifican como fallo publicado.
La sonda nueva escribe en el emulador y comprueba el registro realmente guardado.
Resultados: `82-e2e-barra-estaciones.json` (4 pasan),
`82-e2e-barra-mobile.json` (2 pasan), `82-unidades-resultados.json` (41 pasan).
La suite de itinerario registra aviso de carga ESM de jose en Jest, capturado por
Firebase; sus assertions pasan. Esto NO demuestra SDK productivo funcionando.

## Hallazgo nuevo reproducido

Area: barra. Commit fuente contrastado: `1b57abbec5162402cc30269cc276398707b28d55`.

**BAR82-CANCEL, P2:** se rechaza la cancelacion por corte de respuesta y el boton
queda bloqueado. Handler sin catch/finally, `MiniQuiosco.tsx:117-126`, boton:185;
consumidor real `page.tsx:847`. La sonda inicial y la estricta fallan en disabled.
La estricta aborta una sola solicitud que contiene el ID del pedido: las consultas
posteriores siguen funcionando. El pedido permanece NUEVO en la base emulada.
`82-e2e-barra-corte.json`, `82-barra-corte-desktop.png`; orden 132 para Gemini.
No se envio cancelacion a una fiesta real. No se afirmo fallo en produccion sin UI
productiva autenticada. La comparacion confirma el mismo codigo causal en main.

## Contraste de versiones

Fetch de main al finalizar sin cambio: `1b57abbec5162402cc30269cc276398707b28d55`.
La PR abierta al consultar es solo 1273 documental. Los cambios locales en curso
de otras IA NO se conocen; la orden exige contraste antes de programar.
No cambiaron, entre build 497ee725 y main, invitacion, portal-cliente, evento,
barra actions/helpers, entretenimiento, portal-session, data-service ni las dos
pruebas de barra/ajustes de estaciones. Hay cambios en automatico, notificaciones,
cuotas y redes: NO transferir estos resultados a esas funciones modificadas.
Los 41 unitarios SI se ejecutaron sobre la fuente actual, no sobre la copia vieja.

## Cobertura del contador: inventario, no errores inventados

Un ayudante economico hizo el inventario inicial y fue cerrado. Codex contrasto
el resultado, excluyo tests/mocks y corrigio el conteo de estados: son CINCO
sin-revisar (contrato, portal, invitado, estaciones y asistente), no cuatro.
Esto significa falta de cierre en ese registro, no ausencia de pruebas anteriores.

14 areas, 55 prefijos existentes; 0 rutas declaradas inexistentes. De 2174 archivos
src se clasifican 434. Excluyendo tests/mocks: 1535 archivos, 424 clasificados y
1111 fuera del mapa. No llamar a esos 1111 archivos defectuosos o nunca auditados.
Lista completa y comando reproducible: `82-mapa-cobertura.mjs/.json`.

La sonda SIMULADA de Git ejecuta `estadoReal` real: una hipotetica area permisos
limpia permanece limpia al cambiar `src/app/actions/auth.ts`, omitido del mapa.
No se modifico auth ni se invento una rama con ese cambio. Reproduce el limite
de invalidacion por prefijos. Ampliar orden 131, no reprogramar otra vez el contador.
Otros ejemplos existentes omitidos: Google Workspace y ciclo de vida de fiestas.

## Los 19 presupuestos: limite exacto y proximo paso de Claude

Se encontro credencial local cuyo proyecto coincide con .firebaserc y apphosting.
No se copio ni publico. Dos lecturas SDK directas, sin acciones de app ni escrituras,
fueron rechazadas con gRPC 7: **Missing or insufficient permissions.**
`82-base-real.json` contiene solo resultado sin credenciales o clientes.
No demuestra deuda, base caida, presupuestos ausentes ni error de sincronizacion.
`src/data/presupuestos.json` es un fixture vacio, no los datos del negocio.
El codigo contiene una migracion de 29 presupuestos verified; tampoco prueba que
sean los 19 solicitados ni que esos 29 esten cargados en produccion.

Claude: usar lectura ya autorizada del servidor o exportacion privada, sin ampliar
permisos publicos ni guardar originales/datos personales en Git. Identificar primero
los 19 documentos originales y sus IDs; conciliar fechas documentales, invitados,
items/regalos, descuento, total, pagos confirmados, factura y fiesta asociada.
Separar eventos pasados de futuras fiestas sin cambiar su estado por esta auditoria.
Sin originales no se certifica que la transcripcion coincida con lo contratado.
No se pide tarjeta ni se investigan checks de facturacion GitHub.

## Que sigue sin aceptar

La integracion externa real de cada canal, conciliacion de los 19 originales,
firma/entrega contractual completa, todos los flujos de cada area, video final
descargable/render/impresion y equipo fisico. Reutilizar evidencia existente cuando
SHA, entorno y assertions coincidan; no ejecutar otra auditoria completa al azar.
Los cinco arreglos de ordenes 130/131 estan en programacion segun el dueno: no se
esperaron ni se reprogramaron. No se limpiaron areas automaticamente ni se dio
certificado de cero errores. Browser GUI fallo al abrir el entorno (timeout 35 s);
Playwright SI ejecuto las pruebas; se inspecciono la captura mobile de PREPARANDO.

Servidores/emuladores propios se detienen al cerrar esta tanda. Copia conservada
solo para repetir el SHA aislado comprobado, nunca para certificar codigo posterior.
