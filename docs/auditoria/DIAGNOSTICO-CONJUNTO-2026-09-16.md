# Diagnostico conjunto AK - 16 de septiembre de 2026

## Veredicto y alcance

No hay evidencia suficiente para certificar toda la app lista para publicar. Esto NO significa que todo este roto. Hay correcciones reales y recorridos parciales satisfactorios, junto con fallos reproducidos y flujos sin prueba completa.

Codex revisa y documenta, no cambia la app ni compila esta tanda. Gemini implementa interfaz y operacion; Claude dinero, comida, permisos y compilacion. No se fusiona nada. No crear una implementacion nueva para algo ya corregido.

## Versiones contrastadas

- main: `da6c566fbefdf82efec484f7fc9830db6ab5c4de`.
- PR 1209: `f6b619a7cc44170de70059842abe9e776c0b5b29`.
- PR 1207: `29943cdd80ed7c14ceabc650544eb2aa304516a2`.
- PR 1206: `4cd2d024fd5be0af1ab992d305bd06d6e279a6f5`.
- PR 1202: `6622427c604930b02910a2a2778bf20a72683f40`.
- PR 1197: `f0ac2027b7e25dc6845e1230fba60b0c9055ddb3`.
- Web observada el 14/9: akproducciones.uy, SHA desplegado no identificado. No equiparar web, main y PR.
- Inventario actual: 360 archivos page.tsx; no equivale a 360 recorridos aprobados.

## Fallos y correcciones, sin duplicar ordenes

| Asunto | Evidencia / estado | Siguiente comprobacion |
| --- | --- | --- |
| Guardar tras fallo de lectura | STORE01 reproducido en 1207. main ahora usa leerGenericJsonParaGuardarEncima y rechaza lectura fallida. Correccion presente; no ejecutada por Codex en Firebase. | Contrastar 1207 con main antes de integrar. Reusar orden 58 y prueba guardar-un-cambio-no-borra-el-resto. No reinstalar lectura incierta como documento vacio. |
| Cambio de invitado en Touchpix | ENT03 parcialmente corregido en 1209. Sonda nueva sobre callbacks reales: control normal PASS; retake durante subida FAIL: uploading=true, queued=false para el siguiente turno. | Reusar devolucion 48 de Claude; extenderla con estado pendiente y concurrencia A/B. Gemini. |
| Pruebas de entretenimiento | Los cinco tests nuevos de 1209 definen su propia logica, sin importar las pantallas. El callback productivo consulta liveSession, variable exclusiva de la sonda. | Quitar dependencia de la sonda del producto. Probar componente real con respuestas diferidas y sin variable global liveSession. |
| Decoracion, opinion del cliente | DECO14 reproducido en 1206/0f03c998: opinion guardada antes de fallar sincronizacion de costos por permisos. No repetir ese guardado en datos reales. | Contrastar cadena completa en HEAD actual, separar opinion de accion contable. Claude. No declarar vigente en nuevo SHA sin contraste. |
| Decoracion, edicion mientras guarda | DECO15 reproducido en 0f03c998. 4cd2d024 incorpora contador de versiones. | Correccion presente, pendiente prueba del componente real con edicion B durante guardado A y recarga. No pedir implementarla otra vez. |
| Avisos | AV01-03: defaults distintos, preferencias/destinatario perdidos, categoria nula aceptada. Sondas en antiguo 0f03c998, 3 FAIL y 2 PASS. | Verificar dependencias frente al HEAD actual antes de modificar. Orden 56, no otra orden duplicada. |
| Redes, apertura bloqueada | RED01 en 1202: window.open bloqueado y copia fallida pueden anunciar apertura exitosa. 2 FAIL, 1 PASS aislados. HEAD sigue igual. | Orden 47; mostrar resultado real, no confundir abrir red con publicar. Gemini. |
| Suscripcion de novedades | La version vieja de 1197 devolvia exito sin persistir. Ya corregido en main y 1202 en el contraste previo. | No rehacer. Resolver version final al integrar PR antigua. |

### Detalle nuevo sobre 1209

Sonda: docs/evidencias/1209-sesion-real.cjs. Ejecutada con Node 24 / TypeScript 5.9.3 contra f6b619a. Extrae handleUpload y retake reales con AST; simula almacenamiento/red/camara, NO monta React ni prueba hardware.

1. A inicia subida; retake real cambia sesion; se modela la foto de B pendiente; termina A.
2. Resultado: el indicador Subiendo sigue activo; setQueuedOffline(false), anterior al control de sesion, borra el indicador pendiente de B. Exito de A si queda correctamente suprimido.
3. Lugares: Touchpix lineas 839 y 865 (queued=false antes de guardia), 905 (queued=true antes de guardia), 935-938 (finally), retake 722-749 (no libera isUploading).
4. Aclaracion a la devolucion de Claude: poner finally incondicional no es una solucion general si B ya inicio otra subida. A podria apagar el indicador de B. La sesion nueva debe liberar el estado heredado y cada operacion solo finalizar el estado que posee. Comprobar A pendiente -> B nueva -> B subiendo -> A termina, ademas del caso sin subida B. No imponer como test que finally deba carecer de if.
5. La sonda AST es evidencia parcial, no reemplaza E2E. Sus resultados esperados fallan en esta version; no maquillarlos para obtener verde.

## Experiencia publica observada el 14/9

- Inicio y menu: enlaces a simulador, blog, Club Uruguay y servicios presentes. Fotocabina, 360 y espejo visibles sin Ver mas. Conservar.
- Galeria: el kebab observado figuraba como Catering, no Decoracion. No repetir el hallazgo viejo como actual. No cotejadas todas las fotos ni deduplicacion externa.
- Blog: tarjeta observada con imagen encima del texto, sin el solapamiento reportado anteriormente. Articulo completo y todas las resoluciones sin validar.
- Club Uruguay: fotos y CTA presentes. Faltaria confirmar capacidad/direccion util para decidir una visita, si el negocio dispone de esos datos; es oportunidad, no defecto confirmado.
- Simulador: inicio, formulario y validacion de campos obligatorios recorridos. Dos presentaciones antes de cargar datos: friccion comercial observada. No se genero un prospecto real ni presupuesto ficticio en produccion.
- Acceso: formulario de login cargo en ese recorrido. No se probo login efectivo, Gmail ni recuperacion de clave. No declarar solucionados por ver el formulario.
- Fallos de carga observados: imagen de portada sin cargar y ERR_CONTENT_DECODING_FAILED en una navegacion. Causa y persistencia no establecidas; requieren nueva reproduccion, no culpar al servidor o al navegador sin evidencia.
- Evitar promesas comerciales absolutas como cero fallas. Proponer copy verificable al dueno, sin ocultar servicios ni cambiar ofertas automaticamente.

## Cobertura pendiente de demostrar por recorrido

Esta matriz enumera evidencia faltante en ESTA revision, no afirma que nadie la haya probado nunca. Reutilizar registro anterior solo con SHA, entorno y resultado rastreables.

| Area | Resultado que debe verse para aceptarla |
| --- | --- |
| Web y aterrizajes | Cada CTA lleva al destino correcto; medios cargan en movil y PC; servicios/fotos corresponden; movimiento perceptible y legible con movimiento reducido. |
| Simuladores normal e IA | Cambiar paquete recalcula extras sin repetidos; menu coincide con referencia; varios presupuestos del mismo telefono se conservan; ajuste anual y precio por persona correctos; descargar PDF real con paginas completas y sin controles internos. |
| CRM y agenda | Prospecto llega con origen y presupuestos; seguimiento persiste; avisos alcanzan destinatario correcto; no declarar enviado lo que solo se abrio. |
| Portal cliente | Acceso por su evento, datos privados filtrados en servidor; opinion, seleccion, pago y documento llegan a su modulo y persisten tras recarga. |
| Invitados y recepcion | RSVP, mesa y acceso correctos; otro token no obtiene otra fiesta; doble check-in no duplica. |
| Mural y red social | Publicar, moderar y retirar se refleja en invitado, operador y pantalla; reconexion no duplica; contenido no autorizado no llega al navegador publico. |
| Barra y totem | Trago correcto e ingredientes; pedido y nombre llegan una vez a la cola correcta; preparacion/entrega se sincronizan entre dispositivos. Confirmar con dueno destino barra frente a DJ. |
| Entretenimientos | Captura, vista previa, repetir, publicar, descarga/QR e impresion segun estacion; segundo invitado, permiso de camara, caida de red y cola local. 360, espejo IA e impresora requieren sus equipos reales. |
| Planificacion y 3D | Datos acordados se reflejan en tareas, mesas, catering, personal, carga y portal; plano y 3D representan mismos objetos/medidas; guardar no pierde cambios concurrentes. |
| Contabilidad y 19 presupuestos importados | Conciliar cada origen con total, regalos, seña, pagos confirmados y saldo; no duplicar factura/presupuesto; revisar fechas pasadas sin alterar historial. Sin acceso a esos registros no afirmar conciliacion hecha. |
| Empresa y recursos | Ajustes producen efecto real; disponibilidad de personal/salon/equipo no se solapa; stock y devoluciones persisten. |
| Integraciones | Gmail, WhatsApp, Meta, YouTube, TikTok y pagos: permisos reales, recepcion/envio autorizado, token vencido, reintento sin duplicar, trazabilidad. Un perfil guardado no acredita conexion. |
| Asistentes | Rol y contexto del evento correctos; acciones autorizadas y confirmadas; error de herramienta no se anuncia como exito; memoria separada por acceso. |
| Post-fiesta y operacion | Reporte reconcilia origen; respaldo restaurado en entorno aislado; despliegue identifica SHA; pruebas integrales pasan juntas o se documenta y acepta su riesgo. |

## Por que los verdes anteriores no cierran esta matriz

- docs/COBERTURA-AUDITORIA.md contiene cierres globales de agosto, recuentos 348/350 y afirmaciones absolutas sin SHA por recorrido. Conservar como historico, no como certificado actual.
- recorrido-de-pantallas comprueba principalmente carga, texto y errores; no acciona cada boton ni comprueba persistencia. El reintento nuevo de main mejora tolerancia, no agrega cobertura funcional.
- docs/pantallas-rotas-conocidas.json esta VACIO en main: no se encontro una exclusion activa que ocultara fallos. No confundir capacidad de excluir con exclusiones presentes.
- ESTADO-ACTUAL de main reconoce tres corridas completas fallidas y pruebas que pasan aisladas. Eso prueba intermitencia; no prueba por si solo que la app quede exonerada y la maquina sea la unica causa.
- La suite de sesion segura de 1209 prueba una reimplementacion local. Debe fallar si se rompe el consumidor productivo, no solo su ejemplo.

## Bloqueos y siguiente entrega

El 16/9 el navegador disponible no tenia pestañas ni sesion de AK expuesta. La copia local original del repo no esta disponible; se contrasto GitHub por SHA y snapshots aislados, no Graphify completo. No se ejecutaron build, pagos reales, mensajes externos ni cambios en las 19 fiestas. No se lanzaron agentes nuevos ni se repitieron compilaciones.

Para completar la auditoria funcional faltan una sesion de prueba con roles, una fiesta/prospecto de prueba aislados y equipos de entretenimiento para los flujos fisicos. Mientras no esten, los renglones correspondientes quedan SIN COMPROBAR, no aprobados. La correccion queda para la tanda acordada con el dueno, despues del diagnostico; este documento no inicia Gemini ni Claude automaticamente.

