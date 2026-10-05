# Cierre de la tanda de auditoria - no aprobada para publicar

**Fecha:** 5 de octubre de 2026.
**Area:** cierre transversal de evidencia parcial; no es una revision completa de las 14 areas.
**Commit del codigo:** `212ba37da9c7540fd044b9de6e0edfe448ddfbe5`.
**Hallazgos:** cinco reproducidos con sondas aisladas y trece observaciones de codigo pendientes.
**Veredicto:** NO APROBADA. Se cierra este informe, no se certifica terminada la aplicacion.

GitHub main se consulto nuevamente al cerrar y seguia en ese SHA; no habia PR abierta.
La documentacion esta en `codex/auditoria-66-20261005`, no en main. **NO CONTRASTADO CON LA
TANDA LOCAL/NO SUBIDA** de otras IA. Antes de corregir, contrastar su HEAD y las decisiones
del dueno. No se conoce el SHA del despliegue visto en el recorrido publico de hoy.

## Evidencia reutilizable, sin repetir auditorias

- 589 suites y 3.383 pruebas Jest aprobadas sobre ese codigo, en entorno aislado.
  Los subconjuntos focalizados estan incluidos: no sumar sus cantidades.
- Tres sondas ejecutaron funciones reales con persistencia/servicios simulados y
  reprodujeron SOCIAL01, AUTO01-02 y PERS01-02. No tocaron datos remotos.
- El codigo 0 de esas sondas confirma el defecto base, no una correccion ni aceptacion.
- Recorrido publico parcial: portada, galeria, Club Uruguay, blog e inicio del simulador.
- E2E de invitado inconcluso: no demuestra funcionamiento ni un defecto de produccion.
- No se ejecuto build en esta tanda. Claude conserva la compilacion y su registro de SHA.

Detalles, archivos, consumidores y limites: [informe 66](66-auditoria-sobre-212ba37-voz-video-comida.md).
Instrucciones de los cinco defectos reproducidos: [orden 116](../ordenes/116-auditoria-66-fallos-reproducibles.md).
No abrir otra propuesta por cada fila ni volver a implementar los COB01-09 ya registrados.

## Hallazgos pendientes, no arreglos

Las primeras cinco filas tienen reproduccion aislada. Las otras trece estan sustentadas
en el flujo de codigo descrito en el informe 66, pero no se reprodujeron contra servicios
reales. Revisar politica de permisos con el dueno: no bloquear operacion legitima a ciegas.

| Referencia | Efecto observado o riesgo del codigo | Evidencia | Responsable |
| --- | --- | --- | --- |
| SOCIAL01 | Dos canciones/dedicatorias exitosas dejan un solo registro | Sonda | Gemini |
| AUTO01 | Dos instancias toman el candado; la antigua libera al nuevo dueno | Sonda | Gemini |
| AUTO02 | Servicios fallidos se registran como tareas correctas | Sonda | Gemini; Claude conserva logica contable |
| PERS01 | Un enlace vencido devuelve datos y cambia asistencia/llegada | Sonda | Claude |
| PERS02 | NaN/Infinity permiten registrar llegada con ubicacion invalida | Sonda | Claude |
| 66 / menus publicos | El DTO publico incluye costo interno del plato | Codigo | Claude |
| 66 / permiso insumos | Acciones de stock/costo solo comprueban sesion | Codigo | Claude |
| 66 / presupuestos | Lecturas completas, share-token y reparacion masiva sin limite por perfil | Codigo | Claude |
| 66 / ajuste de costos | Un fallo parcial y reintento pueden aplicar el porcentaje dos veces | Codigo | Claude |
| 66 / video resumen | Promete musica y comparte la pagina, no el video generado | Codigo | Gemini |
| 66 / contador | Cambios sin commit no invalidan un area marcada limpia | Codigo | Gemini |
| 66 / voz | Tope diario no atomico; texto enviado en URL | Codigo | Gemini |
| 66 / permiso barra | Mutaciones de stock aceptan sesion sin limite de operacion por perfil | Codigo | Claude |
| 66 / pedido invitado | Se confirma pedido pese a ingredientes inexistentes o insuficientes | Codigo | Claude |
| 66 / pedido manual | Puede descontar stock y fallar ambos guardados sin compensar | Codigo | Claude |
| 66 / operador estaciones | Sesion generica supera controles y obtiene token de operador | Codigo | Claude |
| 66 / timeout captura | La primera subida y el reintento pueden crear dos publicaciones | Codigo | Gemini |
| 66 / lista invitados | Requiere sesion, pero no limita por perfil/evento asignado | Codigo | Claude |

No llamar a las trece observaciones explotaciones verificadas en produccion. Tampoco
descartarlas porque la suite general pase: no cubre los escenarios concretos descritos.

## Cobertura y lo que impide aprobar

Cada fila es un limite de esta tanda, no una afirmacion de que toda el area este rota.
El registro `docs/codex/areas.json` mantiene 0/14 areas limpias; no se cambio para forzar cierre.

| Area | Evidencia disponible en esta tanda | Pendiente para aceptacion del area completa |
| --- | --- | --- |
| plata | Jest y revision de fronteras de presupuestos | Roles reales, pagos/conciliacion/saldos de extremo a extremo; entrega de arreglos |
| contrato | Pruebas focalizadas de contrato y sena | Generar, firmar y recuperar documento completo en navegador |
| comida | Pruebas focalizadas; revision DTO, permisos y propagacion | Fallo parcial/reintento, datos reales autorizados y correspondencia total menu/foto |
| permisos | Revision de acciones y matriz de perfiles | Ingreso/recuperacion y llamadas directas con perfiles y eventos distintos |
| fiesta | Evidencia historica y suite general | Recorrido operativo completo y conciliacion de las 19 fiestas/presupuestos importados |
| portal | Suite general, sin recorrido completo valido en esta tanda | Cliente real de prueba: datos, documentos, mensajes y cambios sincronizados |
| invitado | Lectura/moderacion revisada; E2E inconcluso | Invitacion, RSVP, muro y aislamiento de datos con enlaces de prueba |
| web | Recorrido publico parcial y primeras validaciones del simulador | Embudo completo, cambio de paquete, extras, precios, PDF multipagina, compartir y CRM |
| redes | Galeria observada; kebab de la muestra correctamente en Catering | Sincronizaciones reales Instagram/YouTube y deduplicacion/catalogo completo |
| estaciones | Revision de subida, tokens y video | Captura, espera, reintento, entrega y video/audio en navegador con permisos reales |
| barra | Suite general y revision del ciclo de stock/pedido | Transacciones concurrentes, fallo de guardado y retiro con datos de prueba |
| asistente | Voz simulada y revision del limite | Tope concurrente y resultado real; llamadas pagas requieren aprobacion |
| personal | Dos defectos reproducidos; permiso interno de recibos comprobado | Retest de enlace/ubicacion y recorrido completo del empleado |
| automaticos | Dos defectos reproducidos con instancias/servicios simulados | Retest multiinstancia, recuperacion y resultado visible de cada tarea |

No se probaron correo, WhatsApp, Mercado Pago, Gemini ni sincronizaciones reales con
credenciales autorizadas. Las pruebas fisicas de fotocabina, 360 y barra quedan al final;
no sustituyen estos pendientes virtuales ni pueden aprobarse desde este informe.

## Propuestas visuales, separadas de los defectos de codigo

- Corregir superposicion del CTA flotante con galeria/servicios a 660 px.
- Separar imagen destacada del titulo en el blog, como pidio el dueno.
- Proponer paleta coherente y ficha del Club Uruguay con datos verificados.

No esconder fotocabina, 360 ni espejo detras de Ver mas. No inventar datos del salon.
Estas propuestas no se usan para inflar el contador de defectos ni decidir funcionalidad.

## Entrega y siguiente verificacion

1. Gemini y Claude contrastan esta lista con su trabajo local y corrigen lo pendiente
   dentro de una sola tanda, respetando el reparto. Una orden escrita no los inicia.
2. Cada hallazgo conserva su ID, prueba de regresion y resultado; fuente corregida no
   equivale a comportamiento probado. Anotar falsos positivos o decisiones justificadas.
3. Claude compila el conjunto y entrega SHA, entorno, resultados y errores. No usar los
   controles rojos por facturacion de GitHub como senal de calidad.
4. Codex comprueba los cambios de esas areas y sus consumidores, sin repetir pruebas
   vigentes de codigo intacto. Completar cobertura no ejecutada, separada del retest.
5. Verificar el mismo SHA desplegado y luego el ensayo fisico. El dueno decide la fusion.

No hay fundamento para emitir un certificado de cero errores. Una futura aprobacion
debe describir el alcance comprobado y las limitaciones, no una garantia absoluta.
