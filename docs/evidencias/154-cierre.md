# Cierre consolidado 151-154 - 20/10/2026

Esta entrega cierra una tanda de pruebas, NO certifica toda la app ni cero errores.
Codex solo audita, prueba y documenta; no implemento cambios de app ni fusiono.

## Versiones contrastadas

- Main: `894d01603e0e03cebc8f90a6ccf869ef86bbe1de`, PR1339 integrada.
- Claude publico: `d0147992eb153e310029c3c88f4366c5150b21a2`; runtime, configuracion
  y dependencias iguales a main. NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.
- QA151: `2e5363f259461a31bf6b31807872c227855415de`.
- QA152/153: `253838732287c2704d78113d15ace9c025cb82c9`.
- Gemini1337: `45a0b1d4783ad58846c2e2d07ad8f318287024bf`, devuelta;
  no aprobada por esta auditoria. Orden195 pendiente.

## Resultados observados

| Comprobacion | Resultado | Alcance y limite |
| --- | --- | --- |
| Builds151/152 | 2 exit0, tipos y lint | Fuentes2e5363f/2538387; no build local894d aceptado |
| Regresion152 | 802 suites,4998 tests:4997PASS,1FAIL,0omitidos | ENOENT de fixture del blog omitido por checkout; no fallo de contenido |
| Blog154 | 1PASS | Funcion real y blob Git canonico, mismas aserciones; NO otra corrida amplia verde |
| Compartir cancelacion154 | 4PASS | Cuerpo real del handler, APIs del navegador dobles; cambio nuevo hasta894d |
| Contrato171, movil | 1PASS | Titulo2lineas, sello/etiqueta separados, texto del boton contenido |
| Panel social172, movil | 1FAIL | Dock tapa Evento:2610.1933596357703px2 a390x844 |
| Cocina184 | 2PASS | Fecha civil2027-08-08, UTC/Uruguay, pantalla y medio print |
| Agenda/costos186, antes179 | 4PASS | PC/Pixel7, enlace598, telefono099 almacenado intacto y titulo visible |
| Proveedores153 | 6PASS | Cuerpos reales de tres acciones, almacenamiento/sesion controlados; identidad porID |
| Guardado por perfiles152 | 10PASS | Funciones reales con almacenamiento controlado |
| Guardado SDK154 | 9PASS,2transacciones,0documentos restantes | SDK Firestore real al emulador demo, fuente894d |
| Otros retornos198 | 12PASS | Reuniones,tareas,suspender,reactivar por dueno/secretaria/personal; I/O y efectos dobles |

Los siete PASS y un FAIL nativos corresponden exclusivamente a171/172/184/186.
Los consumidores visuales, dock, AppShell y CSS de172 no cambiaron hasta894d;
no se presenta otra ejecucion nativa sobre894d. Las fuentes ejecutadas151 estan
congeladas y sus hashes comprobados en `154-sources-verificados.json`.

## Dinero y permisos: que demuestra154

Se conservaron sueldo3000,costos9500,pago60.30 y cuota1000 al guardar una entrada
recortada. Dueno, operador asignado y secretaria guardan segun sus permisos;
operador no asignado y perfiles sin credencial del portal son rechazados.
La respuesta no devuelve al perfil restringido los campos que no puede ver.

La firma de sesion, permisos, recorte, preservacion y funciones de transaccion
son codigo real; el SDK lee/escribe en el emulador y ejecuta dos transacciones.
El adaptador de sesion entrega el usuario de un token verificado por el firmador
real, pero NO es una peticion HTTP Next con cookies. Lecturas de empleados y
escritura directa del dueno usan adaptadores SDK. Esto no acepta los portales
dedicados de cliente/invitado ni todas las acciones financieras.

Los otros cuatro retornos198 pasan12casos adicionales con funciones reales y
almacenamiento controlado. Notificaciones, Google y aprendizaje no salen de QA;
la liquidacion de suspension es un doble, NO una validacion de su aritmetica.
La perdida de sueldo hallada en151 ya fue corregida por Claude en2538387:
se conserva el fallo historico, sin crear otra orden ni atribuirse su arreglo.

## Pendientes reales y limites

1. Orden172: corregir el solapamiento movil y repetir solo ese delta entregado.
2. Orden195 y entrega1337: pendientes del programador; no confundir con cierres.
3. No existe aceptacion exhaustiva de cada control/estado/rol. El inventario de
   421rutas/14areas/7perfiles/6401AST NO demuestra esa cobertura funcional.
4. No certificados:19documentos manuales originales, OAuth/cuentas reales,
   modelos/voz, sincronizaciones externas, hardware y todos los datos publicados.

El GET publico `/api/health` respondio200 con894d a17:01:49UTC, compilada
16:42:52UTC. Sus booleanos indican configuracion, NO integracion comprobada.
Los cierres anteriores150simulador/PDF/CRM,141clienteSDK,1353D/agenda/DJ y
142cabecera se conservan POR ALCANCE Y SHA, no se convierten en aprobacion global.

## Entrega y limpieza

Ver `154-consolidado.json`, recibos por prueba y `154-incidencias-qa.md`.
No nueva validacion amplia por documentacion;153 quedo interrumpida y NO aceptada.
SDK/emulador/agentes propios cerrados,0datos demo restantes y diffQAfuentes0.
No se detuvieron procesos ajenos ni se usaron cuentas,cargos,mensajes o hardware
reales. Propuesta solo docs/QA: Claude debe juntarla con su proxima tanda, no
fusionarla sola ni confundirla con correcciones implementadas por Codex.
