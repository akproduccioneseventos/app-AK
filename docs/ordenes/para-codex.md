# Para Codex: estado correcto de la PR #1128

**Corregido:** 24 de agosto de 2026.

La PR #1128 usa la rama `codex/auditoria-final-lanzamiento-20260823`.
Sí compartía historia con main: GitHub confirmó como ancestro común
`3e259324076ba43434506a739a4354cb3f3d0a8c`.

El diagnóstico anterior nombraba otra rama y no aplicaba a esta PR. Para evitar
cualquier riesgo, igualmente se reconstruyó la propuesta con un commit cuyo padre
es el main actual `2190ff9a9a115dd7cdc8e86a40039a20dd01dbc5`.

## Qué se preservó

- El despertador cada 15 minutos y su despliegue.
- Las estaciones offline y sus colas por fiesta.
- Los agentes y avisos existentes en main.
- El arreglo contable de rentabilidad.
- El reloj del simulador.
- El ajuste anual del 15%.
- El descuento comercial del 50% del Club Uruguay.
- WhatsApp prepara mensajes; no los envía.
- Los precios salen del catálogo, salvo decisiones comerciales ya aprobadas.

## Qué se descartó de la auditoría anterior

- Quitar el reloj.
- Quitar el 50% comercial del Club Uruguay.
- Reemplazar el simulador público actual por una versión anterior.
- Documentar bloqueos del entorno como errores confirmados de la aplicación.
- Sobrescribir documentos compartidos con estados viejos.

## Evidencia

TypeScript y ESLint aprobaron. Las 9 suites focalizadas posteriores a la conciliación aprobaron
66/66 pruebas. Los detalles están en `docs/YA-RESUELTO.md` y
`ESTADO-ACTUAL.md`.

La PR queda abierta para que la fusione el dueño; Codex no la fusiona.

## Nota de recorrido público — 28 de septiembre de 2026

**NO CONTRASTADO CON LA TANDA NI CON EL SHA DE PRODUCCIÓN.** No reutilizar estos
hallazgos como órdenes hasta compararlos con la entrega activa. Evidencia detallada y
alcance en `docs/evidencias/94-recorridos-reales.md`.

- Reproducido en web publicada: las tarjetas de tipos de evento envían `tipo=...`, pero
  el simulador aparece con “Cumpleaños”; el control `?eventType=boda` sí preselecciona
  “Boda”. En la copia auditada, `ServicesSection.tsx` y `simulador-de-presupuesto/page.tsx`
  confirman la diferencia entre productor y consumidor.
- Reproducido en PC: las fichas iniciales del carrusel tecnológico quedan recortadas;
  Plataforma 360 queda fuera del viewport y Espejo Mágico parcialmente fuera. Sus paneles
  sí cambian al activarlos por teclado. No se probó móvil ni la estación real.
- PASS parcial: las cinco etapas de la historia tecnológica, las tres pestañas de la demo
  segura del portal cliente y la pregunta FAQ de reserva cambian/expanden su contenido.
  Eso no valida sincronización con eventos reales.
- No se completaron datos del simulador, no se contactó a clientes y no se modificaron
  datos productivos. La auditoría sigue abierta; estas notas no certifican que la app
  esté lista ni sustituyen las pruebas restantes.
- El entorno local de pruebas (`127.0.0.1:3300`) no está levantado: login, portal cliente,
  invitado y barman son inaccesibles en las pestañas disponibles. No clasificarlo como
  defecto de producción; falta sesión/entorno de prueba para continuar módulos internos.
- Extensión de galería: se cargaron las 144 imágenes publicadas; las 144 URL y títulos
  son únicos y todas las imágenes cargan. No demuestra deduplicación por contenido visual
  o contra Instagram. El caso “Kebab gourmet” sí muestra brochetas. El clic de puntero
  del navegador automatizado quedó inconcluso; Enter sí carga el lote y no se adjudica
  el comportamiento a la app hasta una repetición física.
- Hallazgo nuevo de metadatos: 117/144 (81%) usan títulos técnicos `Img ...` y la vista
  ampliada muestra descripciones genéricas. Código observado en `src/data/catalogo-fotos.json`,
  consumidor `src/components/landing/GallerySection.tsx`, copia auditada `7724ec9`.
  No inventar categorías; revisar la asociación foto/categoría con material de AK.
- Videos públicos (control repetido 28/09): el filtro XV muestra nueve tarjetas; la
  reproducción fue variable entre tres muestras (marco vacío, buffer prolongado, una
  reproducción visible). **NO CONTRASTADO CON LA TANDA NI CON EL SHA DE PRODUCCIÓN.**
  No ordenar cambios todavía: repetir con navegador/red normal y comparar misma URL,
  luego verificar si las fuentes externas responden antes de asignar causa.
- Blog público, artículo de seguridad del salón (28/09): interfaz y CTA visibles; copy
  afirma que una lista orientativa “garantiza” funcionamiento perfecto “sin riesgos ni
  cortes”, y el CTA promete base “exacta”. Revisar copy para no insinuar garantía/precio
  contractual, y enlazar fuente oficial antes de consejos regulatorios locales.
  **NO CONTRASTADO CON LA TANDA NI CON EL SHA DE PRODUCCIÓN.** No cambiar términos
  comerciales sin aprobación del dueño; cotejar el alcance real del simulador primero.
  El resultado oficial hallado (Decreto 7.291/2021) trata pirotecnia sonora, no niveles
  de música de locales/eventos; no usarlo como respaldo de esa afirmación.
- Blog público, guía de bebidas (28/09): cantidades exactas y ajuste por calor sin fuente
  ni supuestos, más promesa de que AK cubre el stock. **NO CONTRASTADO CON LA TANDA NI
  CON EL SHA DE PRODUCCIÓN.** Claude debe confirmar valores y alcance contra la operación
  de catering/barra antes de editar o publicar; no tocar precios/compras.
- Blog, guías de catering y tecnología (28/09): “la mayoría de los clientes” prefiere
  la propuesta mixta y “la opción preferida” en Salto no citan evidencia. La indicación de
  chispas frías “seguras para interiores” no identifica equipo ni condiciones; fuente
  oficial consultada advierte riesgos generales de pirotecnia, no certifica ese equipo.
  Claude debe validar catering/claims comerciales y el responsable de operación/proveedor
  debe validar efectos y requisitos del salón antes de cambiar el copy. **NO CONTRASTADO
  CON LA TANDA NI CON EL SHA DE PRODUCCIÓN.** Evidencia y fuente en `docs/evidencias/94-recorridos-reales.md`.
- Blog, presupuesto y menú (28/09): los checklists sí cubren detalles exigidos por AK, pero
  el copy de ajuste futuro puede diferir de la proyección anual solicitada; cotejar con el
  comportamiento actual antes de editar. La promesa de reducción de vajilla/mozos/costos
  requiere validación de Claude contra costeo real. **NO CONTRASTADO CON LA TANDA NI CON
  EL SHA DE PRODUCCIÓN.** No cambiar cálculos ni precios desde esta revisión.


## Continuidad de auditoría — 28/09/2026

El dueño/equipo informa 129 pruebas aprobadas de prospectos/clientes/agenda/planificación, 15 de alertas de salón/equipo y 14 del mural, además de dos recorridos de navegador. Tres skips del mural fueron intencionales (cámara desactivada y pruebas desktop no aplicables a móvil). Sin SHA/runner adjunto: no repetir si coincide el SHA, no atribuir a producción sin contraste. No crear alerta/bloqueo para proveedores: el dueño confirma que pueden atender más de una fiesta por día.

Codex sigue por web pública. Observaciones de portada (métricas en cero y claims absolutos), Club Uruguay, simulador y privacidad, junto con límites de navegador/Jest/push, están consolidadas en [docs/evidencias/95-actualizacion-28-09.md](../evidencias/95-actualizacion-28-09.md). Revisar el registro y contrastar el SHA antes de ordenar cambios; el resultado de un test no equivale a despliegue validado.


## Club Uruguay — oportunidad de contenido, 28/09/2026
La página extraída muestra tres escenas y CTAs, pero no extrae capacidad, dirección/mapa, accesibilidad, dimensiones, parking o equipamiento. Agregar solo datos confirmados por AK; fotos/CTAs no probados visualmente. Detalle en docs/evidencias/95-actualizacion-28-09.md.

## Auditoría PR #1240 — avisos automáticos a la bandeja (2026-09-28)

PR #1240, HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`: hallazgo P2 de idempotencia visible en el código, no reproducido dinámicamente. Dos llamadas concurrentes o reintento tras fallo de persistencia podrían crear avisos WhatsApp pendientes duplicados. No se envían automáticamente (`manual_click`). La prueba existente sólo cubre llamadas secuenciales; Codex no ejecutó tests. No es un fallo probado en producción. Detalle, paths, consumidor, evidencia y pruebas requeridas en `docs/evidencias/96-idempotencia-avisos-whatsapp.md`. Gemini es el responsable de corregir esta área después de concluir la auditoría; conservar envío manual. Sin build, test, datos reales ni envío de mensajes.


## Auditoría PR #1240 — secuencia de recontacto (2026-09-28)

HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`: la tarjeta de Ajustes no ofrece los pasos/plantillas prometidos (igual que base); `plantilla`/`paso` se pierden antes de `buildRemarketingMessage`; y un lead antiguo podría recibir los pasos pendientes en corridas separadas por seis horas. Revisión estática, no dinámica; no probado en producción. El envío automático a prospectos sí está aprobado como excepción en la orden 95: preservar el consentimiento explícito, switch apagado inicial y demás filtros. Prueba existente mockea el envío y no valida el texto. Evidencia y corrección pendiente tras acabar auditoría: `docs/evidencias/97-secuencia-recontacto-prospectos.md`.


## Auditoría PR #1240 — respuestas automáticas en comentarios (2026-09-28)

En HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`: queja legítima interrogativa no está excluida; la respuesta no usa el catálogo solicitado; falta el control de Ajustes prometido; el backfill puede responder a preguntas antiguas; y el POST a Meta no está protegido contra doble sincronización/fallo de persistencia. P2, revisión estática; no probado en producción ni ejecutado por Codex. Auto-respuesta comercial está autorizada por Orden 95, default apagado: conservar límites y no habilitarla por defecto. Tests existentes solo cubren respuesta simple, repetición secuencial, apagado e insulto. Evidencia: `docs/evidencias/98-respuestas-automaticas-comentarios.md`.


## Auditoría PR #1240 — horario óptimo y reciclado (2026-09-28)

HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`: el cálculo de mejor horario y el reciclado existen como helpers, pero no están conectados a pantalla ni Server Action; en la pantalla de presencia digital y acción inspeccionadas no se usan. Los tests son unitarios del helper, no del flujo del dueño. P2, pendiente de E2E; Codex no ejecutó pruebas ni cron/publicación. Evidencia: `docs/evidencias/99-horario-y-reciclado-sin-pantalla.md`.


## Seguridad P1 — token de acceso de invitado en Analytics (2026-09-28)

Confirmado por inspección de `5e384c6` (SHA publicado registrado en Ya-resuelto) y PR #1240 `79dae2c`: la URL del portal/QR contiene `token`; el token da acceso a datos del invitado; el layout global carga Analytics y el componente pasa `pathname + window.location.search` a gtag; GA usa ID real por defecto. Código, no captura de red; riesgo de que el bearer token llegue a GA. Corregir con prioridad sin añadir banner; proteger páginas con credenciales. No cambié el comportamiento: pedir aprobación antes de excluir páginas del tracking/ajustar flujo. Evidencia, pruebas y límites: `docs/evidencias/100-token-invitado-en-analytics.md`.


## Auditoría PR #1240 — recordatorio automático a invitaciones (2026-09-28)

HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`: la función nueva no aparece conectada al runner/puerta/route exigidos; Gmail se llama con una firma distinta a la implementación real y el test mockea una respuesta incompatible; los fallos Gmail no incrementan `fallados`; los reintentos pueden duplicar borradores/envíos por falta de idempotencia. P2 en la candidata, revisión estática y sin llamadas reales; recordatorio 21/10 días y default-on son decisiones autorizadas por la orden 95. Detalle: `docs/evidencias/101-recordatorio-invitacion-no-conectado.md`.


## Auditoría PR #1240 — check-in de personal y QR de carga (2026-09-28)

HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`: la nueva acción de check-in puede asignar la llegada de un acceso de proveedor sin empleado al primer miembro del personal, y no valida permiso/vigencia dentro de la acción; la prueba no cubre esos casos. En carga operativa, el QR anuncia éxito antes de confirmar persistencia porque descarta la promesa; la persistencia captura internamente el error. Riesgos P1 (atribución/acceso) y P2 (feedback engañoso), revisión estática; Codex no ejecutó pruebas ni confirmó producción. Detalle y pruebas recomendadas: `docs/evidencias/102-checkin-proveedor-y-qr-persistencia.md`.


## Auditoría PR #1240 — mantenimiento y gasto contable no atómicos (2026-09-28)

HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`: el editor ignora `{success:false}` de `saveGastoGeneral` y anuncia el gasto como registrado; el costo/historial del activo se guarda después en otra acción, por lo que puede quedar una sola mitad o duplicarse al reintentar. P1 de consistencia contable, análisis estático; no se ejecutaron pruebas ni se generaron gastos. Claude debe resolver idempotencia/consistencia y probar rechazo, fallo parcial y reintento. Detalle: `docs/evidencias/103-gasto-mantenimiento-y-activo-no-atomicos.md`.


## Auditoría PR #1240 — reunión de organización (2026-09-28)

HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`: la nueva pantalla ignora `{success:false}` de `saveFiesta` tanto al guardar como al cerrar, y anuncia éxito; el textarea de notas del cronograma no se copia al objeto guardado y se pierde al salir. P1 en confirmación/persistencia y P2 en dato operativo, inspección estática; no se ejecutaron E2E. Detalle y casos: `docs/evidencias/104-reunion-confirmacion-y-cronograma.md`.


## Auditoría PR #1240 — orden imprimible y carga operativa (2026-09-28)

HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`: la nueva Orden de Evento imprime solo los primeros seis artículos por categoría mediante `.slice(0, 6)`, sin advertir que la carga continúa; puede usarse una lista incompleta para preparar/devolver equipos. P2, confirmado por código; PDF/impresión y E2E no ejecutados. Evidencia: `docs/evidencias/105-orden-evento-carga-recortada.md`.


## Auditoría PR #1240 — porciones de la hoja de cocina (2026-09-28)

HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`: el consumidor usa `invitadosAdultos || invitadosEstimados`; un 0 explícito se reemplaza por el total. Ejemplo: 0 adultos + 40 niños + estimado 40 produce 40 adultos + 40 niños = 80 porciones. P1 numérico/catering, confirmado por el flujo del cálculo, sin ejecutar tests ni crear hoja real. Claude: preservar cero y probar campo cero frente a ausente. Detalle: `docs/evidencias/106-porciones-duplicadas-evento-infantil.md`.


## Auditoría PR #1240 — alerta de mantenimiento no conectada (2026-09-28)

HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`: el motor necesita la lista de activos para generar la alerta de mantenimiento, pero `getAlertasGlobales` y `getAlertasPorFiesta` no la cargan ni pasan; el test llama al motor directamente y no cubre el consumidor real. P1 funcional: la alerta prometida no aparece en la bandeja. Claude: conectar equipo/fiestas con una prueba a nivel de acción. Inspección estática, no ejecutada en producción. Evidencia: `docs/evidencias/107-alerta-mantenimiento-no-conectada.md`.


## Auditoría PR #1240 — geocerca sin ajuste accesible (2026-09-28)

HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`: el switch `llegadaConUbicacion` tiene default `false`; existe setter autenticado, pero la PR no conecta ninguna pantalla a él. Sin configuración sembrada externamente, el check-in no valida distancia. P2 de función inaccesible/no transparente; no probado en runtime. Evidencia: `docs/evidencias/108-geocerca-sin-control-en-ajustes.md`.


## Auditoría PR #1240 — alcance del QR frente a Orden 95 (2026-09-28)

El bloque 9 aprobado pedía imprimir etiquetas en Activos Fijos y abrir un lector de QR. La PR solo procesa texto tipeado/pegado (o teclado tipo pistola); no cambia la pantalla de Activos Fijos ni inicia cámara. P2: la lógica pura existe, pero el recorrido completo QR no. La devolución #97 ya anotó aparte el posible falso éxito al fallar persistencia; no duplicar ese punto. Evidencia: `docs/evidencias/109-qr-sin-etiquetas-ni-lector.md`.


## Conciliación con main y devolución de Claude — 2026-09-28

Main avanzó 17 commits respecto de la base registrada de PR #1240; la cabeza auditada sigue siendo `79dae2cd75f1ffc572f28f6ee890174c3912fff8`. Leí `docs/ordenes/97-devolucion-de-la-orden-95.md`: no volver a reportar allí lo ya encontrado (sobrescrituras globales, firma/respuesta y variables de envío, tarea sin cron/registro, llegada atribuida al primero y publicación que reescribe la lista). Los findings de Codex 102/106 se actualizaron para etiquetar sus partes solapadas y distinguir el cálculo infantil, que ya estaba publicado y que la página nueva copia, de una regresión exclusiva de la PR. `docs/ESTADO-ACTUAL.md` de main mantiene recorridos de roles pendientes; los 129/15/14 tests reportados por el dueño siguen sin SHA/output para poder atribuirlos a esta cabeza.


## CI de PR #1240 en la cabeza auditada — 2026-09-29

Para HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`, GitHub registra fallidos CI (smoke de navegador, reglas Firestore, lint/typecheck/test/build) y CodeQL. Los logs ya no están disponibles (404 BlobNotFound) y GitHub no devolvió pasos; causa no determinada, no adjudicar automáticamente a código ni ambiente. Este SHA no queda validado para publicar. Ver `docs/evidencias/110-ci-fallido-head-1240.md`. Al aparecer nueva cabeza, consultar sus checks propios; no trasladar estado de SHA viejo.


## Continuación — Multiagente y concurrencia (2026-09-29)

En main SHA `975118a8d2f22868f9cdffc1fa6d8c245ba75fd0`, `appendMultiAgentChatTurn` y `saveAgentLearning` leen y reescriben estados JSON completos sin transacción/mutación atómica. Dos solicitudes simultáneas pueden pisarse; la memoria alimenta después `runMultiAgent`. Riesgo P2 por análisis estático, no reproducido en producción. Gemini: evaluar persistencia por elemento/transacción y prueba concurrente con ambas lecturas sincronizadas. Detalle: `docs/evidencias/111-multiagente-pierde-concurrencia.md`.

## Aclaración del dueño sobre checks de GitHub (2026-09-29)

No usar el rojo de workflows como señal de defecto de app ni gastar más auditoría en sus logs: el dueño informa que se debe a facturación bloqueada. La compilación/verificación pre-fusión completa la hace Claude. El registro histórico `docs/evidencias/110-ci-fallido-head-1240.md` fue actualizado con esta aclaración; esos checks no son un hallazgo funcional.


## Multiagente — completar una tarea ambigua (2026-09-29)

En main SHA `975118a8d2f22868f9cdffc1fa6d8c245ba75fd0`, `complete_task` acepta `t.texto.includes(data.texto)` y toma la primera coincidencia. Una respuesta parcial que coincida con varias tareas puede completar la incorrecta. P2 por análisis estático; test existente solo cubre una coincidencia única y ausencia total de selector. Gemini: usar ID o requerir coincidencia única y probar ambigüedad. Evidencia: `docs/evidencias/112-multiagente-tarea-coincidencia-ambigua.md`.


## Recuento Astra/Luna — 29/09/2026

El historial local identifica Astra desde 7/9, Luna desde 28/9 16:38 hasta 29/9 07:52 (Uruguay), y Astra nuevamente desde esa hora. Fueron 21 registros de contexto pero 12 turnos distintos de Luna. Se separan sus conclusiones de la aprobacion Astra, sin borrar evidencia. Informe completo por areas y pendientes: [RECUENTO-ASTRA-LUNA-2026-09-29.md](../evidencias/RECUENTO-ASTRA-LUNA-2026-09-29.md), publicado en esta rama, commit 6b9e6159f5f67509ea14a4dfc9c3991459b210a9. El main identificado es 62dcb2cb4df718a81c3654028199e49628367d8c; no se pudo conciliar su registro por fallos de conexion. No afirmar que los defectos historicos siguen abiertos ni que estan corregidos hoy. El 110 se retira como fallo de app (facturacion GitHub); 113 queda como oportunidad de proteccion pendiente de revisar limites globales, no defecto P2 demostrado ni bloqueo obligatorio. Faltan evidencia actual por roles, recorrido completo de venta/PDF/CRM, conciliacion de los 19 historicos, integraciones reales, estetica/rendimiento y ensayo final de equipos. No se programo, compilo ni fusiono.
