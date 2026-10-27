# Auditoria697-700: centro de control nuevo

## Fuente y veredicto

PR1365 ABIERTA, SHA `b58abab75d94a732daf79b32aff54ec253ccf63c`.
Main observado `1081fd26737eae3586cb5b4ba923e2adbf32475c` integra1364.
La antigua1363 esta CERRADA: esta entrega usa rama nueva, no su rama anterior.
Claude publicado `cddd22c05951021d963ed4cea6694af5b7ece075` contiene orden237
sobre3bed, pero no `src/app/actions/centro-de-control.ts`. Esta evidencia complementa
el bloque236 posterior; no reencarga237. NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.

**No aceptar el centro de control de b58 como terminado.** Ocho grupos reproducidos,
22 criterios:5PASS/17FAIL, no17bugs independientes. Solo auditoria; app intacta.

## Evidencia ejecutada

| Sonda/resultado en docs/evidencias | Criterios | PASS | FAIL |
|---|---:|---:|---:|
|697-centro-control-sonda.cjs / 697-centro-control-resultados.json|13|3|10|
|698-reglas-y-web-sonda.cjs / 698-reglas-y-web-resultados.json|6|2|4|
|699-consumidor-centro-sonda.cjs / 699-consumidor-centro-resultados.json|3|0|3|

697 ejecuta cuerposTS exactos de `git show`, transpilados, con fronteras explicitas
de permisos/proveedor/persistencia/propuestas en memoria. `markMessageAsSent` real.
En concurrencia se clona cada lectura y se retienen ambas antes de escribir.
698 ejecuta reglas reales en dos contextos con filesystem local separado y almacen
compartido ficticio; tambien encadena acciones reales centro+web, contando guardados.
699 extrae porAST el inicializador exacto de `handleAprobar`, sin modificar su cuerpo;
simula estado/ventana/respuesta. No equivale a navegador renderizado.

Ejecutar `node docs/evidencias/697-centro-control-sonda.cjs` y equivalentes698/699.
`AK_QA_TYPESCRIPT` permite indicar paquete TypeScript instalado. Exit1 conserva las
aserciones incumplidas; no convertirlo en verde. Los JSON registran SHA256 de fuentes.

## A. P2 - Web anunciada como terminada sin guardado

`src/app/actions/centro-de-control.ts:339`, `darOrdenPorVozOTexto`, descarta el
resultado de `armarWebConIA`, silencia excepcion y registra exito. Si no encuentra
evento, usa ID fijo `fiesta-sofia-15`; responde siempre Sofia.
697 C01/C02 y698 W01: pedido QA Lucia, generacion1, guardados0, respuesta de exito
para Sofia. W01 usa ambas acciones reales. `armarWebConIA` en
`src/app/actions/fiesta/armar-web-con-ia.actions.ts:271` devuelve diseno sin guardar:
su consumidor debe hacerlo. No convertirla globalmente en autoguardado, porque
el editor tiene Deshacer. Resolver evento real, verificar resultado y persistencia.

## B. P2 - Respuestas fijas y trabajo no iniciado

Mismo archivo lineas450/457. 697 C03: consulta sabado responde horario18:00 y menu
celiaco sin leer fiesta/tareas. C04: orden desconocida responde "Me pongo a trabajar"
sin accion, propuesta ni registro. Son literales del codigo, no respuestas de Gemini.
Reusar motor/contexto real o explicar que no pudo resolver; no simular cumplimiento.

## C. P2 - Rechazo oculto y tarjeta eliminada

`aprobarItemOK:225` ignora `success:false` de acciones hijas, absorbe error de
escritura y devuelve true incluso si post no existe; registra aprendizaje antes.
697 C05/C06/C09/C10 prueban esas variantes. Consumidor real
`src/app/(app)/centro-de-control/page.tsx:180`, `handleAprobar`, quita tarjeta antes
de esperar y no la restaura ante rechazo/excepcion:699 reject/throw.
Propagar errores y conservar tarjeta/edicion; aprendizaje no puede dar por aplicada
una accion fallida. Rechazar tiene patron parecido en lectura, NO otro caso ejecutado.

## D. P2 - Dos aprobaciones pierden una

697 C07: dos posts distintos, ambas respuestas true, solo uno termina Aprobado.
`aprobarItemOK:251-262` lee/reemplaza lista completa de `social-posts.json` sin
mutacion atomica porID. Corregir intercalacion sin cambiar otras publicaciones.
Reproduccion de contrato de almacenamiento en memoria, NO Firestore real.

## E. P2 - Correo marcado enviado sin envio

697 C08: email pendiente termina enviado/sentAt/sentBy, cero envios.
`aprobarItemOK:249` usa el marcador real `markMessageAsSent`, no un envio.
La pantalla solo abre ventana cuando hay enlaceWhatsApp. Diferenciar aprobado,
abierto y enviado. Conservar envio manual del dueno; abrir WhatsApp no demuestra
entrega. No se enviaron mensajes reales.

## F. P2 - Cambiar texto conserva enlace anterior

699 edit: original OLD, correccion CORRECTED, `window.open` sigue recibiendo
`text=OLD`. Se reutiliza `item.enlaceWhatsapp`; el texto nuevo solo va a la accion,
que tampoco modifica el mensaje programado. Reconstruir enlace y guardar borrador
editado antes del recorrido manual, conservando texto ante error.

## G. P1 - Regla apagada ignorada entre instancias

`src/lib/ia/reglas-de-la-ia.ts:40/62/213/262` prioriza archivo local y escribe
diccionario completo. 698 R01: B guarda apagada en compartido, A sigue leyendo sola.
R03: otro ajuste desde A elimina la regla que B habia apagado. Fuente compartida
autoritaria, cambio atomico por clave y coherencia ante otros procesos/reinicio.
Consumidores reales: `ejecutarAgentesAutonomos` en `src/lib/agentes/motor-agentes.ts`
y `darOrdenPorVozOTexto` consultan `getReglaParaTarea`.
No demuestra envio automatico de dinero/mensajes: conservan prohibiciones propias.

## H. P2 - Fallo remoto de regla dice guardado

698 R02: almacenamiento compartido rechaza, respuesta true, instancia nueva lee
sola en lugar de apagada. `guardarJson` silencia fallo y `guardarReglaIA` anuncia
exito. Un archivo temporal local no demuestra persistencia compartida.

## Positivos y limites

697 C11 permiso denegado impide efectos; C12 apagada leida impide web; C13 aprobacion
secuencial guarda texto. 698 R04 prohibicion de mensajes sola; R05 lectura local
tras guardado correcto. No aceptar todosroles a partir de esos cinco controles.

La suite existente `el-centro-de-control-manda.test.ts` comprueba frases, registro
y estado aceptada. Su(c) simula web exitosa, no verifica guardado; no cubre fallos
de almacenamiento ni dos instancias/aprobaciones. Puede pasar con A-H presentes.

Primera698 tuvo4HARNESS_ERROR por import default path/fs del transpiladorQA.
Preservados `698-inicial-error-qa.cjs/json`; se habilito esModuleInterop solo en
la sonda y se ejecuto la final con0erroresQA. No contarlos como defectosapp.

Un agente economico leyo solo editor de web; sus dos sospechas sobre dialogo y
respuesta tardia NO fueron reproducidas, NO se cuentan ni se ordenan corregir.
Agente cerrado. Se leyeron seis comentarios anteriores1365 y237Claude: fotos,
alerta cocina, IA sin sesion, cron sin sesion y contacto/dedupe postfiesta ya tenian
hallazgos; no se reemitieron ni se atribuyeron a esta auditoria.

Sin NextHTTP, navegador renderizado, SDK, modelo/proveedor reales ni build nuevo.
Sin cuentas/datos/cargos/mensajes/hardware reales. Sin appedit, deps, merge/deploy.
No procesos persistentes. D4/5278/22 siguen historicos porfuente, no certifican b58.
Dictamen limitado: corregir/retestear A-H; no aceptar234/235 completos ni0errores.
