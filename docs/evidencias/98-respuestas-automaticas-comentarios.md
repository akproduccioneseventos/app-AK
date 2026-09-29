# Auditoría — respuestas automáticas en comentarios, PR #1240

Fecha: 2026-09-28
HEAD candidato: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Base GitHub: `main` en `b52b1f013d21bd2831b918fb04649636ce24033a`
Destino: PR abierta #1240; feature nueva en esta rama, no demostrada en producción.
Clasificación: requisitos pendientes/riesgos de código en la entrega candidata. Inspección estática; Codex no corrió las pruebas ni llamó APIs reales.

## Comportamiento aprobado

La orden 95 autorizó expresamente respuestas automáticas a preguntas comerciales, con interruptor apagado de fábrica y límite de IA. No cuestionar esa decisión ni convertirlo en bloqueo para respuestas comerciales aprobadas. El alcance es precio/fecha/disponibilidad/contratación; las quejas legítimas deben seguir siendo quejas, no recibir una respuesta comercial automática.

## Hallazgos P2

### 1. Una queja legítima formulada como pregunta puede recibir respuesta comercial pública

En `src/lib/social-media/comments-backfill.ts`, `syncCommentsFromNetworks` responde cuando `esPregunta && !isInsultOrSpam && !respuestaAutomatica`; `responderPreguntaComentarioSiAplica` vuelve a filtrar insulto/oculto/pregunta, pero no `isLegitimateComplaint`. El clasificador mantiene ese campo y el prompt reconoce quejas legítimas, pero no hay guarda que las excluya. Un comentario con `esPregunta: true`, `isLegitimateComplaint: true` y sin insulto entra en `postReplyToMetaComment`. Esto puede contestar una queja con una invitación comercial a WhatsApp en vez de dejarla para atención humana.

### 2. La respuesta no usa el catálogo que exige la orden

La orden 95 pide `getArmadoRapidoConfig()` y el catálogo real para redactar sin inventar servicios. `armarRespuestaAPregunta` sólo manda comentario/autor al modelo; no obtiene ni incorpora ese catálogo. La respuesta se limita a invitar a WhatsApp y no queda fundamentada en los servicios reales.

### 3. El control para prender/apagar no quedó accesible en Ajustes

`comments-backfill.ts` define `getAjustesRespuestasComentarios`/`setAjustesRespuestasComentarios`, con default `activo: false`, pero la PR no cambia la tarjeta/action de Ajustes. El componente existente de recontacto sigue siendo sólo el interruptor de recontacto y la nueva opción no tiene consumidor UI en el diff. Por defecto el reply queda apagado y el dueño no tiene el control prometido para habilitarlo desde la app.

### 4. Una sincronización histórica puede publicar respuesta tardía

`syncCommentsFromNetworks` procesa comentarios `!classifiedAt` tras traer nuevos resultados; no limita el auto-reply a una ventana temporal ni diferencia el backfill histórico de una sincronización normal. Al usar historial completo, una pregunta vieja que nunca se clasificó puede acabar contestada ahora. La orden habla de cada comentario nuevo; no se comprobó que comentarios antiguos deban recibir respuesta retroactiva.

### 5. Respuesta duplicada ante concurrencia o fallo al guardar

El guardado de `respuestaAutomatica` ocurre en memoria después de publicar en Meta y sólo se persiste al final de `syncCommentsFromNetworks`. No hay reserva transaccional por `networkCommentId`. Dos sincronizaciones simultáneas pueden leer el mismo comentario sin marca y publicar ambas; también puede repetirse si Meta aceptó el POST y falla la escritura local. La prueba de “ya respondido” cubre sólo un objeto ya marcado, no concurrencia ni fallo entre POST y persistencia.

## Cobertura observada

`src/__tests__/la-respuesta-a-comentarios-no-inventa.test.ts` prueba respuesta básica simulando Gemini/Meta, comentario marcado ya respondido, interruptor apagado e insulto. No prueba queja legítima en forma interrogativa, uso del catálogo, backfill viejo, concurrencia, fallo de persistencia tras éxito de Meta ni UI del interruptor. Codex no ejecutó esa suite.

## Corrección para Gemini, al cerrar la auditoría

1. Excluir explícitamente `isLegitimateComplaint` y no responder automáticamente salvo preguntas comerciales dentro de la ventana acordada.
2. Incorporar el catálogo real aprobado por la orden 95; si no está disponible o se excede el presupuesto de IA, dejar en bandeja/escalar sin publicar una afirmación.
3. Añadir el control de Ajustes apagado por defecto, con acción administrativa autorizada y estado visible.
4. Distinguir backfill histórico de comentarios recientes y no hacer respuesta retroactiva.
5. Hacer el POST idempotente ante concurrencia/reintentos y persistir estado fiable; probar estos límites con fallos simulados. Mantener la autorización existente y no habilitarlo automáticamente.

## Límites

No se publicó contenido real, no se leyeron comentarios productivos, no se enviaron respuestas y no se corrieron tests/build. Hallazgos aplican al HEAD de PR indicado; no son defectos confirmados del despliegue actual.
