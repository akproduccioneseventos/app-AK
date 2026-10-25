# 158-159 - Tareas publicas y fecha de seguimiento

Fuente main894d01603e0e03cebc8f90a6ccf869ef86bbe1de. No appedit/build/merge.

158:14casos,12PASS/2FAIL. Puerta de tareas y handlers GET reales, motor real de
seguimiento/preparacion/registro con almacenamiento ficticio; detector de alertas
controlado para el vigilante. Request/Response en proceso con NextResponse.json
adaptado, no HTTP de produccion.

Dos respuestas sin CRON_SECRET incluyen nombre ficticio/evento/detalles privados
dentro de resultado. Es UNA forma de respuesta en dos consumidores, orden201
paraClaude. Con clave ausente/incorrecta en modo configurado se rechaza401 antes
de ejecutar; correcta permite detalle; limite429 y fallo500 no marcan corrida.
No se envia ningun mensaje: solo se prepara el borrador en memoria.

Es un fallo CONDICIONAL. No se leyo la configuracion real de produccion ni se
observaron clientes reales. La decision de permitir preparacion anonima limitada
sinclave se conserva: corregir salida de datos, no apagar tareas como atajo.

159:4casos,2PASS UTC/2FAIL Uruguay. Funcion REAL ejecutarPerseguidorPresupuestos,
ramas5dias y14dias, prepara mensajes sobre2027-08-08 que dicen7/8/2027 en Uruguay.
UTC8/8 es el control. Se comparan partes civiles, no se exige padding. Misma
funcion en main894d y1337/45a0. Cola/lecturas/log son ficticios, ningun envio.
Se amplio193bloque3, no se creo otra orden para la misma familia de fechas.

Combinadas156-159:102casos observados,95PASS/7FAIL de tres causas documentadas,
no siete bugs ni una auditoria global completa. Ver159-consolidado.json.
No se repitieron las suites/builds aceptadas ni se cambiaron pruebas para ocultar
defectos; la unica expectativa QA corregida fue el array vacio explicado en156.

Limites de esta tanda: sin navegador nativo, bases/colas reales, OAuth, modelo,
voz, sincronizacion externa,19originales ni hardware. Estos limites no son fallos
de producto confirmados y tampoco se convierten en aprobaciones.
