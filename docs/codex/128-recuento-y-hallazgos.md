# Auditoria128 - cierre de cobertura comprobada, no certificado global

Area: contrato y su consumidor del portal.
Commit: `ce1ac07d1bb16c24dd73e2d26ac55038028a2472`.
Hallazgos: DOS P2 reproducidos, orden165 para Claude/Gemini.
Codex solo audito, ejecuto pruebas y documento; no programo app ni compilo.

## Resultado observado

- Una pasada amplia de las pruebas existentes:769suites/4819tests PASS,
  0fallos/omitidos,576.69s. Fuente app congelada ce1; documentos en99d53beb.
  Entorno de proceso desde lista permitida, sin claves heredadas y credencial
  centinela inexistente. Guardia restauro bytes originales al terminar.
  Resultado completo y log byte a byte en128-jest.json.gz/128-jest.log.gz;
  resumen legible y hashes de archivo conservados, sin ocultar resultados.
- Sonda nueva de fecha: componente React y accion real de resumen con dobles,
  `2027-08-08` aparece como `07 de agosto de 2027` en Uruguay.1FAIL.
- Sonda nueva de recibo: accion fisica real con dobles, recibo devuelve error
  pero respuesta final solo success:true.1FAIL; control exitoso1PASS.
- No se editaron app, expectativas de pruebas existentes ni datos del negocio.
  No se usaron cuentas, storage, cobros, mensajes ni hardware reales.

## Las14areas, con un inventario verificable

`128-matriz-areas.json` enumera421page/route bajo las14areas,0fuera del mapa.
Esto SOLO prueba asignacion de rutas. Las cuentas se solapan y barra contiene
motor sin rutas propias; sus pantallas estan tambien en estaciones.
La matriz enlaza pruebas que importan directamente fuentes del area mediante
AST de TypeScript. Es RELEVANCIA DE REFERENCIA, no cobertura de ejecucion:
un import puede estar simulado, y no demuestra que se pulso cada boton.

| Area | Situacion de esta tanda |
| --- | --- |
| plata | Pruebas existentes dentro de la pasada amplia; no cierre funcional total |
| contrato | Revision focalizada y dos hallazgos165; falta navegador completo |
| comida | Pruebas existentes; viaje nativo compras/catering no ejecutado ahora |
| permisos | Pruebas existentes; no todos los transportes/roles probados ahora |
| fiesta | Pruebas existentes; no cada guardado/sincronizacion nativa actual |
| portal | Regresiones164 y nuevo defecto de fecha; no area limpia |
| invitado | Pruebas existentes; faltan recorridos nativos actuales conciliados |
| web | Web actual identificada y5vistas de demo abiertas; no todo el embudo |
| redes | Pruebas existentes; no proveedores externos reales |
| estaciones | Pruebas existentes; no captura/entrega real ni hardware |
| barra | Pruebas existentes; no nueva aceptacion nativa pedido-a-preparacion |
| asistente | Pruebas existentes; no modelo/voz externos reales |
| personal | Pruebas existentes; no nueva aceptacion nativa por cada rol |
| automaticos | Pruebas existentes; no cron/proveedores reales certificados |

Las evidencias anteriores109/124/125/126 se conservan: antes de repetir un
caso, comparar fuente/dependencias y resultado vigente. Esta tabla NO dice
que nunca se revisaron esas partes ni que cada pendiente sea un error.
No se marcaron14areas limpias ni se modifico el contador para hacerlo verde.

## Publicado y navegador de solo lectura

GET real a https://akproducciones.uy/api/health informa ce1ac07d, compilada
2026-10-15T06:34:26.428Z, status:ok (consulta11:33:07UTC).
Flags firebase/gemini/googleWorkspace/mail:true, instagram/mercadoPago:false.
Son flags de configuracion, NO prueba de extremo a extremo de esos servicios.
No se adjudica un fallo de integracion solo por el flag ni se piden tarjetas.

En navegador IAB se abrieron las5vistas publicas de La app de tu fiesta:
Portal Cliente, Invitacion, Mural, Barra y Recuerdos. El contenido final cambia
correctamente despues de la animacion. Se vieron sus controles/textos, NO se
usaron como prueba de RSVP/pedido/captura/descarga reales. Sin enviar forms ni
WhatsApp, sin nuevas cuentas/datos en produccion. Tab propio cerrado al terminar.

Incidencia propia: AX llamaba checkbox a botones aria-pressed; el primer
selector no encontro nada. DOM real corrigio la seleccion a button. Leer justo
al cambiar capturaba el panel saliente por AnimatePresence mode=wait; esperar
el control del panel nuevo descarto el supuesto desfase. NO es un defecto app.

## Limite concreto para terminar los viajes internos

No hay compilacion QA actual accesible en este checkout: .next/recibo125 es
b520, y los puertos3300/3301/3302/8085 no estaban activos. No se compilo ni se
disfrazo ese artefacto viejo de ce1. Claude compila y puede reutilizar su
artefacto aprobado actual para poner el entorno ficticio al alcance de Codex.
Ver requisito existente114; no abrir otra orden equivalente ni volver a
calificarlo como pantalla rota. Version de produccion actual SI comprobada.

No hay evidencia para afirmar todas las funcionalidades auditadas. Lo cerrado
en esta tanda es la pasada automatica descrita y los dos casos focalizados,
NO ceroerrores, ni auditoria nativa completa, ni ensayo fisico.
