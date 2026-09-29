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
