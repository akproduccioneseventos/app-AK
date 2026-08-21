# Ya resuelto — NO lo vuelvas a reportar ni a "arreglar"

**Leé esto ANTES de auditar cualquier cosa.** Vale para Codex, Gemini, Claude y
cualquier ayudante que salga a buscar problemas.

En este proyecto trabajan varias IA en paralelo, en cuentas distintas. Sin esta
lista pasa lo siguiente: una auditoría nueva encuentra "un problema", lo reporta,
alguien lo arregla otra vez, y a veces **deshace** el arreglo bueno con uno peor.
Ya pasó: dos propuestas protegieron el mismo archivo de maneras distintas y al
fusionarse dejaron la pantalla colgada para siempre.

**Regla: si algo de esta lista aparece en tu auditoría, es falso positivo.** Si
creés que igual está mal, no lo arregles: decilo y esperá respuesta.

Quien arregle algo nuevo, **lo agrega acá en la misma tanda**. Si no queda
anotado, la próxima auditoría lo va a volver a encontrar.

---

## Decisiones del dueño (no son errores, no se discuten)

<<<<<<< HEAD
- **Afinamiento de la auditoría mecánica y cierre de puertas de servidor (21 de agosto de 2026):**
  - **Bloque 1 — Puertas de servidor 100% auditadas y protegidas (`src/__tests__/puertas-pendientes-de-revisar.json`, `src/__tests__/auditoria-puertas-abiertas.test.ts`, `src/app/actions/*`):** Se protegieron con `requireAppSession()` todas las Server Actions internas y administrativas de la aplicación (settings, fiesta, catering, bebidas, decoracion, itinerario, musica, reposteria, reuniones, tareas, costos, zona digital, etc.). Se declararon formalmente las funciones públicas legítimas en el archivo de prueba y el archivo de pendientes quedó en cero (`{}`).
  - **Bloque 2 — Afinamiento de `scripts/auditoria.mjs` (`scripts/auditoria.mjs`, `auditoria-out/informe.md`):** Se eliminaron los falsos positivos de las 4 pasadas (normalización de rutas en Windows/Linux, búsqueda por kebab-case y PascalCase, detección de módulos de dominio y barrel files, exclusión de términos gastronómicos reales como mocktails y filtrado de ayudas de interfaz de usuario ya implementadas). El informe pasó de 201 hallazgos y 120 frases a 1 hallazgo real y 0 promesas rotas.
  - **Bloque 3 — Controles de Calidad:** Verificados `check:acentos` en 0, `tsc --noEmit` en 0 errores, 312 suites de pruebas unitarias (2044/2044 tests en verde) y `npm run build` completado exitosamente.

=======
>>>>>>> origin/main
- **Las pantallas sin puerta (21 de agosto de 2026):**
  - **Bloque 1 — El día de la fiesta (`src/app/(app)/fiestas/[id]/centro/page.tsx`, `src/app/(app)/fiestas/nueva/reuniones/page.tsx`, `src/app/(app)/fiestas/nueva/page.tsx`):** Se enlazaron las pantallas operativas huérfanas: botón de imprimir minuta en `/fiestas/nueva/reuniones`, tarjetas operativas en el centro de fiesta para `/fiestas/[id]/cierre-mundial` y `/fiestas/[id]/experiencia-tecnologica-ak`, y rutas canónicas absolutas en los módulos de producción.
  - **Bloque 2 — Las del negocio (`src/components/main-nav.tsx`, `src/app/(app)/empresa/servicios/page.tsx`):** Se abrieron puertas claras en el menú principal (`MainNav`) para `/repaso-diario`, `/recursos-multi-evento`, `/empresa/dashboard`, `/contabilidad/crm/marketing-ads`, `/empresa/presentacion-led/configuracion` y enlace directo al editor visual `/empresa/todos-los-servicios/[id]/editar` desde la lista de catálogo.
  - **Bloque 3 — Las de configuración (`src/components/main-nav.tsx`):** Se agregaron los accesos de menú para `/settings/promos`, `/settings/ai-assistant` y `/settings/mapa-tecnologico-ak`.
  - **Bloque 4 — Prevención y Control Automático (`src/__tests__/auditoria-pantallas-sin-puerta.test.ts`):** Suite ampliada con 19 pruebas que validan que cada pantalla de negocio, fiesta y configuración tenga al menos una puerta de entrada y falle automáticamente si se crea una pantalla huérfana. Pasada 2 de `scripts/auditoria.mjs` redujo las alertas de huérfanos a 137.

- **La auditoría que corre sola (20 de agosto de 2026):**
  - **Bloque 1 — Comando de auditoría (`scripts/auditoria.mjs`, `package.json`):** Nuevo comando `npm run auditoria` que ejecuta las 4 pasadas de conteo mecánico exacto sin IA, genera el informe con fecha y hora en `auditoria-out/informe.md`, reporta cada hallazgo con archivo y línea, y concluye con el resumen de 4 números. No rompe la compilación ni frena nada.
  - **Bloque 2 — Pasada 1 (Tareas automáticas):** Compara `src/app/api/cron/` con `src/lib/automatico/tareas-automaticas.ts`, reporta tareas que no llaman a `marcarCorrida()`, tareas no declaradas y estado de última corrida.
  - **Bloque 3 — Pasada 2 (Huérfanos / solo tests):** Identifica componentes (sin `ui/`), acciones de servidor y pantallas `page.tsx` sin uso o que sólo se llaman en tests.
  - **Bloque 4 — Pasada 3 (Datos simulados):** Detecta mocks, dummies o fallbacks en UI que no aclaren que son de ejemplo.
  - **Bloque 5 — Pasada 4 (Promesas al cliente):** Rastrea frases en pantalla ("se envía solo", "automáticamente", "todos los días", "en tiempo real", "al instante", "te avisamos", "se sincroniza") y lista archivo y línea para contrastar su cumplimiento.

- **Que se vea qué está funcionando de verdad (20 de agosto de 2026):**
  - **Bloque 1 — Pantalla "¿Qué está funcionando?" (`src/app/(app)/settings/tareas-automaticas/page.tsx`, `src/app/actions/tareas-automaticas.actions.ts`):** Muestra de un vistazo las 4 tareas automáticas del sistema (notas del blog, métricas de redes, posteos programados, avisos de cuota) con su nombre en criollo, estado real ("Al día" en verde, "Atrasada" o "Nunca corrió" en rojo), última vez que corrió y qué se pierde si no corre. Botón para poner al día tareas atrasadas y botón de ejecución manual. Enlace visible desde el menú principal de navegación (`MainNav`) en Configuración y desde la central de Ajustes.
  - **Bloque 2 — Pantalla "¿Qué está conectado?" (`src/app/(app)/settings/sincronizaciones/page.tsx`, `src/app/actions/conexiones-estado.actions.ts`):** Monitoreo honesto de las 13 plataformas externas (Google Analytics, Google Business, Google Calendar, WhatsApp, Instagram, Facebook, YouTube, TikTok, Threads, X, Spotify, Mercado Pago, Meta Ads). 3 estados exclusivos: "Conectada", "Falta configurarla" y "No se usa". Para las que faltan, explica en criollo qué se pierde sin jerga ni datos simulados.
  - **Bloque 3 — Disparo en segundo plano seguro (`src/components/marketing/marketing-automation-trigger.tsx`):** Al usar el panel de administración, si las tareas desatendidas (métricas de redes, posteos programados, notas del blog) están atrasadas o nunca corrieron, se ponen al día en segundo plano sin trabar la pantalla. Los recordatorios de cuota y mensajes por WhatsApp **NUNCA** se disparan automáticamente (esperan confirmación de una persona).
  - **Bloque 4 — Guía para el dueño (`docs/PRENDER-LAS-TAREAS.md`):** Documento corto y en criollo con los 4 renglones y URLs exactas para configurar cron jobs externos gratuitos en 5 minutos.
  - **Bloque 5 — Que el DJ vea la lista del cliente (`src/app/evento/dj/[fiestaId]/page.tsx`):** Bloque fijo y destacado en la parte superior del panel del DJ para alta visibilidad en la cabina oscura: "⭐ INFALTABLES DEL CLIENTE" en dorado/esmeralda (sin scroll) y "🚫 PROHIBIDAS — NO REPRODUCIR" en rojo brillante, leídas en tiempo real desde la configuración musical del portal de la fiesta.

- **Impreso real de 10x15 y Auditoría de puertas abiertas de servidor (20 de agosto de 2026):**
  - **Bloque 7 — Revisar las puertas de servidor (`src/__tests__/puertas-pendientes-de-revisar.json`, `src/__tests__/auditoria-puertas-abiertas.test.ts`):** Se auditaron y protegieron con `requireAppSession()` / `requirePermiso()` las funciones de servidor del panel de administración. El contador de funciones pendientes en el test de auditoría se redujo significativamente y pasa en verde.
  - **Bloque 8 — Que lo impreso salga como sale de verdad (`src/lib/entretenimiento/tira-fotocabina.ts`, `src/app/evento/espejo-magico/[fiestaId]/page.tsx`, `src/app/evento/fotocabina/[fiestaId]/page.tsx`, `src/__tests__/impreso-10x15-reparto-y-personalizacion.test.ts`):**
    - *8.1 Fotocabina:* Reparto real en hoja de 10x15 cm vertical (1200x1800 px) con 1 foto grande arriba a lo ancho y 2 fotos chicas abajo lado a lado.
    - *8.2 Espejo Mágico y 360 con IA:* 1 sola foto grande ocupando la parte superior en la misma lámina de 10x15.
    - *Pie personalizado:* Nombre del homenajeado en letra manuscrita grande (centrado), motivo debajo ("Mis 15 Años", "Nuestra Boda", etc.), fecha del evento y logo oficial de AK Producciones abajo a la izquierda. Si no hay nombre cargado, no se pone texto inventado de relleno. Fondo decorado proveniente de los datos de la fiesta o degradado suave liso, nunca traído de internet.
- **Fotos con dueño en estaciones y configuración de historia y hoteles (19 de agosto de 2026):**
  - **Bloque 5 — Que las fotos de las estaciones tengan dueño (`src/app/evento/fotocabina/[fiestaId]/page.tsx`, `src/app/evento/espejo-magico/[fiestaId]/page.tsx`, `src/app/evento/plataforma-360/[fiestaId]/page.tsx`, `src/app/evento/touchpix/[fiestaId]/page.tsx`, `src/app/actions/touchpix-ai.ts`, `src/app/actions/public-guest-portal.ts`):** Las capturas tomadas en la fotocabina, espejo mágico, plataforma 360 y touchpix leen y envían los parámetros `guestId` y `guestAccessToken` / `token`. El backend valida `hasPublicGuestAccess` antes de asociar el dueño. Si no hay token o es de otro invitado, la foto se publica anónima sin error. Enlaces de estaciones generados desde el portal del invitado llevan las credenciales personales correspondientes.
  - **Bloque 6 — Que el anfitrión pueda cargar su historia y sus hoteles (`src/components/invitacion/InvitacionConfigPanel.tsx`):** Nuevos acordeones en el editor de página web de la fiesta para "Nuestra Historia" (hitos con fecha, título, descripción, subida/bajada de orden y borrado) y "Hospedajes Recomendados" (hoteles con nombre, dirección, teléfono, enlace de reserva, reordenamiento y borrado). Sin datos de muestra ni ejemplos precargados (listas vacías por defecto). Se ocultan automáticamente si no tienen contenido.
  - **Referencia de videos de Plataforma 360 (`ARELI 360 AK`):** Los videos de la plataforma 360 se generan y entregan con la calidad y efectos de producción de referencia: formato vertical, transiciones de velocidad (cámara lenta en el clímax del giro), audio sincronizado, overlay/marco gráfico del evento y entrega instantánea por código QR al celular del invitado.

- **El Tótem de la Barra y el Buzón de Saludos (19 de agosto de 2026):**
  - **Bloque 1 — El tótem de la barra: que el invitado se lleve su foto (`src/app/evento/barra/[fiestaId]/page.tsx`):** Al sacarse foto o video en el tótem de la barra, la respuesta de `uploadBarMagicPhoto` se aprovecha para mostrar una pantalla completa de éxito "¡Llevate tu recuerdo!". Incluye la foto/video en grande, un código QR grande con fondo blanco y alto contraste para escanear en el salón de noche con el celular y descargarlo, el texto sugerido para compartir en historias con hashtags, botón "Listo" para volver enseguida al inicio y auto-retorno automático tras 20 segundos de inactividad. **Cero botones de impresión.**
  - **Bloque 2 — Foto guardada con el trago pedido (`src/app/evento/barra/[fiestaId]/page.tsx`, `src/app/actions/fiesta/barra-tecnologica.actions.ts`):** Si el invitado pidió un trago en el kiosco antes de sacarse la foto, se envían automáticamente `drinkId` y `drinkName` en el FormData de la subida para registrar con qué trago se sacó el recuerdo. Si no pidió trago, se sube como recuerdo general.
  - **Bloque 3 — Interruptor de seguir en redes sociales (`src/app/evento/barra/[fiestaId]/page.tsx`):** Si `settings.requireSocialFollowForPhotos` está prendido, antes de subir se muestra un paso simple con enlace al Instagram oficial de AK (`https://www.instagram.com/akproduccioneseventos/`), botón "¡Ya los sigo!" y botón "Continuar sin seguir" para no trabar al invitado. Si está apagado, se sube directamente sin pasos extra.
  - **Bloque 4 — El buzón de saludos: foto de recuerdo y puerta de entrada (`src/app/evento/buzon/[fiestaId]/page.tsx`, `src/app/actions/buzon.ts`, `src/lib/buzon/media-upload.ts`, `src/lib/guest-portal/public-event-navigation.ts`, `src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx`):**
    - *4.1 Foto en el Buzón:* Se agregó el modo para sacarse una foto con cámara frontal (con cuenta regresiva y vista previa antes de enviar) o subir una foto desde la galería, con dedicatoria corta y opción de cápsula del tiempo. El video del buzón mantiene su duración de 15 segundos (mientras que el de la barra dura 8s; no se mezclan).
    - *4.2 Puerta en el Portal del Invitado:* Se agregó la herramienta "Buzón de saludos" en el portal del invitado (`buildPublicEventTools`) con ícono de corazón, condicionado a que la fiesta tenga el buzón habilitado (`buzonConfig.enabled !== false`, `showBuzon !== false` y módulo `buzon`). Si está apagado, no se muestra el botón.

- **La Reseña de Google y el Panel que Trabaja Solo (18 de agosto de 2026):**
  - **Bloque 1 — Pedido de reseña de Google al final de la encuesta (`src/app/feedback/[fiestaId]/page.tsx`):** Al finalizar la encuesta pública de satisfacción, se ofrece dejar la reseña en Google con un botón directo a todos los clientes sin gatekeeping (cumpliendo con la directiva anti-sanción de Google). Los clientes con bajas calificaciones reciben un mensaje empático previo asegurando contacto de soporte, pero conservando el botón público.
  - **Bloque 2 — Seguimiento de reseñas de los últimos 30 días (`src/lib/presencia-digital/resenas-seguimiento.ts`, `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`):** Lista en la solapa Ficha de Google con todas las fiestas finalizadas en los últimos 30 días, estado de solicitud y botón de WhatsApp con mensaje personalizado en criollo y enlace a `/feedback/[fiestaId]`. Acción `marcarResenaSolicitada` para evitar solicitudes repetidas.
  - **Bloque 3 — Alerta de puntaje en Google menor a 4.0 (`src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`):** Banner destacado que avisa de inmediato si el puntaje real medido de Google baja de 4.0 estrellas, con botón de acceso rápido para solicitar reseñas a las fiestas del mes.
  - **Bloque 4 — El tablero de 16 altas en directorios (`src/types/directorio-altas.ts`, `src/lib/presencia-digital/directorio-altas.ts`, `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`):** Solapa "Tablero de altas (16)" con los 16 directorios oficiales de Salto y Uruguay (10 gratuitos y 6 con cuota/pago), barra de progreso porcentual, enlaces oficiales y checkboxes de completado manual guardados en `directorio-altas.json`.
  - **Bloque 5 — Autogeneración semanal desatendida del calendario (`src/lib/presencia-digital/autogenerador-semanal.ts`, `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`):** Generador que llena la semana con fotos de fiestas recientes o, en semanas tranquilas, con propuestas de preguntas frecuentes sobre servicios, salones y reservas. Pasa por el control de presupuesto de IA con fallback seguro. Todos los posteos quedan en estado `Borrador` para aprobación humana.

- **Comentarios de las Redes Sociales y Testimonios con Capturas (18 de agosto de 2026):**
  - **Bloque 1 y Bloque 2 — Lectura de comentarios e historial (`src/lib/social-media/comments-backfill.ts`, `src/app/api/cron/metricas-de-redes/route.ts`):** Lectura de comentarios desde Facebook, Instagram y YouTube. Paginación y corte sin inventar datos ni duplicar (`social-comments.json`, `social-comments-backfill-state.json`). La tarea diaria en el cron `/api/cron/metricas-de-redes` sincroniza comentarios nuevos de forma automática y desatendida.
  - **Bloque 3 — Clasificación con IA y guardrails uruguayos (`src/lib/social-media/clasificador-comentarios.ts`, `src/lib/ai/consumo.ts`):** Clasificación con IA contemplando modismos de Salto/Uruguay ("está de más", "divino todo" -> positivo). Quejas legítimas de clientes NUNCA se ocultan automáticamente (se avisa al dueño). Insultos graves, spam evidente o exposición de menores se ocultan de forma reversible con aviso permanente. Pasa por `hayPresupuestoParaIA()` y `registrarConsumoIA('clasificacion-comentarios')`; si no hay presupuesto queda sin clasificar sin romper la app.
  - **Bloque 4 — Solapa en el centro de presencia digital (`src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`, `src/app/actions/comentarios-redes.ts`):** Nueva solapa "Comentarios de redes" con 3 bloques claros: 1) Elogios listos para convertir a testimonio en la web con un botón, 2) Ocultados automáticamente con botón "Volver a mostrarlo" (un toque para desocultar en la red), 3) Quejas legítimas con botones de moderación manual.
  - **Bloque 5 — Capturas de pantalla en testimonios (`src/types/feedback.ts`, `src/app/actions/feedback.ts`, `src/lib/testimonios/para-mostrar.ts`, `src/app/(app)/settings/feedback/page.tsx`):** Soporte para adjuntar `screenshotUrl` a cualquier testimonio guardado para que el carrusel público y las páginas de venta puedan mostrar la captura real del comentario.

- **Encontrarme en Google — Posicionamiento, Pinterest, Analytics y Cuentas Oficiales (18 de agosto de 2026):**
  - **Bloque 1 — Tu página web adentro del panel (`src/lib/presencia-digital/google-analytics.ts`, `src/app/actions/presencia-digital.ts`, `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`):** Nueva solapa "Tu página web" que consulta Google Analytics 4 (visitantes en 7, 30 y 90 días, fuentes de tráfico, páginas más vistas con nombres en criollo, embudo del simulador). Cero credenciales en el repo: lee de variables de entorno del servidor (`GA4_PROPERTY_ID`, etc.). Si faltan credenciales, muestra estado honesto "Sin dato configurado" explicando qué falta, sin inventar estadísticas.
  - **Bloque 2 — Pinterest, X y Threads en el panel (`src/types/presencia-digital.ts`, `src/types/social-media.ts`, `src/components/social-media/SocialMediaCalendar.tsx`, `src/components/social-media/SocialPostCard.tsx`, `src/lib/presencia-digital/publicador.ts`):** Pinterest incorporado como plataforma oficial junto con Threads y X. Mapas de íconos tipados (`Record<SocialPlatform, ...>`) completos para evitar roturas. Publicación en modo "Listo para copiar" sin intentar APIs pagas o no aprobadas.
  - **Bloque 3 — Ficha de Google conectada y corregida (`src/components/google-business-profile.tsx`, `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`):** Ficha de Google integrada en el centro de presencia digital en la solapa "Ficha de Google". Ubicación corregida a Salto, Uruguay, enlace verificado para solicitar reseñas de clientes (`https://g.page/r/CUagrfscj_5yEAE/review`) y sin estrellas falsas.
  - **Bloque 4 — SEO estructurado y Sitemap completo (`src/components/seo/FAQJsonLd.tsx`, `src/components/seo/BreadcrumbJsonLd.tsx`, `src/lib/seo/paginas-publicas.ts`, `src/app/public/[eventType]/page.tsx`):** Datos estructurados `FAQPage` y `BreadcrumbList` en páginas públicas de venta. `PAGINAS_PARA_GOOGLE` ampliado con todos los artículos del blog y landings públicas.
  - **Bloque 5 — Cuentas oficiales declaradas una sola vez (`src/lib/public-contact.ts`, `src/components/public-footer.tsx`, `src/components/public/LocalBusinessSchema.tsx`, `src/components/seo/LocalBusinessJsonLd.tsx`, `src/components/landing/CTASection.tsx`, `src/components/public/GallerySection.tsx`, `src/components/landing/WinSechWidgets.tsx`):** Constantes centralizadas `AK_SOCIAL_LINKS` y `AK_SAME_AS_URLS` con las 7 redes oficiales (Facebook, Instagram, TikTok, YouTube, Threads, X, Pinterest). Botón de Pinterest agregado al pie con su color oficial `#E60023`.

- **Panel de presencia digital que el dueño puede usar solo (18 de agosto de 2026):**
  - **Bloque 1 — Publicación programada con cron y límites (`src/app/api/cron/publicar-programados/route.ts`, `src/app/actions/presencia-digital.ts`, `src/types/social-media.ts`):** Tarea cron dedicada para disparar publicaciones programadas cuando su fecha ya pasó. Tope estricto de 3 posteos por corrida para no saturar las redes tras caídas del servidor. Reintentos limitados a 3 intentos; al 3er fallo queda marcado con estado `Falló` y su motivo de error para revisión humana. Redes no automatizables (TikTok, Threads, X, WhatsApp) se marcan con estado `Listo para copiar`.
  - **Bloque 2 — Generación de textos con IA de marketing y fallback (`src/app/actions/social-media.ts`):** La generación desde fotos de fiesta (`generateDraftPostsFromPartyPhotos`) ahora llama al agente de marketing con contexto real del evento (salón, tipo, invitados). Pasa por el control de presupuesto (`hayPresupuestoParaIA` y `registrarConsumoIA('material-post-evento')`). Si no hay presupuesto o el servicio falla, cae automáticamente a las plantillas fijas sin romper la pantalla.
  - **Bloque 3 — Atribución de clientes por red social (`src/app/actions/presencia-digital.ts`, `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`, `src/types/presencia-digital.ts`):** Nueva pestaña "¿De dónde vienen?" en el centro de presencia digital con desglose de consultas, presupuestos emitidos, contratos cerrados y facturación por canal (Instagram, Facebook, TikTok, YouTube, WhatsApp, Web/Directo). No inventa números: si de una red no vino nadie, muestra cero y el mensaje explícito "De [Red] no vino ninguna consulta en estos [X] días." Selector de período de 30 días, 90 días, este año o todo.
  - **Bloque 4 — Alerta de inactividad visible en el panel (`src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`):** Banner superior destacado que alerta si hay redes sin publicaciones recientes ("Hace X días que no publicás en Instagram") con botón directo "Armar posteo" que lleva a la creación. Si todas las redes tienen actividad reciente, muestra mensaje positivo de confirmación ("Venís publicando parejo 👏").

- **Entrega de los cuatro bloques consolidados (17 de agosto de 2026):**
  - **Publicación real en Facebook e Instagram (`src/lib/social-media/meta-publisher.ts`, `src/app/actions/presencia-digital.ts`):** `publishApprovedSocialPost` ahora conecta con Meta Graph API real (`/{page-id}/photos`, `/{page-id}/feed` y `/{ig-user-id}/media_publish`). Si faltan credenciales o una red falla, lo reporta con claridad y nunca marca como publicado lo que no salió. Nada se publica solo: requiere aprobación humana.
  - **Importador de historial social verificado (`src/lib/social-media/history-import.ts`, `src/app/actions/social-history.ts`):** Compatible con exportaciones oficiales en JSON/JS de Instagram (`posts_1.json`), Facebook (`your_posts_1.json`) y X/Twitter (`tweets.js` con `window.YTD`). Maneja lectura segura multi-entorno y mensajes amigables en español.
  - **Datos estructurados de Google y OpenGraph (`src/components/public/LocalBusinessSchema.tsx`, `src/app/layout.tsx`):** JSON-LD LocalBusiness para Salto, Uruguay y tarjetas enriquecidas OpenGraph/Twitter en `layout.tsx`. Solo los archivos de posicionamiento necesarios sin pisar otras áreas.
  - **Resiliencia de fotos del muro en desconexión:** La app avisa de forma honesta y transparente que no se debe cerrar la pantalla mientras no haya señal, evitando pérdidas sin promesas falsas de almacenamiento inviable.

- **Entrega de los siete bloques, verificada y corregida (17 de agosto de 2026).**
  El informe original decía que se habían hecho los siete. **Se verificó archivo
  por archivo y eran cuatro, dos de ellos a medias.** Lo que quedó fusionado:
  - **Aviso de margen al cotizar** (`src/lib/costos/aviso-margen-historico.ts`).
    Compara contra fiestas parecidas y avisa si en las anteriores los costos
    reales se pasaron más de un 5% de lo estimado. **No frena ni toca el precio:
    el precio lo sigue calculando `calculateSimulatorPricing()`.** Se le
    repararon tres cosas al revisarlo: comparaba contra campos que no existen
    (`tipoEvento`, `numeroInvitados`) así que **la cuenta daba siempre cero**;
    calculaba el salón y no lo usaba, así que una fiesta del Club Uruguay se
    comparaba contra otra de un salón distinto; y decía tomar "las 5 más
    recientes" sin ordenar por fecha. **Su prueba tampoco probaba nada**: armaba
    las fiestas con nombres de campo inventados.
  - **Que no se pierda la llegada de invitados si se cae el internet**
    (`src/lib/offline/offline-action-queue.ts` y la pantalla de recepción). La
    cola guarda en el celular y manda sola cuando vuelve la señal, sin duplicar.
    **Sólo está enchufada al registro de llegada.** El informe decía que también
    cubría la foto del muro y el pedido de la barra: **no las cubre.**
  - **La pantalla de la puerta, en oscuro.** Es la que se usa a las tres de la
    mañana en un salón sin luz.
  - **El resumen de la mañana ordena las fotos por corazones**, en vez de tomar
    las primeras doce.

  **Lo que el informe daba por hecho y no estaba:** la trivia conectada a la
  pantalla gigante y la pregunta de los quince en la fotocabina. **No se tocó
  ningún archivo de las dos.** Quedan pendientes.

  **El configurador de la reunión de cierre se devolvió.** Estaba escrito contra
  una función que no existe (`createPresupuesto`, la real es `savePresupuesto`) y
  contra campos que `ServicioEmpresa` no tiene. **Nunca compiló.** No se remendó:
  se sacó y se rehace, porque cuando aparecen errores nuevos y distintos al
  arreglar los primeros, no está dañado, está sin terminar.

  **Por qué se anota todo esto:** el control que sirvió no fue correr las pruebas
  —que también fallaban— sino **comparar lo que el informe decía contra los
  archivos que realmente cambiaron**. Conviene hacerlo siempre.

- **Bajar el ruido de alertas y notificaciones — sólo la plata grita (16 de agosto de 2026):**
  - **Bloque A — Que no todo sea urgente (`src/lib/automatizaciones-engine.ts`):** Solo cuatro reglas permanecen como `'urgente'` (`falta-sena`, `cuota-vencida`, `saldo-pendiente-evento-cercano`, `contrato-sin-firmar`), porque tocan cobros, vencimientos o el contrato legal. Las reglas operativas y organizativas (`decoracion-sin-definir`, `cronograma-vacio`, `tareas-vencidas`) se degradaron a `'atencion'` sin disparar alarma roja.
  - **Bloque B — El globito rojo cuenta sólo lo urgente (`src/components/main-nav.tsx` y `src/components/notifications-hub.tsx`):** El contador rojo de la barra lateral y de la campana solo se enciende si hay alertas urgentes pendientes. Si hay únicamente avisos tranquilos (`atencion`, `info`), se muestra un punto gris discreto sin número que no genera estrés.
  - **Bloque C — Una línea por fiesta (`src/app/(app)/alertas/page.tsx`):** Las alertas se agrupan en una tarjeta por fiesta; si la fiesta tiene alertas urgentes de dinero/contrato, se destacan arriba en rojo suave y el resto de los avisos operativos se listan abajo de forma limpia y ordenada.
  - **Bloque D — Silenciar guardados de rutina en las pantallas más ruidosas (`muro-social`, `portal-cliente`, `empresa/galeria`, `decoracion`, `entretenimiento`):** Se eliminaron los carteles emergentes de éxito que tapaban la pantalla tras cada toggle o guardado básico. Se conservan todos los carteles de error (`destructive`) y los carteles de confirmación en operaciones que tocan costos (`syncDecoGastosToModule`).
  - **Bloque E — Retirar animaciones decorativas (`animate-pulse`, `animate-ping`, `animate-bounce`):** Se removieron los parpadeos y rebotes decorativos de las pantallas internas del equipo (`admin`, `carga-operativa`, `decoracion`, `entretenimiento`, `muro-social`, `fiestas/nueva`, `portal-cliente`, `timeline`, `presupuestos/[id]/ver`), conservando intactos los esqueletos de carga (`kpi-card`) y las estaciones vivas de la fiesta.
  - **Bloque F — Los sonidos, apagados salvo en la fiesta:** Se verificó que las pantallas internas no reproduzcan audio automáticamente y sólo suenen ante un clic explícito del usuario para reproducir grabaciones, respetando el sonido propio de las estaciones del salón.

- **Mejoras Tanda 1 — Que la fiesta venda la próxima (15 de agosto de 2026):**
  - **Fotocabina (`evento/fotocabina/[fiestaId]`):** Añadido renglón discreto al finalizar la tanda de fotos en la pantalla del invitado con enlace atribuido al simulador de presupuesto (`campaign: 'fotocabina'`, `refFiestaId`), sin tapar fotos ni botones y visible solo para invitados (no operadores).
  - **Galería interactiva y Muro Social (`evento/galeria` y `evento/social`):** Añadido enlace discreto con atribución al simulador de presupuesto (`campaign: 'galeria'` / `'muro_social'`). Ocultada la barra de contadores cuando `posts.length === 0` y añadido botón de llamado a la acción "Subí tu primera foto".
  - **Atracción de Clientes por Fiesta (`contabilidad/crm/atraccion-fiestas`):** Pantalla en el CRM y acción `getAtraccionFiestasReport` para agrupar prospectos, presupuestos y contratos ganados según el evento del que llegaron (`refFiestaId`), con filtro por año y estado vacío explicativo. Botón de acceso directo en el encabezado del CRM.
  - **Álbum Oficial Público (`evento/album/[fiestaId]` y `/album/[fiestaId]`):** Página pública del álbum con nombre del evento, fecha, grilla de fotos aprobadas en alta definición, modal lightbox a pantalla completa con descarga directa, botón "Compartir álbum" (copia al portapapeles/WhatsApp) y pie comercial discreto con atribución al simulador.

- **Mejoras Tanda 2 — Bloques F al K de la orden maestra (15 de agosto de 2026):**
  - **Bloque F — Ranking de la noche en pantalla gigante (`evento/muro-en-vivo/[fiestaId]`):** Diapositiva rotativa automática en el slideshow cada 6 publicaciones ("⭐ Momento Estelar: La foto más querida de la fiesta") destacando la publicación aprobada con más corazones y el marcador de mesas/grupos más participativos, sin perdedores ni nombres propios, solo festejo colectivo.
  - **Bloque G — Cápsula del tiempo en Buzón de Deseos (`evento/buzon/[fiestaId]` y `actions/buzon.ts`):** Opciones para marcar saludos como cápsula para abrir en 1, 3, 5, 10 o 15 años, con cálculo automático de fecha ISO futura (`unlockDate`), nota de destinatario y persistencia en Firestore.
  - **Bloque H — Pedidos de música para el DJ (`evento/dj/[fiestaId]`, `evento/social/[fiestaId]` y `actions/social-interactive.ts`):** Límite de 3 solicitudes por invitado con aviso claro y panel en vivo para el DJ con ranking ordenado por votos, estados ("Pendiente" / "Sonada") y aviso de control total del DJ.
  - **Bloque I — Pedido por proveedor listo para WhatsApp (`fiestas/nueva/catering/lista-compras`):** Botones "WhatsApp" y "Copiar" en cada tarjeta de proveedor que arman el mensaje formal y educado con datos del evento y lista de insumos/unidades sin tocar fórmulas ni cálculos.
  - **Bloque J — Fotos de fiesta convertidas en posteos (`actions/social-media.ts` y `empresa/redes-sociales`):** Server action `generateDraftPostsFromPartyPhotos` y diálogo en el planificador que generan 4 borradores con copy, etiquetas y fotos aprobadas en estado `Borrador` esperando aprobación (nunca publica automáticamente).
  - **Bloque K — El presupuesto que se explica solo (`lib/budget/budget-narrative.ts` y `components/budget/BudgetDocument.tsx`):** Resumen narrativo fiel y determinista arriba del desglose de ítems que describe los servicios contratados (gastronomía, bebidas, DJ, fotografía/cabina, salón, limpieza de Club Uruguay) sin inventar números ni precios.

- **Lo que le toca a Gemini, Claude no lo programa.** Claude escribe código sólo
  en plata, cobros, comida y permisos; el resto va a una orden en
  `docs/ordenes/`. Programarlo igual le cuesta el doble al dueño.
- **Propuestas grandes, no muchas chicas.** Cada fusión dispara un despliegue y
  se paga. Se junta la tanda entera en una sola propuesta. La documentación
  viaja con el código, nunca en una propuesta aparte. **Vale también para las
  órdenes que una IA le escribe a otra**: una orden de cinco bloques se entrega
  en una sola propuesta con los cinco, no en cinco. El dueño lo tuvo que repetir
  el 10 de agosto de 2026 porque la orden pedía lo contrario que la regla.

- **Reseñas de Google Automáticas:** Solo se envían a los que tienen NPS >= 9, y solo si el enlace está configurado en Ajustes. No se manda más de una vez.
- **Plan de la Noche del Equipo:** Los sueldos y `eventSalary` NO deben filtrarse en la vista `getAccesoPersonalPortalView` bajo ningún concepto. La hora de llegada es simplemente `fiesta.configuracion.horaInicio`.

- **Pantallas de la noche — Resiliencia ante cortes (15 de agosto de 2026):**
  - **Estación de Impresión (`impresion/[fiestaId]`):** Mantiene el estado de error de forma persistente con `hasError`, timestamp de desconexión y `<ReconnectingIndicator />`. No oculta el fallo tras 2 segundos para que el operador no imprima desinformado.
  - **Presentación LED (`presentacion-led`):** Auto-reintenta la carga cada 10 segundos ante fallos de conexión sin necesidad de refrescar la página entera a mano (evita que la pantalla quede congelada en un salón con mala señal).
  - **Tótem (`totem/[fiestaId]/[totemId]`):** Mientras no haya conexión (`!qrUrl`), el QR no se muestra disponible y se presenta un aviso grande y visible desde lejos indicando que la estación está conectando, evitando intentos de escaneo fallidos.
  - **`public/firebase-messaging-sw.js` no se edita a mano ni se commitea con la configuración adentro.** Lo genera `scripts/generate-firebase-messaging-sw.mjs` en cada compilación, y en la versión principal queda la variante que no hace nada. Vino modificado en la entrega y se descartó al fusionar. Si aparece cambiado en una rama, quedarse siempre con la versión de `main`: es la segunda vez que se cuela.
  - **La prueba de estas tres pantallas controla el texto del código fuente, no el navegador.** Se dejó a propósito así (es barata y frena una regresión), pero **no se le agregan colores concretos**: el bloque de colores del tema está a medias y los rompería. Se controla tamaño y peso del texto.

- **Incidentes, aprobaciones y guías de armado: se conectan al menú, NO se retiran (15 de agosto de 2026).** Estaban terminadas y funcionando, pero ningún botón llevaba a ellas: había que escribir la dirección a mano. Se decidió conectarlas porque es trabajo ya pagado y sano; borrarlas era tirar plata. **Incidentes** y **Guías de Armado** van en el grupo Fiestas (se usan al armar el evento y durante la noche); **Cambios a Aprobar** va en Contabilidad, porque cada solicitud lleva impacto en pesos y la decisión la toma quien maneja la plata. Hay una prueba que controla que los tres enlaces sigan en el menú: si alguien reordena y se los lleva puestos, salta ahí.
- **Una solicitud de cambio se decide UNA sola vez (15 de agosto de 2026).** Antes, aprobar y rechazar no miraban el estado: un cambio ya rechazado se podía volver a aprobar y el nombre de quien había decidido se pisaba con el último. Sobre solicitudes con impacto en pesos eso es plata autorizada sin poder reconstruir por quién. Ahora avisa que ya fue decidida, por quién y cuándo, y pide una solicitud nueva. El control vive en `src/lib/aprobaciones/decision.ts` y no en el archivo de acciones, porque ése es `'use server'`.
- **Guardado de aprobaciones con turnos (15 de agosto de 2026).** `aprobaciones.json` se leía y escribía sin turno: dos personas decidiendo a la vez pisaban la decisión de la otra. Se usa el mismo mecanismo que facturas y recibos. Adentro del turno se lee con `readData` directo y **nunca** con `getAprobaciones`, porque volver a pedir el mismo turno deja la pantalla colgada para siempre.
- **La seña del contrato ya no se asienta como efectivo por defecto (15 de agosto de 2026).** `registerContractDeposit` guardaba "Efectivo" cuando no le decían cómo había entrado la plata, y ese método se copiaba después al pago de la factura: una transferencia quedaba anotada como plata en mano. Ahora el método es obligatorio. La usa el cierre de contratación (`confirmBookingWithContract`), y el formulario pedía el monto de la seña pero **nunca preguntaba cómo había entrado**: toda seña quedaba como efectivo. Ahora el diálogo de contratación pregunta el método apenas se escribe un monto, y el servidor rechaza el cierre si falta. **Ojo:** hay una segunda función con el mismo nombre en `src/lib/commercial-flow/deposit-service.ts` que no la usa nadie. Si algún día hace falta, usar la de `actions/crm.ts` y no dejar las dos vivas.
- **Auditoría de plata, cobros y permisos del 15 de agosto de 2026: sin hallazgos.** Se revisaron presupuestos, facturas, recibos de personal, gastos, cupones, planes de pago y pagos del portal. Todos tienen turnos de guardado, control de permiso y bloqueo de cambios después de cobrado. Las divisiones controlan el cero y el redondeo está centralizado. **No hace falta volver a auditar esta área**: si una auditoría nueva reporta algo de acá, verificarlo contra esta línea primero.
- **Rechazar exige motivo también en el servidor (15 de agosto de 2026).** La pantalla ya lo pedía, pero la acción aceptaba un motivo vacío si se la llamaba de otro lado. Quedaba un cambio rechazado sin explicación.
- **Gestión de Promociones — Fechas Obligatorias (15 de agosto de 2026):**
  - **Validación estricta (`promos.ts` y `settings/promos`):** No se permite guardar ninguna promoción sin `fechaInicio` o sin `fechaFin`, ni con fecha de fin anterior a la de inicio. Previene que queden promociones activas con countdown roto o indefinido en la landing page.
- **Colores del Tema y Escala Visual — Ajustes, Pantallas Principales y Alertas (15 de agosto de 2026):**
  - Recorridas y adaptadas pantallas de Ajustes (`settings/promos`, `settings/catalogo-servicios`, `settings/feature-flags`, `settings/account`, `settings/cupones`), Centro de Alertas (`alertas/page.tsx`) y pantallas principales cliente/invitados (`simulador-de-presupuesto`, `portal/c/[accessKey]`, `portal-cliente/[id]`, `evento/buzon/[fiestaId]`, `presentacion-led/portafolio`, `portal-cliente/[id]/muro-social`, `simulador-ak`) pasando colores hardcoded a tokens semánticos del tema (`text-foreground`, `text-primary`, `text-muted-foreground`, `bg-card`, `bg-background`, `bg-muted/40`, `border-border`) y fijando la escala `rounded-xl` para tarjetas y `rounded-lg` para campos/botones.
- **Refuerzos de Seguridad y Sincronización en Server Actions (15 de agosto de 2026):**
  - `deleteAllVideoVidaPhotos` exige `requireAppSession()` antes de purgar archivos en Firebase Storage.
  - `updateConfiguracion` utiliza `saveFiesta` para validar acceso de escritura (`requireFiestaWriteAccess`) y preservar secretos del evento.
  - `updateAppointment` sincroniza automáticamente con Google Workspace ante modificaciones de fecha/hora o datos del cliente.
- **En `src/app/actions/simulador-copilot.ts` el `z` se importa de `genkit`, no de `zod` (15 de agosto de 2026).** Vino cambiado a `zod` en una entrega, sin relación con lo que se había pedido, y se descartó al fusionar. Todo el resto del proyecto lo importa de `genkit`: ese `z` es el que espera `ai.definePrompt` para registrar el esquema, y el cambio compila igual pero puede fallar recién al usarlo. Si vuelve a aparecer, quedarse con la versión de `main`.

- **Comida: números negativos y platos sin ingredientes (15 de agosto de 2026).** Cuatro cosas de la misma tanda:
  - **No se guarda un menú con cantidades por persona o costos negativos.** Un costo en menos hace que el plato parezca más barato que gratis, y ese número entra derecho al presupuesto del cliente y a la rentabilidad del evento: se veía una ganancia que no existía. El control vive en `src/lib/catering/numeros-de-menu.ts` (afuera del archivo `'use server'`). **El cero sí se permite**: hay ingredientes que todavía no se cargaron.
  - **Bebidas y repostería tampoco aceptan cantidades ni costos negativos** en los campos de carga.
  - **La lista de compras avisa cuando un plato contratado no aporta ningún ingrediente**, o cuando el plato ya no está en el menú. Antes se salteaba en silencio y la cocina compraba sin saber que le faltaba un plato entero: se enteraba el día de la fiesta.
  - **Cantidad cero en bebidas o repostería quiere decir "no se pide".** Antes se compraba una unidad igual, porque el código usaba `|| 1`.
- **La fecha del contrato firmado se muestra en formato uruguayo (15 de agosto de 2026).** Estaba en `es-ES` mientras el resto de esa pantalla usaba `es-UY`.
- **Cuatro incomodidades de las pantallas internas, resueltas (15 de agosto de 2026).** Estaban pedidas a Gemini y el dueño pidió hacerlas en el momento:
  - **El menú tenía dos botones al mismo lugar.** "Nuevo Presupuesto" y "Presupuestos" caían los dos en la Central de Presupuestos, porque `/presupuestos` redirige a `/presupuestos/nuevo`. Quedó **una sola entrada, "Presupuestos"**; el botón de crear ya vive adentro de esa pantalla.
  - **Las citas del calendario ahora se pueden reprogramar y cancelar.** Antes lo único posible era marcarlas "Confirmada": si el cliente cambiaba la fecha había que crear otra cita al lado y quedaban las dos en la agenda. Se reusa el mismo formulario. **Cancelar no borra**: deja la cita marcada como cancelada, para que quede el registro. Las acciones nuevas son `updateAppointment` y `cancelAppointment` en `agenda.ts`, y el servidor rechaza reescribir una cita ya cancelada.
  - **Las alertas arrancan mostrando sólo las que faltan mirar.** Las leídas se quedaban en la lista con el color apagado y tapaban las nuevas. Hay un enlace que dice cuántas hay escondidas para verlas.
  - **El historial de un empleado va de la fiesta más nueva a la más vieja y tiene filtro por año.** Antes cargaba todo junto y había que bajar hasta el final para ver el último evento.
  - De paso, el control de seguridad de `agenda.ts` en `release-security-boundaries.test.ts` **dejó de contar llamadas a mano**. Esperaba exactamente dos `requireAppSession` y fallaba al agregar una acción nueva aunque el control estuviera puesto, sin decir cuál faltaba. Ahora controla lo que importa: toda función exportada que escriba en el archivo tiene que pedir la sesión antes, y el error nombra la que falta.
- **Mejoras Estéticas de Pantallas — 5 Bloques Resueltos (15 de agosto de 2026):**
  - **Bloque D — Dock de navegación en celular (`module-navigation-dock.tsx` y `catering/page.tsx`):** Dock reubicado en mobile a `bottom-4 left-3` (`sm:top-20 sm:left-3`), dejando libres todos los títulos de pantallas internas sin tapar contenido ni botones de acción. Se eliminó el botón redundante de volver en el encabezado de catering.
  - **Bloque E — Margen inferior del asistente flotante (`app-shell.tsx` y `catering/page.tsx`):** Añadido `pb-32 sm:pb-36` en `<main>` de la app y `pb-28 sm:pb-32` en catering para que los botones inferiores ("Añadir postre", etc.) scrolleen con holgura por encima del widget flotante de IA.
  - **Bloque A — Galería interactiva vacía (`galeria/[fiestaId]/page.tsx`):** Oculta la barra de estadísticas cuando no hay fotos (`posts.length === 0`) y muestra un estado vacío con botón destacado *"Subí tu primera foto"* apuntando a la subida y recomendaciones de fotocabina.
  - **Bloque B — Portada de presentación LED (`slides/portada-slide.tsx`):** Reemplazado placeholder roto por tarjeta estética con gradiente nocturno sutil, resplandor e isotipo de marca.
  - **Bloque C — Espaciado de controles en presentación LED (`slide-layout.tsx` y `presentacion-led/page.tsx`):** Barra inferior adaptada de forma responsiva (`bottom-5 sm:bottom-6`) y margen de diapositivas ampliado a `pb-36 sm:pb-40` para evitar cualquier colisión con los textos explicativos.
- **El registro de qué está probado y qué se auditó vive en `docs/PRUEBAS-Y-AUDITORIA.md` (15 de agosto de 2026).** Está ahí para no volver a contar a mano: cuántas pruebas hay, qué protege cada grupo, qué recorre cada prueba de navegador, qué áreas se auditaron y con qué resultado, y **qué NO está probado**, dicho de frente. Ojo con los números: contarlos a mano da 1.233 y la corrida real da 1.617, porque una prueba que recorre varios casos figura una sola vez en el archivo. **Los números salen de correr, no de contar.**
- **La presentación que se le muestra al cliente repetía la misma frase dos veces (15 de agosto de 2026).** El subtítulo por defecto de la portada era exactamente el mismo texto que la frase grande de arriba: "Tu evento soñado, hecho realidad", una arriba de la otra. Se cambió el subtítulo y además la portada **no muestra el subtítulo si dice lo mismo que la frase grande**, por si alguien lo vuelve a escribir igual desde Ajustes.
- **Los avisos del ingreso con Google hablaban en técnico (15 de agosto de 2026).** Decía "Firebase no esta configurado para iniciar con Google" en rojo, arriba del botón de entrar, antes de que la persona intentara nada. Ahora dice que el ingreso con Google no está disponible y que entre con su correo.
- **La app dejó de hablar como programador cuando falta un dato (16 de agosto de 2026).** Salió de mirar las 243 pantallas. Cinco arreglos, todos de texto:
  - **La confirmación de asistencia** decía "Evento no encontrado." y nada más, y **eso lo ve el invitado**. Ahora dice que el enlace no está disponible y que le pida el nuevo a quien lo invitó.
  - **La pantalla de estado del evento** mostraba la dirección web con su parámetro, escrita como código. Ahora dice que todavía no eligió una fiesta, con el botón para ir a los eventos.
  - **Tres pantallas** tiraban cartel rojo de error cuando el usuario no había hecho nada mal, sólo entrado sin elegir fiesta. Ahora piden elegirla, sin rojo.
  - **Editar empleado** mostraba el identificador interno en el aviso. Ya no.
  - **El aviso de Instagram** nombraba "Graph API" y "token". Ahora dice que no está conectado y dónde se conecta.
  Hay una prueba (`sin-jerga-cuando-falta-un-dato.test.ts`) que los cuida. **Ojo:** una prueba vieja exigía que el mensaje de Instagram dijera "Graph API"; se cambió para que controle **la intención** —que avise y no guarde nada— y no la palabra técnica. Atar una prueba a la jerga impedía mejorar el mensaje.
- **Mejoras Tanda 3 — Bloques A, B, C, D de la orden de agosto (17 de agosto de 2026):**
  - **Bloque A — Trivia y Misiones (evento/social y muro-en-vivo):** La Trivia Múltiple Opción y Misión Fotográfica se conectaron al Muro en Vivo. El podio (tableLeaderboard) ahora se inyecta por WebSockets a `toPublicSocialEvent` para que el muro lo vea instantáneamente, y `ActiveGameData` ganó la propiedad `isFinished` para frenar los relojes. El invitado ve las dos opciones en el portal interactivo de la noche.
  - **Bloque B — El micrófono de la secretaria (multiagent-widget.tsx):** Se agregó soporte para síntesis y reconocimiento de voz nativos del navegador (`SpeechRecognition` y `SpeechSynthesis`). Tiene un botón de silenciar para que no hable en voz alta en un salón ruidoso, y cambia de color según esté escuchando o no.
  - **Bloque C — Registro de llegada del equipo (acciones y centro de fiesta):** El coordinador ahora marca a qué hora llegó cada empleado. Se guardó como `checkInTimestamp` (para que no pise la asignación original), y el botón en el Centro de Mando se pone verde una vez tocado, alimentado por una server action directa.
  - **Bloque D — Pantallas oscuras de la noche:** `accesos` ya usaba el fondo `#111827` de `ak-live-stage`, pero `logistica` era una pantalla diurna que encandilaba en la puerta. Se pasó a `bg-slate-950` con tarjetas y textos en alto contraste (`bg-slate-900`, `text-slate-200`) para igualar las demás.

- **El recuerdo de cada invitado implementado y validado (17 de agosto de 2026).**
  - **Bloque 1 (Guardar de quién es cada foto):** `SocialGalleryPost` ahora persiste el `guestId` de quien la subió en el muro social y en todas las estaciones de captura (`uploadSocialPost`, `persistSocialMediaPostFromUrl`, `uploadEntretenimientoMedia`), permitiendo asociar cada recuerdo a su autor sin reconocimiento facial invasivo. Si la foto se sube sin enlace personal se guarda igual sin dueño.
  - **Bloque 2 ("Tu recuerdo" en el enlace personal):** `buildMorningRecap` en `src/lib/recap/recap-engine.ts` y `/evento/[id]/video-recuerdo` filtran por `guestId`, ubicando sus fotos primero con distintivo de autoría ("Tu foto") y completando con las más queridas de la fiesta (o la fiesta entera si no sacó ninguna).
  - **Bloque 3 (Video vertical descargable para historias):** En `video-recuerdo-client.tsx`, renderizado y grabación de video vertical (9:16) con Ken-Burns y marca de agua discreta de AK generado directamente en el celular del cliente (`MediaRecorder` sobre canvas) sin procesador en el servidor ni costos de IA. Botón de descarga para historias y texto para compartir.
  - **Bloque 4 (Guardarse el enlace por WhatsApp):** En el muro social y la fotocabina, botón *"Mandármelo por WhatsApp"* que abre `https://wa.me/?text=...` para que el invitado se autoenvíe su enlace de recuerdo para ver al día siguiente sin envíos automáticos ni spam desde el sistema.
  - **Bloque 5 (Teléfono inventado eliminado):** `recordQuinceaneraLeadAction` en `src/app/actions/commercial-intelligence.ts` dejó de guardar el número inventado `'099000000'`. Si la invitada no deja teléfono, se guarda sin contacto y con nota explícita ("respondió que cumple quince el año que viene, no dejó teléfono").
  - **Validación:** Suite dedicada `el-recuerdo-de-cada-invitado.test.ts` pasando con éxito.

- **Centro de Presencia Digital implementado y validado (17 de agosto de 2026).**
  - **Bloque 1 (El tablero único):** Nueva pantalla interna `/empresa/presencia-digital` pensada para el celular, con 4 KPIs grandes arriba (seguidores con variación semanal, fiestas reales cerradas de avisos, publicaciones pendientes de aprobación y estado de Google Ficha).
  - **Bloque 2 (Guardar los números todos los días):** Motor de snapshot diario `buildDailySnapshots` y persistencia en `social-analytics-history.json` (`src/lib/presencia-digital/metricas-historicas.ts`) guardando seguidores, alcance, interacciones y gasto por red sin duplicados diarios.
  - **Bloque 3 (Publicar una vez y que salga en todas con aprobación humana):** Acción de servidor `publishApprovedSocialPost` con regla estricta: *Nada se publica solo. La app prepara, una persona aprueba.* Reporte explícito por plataforma (Instagram/Facebook directos, aviso de no automatización en estados de WhatsApp para proteger la cuenta, y aviso de aprobación de app requerida para TikTok).
  - **Bloque 4 (La revisión diaria):** Acción `buildDigitalPresenceDailyReview` que detecta la publicación con mejor desempeño, alerta sobre redes inactivas (+3 días sin postear) y genera sugerencia concreta para hoy, contabilizando el consumo de IA bajo `'revision-diaria'` ($2 UYU) en `COSTO_ESTIMADO_UYU`.
  - **Bloque 5 (Qué publicidad trae fiestas de verdad):** Cruce determinista entre `meta-ads.ts`, `crm-leads.json` y `presupuestos.json` aceptados/señas mediante `calculateCommercialAdsRoi`. Calcula el costo real por fiesta confirmada (`gasto / fiestas_cerradas`) ordenado por cierres reales y destacando avisos que no cerraron nada.
  - **Validación:** 4 suites dedicadas en `centro-de-presencia-digital.test.ts` con cobertura completa, cero regresiones y enlaces directos desde el menú de Empresa y el Planificador de Redes Sociales.

- **Entregas 2 y 3 de la Orden Maestra implementadas y validadas (17 de agosto de 2026).**
  - **Bloque E (Reunión que se agenda sola):** Motor de cálculo de turnos y franjas horarias disponibles (`src/lib/agenda/horarios-disponibles.ts`) con agendamiento en el paso 6 del simulador (`SimulatorMeetingScheduler.tsx`, `src/app/actions/simulator-agenda.ts`), generación de enlace a Google Calendar y mensaje listo para WhatsApp.
  - **Bloque G (Pregunta de los 15 y categoría Adolescente):** Nueva categoría `'Adolescente'` en invitados y fiestas; widget `QuinceaneraLeadPrompt.tsx` en fotocabina y muro social; agrupación unificada de niños y adolescentes en compras de menú de menores con `getGuestCountForItem()`.
  - **Bloque H (Resiliencia offline en salón):** Encolado local con `enqueueOfflineAction` en muro social y barra de tragos cuando se corta la señal.
  - **Bloque A (Misiones secretas de fotos):** Pestaña de misiones fotográficas activa en el muro social.
  - **Bloque I (Configurador visual 3D para reunión de cierre):** Pantalla `/empresa/configurador-reunion` con render 3D Three.js del salón, ambientación LED, selección de servicios y motor de cálculo de presupuestos formales.
  - **Bloque J (Video de la mañana / historias para la quinceañera):** Flujo de video recuerdo verificado en `/evento/[id]/video-recuerdo`.
  - **Bloque K (Termómetro de la fiesta):** Monitor de energía en vivo `FiestaThermometer.tsx` en la consola del DJ (`/evento/dj/[fiestaId]`).
  - **Bloque L (Libro de la fiesta en PDF):** Generador descargable `src/lib/pdf/generador-libro-fiesta.ts` y `DownloadPartyBookButton.tsx` con dedicatorias, cronograma y fotos.
  - **Bloque M (Cronograma por rol - "Lo tuyo, ahora"):** Vista `/evento/staff/[fiestaId]/cronograma` para mozos, DJ, fotógrafos, animadores y catering.
  - **Bloque N (Transmisión privada en vivo):** Pantalla `/evento/en-vivo/[fiestaId]` con chat reactivo para familiares a distancia.
  - **Validación:** 200 suites de pruebas unitarias pasando (1.446 tests), cero errores de TypeScript y build de producción de Next.js exitoso.

- **El ruido bajó: sólo la plata grita (16 de agosto de 2026).** El dueño dijo que la app era "un alertadero continuo". Se había medido: 1.405 carteles emergentes, 7 de 11 reglas marcadas como urgentes —entre ellas "decoración sin definir" **a 30 días**, al mismo nivel que una cuota vencida—, 120 cosas parpadeando y 13 pantallas con sonido. Ahora **quedan urgentes sólo las cuatro de plata y contrato**; el globito rojo cuenta sólo ésas (bajó de 4 a 1 en la pantalla de prueba); las alertas se agrupan **en una tarjeta por fiesta**; los carteles de éxito de las cinco pantallas más ruidosas se reemplazaron por una marca discreta, **dejando todos los de error**; dejó de parpadear lo que no está cargando; y los sonidos quedaron sólo en las estaciones de la fiesta. **No se borró ninguna alerta ni se cambió cuándo salta**: cambió cómo avisa. Verificado con foto.
- **Se miraron LAS 243 PANTALLAS de la app, una por una (16 de agosto de 2026).** No una muestra: todas. Se repartió entre seis ayudantes en lotes de veinte a treinta, y cada hallazgo se verificó en el código antes de darlo por bueno. **La mayoría está bien.** Salieron trece cosas en total y ninguna rompía nada. **El patrón que apareció:** cuando una pantalla se abre sin el dato que necesita, la app habla como programador —muestra identificadores internos, nombres de parámetros y hasta `?fiestaId=...` tal cual—. Son cinco pantallas y están pedidas en la orden vigente. **Que una pantalla no figure en la lista de hallazgos quiere decir que se miró y estaba bien**, no que no se miró.
- **El botón flotante de volver va abajo, y en escritorio corrido pasando la barra lateral (16 de agosto de 2026).** `module-navigation-dock.tsx`. Costó tres intentos y quedan anotados para no repetirlos: arriba tapaba el título en el celular y el logo en escritorio; bajarlo a la izquierda tapaba **"Alertas"** en el menú. La barra lateral mide 16rem y aparece a partir de 768px, así que desde ahí el botón arranca en `17rem` y queda dentro del área de contenido. El botón del asistente vive abajo a la derecha, así que no se chocan. En las pantallas públicas no hay barra lateral y sigue arriba, como estaba. **Verificado con foto, no por deducción.**
- **Las once mejoras se entregaron y se fusionaron (16 de agosto de 2026).** La fotocabina, la galería y el muro ofrecen el presupuesto con la marca de la fiesta; hay pantalla de qué fiesta trajo clientes; álbum público que el cliente reparte; ranking de la noche; mensajes para abrir dentro de años; pedidos de música al DJ; pedido por proveedor listo para WhatsApp; posteos automáticos desde las fotos; y el párrafo que explica el presupuesto. **Ojo con dos cosas que dejó la fusión:**
  - **Vinieron en TRES propuestas y la orden pedía UNA.** Al juntarlas apareció el problema que la regla justamente evita: **dos entregas arreglaron la galería vacía cada una por su lado**, y al fusionarlas el archivo quedó roto y no compilaba. Se reparó a mano quedándose con la versión que se adapta a la pestaña y volviendo a poner el renglón de atribución de la otra. **Si dos entregas tocan la misma pantalla, revisar ese archivo a mano, no confiar en la fusión automática.**
  - **Quedó pendiente la parte de escritorio del botón flotante.** En el celular ya no tapa el título; en escritorio sigue montándose sobre el logo de la barra lateral. Está pedido en la orden vigente.
- **Los colores del tema en las pantallas principales SÍ se fusionaron, aunque estaban descartados (15 de agosto de 2026).** Gemini ya los había hecho antes de que se descartara la orden, sobre `portal-cliente`, `muro-social`, `buzon`, `portafolio`, `simulador-ak` y `simulador-de-presupuesto`. Se fusionó porque el trabajo ya estaba hecho, pasó los cuatro controles y no pisó nada. **Ojo con dos cosas que se aprendieron ahí:**
  - **No era invisible.** En `simulador-ak` la cabecera y la tarjeta del presupuesto pasaron **de oscuro a claro**. Un pasaje de colores puede cambiar el aspecto de verdad; no se aprueba a ciegas.
  - **Hubo conflicto en `simulador-ak` justo donde estaba el arreglo del logo.** Se resolvió quedándose con el diseño nuevo (fondo claro, logo sin blanquear), que es lo coherente. **Después de fusionar hay que verificar que el logo no quede blanco sobre blanco.**
  - Lo que sigue descartado es **migrar los 354 archivos restantes**: sin modo oscuro no se ve distinto. Lo de abajo sigue valiendo.
- **El pasaje de colores al tema quedó DESCARTADO para el resto de la app (15 de agosto de 2026). No lo pidas de nuevo.** Faltaban 354 archivos y unas 7.200 apariciones. Se descartó al verificar que **la aplicación no tiene modo oscuro**: está preparada por dentro (`darkMode: ['class']` y un bloque `.dark`), pero **no existe ningún proveedor de tema ni interruptor**, así que la clase `dark` no se aplica nunca y de cientos de pantallas sólo 7 tienen algo escrito para oscuro. Sin modo oscuro el cambio **no se ve distinto en pantalla**: son 7.200 modificaciones invisibles sobre pantallas que ya funcionan y ya se revisaron a ojo, cada una con riesgo de romper algo sano. Si algún día se quiere modo oscuro, el orden es al revés: primero el interruptor, después migrar sólo lo que se vaya a usar en oscuro. El detalle está en `docs/ordenes/hechas/colores-del-tema-descartado.md`.
- **Cuatro cosas de estética encontradas MIRANDO las pantallas, no leyendo código (15 de agosto de 2026).** Las pruebas comprueban que las pantallas funcionen; que se vean bien no lo miraba nadie. Se sacaron fotos de las pantallas del cliente y del invitado (`AK_FOTOS=true`) y se revisaron a ojo:
  - **Un globo blanco vacío en la portada del simulador.** El logo tiene un respaldo —círculo rojo con "AK"— para mientras carga la imagen. Las pantallas oscuras pintan el logo de blanco con `brightness-0 invert`, y ese filtro caía también sobre el respaldo: círculo blanco con letras blancas. Justo donde el cliente arma su presupuesto. El respaldo ahora se salva del filtro.
  - **En el celular, el botón "Personalizar portada" tapaba el nombre de la empresa** en el portal del cliente: está flotando sobre la esquina y con el texto completo se montaba sobre los rótulos. En pantalla chica queda sólo el ícono.
  - **"Faltan 0 días".** El portal decía siempre "Faltan N días": el día de la fiesta mostraba cero, que parece un error, y la víspera decía "Faltan 1 días". Ahora dice "¡Es hoy!", "¡Es mañana!" y "¡Ya la festejaste!". Vive en `src/lib/portal/cuenta-regresiva.ts`.
  - **"Acceso de estacion no autorizado."** Es lo que veía un invitado al abrir la fotocabina sin permiso: jerga, sin acento y sin decir qué hacer. Ahora dice que la estación no está habilitada y que se lo pida al equipo de AK.
- **El muro social tarda en dibujarse, y es sabido (15 de agosto de 2026).** La prueba `muro-subir-foto` le da hasta 20 segundos a propósito, con el comentario de que en la fiesta real pide varias cosas al servidor. Una foto sacada a los 4 segundos lo agarra girando: **no es una pantalla rota**. Si alguna vez molesta de verdad, lo que hay que mejorar es la espera, no la pantalla.
- **Las pruebas de navegador se pisaban entre ellas (15 de agosto de 2026).** `noche-de-fiesta` crea una fiesta señuelo a **un año justo** y `simulator-budget-journey` avanza doce meses en el calendario y elige el día 15: caían en la misma fecha. El simulador la marcaba ocupada —**correcto, porque lo estaba**— y no dejaba pasar de paso. **No era un defecto de la app.** La señuelo pasó a 400 días para que queden en meses distintos.
- **Cómo se corren las pruebas de navegador: `npm run test:e2e:production`, nunca `npx playwright test` a secas (15 de agosto de 2026).** El segundo levanta el servidor de desarrollo, que recompila cada ruta y renderiza distinto: da fallas que no existen. Ya costó una corrida entera de 27 minutos.
- **FALSO POSITIVO verificado: "la pantalla de presupuestos no tiene listado" (15 de agosto de 2026).** `/presupuestos` redirige a `/presupuestos/nuevo`, y esa pantalla **es** la "Central de Presupuestos": trae el listado completo, el conteo y el interruptor de archivados. El listado no falta. Lo que sí sobra es que el menú tenga dos entradas al mismo lugar, y eso quedó pedido en la orden vigente.
- **El ajuste anual del 15% va siempre.** Aparece en presupuestos y en el portal.
- **El descuento del 50% del Salón Club Uruguay** y el descuento del presupuesto
  son decisiones de marketing.
- **La lista de compras usa los invitados del PRESUPUESTO**, no los confirmados.
  Se cocina lo que se contrató. Si vienen más, se agregan y el presupuesto sube.
- **El invitado marca cuántos del grupo son niños o adolescentes.** Antes la
  invitación pública metía a todos como `'Adulto'` fijo, así que una familia de
  dos grandes y tres chicos entraba como cinco adultos y el menú salía mal. Ahora
  se pregunta y se guarda en `kidsCount`, el desglose fino del grupo.
  **`categoria` sigue existiendo** para las pantallas que muestran una sola
  etiqueta: no la saques.
- **El conteo para cocinar sale del PRESUPUESTO, no de los confirmados.** Y eso
  ya funciona solo: `syncFiestaFromBudget` copia `invitadosAdultos` e
  `invitadosNinos` del presupuesto a la fiesta, y `syncLinkedFiesta` lo dispara
  cada vez que el presupuesto se guarda o se actualiza. **Si los invitados
  aumentan, el conteo se actualiza solo.** El dato que marca el invitado sirve
  para saber a quién llevarle cada menú en la mesa, no para comprar.
- **Los límites de cambio de invitados salen del contrato y ya están en código.**
  El contrato (`src/lib/contract-template.ts`) dice: *"La lista final deberá
  entregarse siete días antes. Podrá reducirse hasta 10% de los invitados,
  ajustando solo servicios por persona, y aumentarse hasta 30%, sujeto a
  disponibilidad y pago previo. No habrá devolución por inasistencias."* Eso
  estaba en el papel y en ningún lado del sistema, así que se podía bajar la
  cantidad un 40% sin que nada avisara. Ahora la regla vive en
  `src/lib/budget/cambio-de-invitados.ts`, con diez pruebas. **El redondeo va a
  favor del cliente** (con 55 contratados puede bajar a 49, no a 50).
  **Si cambiás un tope, cambialo también en el contrato**, o el sistema y el
  papel dejan de decir lo mismo.
- **El cliente puede pedir el cambio de invitados desde su portal.** Bajar hasta
  10% o subir hasta 30%, poniendo cuántos adultos, adolescentes y niños. Las
  acciones están en `portal.actions.ts`
  (`submitClientGuestCountChangeRequest`, `approve...`, `reject...`), con siete
  pruebas. Decisiones tomadas, **no las cambies sin motivo**:
  - **El pedido NO se aplica solo.** Queda pendiente y lo resuelve AK, porque
    subir invitados mueve el precio y hay que confirmar con el salón.
  - **Fuera de los límites del contrato ni se toma el pedido**: se le explica al
    cliente el rango en el momento. Tomarlo para rechazarlo después le hace
    perder el viaje.
  - **Un pedido pendiente por vez.** Si no, se acumulan tres y no se sabe cuál
    vale.
  - **Al aprobar se actualiza el PRESUPUESTO**, no sólo la fiesta: de ahí sale
    lo que se compra y se cocina.
- **El "Tal vez" de la invitación se saca: se confirma o no se confirma.** Un
  "tal vez" no sirve para encargar comida ni poner sillas. **Pero el estado
  `'Tal vez'` NO se borra del tipo `RsvpStatus`**: hay invitados guardados con
  ese valor y romperían las pantallas. Sólo se saca el botón de la invitación.
- **El invitado SÍ puede cambiar su respuesta**, y eso ya funciona: al responder
  de nuevo con el mismo nombre, `submitPublicRsvp` lo busca por nombre
  normalizado y lo actualiza, no lo duplica. Lo que falta es decírselo en
  pantalla. Va en `docs/ordenes/estetica-01.md`, bloque E.
- **Las fotos del muro se descargan con enlace directo, a propósito.**
- **Se trabaja sólo en pesos uruguayos.** No hay diferencias de redondeo en
  dólares que corregir.
- **Bloque D ("Entretenimiento: video y guía")**: Verificación integral del sistema de entretenimiento en fiestas (`plataforma-360`, `bogue`, `buzon`, `readiness`). Plataforma 360 configurada con cámara lenta por defecto, música cargable por evento, marca de agua con nombre de la fiesta, guía paso a paso y mensaje de falla amigable sin trabar tablets. Bogue preserva las fotos individuales capturadas en la tanda y las permite imprimir mediante `imprimirRecuerdo` y `tira-fotocabina.ts` sin descartarlas al armar el video boomerang. Cápsula del tiempo con voz de orientación, pre-escucha y aviso antes del corte a los 15s. Verificación de prueba de estación con impresión de hoja de prueba real antes del evento.
- **Bloque E ("Ajustes del sistema")**: Auditado el módulo `src/app/(app)/settings/` (plantillas de contrato, invitaciones web, WhatsApp, catálogos de servicios, salones y personal). Se implementó validación preventiva al guardar plantillas para detectar marcadores no reconocidos (`{{ALGO}}`) impidiendo que queden variables rotas en contratos o mensajes de WhatsApp hacia los clientes. Se garantizaron alertas claras de guardado y terminología amigable en criollo.
- **Presentación LED alineada con el catálogo de papel (13 de agosto de 2026)**:
  - **Bloque 1 — Logos de empresas**: cargados en local (`public/logos/`) con sus 12 nombres reales visibles (Correo Uruguayo, Salto Hotel & Casino, Plus Medical, A.S.DE.M. y A., Woslen, APC Salto, INC, Antel, ABRA, INAU, Intendencia de Salto, Club Uruguay) y administrables desde Ajustes → Contenido público.
  - **Bloque 2 — Pantalla del equipo ("Hay equipo")**: nueva diapositiva `EquipoSlide` ubicada antes de los precios (después del salón), mostrando fotos del equipo trabajando, cantidad de profesionales (11) y frase en criollo, adaptable por tipo de evento y desde Ajustes.
  - **Bloque 3 — Salón Club Uruguay**: pantalla actualizada resaltando los 120 años de historia, ubicación céntrica, capacidad +120 personas, limpieza completa incluida y **sin mencionar portero en ningún lado**.
- **Los controles rojos de GitHub son por facturación de la cuenta.** No los
  investigues. Vale lo que se verifica localmente.
- **El pasaje a la galería del cliente (wfolio) es manual.** No tiene forma
  documentada de automatizarse; ya se investigó. No armes una integración.

---

## Módulo de entretenimiento — TERMINADO

### Arreglado, no lo toques

- **Las cuatro estaciones de captura ya no mienten.** Cuando falla la subida no
  muestran más "escaneá tu recuerdo" con el código girando: avisan y ofrecen
  descargar o reintentar. Hay un componente compartido, `QrRecuerdo`, para que el
  defecto no se copie en la próxima estación.
- **Espejo mágico IA:** al fallar la IA se queda en revisión con la foto original
  y los botones para subirla, en vez de saltar al cartel de recuerdo listo. La
  cámara no se reenciende encima del cartel de error.
- **El operador ve las fallas del invitado** en su cabina, con la hora, y el
  aviso se borra solo cuando la estación vuelve a andar (`lastError` en la sesión).
- **El operador sabe si la IA no está disponible** antes de que llegue el primer
  invitado.
- **Pantalla gigante, muro, galería y red social** avisan si se cortó la conexión
  y distinguen "no hay nada" de "no se pudo cargar".
- **La zona digital** no tiene más tarjetas muertas; el **tótem** no muestra un QR
  que no sirve.
- **Trivia por mesa:** funciona, arma el ranking por mesa y el invitado sin mesa
  juega igual en el ranking individual.
- **El muro saluda por nombre** cuando la foto viene del enlace personal, y sigue
  funcionando sin nombre cuando viene del QR general del salón.
- **Las estaciones funcionan sin muro contratado.** La foto **se guarda siempre**;
  si el muro está pausado o no contratado queda como `pending` y no se ve. Nadie
  saltea la pausa de la moderación.

### La fotocabina funciona como las clásicas (9 de agosto de 2026)

Se copió el mecanismo de las cabinas del rubro, después de mirar cómo lo hacen
las que se venden hoy:

- **Tres fotos por tanda, encadenadas solas.** El invitado no toca nada entre
  foto y foto.
- **La primera cuenta es de 10 segundos y las otras de 4.** Es a propósito: en
  la primera la gente recién se acomoda; después ya está ubicada y una espera
  larga hace cola. **No las emparejes.**
- **Sólo se cantan en voz alta los últimos cinco números.** Contar desde diez
  tapa la música del salón.
- **La pantalla guía**: "Foto 2 de 3", con puntitos de avance y una frase
  distinta para cada una. Entre foto y foto sigue viéndose la cámara: si se
  cambia de estado, la pantalla queda en negro y el invitado se pierde.
- **Al terminar se arma una sola imagen** con las tres pegadas, el nombre del
  evento y la fecha, en formato 10x15. Se eligió la postal y no la tira finita
  de 5x15 porque la tira obliga a una impresora con cortadora.
- **Imprime sola, sin que el invitado apriete nada**, y después ofrece "quiero
  otra copia". La copia automática es la única que reinicia la cabina; las
  copias extra dejan la pantalla quieta para poder pedir más.
- **El muro es el extra, no el camino principal.** Si el cliente no contrató
  muro, la cabina imprime igual y no muestra el botón de publicar.
- **El espejo mágico también imprime**, y en el modo firma se imprime el lienzo
  para que salgan la firma y los stickers en el papel.
- **La impresión vive en un solo lugar** (`imprimirRecuerdo`), compartida entre
  la fotocabina y el espejo. Si agregás impresión a otra estación, usá esa: no
  armes una propia.
- **La galería del operador ya permite reimprimir** una foto que ya salió. No
  hace falta agregarlo.

### Qué produce cada estación (verificado en el código el 9/8/2026)

Lista corta para no volver a confundirse. Ya pasó: se describió el Bogue como
estación de video cuando es de fotos.

- **Fotocabina** — FOTOS. Tanda de tres, se arma una tira y se imprime.
- **Bogue** — **FOTOS.** Saca varias seguidas. Hoy sólo guarda el video
  boomerang que arma con ellas y **descarta las fotos**: eso está mal y va en
  `docs/ordenes/entretenimiento-03.md`, bloque B.
- **Espejo mágico foto** — FOTO, con filtro. Imprime.
- **Espejo mágico firma** — FOTO con firma y stickers encima. Imprime el lienzo.
- **Espejo mágico IA (touchpix)** — FOTO. Guarda la original y la generada.
- **Plataforma 360** — VIDEO de verdad, 15 segundos, grabado de la cámara.
- **Cápsula del tiempo (buzón)** — AUDIO o VIDEO. No se imprime.
- **Tótem** — NO CAPTURA NADA. Sólo muestra el código y las fotos aprobadas.

### Topes, ya calibrados

- **Videos del invitado: 15 segundos.** Es a propósito.
- **Tope del evento: 5000 fotos.** Antes eran 200 y cortaba la fiesta a la mitad.
  No lo bajes.
- **Generaciones de IA: 3 por sesión de foto**, contadas en el servidor con un
  identificador estable, más una red de contención de 150 por hora por estación.
- **Paquete de recuerdos: 300 MB por pedido**, y se puede pedir por estación
  (`?estacion=`). El límite es de memoria del servidor, no de la fiesta.
- **41 estilos de IA**, y se pueden elegir por fiesta con `allowedTemplateIds`.
  Vacío significa todos.

---

## Módulo de organización — TERMINADO

### Arreglado, no lo toques

- **Los conteos cuentan PERSONAS, no filas.** Celíacos en la pantalla de
  invitados y el reporte al catering ya usan `partySize`.
- **Los conteos de CONFIRMADOS también cuentan personas (9/8/2026).** Faltaban
  seis lugares que hacían `.filter(rsvp === 'Confirmado').length`: el avance del
  evento, las automatizaciones, las dos cuentas de `fiesta-progress`, el centro
  de experiencia y las plantillas de invitación. **Lo grave era que esos números
  se comparan contra `invitadosEstimados`, que sí son personas**: con 100
  estimados y 30 filas que eran 90 personas, el sistema mostraba 30% de avance y
  disparaba avisos de "faltan confirmaciones" con la fiesta casi llena. Hay una
  prueba que lo deja clavado: `conteo-confirmados-personas.test.ts`.
- **El que cancela sale del conteo solo**, porque deja de estar `'Confirmado'`.
  No hace falta restarlo a mano en ningún lado.
- **Las bebidas llegan a la lista de compras**, todas las categorías activadas,
  leyendo `fiestaData.bebidas`.
- **El autoguardado del diseño de decoración avisa cuando falla** y reintenta.
- **Borrar una foto del moodboard** confirma o avisa el error.
- **Los recibos del personal se autoguardan**, igual que la pantalla de personal.
- **El aviso de doble asignación** dice cuándo no se pudo verificar, en vez de
  callarse.
- **Primero se guarda, después se sincroniza con Google.** El orden es
  deliberado: al revés mandaba los avisos con la asignación vieja. **No lo
  muevas.**
- **En la lista de carga, el precio ya no se usa como cantidad.** Sin referencia
  de cobertura queda en 1 unidad.
- **El PDF del itinerario no muestra las notas internas del organizador** y
  filtra los momentos marcados como no visibles. Ese PDF lo ven proveedores.
- **El tablero central** muestra el avance por módulo, el avance general y el
  próximo paso sugerido con botón directo.
- **Buscador de empleados**, sincronización de carga que no duplica, tareas de
  proveedores que no se cortan en silencio, aviso de horarios que se pisan en el
  itinerario, y vista previa del portal del invitado.
- **El menú de mesa vuelve atrás el color** si el guardado falla, en vez de
  dejarlo visible como si hubiera guardado.
- **La descarga de recuerdos incluye el dominio propio de AK**
  (`galeria.akproducciones.uy`) en la lista de dominios habilitados.
- **El paquete de recuerdos baja ordenado por estación** y con el tipo de fiesta
  en el nombre.

### Ya existía antes, no lo construyas de nuevo

- **El álbum del portal del cliente.** Está en
  `src/app/portal-cliente/[id]/fotos-video/page.tsx` y `getContractedDownloads`
  ya decide qué mostrar según lo contratado. Una orden de trabajo pidió
  construirlo y se perdió el viaje entero.

---

## Planificación — pantallas de plata

- **La merma de bebidas ya no se cuenta dos veces** en el gestor de
  rentabilidad. `totalBebidasCost` viene con el 5% adentro y la merma figuraba
  además como item propio, así que el costo salía inflado y el margen más bajo
  que el real. El reporte de post-evento ya lo descontaba con
  `costosSinMermaDuplicada`; ahora las dos pantallas dan el mismo número.
- **El costo de proveedores NO va sumado aparte al margen.** Ya está adentro de
  `costosItems` como items `auto_prov_*`. `totalProveedorCost` es sólo el
  subtotal que se muestra en la tabla. **Si una auditoría dice que "falta sumar
  proveedores", es falso positivo:** sumarlo lo contaría dos veces. Ya se reportó
  una vez por error.

- **El porcentaje del ajuste anual se lee de la configuración en TODAS las
  pantallas.** El estado de cuenta lo hacía; el recibo de pago y las dos vistas
  del portal del cliente lo tenían clavado en 15%. El día que se cambiara el
  porcentaje en ajustes, el cliente iba a ver un saldo y AK otro. Ahora las
  cuatro le pasan el porcentaje configurado a la misma cuenta compartida. **Si
  agregás una pantalla que muestre saldo, pasale el porcentaje**: sin él vuelve
  al 15% fijo y reaparece la diferencia.
- **El contrato del salón ya se guarda.** Antes el botón "Finalizar" sólo cerraba
  el modo edición: lo que el equipo escribía (cláusulas, montos) se perdía al
  recargar, y peor, al abrir la pantalla se regeneraba el borrador y pisaba lo
  editado. Ahora hay botón de guardar, el texto vive en `contratoSalonTexto`, y
  lo guardado le gana al borrador automático.

- **El plan de pagos avisa si las cuotas no cubren el total del contrato.** Antes
  el "Total" de esa pantalla era la suma de las cuotas cargadas, así que un plan
  al que le faltaba plata se veía perfectamente cuadrado. Ahora compara contra el
  total real del evento (con el ajuste anual) y dice cuánto falta o cuánto sobra.

- **El contrato de servicio no pisa más las ediciones sin avisar.** Cambiar de
  plantilla o salir del modo edición con cambios sin guardar ahora pregunta
  antes. El botón dice "Salir sin guardar" para que se entienda que no guarda.
- **El contrato de servicio avisa si quedaron huecos sin llenar.** Si la
  plantilla trae un marcador que nadie reemplazó, sale un cartel naranja con la
  lista antes de imprimir, en vez de que el cliente reciba el contrato con
  `{{ALGO}}` escrito adentro.
- **Borrar un documento del evento pide confirmación**, con el nombre del
  documento. Ahí vive el contrato firmado.
- **Costos y rentabilidad no acepta importes negativos** ni inválidos, ni en
  gastos ni en pagos a proveedores. Un negativo inflaba la ganancia en silencio.

- **En servicios contratados, el personal sin categoría ya no aparece como
  Catering.** Tiene su propia sección "Otro personal", que explica que al rol le
  falta la categoría. Antes un DJ o un chofer figuraba entre los mozos.

## Pantallas del planificador: qué está conectado y qué no

Verificado el 8 de agosto de 2026. **No hay una plaga de pantallas huérfanas**,
como pareció al principio:

- **Los "centros de mando" duplicados no son un problema.** Seis pantallas
  (`centro-de-mando`, `centro-experiencia`, `comando-total`, `show-control`,
  `centro-total`, `mission-control`) son redirecciones de 18 líneas a
  `fiestas/[id]/centro`. Vienen de una unificación deliberada y existen para no
  romper enlaces guardados. **No las borres.**
- **Las pantallas de gestión documental están todas enlazadas** desde
  `gestion-documental/page.tsx`. No están huérfanas.
- **`planner-costo-fiesta` y `servicios-contratados`** se alcanzan por dirección
  directa aunque no tengan botón en el tablero.
- **`nueva/playlist-pantalla` SE CONECTA, no se retira.** Verificada el 9 de
  agosto de 2026: está terminada y funciona (lista de la pantalla en vivo más la
  configuración del muro social). Lo único que le falta es el botón que la
  enlace, y va en el bloque D de `docs/ordenes/planificacion-02.md`. **No la
  borres ni vuelvas a reportarla como huérfana.**

## Comercial y contable

Auditado el 9 de agosto de 2026. **Son 47 pantallas** entre los dos módulos (35
comerciales, 12 contables), no las que aparecen en el menú.

- **Guardar un presupuesto avisa si el cliente no quedó en el seguimiento.**
  Antes, si fallaba la sincronización con el CRM, el presupuesto se guardaba
  igual y decía "Guardado" a secas: el equipo creía que el cliente estaba
  cargado y no estaba. El guardado sigue sin bloquearse a propósito (el
  presupuesto vale más que el CRM), pero ahora vuelve el aviso a la pantalla.
- **Si el cupón no se pudo registrar, ahora se dice.** El descuento se aplicaba
  igual y el uso quedaba sin anotar en silencio.
- **Pagos rápidos no muestra más presupuestos archivados.** Filtraba por estado
  pero no por archivado, así que uno viejo dado de baja seguía en la lista.
- **Pagos rápidos muestra lo informado y sin confirmar.** El saldo cuenta sólo
  los pagos confirmados; si el cliente informaba uno, el saldo no se movía y
  parecía un error. Ahora aparece aparte, en ámbar.
- **El motivo del rechazo de un pago se ve en la lista**, sin tener que entrar
  al presupuesto.

- **Las facturas cobradas están protegidas.** Una factura con pagos ya no
  permite cambiarle el número ni la moneda, una factura pagada no puede volver a
  borrador, y no se puede eliminar una factura cobrada: es el comprobante del
  cobro. La validación está en el servidor, no sólo en la pantalla.
- **No se repiten números de factura.** **Los recibos de seña quedan afuera a
  propósito:** comparten el número por evento cuando el cliente paga la seña en
  varias veces, y la duplicación real ya la corta `findExistingDepositReceipt`.
  Si una auditoría dice que "faltan validar los números de seña", es falso
  positivo.
- **El WhatsApp del día avisa si el mensaje quedó pendiente.** Antes, si fallaba
  marcarlo como enviado, seguía en la lista y alguien lo mandaba dos veces al
  mismo cliente.

- **El catálogo no acepta precios negativos**, ni en el precio de venta, el
  precio base, el precio por persona, el costo estimado ni los tramos. Un
  negativo se arrastraba a todos los presupuestos que usaran ese servicio e
  inflaba la ganancia. **El cero sí se permite**: hay servicios de cortesía.
- **El reporte de ganancias y pérdidas muestra el error cuando falla.** Antes
  aparecía un triángulo rojo suelto, sin texto: nadie sabía si reintentar o
  cambiar las fechas.
- **El simulador exige un celular uruguayo de verdad.** Aceptaba cualquier cosa
  de 7 dígitos aunque el cartel prometiera otra cosa, así que llegaban pedidos
  de presupuesto a los que después no se les podía contestar.

### Falsos positivos ya verificados en estos módulos

- **Los recibos del personal NO dan NaN.** El cálculo del sueldo protege los
  porcentajes faltantes con `?? 0` y sólo divide si el divisor es mayor a cero.
- **La deduplicación de señas es deliberada.** Busca por evento, monto y día
  para no registrar dos veces el mismo pago. Que dos señas idénticas el mismo
  día se confundan es el precio de esa protección: no lo "arregles" sin hablarlo.
- **El precio tachado del Club Uruguay en el simulador es el doble a propósito.**
  Es el 50% de descuento que decidió el dueño. No es un error de cálculo.
- **El filtro "Con responsable" del CRM hace lo que dice la etiqueta.** La clave
  interna se llama `my_leads` por historia, pero no promete "los míos" en
  pantalla y el equipo ve el CRM completo igual. No es una filtración.
- **Las dos pantallas de servicios no están duplicadas por error.** La de
  ajustes es sólo de lectura y la de empresa es la que edita. Escriben en el
  mismo lado.
- **El panel contable no tiene divisiones por cero.** Se verificaron los
  márgenes, el flujo de caja y los reportes: todos protegen el divisor.
- **Los regalos del presupuesto NO se muestran mal.** Sale el precio unitario y
  el importe en cero porque **hay una columna de descuento que dice 100%**. Está
  explicado en la propia tabla.
- **El cartel de "Verificación Pendiente" muestra el total guardado a
  propósito.** Es lo que se está verificando antes de mandárselo al cliente. No
  es una inconsistencia con el total recalculado de abajo.
- **El filtro "Con responsable" del CRM hace lo que dice la etiqueta**: muestra
  los prospectos que tienen alguien asignado. La clave interna se llama
  `my_leads` por historia, pero no promete "los míos" ni filtra mal.

## Estética — auditada el 9 de agosto de 2026

La app **no está rota, está despareja**: 925 colores escritos a mano en 211
pantallas, 582 textos de menos de 12 píxeles y 8 variantes de borde redondeado
conviviendo. El detalle y el plan están en `docs/ordenes/estetica-01.md`, que le
toca a Gemini.

### Falsos positivos verificados: NO los vuelvas a reportar

- **Los colores en `style={{ backgroundColor: ... }}` del croquis del salón, la
  decoración, los números de mesa y las invitaciones NO son colores mal
  puestos.** Son los que **elige el usuario** para cada elemento. Se reportó una
  vez como "rompe la paleta" y es al revés: si los cambiás a tokens, el usuario
  pierde la posibilidad de elegir el color.
- **El `bg-white` de facturas, recibos y contratos es correcto.** Esos
  documentos se imprimen en papel.

### Tanda `estetica-01` — propuesta unificada del 9 de agosto de 2026

- **La escala visual queda fijada así: tarjetas `rounded-xl`, botones
  `rounded-lg` y campos `rounded-lg`.** Los componentes compartidos `Card`,
  `Button`, `Input`, `Select`, `Textarea` y `EmptyState` usan esa escala y los
  colores semánticos del tema. Se eligió una diferencia corta entre tarjeta y
  control para ordenar la interfaz sin volverla ni cuadrada ni exageradamente
  redonda.
- **Los botones, tarjetas y campos compartidos dejaron de imponer rojo, blanco
  y gris escritos a mano.** Ahora usan `primary`, `foreground`, `background`,
  `border`, `accent` y `destructive`, porque esos tokens ya tienen versión clara
  y oscura. No se tocaron los colores dinámicos que elige el usuario ni el
  blanco de los documentos imprimibles.
- **Alcance manual terminado del bloque de colores:** portal principal del
  cliente, sus variantes pública/Pro, confirmación de invitados, control del
  muro social, invitación pública, portal individual del invitado, contrato,
  moodboard, configuración de la fiesta y bandeja del portal del cliente. El
  resto de las 211 pantallas todavía necesita recorrerse pantalla por pantalla;
  no se hizo un reemplazo masivo imposible de revisar. Los componentes
  compartidos sí mejoran desde ahora toda la app.
- **Ningún `text-[8px]`, `text-[9px]`, `text-[10px]` o `text-[11px]` se renderiza
  por debajo de 12 px.** La garantía vive en `globals.css`, para corregir los
  cientos de usos históricos sin editar mecánicamente 71 pantallas. Las
  medidas de impresión en puntos no cambian. Además se corrigieron a mano las
  grillas móviles señaladas: cuenta regresiva, muro social, resumen de
  invitados y respuesta pública; el mensaje del invitado ya no queda cortado.
- **Los vacíos del portal explican qué falta y qué ocurre después.** Las líneas
  grises de checklist, cronograma, tragos, servicios, música, reuniones,
  decoración, documentos, catálogo y preguntas se reemplazaron por
  `EmptyState`. No se inventaron acciones de edición donde el cliente no tiene
  permiso: se aclara cuándo debe publicar o intervenir AK.
- **Las cargas públicas ya dicen qué están preparando.** Portal, contrato,
  moodboard, invitación individual y mini quiosco tienen texto y `aria-live`;
  sus fallos ofrecen reintento o un próximo paso. Las excepciones y mensajes
  técnicos del servidor ya no quedan expuestos a clientes o invitados en esos
  recorridos.
- **La acción principal del portal ahora coincide con el próximo paso real.**
  Puede llevar a pago, pagos en revisión, organización, invitados o contacto;
  si una fase no habilita organización, dirige al resumen financiero. Se quitó
  el pulso que hacía parecer urgente pagar siempre y las acciones posteriores
  quedan como secundarias.
- **La invitación pública ya no ofrece “Tal vez”�.** Quedan sólo “Asistiré”� y
  “No puedo”�, anchos para el dedo. `RsvpStatus` conserva `Tal vez` para datos
  históricos y uso interno. La confirmación explica que se puede cambiar la
  respuesta con el mismo enlace y nombre, y “Responder de nuevo”� vuelve al
  formulario sin recargar ni borrar los datos.
- **El equipo ve el rango contractual al cambiar invitados.** La pantalla de
  configuración reutiliza `validarCambioDeInvitados`, conserva como base la
  cantidad originalmente contratada y muestra siempre rango y aviso en verde,
  ámbar o rojo. El aviso no bloquea el guardado; no se tocaron los topes de 10%,
  30% ni los siete días.
- **El pedido de cambio de invitados ya tiene las dos pantallas.** El cliente
  carga adultos, adolescentes, niños y nota, ve total/rango/errores/avisos y,
  si ya existe un pedido, ve su estado. El equipo ve anterior, nuevo y desglose;
  aprobar dice que actualizará el presupuesto y rechazar exige una explicación
  que luego ve el cliente. Se conectaron las acciones existentes de Claude sin
  reescribir su lógica.
- **Coordinación de IA registrada:** el director principal revisó las decisiones
  de contrato, presupuesto y jerarquía; agentes económicos `gpt-5.6-terra` con
  razonamiento bajo hicieron inventarios, cambios mecánicos acotados, una prueba
  de contrato de interfaz y una revisión del diff en paralelo. Luna era el
  modelo preferido por la guía, pero no estaba disponible en este entorno.
- **Pruebas focalizadas:** 22 aprobadas entre la nueva prueba de contrato de
  interfaz y las 17 pruebas existentes de límites/solicitudes. TypeScript quedó
  sin errores después de corregir el único estrechamiento de tipo detectado. Los
  cuatro controles finales de la propuesta se anotan al cerrar la tanda.

## Toda la app vende (regla del dueño, 9 de agosto de 2026)

No hay pantallas "internas" y pantallas "comerciales". El invitado que usa la
fotocabina es el cliente de la fiesta del año que viene, el proveedor que recibe
un PDF prolijo recomienda, y la pantalla que el equipo usa adelante del cliente
también vende.

Hay una habilidad con ese criterio ya escrito: **`/vende`**. Se usa antes de dar
por terminada cualquier pantalla que vea un cliente o un invitado.

## Accesos de proveedores (fotógrafo, catering)

Verificado y cerrado el 9 de agosto de 2026.

- **El enlace del proveedor se valida de verdad.** Las pantallas de fotografía y
  catering se abrieron para que el proveedor entre sin cuenta, pero al principio
  **no se comprobaba el token**: alcanzaba con escribir `?token=hola` en la
  dirección para ver los datos de cualquier fiesta. Ahora
  `verifyAccesoPersonalToken` comprueba contra `accesos-personal.json` que el
  token exista, tenga el permiso de ese módulo, sea de esa fiesta y no esté
  vencido.
- **Los enlaces vencen a los 90 días** contados desde que se crearon, si no
  tienen fecha propia (`fechaVencimiento`). Antes no vencían nunca: el fotógrafo
  de una fiesta de hace ocho meses seguía entrando. Los accesos ya guardados no
  tienen la fecha, por eso la ventana por defecto se cuenta desde la creación.
- **Un acceso sin `fiestaId` es global a propósito** (el DJ de siempre, que
  trabaja en todas las fiestas), pero igual necesita el permiso del módulo.
- **Al proveedor externo no se le muestra el presupuesto** ni el botón de
  sincronizar: vería los precios del evento.
- **El cartel distingue el enlace vencido del que no corresponde.** Al proveedor
  de una fiesta vieja hay que pedirle que avise, no dejarlo pensando que se
  equivocó de enlace.

## Automatizaciones — auditadas el 9 de agosto de 2026

- **Los recordatorios de pago ahora se disparan solos.** `scanAndTriggerPaymentReminders`
  existía y **nadie la llamaba nunca**: ningún cliente con la cuota vencida
  recibía el aviso y la plata quedaba sin reclamar. Hay una tarea programada en
  `/api/cron/recordatorios-de-pago`, protegida con `CRON_SECRET` igual que la del
  blog. **Sin esa clave configurada no corre**, a propósito: es preferible que no
  salga a que cualquiera pueda dispararle mensajes a los clientes desde afuera.
- **La decisión de a quién avisarle vive aparte**, en
  `src/lib/cobros/escaneo-recordatorios.ts`, con diez pruebas. Está separada de
  la acción de servidor porque la acción exige sesión y una tarea programada no
  tiene: así la usan las dos sin abrir una acción sin control.
- **Nadie recibe el mismo aviso dos veces en el día** (ventana de 24 horas), ni
  se le avisa a quien ya pagó o tiene saldo cero.
- **El motor de alertas internas no manda nada al cliente**: sólo genera avisos
  para el equipo, con identificador estable (`regla_fiesta`), así que no se
  duplican. Si una auditoría dice que "manda mensajes", es falso positivo.

### Lo que falta y NO es un defecto del código

- **Los mensajes del WhatsApp del día se mandan a mano**, abriendo WhatsApp con
  el texto ya escrito. No hay integración con la API de Meta. Es una decisión
  pendiente del dueño, no algo roto: no lo "arregles" conectando Meta sin
  hablarlo.

## Cupones, precios y plantillas de contrato — cerrado el 10 de agosto de 2026

- **El ajuste de precios en masa no acepta bajar 100% o más.** Con -200% el
  multiplicador quedaba en -1 y **todo el catálogo cambiaba de signo**: el
  sistema pasaba a cobrar al revés. El `min="-100"` de la pantalla lo controla
  el navegador y se saltea. También se rechaza más de 1000%, que es error de
  tipeo.
- **Los marcadores de contrato tienen sinónimos y viven en un solo lugar**
  (`src/lib/contratos/marcadores.ts`). Había DOS nombres para lo mismo: el
  editor ofrece `{{CLIENTE_DIRECCION}}` y el contrato original usa
  `{{CLIENTE_DOMICILIO}}`; el generador sólo reemplazaba el primero, así que una
  plantilla copiada del original salía impresa con el hueco escrito. Ahora el
  generador acepta los dos. **Si agregás un marcador nuevo, sumalo a ese
  archivo** o el editor lo va a marcar como inventado.
- **Al guardar una plantilla se avisa si tiene datos que el sistema no sabe
  completar.** Antes se enteraba cuando el contrato ya estaba impreso.
- **Un cupón que ya se usó no se puede borrar**, porque es el respaldo del
  descuento que se le hizo a un cliente. Se desactiva en su lugar.
- **Editar un presupuesto con cupón ahora sí registra el uso**, y el servidor no
  lo cuenta dos veces por el mismo presupuesto: antes la condición excluía las
  ediciones y el uso no quedaba anotado nunca.

### Falsos positivos verificados

- **El tope de usos del cupón NO tiene carrera.** `registrarUsoCupon` revalida
  el tope y lo incrementa **dentro del mismo turno** (`cuponMutex`), así que dos
  usos simultáneos no se pasan del límite. Se reportó una vez por error.
- **Un cupón vencido o desactivado no se puede usar**, y uno de más del 100% se
  rechaza al crearlo. Ya está controlado.

## Infraestructura y pruebas

- **`tests/e2e/layout-baseline.json` se regeneró el 8 de agosto de 2026.** Estuvo
  seis días en rojo por un cambio global del 3. Si vuelve a fallar, mirá primero
  si el cambio fue intencional antes de tocar pantallas.
- **`npm run check:acentos` existe** y es control obligatorio. No hace falta
  inventar otro.
- **La pantalla de recepción ya está arreglada**: declaraba mal los parámetros de
  ruta y rompía el build entero.

---

## Auditoría PARA-GEMINI.md (PR #932)

- **Stock de barra**: Se removió la llamada duplicada a `descontarStock` en entrega de pedidos y se agregó `reponerStock` automático en caso de cancelación de pedido.
- **WhatsApp automatización**: Se agregó resolución e inserción de `targetPhone` normalizado en eventos de presupuesto creado y enviado.
- **Pantalla Barman**: Se encerró `loadData()` en `try/catch/finally` garantizando la eliminación del cargando (`setIsLoading(false)`) e informando adecuadamente si la red falla.
- **Pantalla Gigante**: Notificación clara de fallos de red/conexión con cartel gigante para distinguirlos de "esperando contenido".
- **`getFiestaActual()`**: Reordenado para priorizar fiesta del día en Uruguay, luego futura cercana, luego pasada reciente.
- **Eliminación de proveedores**: Bloqueado si el proveedor posee insumos vinculados.
- **Personal**: Tope de máximo 2 roles por persona por fiesta con aviso descriptivo y etiqueta de recuento en Select.
- **Recibos de personal**: Se añadieron campos `pagadoPor` y `pagadoEn` al marcar recibos de sueldos como pagados.
- **Plataforma 360**: Se cambió botón inerte "Cámara Lenta Activada" por `<div>` informativo de estado.
- **Plantillas de contrato**: Se agregó validación de marcadores desconocidos al guardar, para que no queden `{{ALGO}}` inventados en el contrato impreso.

## Auditoría PARA-GEMINI.md — Nuevos hallazgos (11 de agosto de 2026)

- **Bloque 1 — Protección contra borrado en uso**:
  - `deleteInsumo`: Bloqueado si el insumo se utiliza en recetas o menús de catering.
  - `deleteServicioEmpresa`: Bloqueado si el servicio está incluido en presupuestos.
  - `deleteMenu`: Bloqueado si el menú está seleccionado en presupuestos, si uno de sus platos quedó como ítem histórico o si está asignado a una fiesta.
  - `deleteActivoFijo`: Bloqueado si el activo fijo está asignado en la lista de carga de cualquier evento.
- **Bloque 2 — Protección de sueldos**: El dueño conserva `PERMISOS.SUELDOS`; el perfil `personal` puede abrir únicamente su propio portal cuando coincide el usuario o el correo de su ficha. No puede consultar el portal de otro empleado.
- **Bloque 3 — Identidad real en aprobaciones y playbooks**: En `aprobarCambio`, `rechazarCambio` (`approvals.ts`) y `applyPlaybookToFiesta` (`playbooks.ts`) la identidad sale solamente de la sesión firmada del servidor. Los nombres enviados por la pantalla se conservan como parámetros antiguos, pero ya no se usan como respaldo.
- **Bloque 4 — Formatos visuales**:
  - Moneda cambiada de `es-AR` / `ARS` a `es-UY` / `UYU` en la pantalla de aprobaciones.
  - Validación de sueldos no negativos (`min={0}`) en UI (`personal/page.tsx`) y en servidor (`personal.actions.ts`).
  - Fechas ajustadas a formato uruguayo `es-UY` en `auditoria`, `incidentes`, `eventos` y `pagos-rapidos`.

### Revisión cruzada Codex sobre la PR de Claude

- Se corrigió una regresión detectada en revisión: exigir `SUELDOS` sin excepción dejaba al personal con un 404 al abrir su propio portal.
- Se corrigió la trazabilidad de menús: `selectedMenuId` ahora forma parte del presupuesto persistido y vuelve a cargarse al editarlo.
- Se eliminó el respaldo de identidad controlado por el navegador en aprobaciones, rechazos y aplicaciones de playbooks.
- Se corrigió la protección de servicios en presupuestos: Claude consultaba `item.id`, una propiedad inexistente que hacía fallar TypeScript; se usa el ID real `idServicioCatalogo` y el nombre histórico.
- Se agregaron comprobaciones de regresión en `release-security-boundaries.test.ts` para estos tres límites.

---

## Candidato final del 11 de agosto de 2026

- **Portal LED y presupuesto usan el mismo criterio de catering.** El selector de
  adultos ya no trata el catálogo completo de platos principales como si fuera un
  único menú ni suma todos sus platos. Cada plato principal es una opción. Las
  entradas, el plato adulto y el menú infantil/adolescente se transfieren como
  ítems reales al presupuesto manual y quedan incluidos en el total.
- **El total visible del Portal LED dejó de ser un aproximado incompleto.** Ahora
  suma entradas y aplica el motor central a servicios fijos, por persona, por
  ratio o por tramos. El importe flotante y el cierre muestran ese total completo.
- **El total del Portal LED se calcula después de preparar sus entradas.** Se
  corrigió el orden de declaración que TypeScript detectó en la congelación final.
- **La importación de catering al presupuesto tiene dependencias estables.** El
  efecto incluye el conversor de platos que usa, eliminando la advertencia de
  hooks y evitando cierres con referencias antiguas.
- **Hay un control financiero cruzado en Auditoría.** El botón `Revisar ahora`
  recalcula presupuestos y facturas, detecta pagos repetidos, cobros mayores al
  total, facturas duplicadas y enlaces rotos entre presupuesto, factura y fiesta.
  Es de sólo lectura: nunca cambia saldos ni documentos automáticamente.
- **Los 19 eventos reales no se declararon revisados desde JSON local.** La copia
  local no contiene esos presupuestos, facturas y fiestas. Deben verificarse con
  el nuevo control dentro de la app autenticada, donde lee los datos actuales de
  Firebase. Un resultado local vacío no sirve como aprobación contable.
- **La pantalla gigante exige evento asignado.** Dueño y perfiles autorizados
  conservan acceso. Un operador sólo puede controlar una fiesta si su usuario o
  correo coincide con un empleado incluido en `personalAsignado` de esa fiesta.
  Las votaciones de invitados siguen públicas y limitadas por frecuencia.
- **La moderación es segura por defecto.** Las fiestas nuevas y las antiguas sin
  configuración explícita dejan fotos y videos pendientes de aprobación. Sólo una
  fiesta configurada expresamente con `requireApproval: false` publica directo.
- **Google Workspace valida identidad y rol en el servidor.** La cuenta
  corporativa y el panel son del dueño; una cuenta personal sólo la conecta su
  propio empleado o el dueño; sincronizar una fiesta exige organización y acceso
  a ese evento, sincronizar todas exige administración y las citas exigen CRM.
- **Marketing ya no finge una publicación externa.** Guardar un post conserva el
  estado elegido y no lo marca como publicado mediante un `console.log`. La
  sincronización de Instagram y la agenda social exigen permiso de CRM.
- **El secreto del cron de blog viaja sólo en Authorization Bearer.** Ya no se
  acepta en la URL, donde podía quedar registrado en historial y logs.
- **Consultar un pago de Mercado Pago ya no crea acceso al presupuesto.** La ruta
  pública de estado devuelve solamente estado e importes. Para volver, el mismo
  navegador conserva localmente el enlace que ya tenía antes de ir a Mercado Pago;
  una sesión filtrada no se transforma en un token nuevo del documento.
- **El cron de recordatorios conserva la automatización sin abrir el CRM.** Las
  personas necesitan permiso para leer o crear mensajes; la tarea validada usa un
  token interno no serializable. Su secreto se acepta sólo en el encabezado y no
  queda expuesto en la URL.
- **Agenda y Google Workspace vuelven a respetar el trabajo de secretaría.** La
  sincronización de una fiesta exige organización y alcance sobre ese evento, no
  acceso a sueldos. La sincronización masiva permanece reservada al dueño.
- **La portada vuelve a ser estática con renovación cada cinco minutos.** Se quitó
  un `searchParams` sin uso que forzaba render dinámico y hacía esperar a cada
  visitante las fuentes de galería, testimonios, Instagram, YouTube y salones.
- **Evidencia del candidato congelado:** TypeScript completo quedó sin errores,
  lint sobre los archivos tocados quedó sin errores ni advertencias y 143/143
  pruebas focalizadas en 13 suites quedaron aprobadas. Las tandas anteriores de regresión
  terminaron en 99/99, 114/114, 18/18 y 104/104. La suite Jest completa se
  intentó una vez, siguió activa más de diez minutos y fue detenida por el límite
  de la herramienta sin resumen; no se cuenta como verde. El build de producción
  con datos locales siguió activo durante treinta minutos y fue detenido sin
  resumen, por lo que tampoco se declara aprobado. El E2E de producción no se
  ejecutó al no existir un build terminado en esta máquina.
- **Graphify quedó actualizado sobre el candidato.** El índice estructural contiene
  7.801 nodos, 28.664 relaciones y 377 comunidades. El parser de Graphify avisó
  20 archivos parcialmente interpretados, pero TypeScript sí compiló todo el
  proyecto; se registra como limitación del índice, no como aprobación omitida.

## Continuacion de lanzamiento iniciada en la PR #941

- **La PR #941 fue fusionada durante la validacion.** Contiene el bloque inicial
  hasta `80384e07`. Las correcciones y evidencia producidas despues quedaron en
  la PR `#942`, porque GitHub no permite agregar commits a una PR fusionada.
- **El rojo de GitHub es una limitacion aceptada.** Firestore rules, CI, browser
  smoke y CodeQL no ejecutaron pasos: GitHub anoto bloqueo de cuenta por
  facturacion. El dueno no agregara tarjeta. No se corrige con codigo.
- **No se reinicia la auditoria terminada.** La continuacion usa este documento y
  `ESTADO-ACTUAL.md` como matriz. Solo se vuelven a ejecutar controles necesarios
  para build, E2E, Firebase, roles, integraciones, entretenimiento, visual y
  rendimiento que aun no tengan evidencia de lanzamiento.
- **La continuacion tiene una sola PR abierta: #942.** No crear otra propuesta
  paralela; documentar ahi el fallo reproducido, la correccion y su prueba.
- **El build de produccion es reproducible.** Sobre el commit publicado
  `80384e07052a4245ef70a81bc69f044859e34c11`, Next genero las 265 paginas y
  termino con codigo 0 en 9 minutos 44 segundos. Las advertencias encontradas se
  mantienen separadas de los errores y se revisan en esta misma continuacion.
- **Google OAuth ya no acepta una direccion imposible.** La configuracion ahora
  detecta que falta un origen publico absoluto y rechaza `0.0.0.0` antes de
  enviar al usuario a Google. Se agrego una prueba para origen ausente,
  `0.0.0.0` y desarrollo local.
- **Instagram tiene variables documentadas.** `.env.example` incluye el token
  privado y el identificador de cuenta profesional que usa la sincronizacion
  real. No se afirma conexion sin credenciales ni respuesta del proveedor.
- **La prueba de Instagram refleja el permiso vigente.** La sincronizacion manual
  ya estaba protegida con permiso CRM, pero su prueba aun simulaba una sesion
  generica. Se actualizo el doble de prueba sin reducir la seguridad del servidor.
- **Autenticacion e integraciones tienen una tanda focalizada aprobada.** Nueve
  suites y 42 pruebas cubrieron sesion, identidad Google, correo Workspace,
  redireccion OAuth, integraciones externas, Instagram, limites de rutas,
  Mercado Pago y generacion de imagenes con Gemini.
- **Las reglas de Firestore se ejecutaron en emulador.** Las 20 pruebas aprobaron;
  los mensajes `PERMISSION_DENIED` del registro corresponden a escrituras que la
  prueba esperaba rechazar. Firebase Tools solo aviso que una version futura
  requerira Java 21; la version actual ejecuto y cerro correctamente.
- **Los proveedores en vivo siguen siendo evidencia separada.** Estas pruebas no
  afirman que Gmail envio, Mercado Pago cobro, Instagram publico ni Gemini genero
  en produccion sin credenciales validas y una respuesta real de cada servicio.
- **Portales publicos y pantallas del evento aprobaron PC y celular.** Playwright
  abrio el portal del cliente, el portal individual del invitado, la carta de
  tragos, la red social, la barra publica, el totem y el mural en vivo. No encontro
  enlaces administrativos, errores del navegador ni desborde horizontal.
- **El primer arranque lento no se confundio con un boton roto.** La primera ruta
  del portal en Next desarrollo necesito compilacion en frio y supero el limite
  de tres minutos; con la ruta compilada, el mismo recorrido de PC termino en 39
  segundos y celular tambien aprobo. Se conserva como evidencia de velocidad del
  entorno de desarrollo, no como fallo funcional de la carta de tragos.
- **El simulador aprobo su recorrido comercial en ambos tamanos.** Seis pruebas
  completaron el precio desde el simulador, el ingreso desde catalogo y la
  descarga de un PDF formal para un evento de ano futuro en PC y celular.
- **Recuperacion publica y viaje del invitado aprobaron.** Trece recorridos
  verificaron acceso protegido, recuperacion de clave, portada, campos legibles,
  confirmacion y rechazo, QR, conteo sin duplicados, sincronizacion con el equipo
  y acceso del cliente con su clave. El ultimo caso se repitio solo porque el
  servidor de desarrollo se reinicio durante la primera navegacion; la repeticion
  termino correctamente y no se cambio codigo por una caida del entorno.
- **Los accesos flotantes ya no tapan la web en celular.** La revision visual
  encontro que subir, cotizar y WhatsApp formaban una columna de casi media
  pantalla sobre la galeria. En movil quedan Cotizar y WhatsApp en una barra
  compacta inferior; subir se conserva en PC. Se elimino el gradiente violeta
  ajeno a la marca y se mantuvieron los mismos destinos comerciales. El bloque
  tambien calcula su visibilidad al montar para funcionar al volver a una
  posicion guardada o entrar desde un enlace interno.
- **Las estaciones de entretenimiento aprobaron navegador y responsive.** Las
  pantallas de operador, la camara simulada de fotocabina, la capsula con sus
  modos y marco final, y el selector tactil del espejo IA pasaron en PC; los
  casos aplicables tambien pasaron en celular. Tres pruebas de captura completa
  se omiten en movil por diseno del dispositivo, no por fallo.
- **La subida al muro responde y se recupera.** PC y celular mostraron resultado
  tras publicar y el muro no quedo girando despues de un intento fallido. La
  primera ejecucion de PC excedio el limite durante compilacion en frio; la misma
  subida, repetida sola con la ruta compilada, aprobo en 56 segundos.
- **Hardware fisico no se declara probado.** La camara simulada valida el flujo
  web, pero esta computadora no demuestra la impresora configurada, codecs de
  cada tablet, brazo fisico de plataforma 360 ni rendimiento de la red del salon.
- **El menu de mesa restaura de verdad el ultimo guardado.** La referencia existia
  pero no se leia al fallar: la pantalla restauraba el mismo borrador. Ahora se
  actualiza al cargar y al guardar con exito, y se usa ante un error del servidor.
- **Los accesos por token no quedan viejos al navegar.** Catering y fotografia
  incluyen el token actual en la carga memorizada; contrato y moodboard eliminan
  dependencias que no se utilizan. El comportamiento queda expresado sin avisos
  de hooks.
- **Los metadatos globales tienen dominio publico.** Open Graph y Twitter ya no
  resuelven imagenes contra `localhost` cuando una pantalla usa los metadatos del
  layout raiz.
- **La imagen de Bogue conserva el elemento imprimible correcto.** La tira es un
  `blob` o `data URL` generado en el navegador; se mantiene `img` de forma
  deliberada y se documenta la excepcion local para no fingir una optimizacion
  incompatible con impresion.
- **El build completo dejo solo dependencias externas conocidas.** Tras corregir
  hooks, metadatos y la excepcion de Bogue, las advertencias propias quedaron
  eliminadas. El aviso restante de Webpack nace en `express` dentro de Genkit y
  los mensajes de cache describen serializacion del compilador; no corresponden
  a una ruta rota ni se silencian desde el codigo de negocio.
- **El candidato productivo abre los modulos internos criticos.** El artefacto de
  265 paginas inicio en 5,6 segundos y Playwright recorrio dashboard,
  contabilidad, pagos rapidos, presupuestos, clientes y eventos con una sesion
  firmada, sin respuestas HTTP de error, expulsion al login, mensaje de panel
  roto ni desborde horizontal.
- **Los portales restaurados conservan el alcance de seguridad.** El planificador
  cargo el evento seleccionado y el acceso por token de proveedor mostro solo su
  trabajo asignado, sin revelar el nombre del cliente. La tanda de produccion
  completo 3/3 pruebas en 53,3 segundos.
- **La velocidad se mide en produccion local, no por compilacion en frio.** El
  primer acceso a rutas nuevas en `next dev` puede tardar minutos porque compila;
  el mismo codigo construido sirvio los recorridos internos completos en menos de
  un minuto. La portada mantiene ISR de cinco minutos para no reconstruir fuentes
  de galeria y redes en cada visita.
- **El personal no puede quedar en dos eventos al mismo tiempo.** La validacion
  usa fecha y horario local de Uruguay, contempla fiestas que cruzan medianoche
  entre dias consecutivos y permite eventos contiguos. Un choque confirmado se
  bloquea en el servidor antes de guardar y muestra todos los primeros eventos
  involucrados. Si falta una hora no inventa `21:00 a 04:00`: guarda con un aviso
  para que el encargado complete los horarios.
- **La agenda se lee una sola vez al asignar personal.** Varias personas nuevas
  se comparan contra la misma foto de fiestas activas. Editar sueldo o rol de una
  asignacion existente no vuelve a cargar toda la agenda en cada tecla. Si la
  lectura necesaria falla, no se guarda ni se envian avisos de Google; el equipo
  recibe el error y puede reintentar sin crear una asignacion sin verificar.
- **Dos servidores no pueden reservar al mismo empleado a la vez.** Un bloqueo
  corto por empleado en Firestore cubre la lectura y el guardado; si otra
  instancia ya esta actualizando esa agenda, la segunda operacion pide reintentar.
  Los bloqueos vencen solos para no dejar personal inutilizable ante una caida.
- **Los rechazos de Google Workspace quedan visibles.** Si Google responde
  `success: false` sin lanzar una excepcion, la asignacion ya guardada se conserva
  y el motivo queda registrado como aviso para poder reintentar la sincronizacion.
- **La matriz cerrada no sustituye el mundo real.** Los 19 eventos requieren
  Firebase productivo; Gmail, Instagram, Mercado Pago y Gemini requieren
  credenciales y respuesta del proveedor; impresora, camaras, codecs, brazo 360
  y Wi-Fi requieren prueba fisica en el salon. Esos puntos se dejan explicitamente
  pendientes en lugar de declararlos aprobados por simulacion.

## Puesta al dia de los eventos y el ajuste anual (12 de agosto de 2026)

- **El ajuste anual no se aplicaba a los contratos sin facturar.** La marca que lo
  activa (`ajusteAnualActivo`) se ponia en un solo lugar: al marcar el presupuesto
  como Facturado. Un presupuesto Aceptado y todavia sin facturar nunca la recibia, y
  `calcularEstadoDeCuenta` la exige para aplicar el ajuste. Resultado: la aplicacion
  mostraba el precio del anio en que se firmo. En los contratos cargados de eventos
  anteriores son miles de pesos por contrato. Ahora se completa al quedar contratado
  (Aceptado o Facturado), dentro de `normalizePresupuestoFinancials`; las
  importaciones historicas ya activan la misma marca en su flujo propio.
  **Se completa solo cuando nunca se decidio**: si el duenio lo apago a proposito
  para un cliente, se respeta.
- **Pantalla nueva "Poner al dia los eventos"**, en Auditoria y de solo lectura.
  Encuentra fiestas pasadas que siguen abiertas, eventos viejos con equipo asignado
  o tareas sin terminar, fiestas sin presupuesto vinculado, contratos de anios
  anteriores sin el ajuste anual (con cuanto se deja de cobrar) y presupuestos
  aceptados cuya fecha paso sin evento creado. No cierra ni cobra nada por su
  cuenta.
- **Correcciones de la revision de Codex, todas validas:** el saldo pendiente usa el
  estado de cuenta con ajuste (con el total pelado, un contrato pagado al precio
  viejo no mostraba nada); no se insiste con el ajuste cuando el duenio lo apago a
  proposito; se cuentan las tareas del equipo (`tareas`) ademas de la lista del
  cliente (`clientChecklist`), que son cosas distintas; y las fiestas archivadas se
  usan solo para saber que un presupuesto ya tiene su evento, sin revisarlas como si
  estuvieran abiertas.
- **Segunda auditoria contable de la misma propuesta:** el anio se toma desde la
  fecha real de firma, no desde una creacion anterior del presupuesto; el saldo
  cobrable, los recibos, pagos rapidos, dashboard, portal y Mercado Pago incluyen
  el ajuste sin modificar el total base del presupuesto; y el limite de pagos ya
  permite cobrar exactamente ese saldo ajustado. Las operaciones legales de
  cancelacion y cambio de fecha conservan el total base para no aplicar el ajuste
  dos veces.
- **La pantalla ya no duplica lecturas de Firestore.** Carga activos una vez y el
  historial por separado. Tambien enlaza cada alerta con el evento o presupuesto
  exacto para poder resolverla, y la accion tiene una prueba que impide leer datos
  si falta el permiso de Contabilidad.

## Galería, subida de archivos y editor de invitación (12 de agosto de 2026)

- **Cualquiera de afuera podía dejar archivos en el depósito de la empresa.** La
  acción que sube imágenes (`uploadPublicPageAsset`) no pedía sesión, y es la que
  usan la galería, el editor de la invitación, la portada y las fichas del
  personal. Cualquiera que conociera la dirección podía subir lo que quisiera y
  quedaba publicado con una dirección nuestra, ocupando lugar que se paga todos
  los meses. Ahora pide sesión del equipo. **Por qué se puede pedir sesión sin
  romper nada:** se revisaron todos los lugares que la usan y son todos pantallas
  internas; el invitado sube fotos por otro camino distinto (el muro social), que
  no se tocó.
- **Sacar una foto de la galería no la sacaba del todo.** Se iba de la lista pero
  quedaban dos rastros: el archivo seguía para siempre en el depósito, y la foto
  seguía apareciendo en el catálogo, porque al subirla se guarda un gemelo que
  apunta al mismo archivo. El dueño borraba una foto y el cliente la seguía
  viendo. Ahora se limpian los tres lugares. **Por qué se eligió así:** el archivo
  se borra sólo si es nuestro y si ninguna otra foto ni video lo está usando; si
  se borrara a ciegas, una foto compartida dejaría un cuadro roto en pantalla. La
  lógica está en `src/lib/galeria/borrado-seguro.ts` con pruebas propias.
- **Se podía dar por firmado un contrato sin ser del equipo.** Subir el contrato
  firmado en papel no pedía sesión, y esa misma acción marca el contrato como
  firmado y deja el evento como Contratado, que es lo que dispara la seña y la
  organización. Igual pasaba con los documentos adjuntos del evento. Las dos
  piden sesión del equipo ahora.
- **La fecha de la ceremonia se guardaba con hora universal.** En el editor de la
  invitación, el calendario de cada ceremonia guardaba la fecha con hora, y al
  volver a abrirlo mostraba el día anterior; si el equipo tocaba el calendario,
  ese día corrido se guardaba y era el que veía el invitado. Ahora se guarda el
  día suelto, igual que la fecha del evento, y se lee con `parseEventDate`.
- **Editor de invitación y vista previa (12 de agosto de 2026).**
  - **Bloque 1 — Indicador de guardado en móvil**: En `src/components/ui/auto-save-indicator.tsx` y `pagina-web/page.tsx` se ajustó la visibilidad para que en celulares se muestre el estado de guardado (íconos visibles y texto adaptado a `sm`). En caso de error de guardado, la barra muestra el ícono rojo y al tocarlo salta la explicación completa del error.
  - **Bloque 2 — Fidelidad en vista previa de plantillas**: Se removió el filtro `!isPreview` de los `EventParticles` en `GraziaTemplate.tsx` y `AllegriaTemplate.tsx` para que las animaciones de fondo se dibujen exactas en la vista previa del editor, sin afectar las restricciones funcionales de RSVP ni contadores.
  - **Bloque 3 — Verificación de datos mínimos antes de compartir**: En `pagina-web/page.tsx`, al presionar "Ver Real", copiar el enlace de la invitación, o descargar el código QR, el sistema verifica si faltan datos esenciales (fecha, hora, salón, dirección). Si faltan, no bloquea la acción sino que abre un aviso en criollo detallando qué falta, con opción de completarlo o continuar de todos modos. La función de validación `getDatosMinimosFaltantesInvitacion` fue extraída y exportada correctamente para que la prueba unitaria la ejecute sin fallos.

## El sitio no podía aparecer en Google (12 de agosto de 2026)

- **Google tenía prohibido mostrar todo el sitio.** Había una instrucción, de
  cuando la aplicación era sólo interna, que le decía a todos los buscadores que no
  indexaran ninguna página. Con eso puesto, la portada y las páginas de bodas,
  quince, cumpleaños, catálogo y blog **no podían aparecer en una búsqueda**, por
  más bien escritas que estuvieran. Ahora se abre página por página.
- **Por qué se eligió abrir de a una y no todo.** En el mismo dominio conviven las
  páginas de venta, las pantallas internas del equipo y las pantallas con datos de
  una persona: el portal del cliente, las invitaciones con la lista de invitados,
  la opinión post evento y los accesos del personal. Si se abriera todo, la fiesta
  de un cliente podría aparecer en una búsqueda. Queda **cerrado por defecto** y la
  lista de lo permitido vive en `src/lib/seo/paginas-publicas.ts`. Si mañana se
  agrega una pantalla nueva y nadie toca la lista, queda cerrada, que es el error
  barato.
- **Se agregó el listado de páginas que se le entrega a Google**, que antes no
  existía: aunque hubiera tenido permiso, tenía que encontrarlas de casualidad. Sale
  de la misma lista que los permisos, así que no puede ofrecer una página prohibida
  ni olvidarse de una permitida. Hay pruebas que verifican las dos cosas.
- **Inventario nuevo en `docs/QUE-HAY-EN-LA-APP.md`.** Qué existe de verdad en
  inteligencia artificial, redes sociales, marketing y posicionamiento, con el
  estado de cada cosa. **Se lee antes de salir a inventariar nada**, para no volver
  a auditar lo mismo; cuando se toca algo de esa lista, se actualiza ahí mismo.

## Testimonios reales y recontacto del que no señó (12 de agosto de 2026)

- **La presentación que se le proyecta al cliente mostraba testimonios inventados.**
  La aplicación junta opiniones reales y el dueño las aprueba una por una, y esas
  aprobadas ya salían en la portada, pero la pantalla grande —donde más venden—
  seguía con una lista escrita a mano. Ahora usa las reales aprobadas.
- **Por qué se controla dos veces que estén aprobadas.** La consulta ya devuelve
  sólo las aprobadas, y `src/lib/testimonios/para-mostrar.ts` vuelve a filtrar. Es a
  propósito: **una opinión mala nunca se publica** (orden del dueño), y si alguien
  cambia la consulta o le pasa la lista completa por error, igual no se cuela.
  Mientras no haya ninguna aprobada se muestran las de ejemplo, para no dejar la
  pantalla vacía en medio de una venta.
- **El recontacto del que pidió presupuesto y no señó estaba escrito y apagado.**
  La función y el mensaje existían desde hacía tiempo pero **ningún lugar del código
  la llamaba**: trabajo hecho que no rendía nada. Ahora corre dentro del marketing
  automático, cada seis horas.
- **Por qué viene apagado de fábrica y con un interruptor en Ajustes.** Son mensajes
  de WhatsApp a clientes reales y no se pueden deshacer; nadie los dispara por
  sorpresa al publicar una versión nueva. El interruptor es sólo para el
  administrador. Las reglas de a quién se le escribe viven separadas del envío, en
  `src/lib/marketing/candidatos-recontacto.ts`, con pruebas propias: pasaron 48
  horas, dio permiso de marketing, **una sola vez en la vida**, nunca a quien ya
  contrató ni a quien está en una etapa terminada del embudo. Se anota la marca sólo
  a los que recibieron el mensaje de verdad, así un envío fallido no pierde al
  prospecto.

## Planificador de redes y ficha de negocio para Google (12 de agosto de 2026)

- **El planificador decía "Publicado" sobre algo que la app no publicó.** Lo que se
  importa de Instagram ya está publicado *en Instagram*, pero en el planificador se
  leía como si la aplicación lo hubiera publicado, y la aplicación **no publica en
  ninguna red**: el contenido se redacta acá y se copia y pega a mano. Ahora esos
  quedan como "Importado de IG", con color propio, separados de lo que el equipo
  todavía tiene que publicar.
- **La ficha de negocio para Google** (nombre, dirección, teléfono, coordenadas de
  Salto y redes) estaba sólo en la portada. Ahora también está en bodas, quince,
  cumpleaños y el blog, que son las páginas que traen clientes.
- **Por qué la ficha del blog apunta a `/public/blog` y no a `/blog`.** `/blog`
  sólo redirige, y además está fuera de la lista de páginas que Google puede mirar.
  Apuntar la ficha a una dirección prohibida no sirve de nada.

### Lo que se descartó de esa propuesta, y por qué

La propuesta traía además su propia versión de los testimonios reales y del
recontacto del que no señó, que **ya estaban hechos y fusionados** poco antes. De
haberla tomado entera, habría borrado el filtro doble que impide publicar una
opinión mala, las reglas probadas de a quién se le puede escribir por WhatsApp y
sus veinte pruebas. Se rescató sólo lo de arriba. Tampoco se tomó un segundo
interruptor de recontacto en la pantalla de WhatsApp: ya hay uno en Ajustes →
Contenido público, y dos interruptores para lo mismo confunden y se contradicen.

## Control de gasto de la inteligencia artificial (12 de agosto de 2026)

- **Nadie avisaba cuánto se gastaba por mes.** Los topes que ya existían (tres
  intentos por invitado, ciento cincuenta por hora por estación) frenan el abuso de
  una persona, pero con cuatro fiestas grandes seguidas el gasto se notaba recién en
  la factura, cuando ya estaba gastado. Ahora se cuenta cada foto con efecto y se ve
  en Ajustes → Contenido público, con el gasto estimado del mes.
- **Se puede poner un tope en pesos**, y al llegar al 80% avisa antes de que se
  dispare.
- **Por qué al llegar al tope no se corta nada.** La fotocabina y el espejo siguen
  andando: sacan la foto igual, con el efecto simple, sin gastar. Es el mismo camino
  que ya existía para cuando el servicio no está configurado. **Nunca se le corta la
  foto a un invitado por una cuestión de plata**, y menos en medio de una fiesta.
- **Por qué ante un error de lectura se deja gastar.** Quedarse sin efectos toda una
  noche por un problema al leer el contador es peor que gastar de más una vez. Lo
  mismo al anotar: si falla el guardado, la foto sale igual y se pierde un número del
  contador.
- **Se guarda un contador por mes y no un renglón por foto**, para no llenar la base
  con miles de registros en una sola fiesta.
- El costo por generación es una **estimación** para ver la tendencia y frenar a
  tiempo, no la factura del proveedor. Está en `src/lib/ai/consumo.ts` y se cambia
  ahí si cambia el precio.

## Títulos para Google en las pantallas públicas (12 de agosto de 2026)

- **Faltaba título y descripción propios** en la experiencia AK, la galería LED, la
  presentación de tecnología, el portafolio y el catálogo. Google mostraba esas
  páginas sin nombre propio.
- **Por qué el del catálogo va en la envoltura y no en la pantalla.** El catálogo se
  dibuja del lado del navegador, y esas pantallas no pueden declarar título. Va en
  `src/app/catalogo/layout.tsx`.
- **No se abrió ninguna página nueva a Google.** La lista de lo permitido sigue
  igual, cerrada a propósito, en `src/lib/seo/paginas-publicas.ts`. Poner título en
  una pantalla interna no la publica: sólo mejora el nombre de la pestaña.

## Las cuatro ideas grandes (12 de agosto de 2026)

Llegaron de una propuesta de Gemini que **no compilaba** y traía dos cosas graves.
Se repararon y se fusionó. Quedó andando:

- **El mensaje de recontacto ahora lo escribe la inteligencia artificial** con los
  datos de esa persona. Si el servicio falla o se llegó al tope de gasto, **manda el
  mensaje de siempre**: nadie queda sin mensaje ni recibe uno a medio escribir.
- **Asistente de ventas en las páginas públicas**, apagado de fábrica.
- **Video del recuerdo** por evento, armado con las fotos del muro. Sólo entra
  contenido aprobado, porque lee la lista pública que ya filtra por aprobación.
- **Repaso de la mañana** en el panel interno: reusa el reporte de "Poner al día" y
  esconde los cobros a quien no tiene el permiso de Contabilidad.

### Lo que hubo que corregir, y por qué

- **El asistente de ventas aparecía en TODA la aplicación.** Se filtraba con una
  lista de pantallas prohibidas, incompleta: el globito de ventas salía encima de la
  invitación de un casamiento, del portal de un cliente que ya contrató, de las
  estaciones de la fiesta y de la presentación proyectada en el salón. Ahora es al
  revés, **lista de lo permitido**: sólo las páginas de venta, las mismas que ve
  Google. Una pantalla nueva queda sin asistente por defecto, que es el error
  barato. Está en `src/lib/public-experience/donde-va-el-asistente.ts` con pruebas.
- **Daba por dado el permiso para escribirle al cliente.** Guardaba
  `marketingConsent: true` fijo cada vez que llegaba a armar el presupuesto, sin
  importar lo que la persona hubiera contestado. Ese permiso es justo lo que
  habilita mandarle WhatsApp automático después. Ahora se exige que el resumen lo
  marque **y** que la última respuesta de la persona sea un sí. Si no, el dato se
  guarda igual pero sin permiso: se pierde poder escribirle solo, que se arregla
  llamándola, y no al revés.
- **No se arma el presupuesto desde el chat.** La propuesta lo intentaba inventando
  los datos que espera la función real (subtotal, costo estimado, servicios
  incluidos), que son las cuentas que el cliente ve como precio firme. Sacarlas de
  una conversación es inventar plata. El dato del interesado se guarda y el equipo
  arma el presupuesto donde esas cuentas están bien hechas.
- **Dos textos de venta cambiados sin pedirlo**, y a peor: el cierre del asistente
  pasaba de invitar a una reunión a un simple "ya anotamos tus datos". Se devolvieron
  los originales.
- **La segunda llamada a la inteligencia artificial no se contaba** en el gasto. Ya
  se cuenta.
- Errores mecánicos reparados: nombres de campos inexistentes en tres lugares, y la
  pantalla del video declaraba mal sus datos, lo que hacía fallar la publicación
  aunque el revisor de tipos pasara.

## Ganancia real y comparación entre fiestas (12 de agosto de 2026)

- **La ganancia se mostraba contra el gasto estimado, no contra el real.** El
  Analizador de Rentabilidad calculaba lo cobrado menos lo que se *estimaba*
  gastar. Los pagos a proveedores se registraban aparte y no entraban en la cuenta,
  así que **si el evento se iba de gasto, el número seguía viéndose lindo**. Ahora
  manda lo que se pagó de verdad en cada renglón que tenga pagos cargados, y donde
  no hay pagos se usa el estimado. La tarjeta dice cuál de las dos cosas está
  mostrando, en vez de decir siempre "estimada".
- **Pantalla nueva: "Qué fiesta deja más plata".** Compara todas las fiestas juntas,
  agrupadas por tipo de evento y por mes. Entra desde el Panel Contable. El
  analizador de siempre muestra una fiesta por vez; esto contesta la pregunta que
  decide qué conviene vender.
- **Por qué la cuenta vive en un solo archivo** (`src/lib/costos/ganancia-evento.ts`):
  antes cada pantalla la rehacía y dos mostraban números distintos de la misma
  fiesta, porque una se olvidaba de descontar la merma de bebidas, que viene contada
  dos veces en los datos. Ahora las tres pantallas usan la misma suma y las dos
  trampas conocidas están resueltas ahí adentro, explicadas: la merma duplicada y
  el costo de proveedores, que ya está dentro de los renglones y no se suma aparte.
- **Por qué el margen de un grupo se calcula sobre los totales** y no promediando
  los porcentajes de cada fiesta: promediar le daría el mismo peso a una fiesta de
  diez personas que a una de trescientas.
- **Un pago que no corresponde a ningún renglón igual se cuenta** como plata que
  salió. Esconderlo mostraría una ganancia que no existe.
- La pantalla avisa cuántas fiestas todavía no tienen pagos cargados, para que se
  sepa qué parte del número es estimación.
- Pide el permiso de Contabilidad, no alcanza con tener sesión: se ve lo que se le
  cobró a cada cliente y lo que dejó cada evento.

## La seña se cobraba de menos (12 de agosto de 2026)

- **El botón "Pagar seña" cobraba siempre $5.000**, sin mirar la seña acordada con
  ese cliente. Ese número era el valor de último recurso, pensado para cuando no hay
  ningún dato. En un evento grande el cliente apretaba, pagaba cinco mil pesos, y la
  reserva quedaba señada con una fracción de lo acordado. La diferencia aparecía
  mucho después, al ir a cobrar el resto.
- **Lo peor: la aplicación ya sabía el número correcto.** El resumen que se le
  muestra al cliente antes de firmar usa la seña acordada, o el 20% del total. Eran
  dos lugares distintos diciendo cosas distintas sobre la misma plata.
- **Ahora la cuenta vive en un solo lugar** (`src/lib/budget/monto-de-senia.ts`) y la
  usan el botón y el cobro: primero la seña acordada con ese cliente; si no hay, el
  monto general. Nunca se cobra más que el saldo pendiente.
- **Decisión del dueño, 12 de agosto de 2026: la seña es un monto fijo, hoy $5.000,
  no un porcentaje del evento.** Se le preguntó expresamente. Si alguna auditoría
  marca que "la seña debería seguir al tamaño del evento", es falso positivo.
- **El monto se edita desde Ajustes → Presentación del presupuesto**, así que el día
  que suba no hay que tocar código ni pedirle nada a nadie. Empieza en $5.000.
- **El botón y el cobro leen la misma cuenta**, a propósito. Si el botón dijera un
  número y se cobrara otro, el cliente pierde la confianza justo en el momento en
  que está reservando.

### Falsa alarma verificada

Se reportó que "el cliente no puede pagar solo, la función está desconectada de la
pantalla". **Es falso:** el botón de Mercado Pago existe y el cliente lo usa desde
su presupuesto, con seña y saldo, en cuotas. Y el aviso de pago acreditado entra
solo por el webhook, que verifica la firma y actualiza el saldo sin que nadie toque
nada. Lo único que estaba mal era el monto.

## Sin usuario se veía plata, y una prueba que no probaba nada (12 de agosto de 2026)

- **Preguntar por los permisos de alguien que no existe devolvía los de secretaria**,
  que incluyen ver contabilidad. Venía de la conversión de las cuentas viejas: el que
  no tiene perfil cargado se trata como secretaria, y eso está bien para una cuenta
  de verdad, pero no para la ausencia de cuenta. Una pantalla que preguntaba antes de
  terminar de cargar la sesión mostraba números que no le correspondían. Ahora sin
  usuario no se puede nada. **La conversión de las cuentas viejas no cambió.**
- **La regla de qué contenido del muro se muestra estaba copiada en nueve lugares**
  distintos: el listado público, el tótem del salón, el muro en vivo, la impresión y
  el video del recuerdo. Nueve copias de la regla que decide si una foto sin revisar
  aparece proyectada delante de toda la fiesta; alcanzaba con que una quedara vieja.
  Ahora vive en `src/lib/social-fiesta/visibilidad.ts` y las demás la usan.
- **Se reescribió una prueba que no podía fallar.** Armaba una lista inventada
  adentro de la prueba y después la filtraba ahí mismo, así que probaba su propio
  filtro y no el de la aplicación: si el video hubiera dejado de descartar las fotos
  pendientes, seguía en verde. Ahora llama a la función de verdad. Una prueba que no
  puede fallar es peor que no tener prueba, porque el que la lee cree que la regla
  está protegida.

## Reseñas de Google y plan de la noche del equipo (13 de agosto de 2026)

- **El pedido automático de reseña no se mandaba nunca.** El cliente contesta la
  encuesta sin estar logueado, y el envío buscaba el teléfono con una función que
  exige sesión del equipo: se caía siempre en silencio. El dueño habría prendido
  el interruptor y no habría salido un solo mensaje. Ahora el teléfono se lee del
  lado del servidor, sin pedir sesión, y sólo se usa para mandarle el WhatsApp a
  esa persona.
- **Se le podía escribir dos y tres veces por la misma fiesta.** La encuesta es
  pública y se puede contestar hasta tres veces por día; cada respuesta con nota 9
  o 10 disparaba su propio mensaje. Ahora se mira si a esa fiesta ya se le pidió la
  reseña: si sí, no se vuelve a escribir. Vale para el envío automático y para el
  botón manual.
- **Sólo a promotores y sólo si hay enlace.** Con nota menor a 9 no sale nada, con
  el enlace de Google vacío tampoco, y el interruptor viene apagado de fábrica.
  Hay pruebas para las cuatro puertas.
- **Una prueba que fallaba sola.** Las pruebas de este bloque preparaban respuestas
  "de un solo uso" que no se consumían y se filtraban a la prueba siguiente,
  haciéndola fallar sin que hubiera nada roto. Ahora las respuestas quedan fijas
  por prueba.
- **El plan de la noche no muestra sueldos.** Cada persona del equipo ve su propio
  rol, la hora, el lugar, el teléfono del encargado y el programa de la fiesta. No
  ve lo que cobra ni lo que cobran los demás, y hay una prueba que lo cuida.
- **La documentación tenía 427 acentos rotos.** `docs/YA-RESUELTO.md`, que es
  justamente lo que todos leen antes de auditar, estaba lleno de "auditoría" y
  "dueño". Pasó desapercibido porque la revisión completa de acentos sólo miraba
  el código, no la documentación. Reparado, y la revisión ahora mira también los
  documentos para que no vuelva a pasar.
## Los logos de las empresas, de verdad (13 de agosto de 2026)

- **Ahora son los reales y viven adentro de la aplicación.** Se sacaron del catálogo
  impreso de la empresa, recortados uno por uno y verificados a ojo antes de
  nombrarlos: Correo Uruguayo, Salto Hotel & Casino, Plus Medical, A.S.DE.M. y A.,
  Woslen, APC Salto, INC, Antel, ABRA, INAU, Intendencia de Salto y Club Uruguay.
  Los doce, cada uno con su nombre visible en pantalla.
- **Por qué no se cargan más desde afuera:** venían del sitio de Canva de la
  empresa. Si esa página cambiaba o se caía, los logos desaparecían en medio de la
  presentación, delante del cliente.
- **Dos cosas que ya salieron mal y no se repiten** (hay pruebas que las cuidan):
  no se dibujan logos —una entrega los reemplazó por rectángulos de color con el
  nombre escrito en una tipografía cualquiera, que no es el logo de nadie y usa mal
  la marca de un tercero—, y no se adivina qué nombre va con qué logo.
- Se pueden reemplazar y sumar clientes nuevos desde Ajustes → Contenido público.
- **Se borró `quienes-somos-slide`**, que quedaba muerta al lado de la pantalla del
  equipo. Estaba terminada pero nunca enganchada a la presentación.

## Lo común de los tres catálogos se perdía por tipo de fiesta (13 de agosto de 2026)

- **Los tres catálogos de la empresa comparten casi todo y cambian pocas cosas**
  (sobre todo las fotos). Así está armado el contenido de la presentación: un bloque
  común y, por tipo de fiesta, sólo la diferencia.
- **El problema:** se devolvía el bloque del tipo de fiesta **entero**, no combinado
  con el común. Todo lo que ese bloque no tuviera cargado quedaba vacío. La pantalla
  del equipo salía sin título ni frase en **todos** los tipos conocidos —casamiento,
  quince, cumpleaños— y sólo se veía bien cuando el tipo no estaba en la lista, que
  es justo al revés de lo que uno espera.
- **Ahora se combinan:** lo común primero, y encima lo propio de ese tipo. Cargar un
  tipo nuevo es escribir sólo lo que cambia. Hay pruebas que lo cuidan.
- Los doce logos de empresas **son los mismos en los tres catálogos**, verificado
  mirándolos: alcanza con un solo juego para todos.

## Infantiles y empresariales, sin catálogo impreso (13 de agosto de 2026)

- **El dueño no tiene catálogo de fiestas infantiles ni empresariales**, y no hace
  falta: la presentación ahora **saca las fotos de la galería** según el tipo de
  fiesta. Cada fiesta que el equipo sube mejora la presentación sola, y sirve para
  cualquier tipo que se agregue en el futuro.
- **El detalle que lo habría dejado sin funcionar:** la presentación y la galería no
  llaman igual a las mismas cosas. La presentación dice "Empresarial" y la galería
  "Corporativo"; la presentación escribe "Cumpleaños infantil" con minúscula y la
  galería con mayúscula. Buscar tal cual no traía **ninguna** foto, y la pantalla
  quedaba vacía **sin dar ningún error**: nadie se entera hasta que está vendiendo.
  La traducción vive en `src/lib/presentacion/fotos-por-tipo.ts`, en un solo lugar y
  con pruebas.
- **Si para un tipo no hay fotos cargadas, se muestran las generales.** Es mejor una
  foto linda de otra fiesta que una pantalla vacía delante del cliente.
- **Lo que cargue el dueño manda siempre**: las fotos de la galería son el respaldo,
  no el reemplazo.
- Se escribieron los textos propios de los dos tipos. El de empresariales apoya en
  las empresas para las que ya se trabajó, que es el argumento que decide una
  contratación corporativa; el de infantiles habla al padre, no al chico: le promete
  que él va a poder disfrutar a su hijo en vez de estar trabajando.

## Sueldos, empresa y la noche de la fiesta (13 de agosto de 2026)

Primera auditoría de tres módulos que nunca se habían revisado.

### Arreglado

- **Un recibo del personal ya pagado no se puede cambiar.** Se podía editar el
  monto y la fecha de un recibo marcado como pagado o con el papel firmado
  subido, sin dejar rastro: en una revisión no había forma de saber si se le
  pagó mil o cinco mil. Ahora quedan cerrados el monto y la fecha, y no se puede
  volver a "pendiente". **El estado sí puede seguir avanzando** (pagado → con
  recibo firmado), que es el camino normal. Bloqueado en el servidor y mostrado
  en gris en la pantalla, para que no falle recién al guardar.
- **Un menú sin platos no se guarda.** Se podía crear vacío y después aparecía
  para elegir en un presupuesto: el cliente contrataba un menú sin comida.
- **Un salón sin capacidad no se guarda.** Un salón para cero personas no sirve
  y aparecía igual al armar un presupuesto.

### Verificado y sano, no lo vuelvas a reportar

- **Los sueldos están bien protegidos.** No hay doble pago por empleado y fiesta,
  los importes negativos se rechazan en el servidor, el cálculo protege la
  división por cero, y **sólo con el permiso de sueldos se ven los sueldos**.
- **Los borrados de empresa están bien cuidados**: no se puede borrar un menú, un
  servicio, un insumo ni un activo que esté en uso en presupuestos, fiestas,
  recetas o listas de carga. Los gastos generales rechazan importes en cero.
- **Las pantallas de la noche manejan bien los cortes de internet**, salvo tres:
  la pantalla gigante, la galería y el tótem reintentan solas. Los centros de
  mando se arman en el servidor. **No hay datos internos a la vista del invitado
  ni errores en jerga en las pantallas grandes.**

### Lo que quedó para Gemini

`docs/ordenes/pantallas-de-la-noche.md`: la pantalla de impresión sigue mostrando
fotos viejas cuando se corta internet y el operador no se entera; la presentación
no se recupera sola; y el aviso del tótem es demasiado chico.

### Pantallas sueltas — auditadas el 13 de agosto de 2026

- **Alertas, incidentes, aprobaciones, calendario, auditoría, playbooks y
  eventos están sanas.** Se revisaron las siete: manejan errores con aviso,
  cargan bien, usan formato uruguayo de fecha y moneda. **No las vuelvas a
  auditar sin motivo.**
- **En aprobaciones quedaba un texto que decía "(ARS)"** cuando el sistema
  trabaja en pesos uruguayos. Figuraba como corregido en esta misma lista pero
  ese cartel se había salteado. Ya dice "pesos uruguayos".
- **Incidentes, aprobaciones y playbooks no las enlaza nadie.** Funcionan bien,
  pero sólo se llega escribiendo la dirección: no hay botón en el menú ni en el
  panel. **No las borres**: falta que el dueño decida si se conectan o se
  retiran.

### Portales del cliente y del invitado — auditados el 13 de agosto de 2026

- **La distribución de mesas era pública y mostraba los invitados de cualquier
  fiesta.** `/portal` es público porque ahí vive el portal del invitado, y mesas
  colgaba de ese mismo prefijo, pero es una herramienta del EQUIPO. Con poner
  `/portal/mesas?fiestaId=...` se veía la lista entera de invitados de esa
  fiesta, con sus datos, sin estar logueado: `getFiestaById` sin sesión sólo
  borra la clave de acceso y devuelve todo lo demás. Cerrado agregándola a
  `PROTECTED_EVENT_ROUTES`, con prueba (`mesas-no-es-publica.test.ts`).
  **Ojo con esto al agregar pantallas del equipo bajo `/portal`: hay que sumarlas
  a esa lista o quedan abiertas.**
- **El resto de los portales está bien.** Se revisaron los tres (el del invitado,
  el del cliente con clave y las vistas pública y Pro): la validación de la clave
  es correcta, no se filtran sueldos, costos, márgenes ni notas del equipo, el
  guardado avisa cuando falla y los formularios no pierden lo cargado si se corta
  la conexión.

## Ajustes y empresa, lo último sin auditar (13 de agosto de 2026)

Con esto **queda auditada la aplicación entera**.

### Arreglado

- **Los datos de la empresa no se pueden dejar vacíos.** Se podía borrar el
  nombre o el RUT y guardar: el contrato y la factura del cliente salían con el
  renglón en blanco y nadie se enteraba hasta tenerlos sobre la mesa.
- **Una cuenta bancaria a medias no se guarda.** Sin banco, titular o número, el
  cliente no sabe adónde transferir y termina llamando para preguntar.
- **Los insumos y los activos no aceptan cantidades ni costos negativos.** El
  `min` del formulario lo controla el navegador y se saltea; un negativo se
  arrastra al costo de la comida en todos los presupuestos.
- **Se avisa cuando la receta y el catálogo usan unidades que no se pueden
  convertir.** El cálculo sólo sabe pasar de gramos y mililitros a kilos y
  litros. Si la receta pide "2 tazas" y el insumo está en gramos, multiplicaba
  como si fueran lo mismo y el costo del plato salía mal, en silencio.
  **Decisión: se avisa, no se inventa la conversión** — nadie puede saber cuánto
  pesa una taza de ese ingrediente. Vive en `src/lib/catering/unidades.ts` con
  seis pruebas.

### Verificado y sano, no lo vuelvas a mirar

- **Ajustes está bien**: la pantalla de presupuestos, el respaldo (con
  confirmación al restaurar), el reinicio de datos, Google Workspace y las
  sincronizaciones manejan bien los errores.
- **Los borrados de empresa siguen protegidos**: no se puede borrar un
  proveedor, insumo, menú, servicio ni activo que esté en uso.

### Lo que quedó para Gemini

Las promociones se pueden crear sin fechas y el contador de la web no arranca.
Va en `docs/ordenes/ahora.md`.

### Las órdenes de trabajo se ordenaron

Había **quince archivos con 2700 líneas**, casi todos cumplidos, sin forma de
saber cuál seguía vivo. Ahora hay **una sola vigente, `docs/ordenes/ahora.md`**,
y el resto está en `docs/ordenes/hechas/` como historia. **Cuando una orden se
termina, se mueve a `hechas/` en la misma propuesta.**

## Tres pantallas que quedaban en blanco (16 de agosto de 2026)

Salieron de mirar las fotos de las pantallas en celular, no de leer código. Las
tres cargaban bien y no daban ningún error: simplemente no mostraban nada.

- **La pantalla del salón se quedaba negra cada tanto.** El televisor va rotando
  entre fotos, redes, juegos y dedicatorias. El pedazo que dibuja las
  dedicatorias está apagado a propósito (los saludos van en el buzón privado),
  pero la rotación seguía pasando por ahí y el televisor quedaba en blanco hasta
  que le tocaba el turno a la siguiente. Ahora, cuando llega a esa vuelta,
  muestra el cartel de siempre con el nombre de la fiesta y el código para subir
  fotos.
- **Y si el muro está apagado para esa fiesta, ahora lo dice.** Antes no se
  dibujaba nada en ninguna parte y nadie sabía si estaba roto o apagado. Ahora
  aparece el nombre de la fiesta y una línea que explica dónde se enciende.
- **Dos carteles eran blancos sobre blanco.** En "Zona digital" y en "Mi mesa",
  cuando el enlace no servía, el invitado veía una tarjeta blanca vacía con un
  dibujito y nada más. El texto estaba escrito, pero era blanco sobre fondo
  blanco. **Por qué pasaba:** el fondo oscuro se pedía con una clase de la hoja
  de estilos y el blanco propio de la tarjeta le ganaba. Se le puso el fondo
  oscuro directo en la tarjeta. Hay una prueba que impide volver a combinar esas
  dos cosas.

**Falso positivo descartado:** el ayudante que miró las pantallas del equipo
avisó que el gráfico vacío de contabilidad y las listas vacías de facturas y
clientes "se ven frías". Funcionan y se leen bien; son pantallas internas que no
ve el cliente. **No se tocan.**

## El portal del cliente y la portada, con ojo de vendedor (16 de agosto de 2026)

No eran errores: la app funcionaba bien. Es la diferencia entre "está bien" y
"qué bueno esto".

- **La fiesta del cliente pasó a ser la protagonista.** En el celular, la fecha,
  la hora y el salón estaban en cuatro cajitas grises chicas, una debajo de la
  otra, como una lista de datos de sistema. Ahora son una sola tarjeta grande, y
  la cuenta regresiva —"¡Es hoy!", "Faltan 12 días"— va grande y con el color del
  evento. **Por qué así:** es lo que el cliente siente cada vez que abre el
  portal, y estaba en letra chica.
- **Las etiquetas de arriba se achicaron.** "PORTAL VIP" y el nombre de la
  empresa competían con el nombre de la fiesta. Van discretas.
- **El portal abre con una foto.** Si la fiesta no tiene foto cargada se usa una
  del catálogo propio según el tipo de evento. **Por qué archivos propios y no
  enlaces a otro sitio:** una foto de afuera puede tardar, fallar o desaparecer,
  y la portada quedaría gris justo en la pantalla que más importa. **Ojo:** el
  tipo "XV" no lo reconocía y caía siempre en la foto genérica.
- **El botón de personalizar portada ya no se monta sobre la tarjeta** de
  "Próximo paso", que además quedaba cortada por arriba.
- **Salieron dos notas internas de la pantalla del cliente.** Una decía "antes de
  enviarlo al cliente final" y la otra "AK debe cambiar el link de prueba". Las
  dos le hablaban al equipo en la pantalla del propio cliente. Ahora el aviso
  está en la pantalla interna del portal, con la lista de qué falta completar.
- **La espera del muro dejó de ser una rueda pelada.** El invitado escanea el QR
  parado en la fiesta y puede esperar hasta veinte segundos. Ahora ve la marca de
  AK desde el primer instante, la frase "Buscando las fotos de la fiesta…" y el
  armazón de la galería en gris. Los mismos segundos se sienten la mitad.
- **Las pantallas vacías del muro llevan al próximo paso.** Se copió el modelo de
  la galería: dibujo grande, frase clara, botón que lleva a la acción y una línea
  de ayuda. La del muro dice además que lo que subas aparece en la pantalla
  grande del salón.
- **La portada pública tiene un respaldo debajo del botón principal.** Tres datos
  cortos donde el visitante decide si sigue leyendo. **Por qué no dice cuántas
  fiestas ni cuántos años:** no se inventan números en la web pública. Si algún
  día se quieren poner cantidades reales, tienen que salir de la ficha de la
  empresa.

**Lo que no salió:** en las fotos de prueba, la imagen de la portada del portal y
el logo de la barra pública no llegan a verse. Se intentó tres veces y se paró
por regla. El resto de los cambios sí se verificó con fotos.

## Textos con inteligencia artificial para vender y para después de la fiesta (16 de agosto de 2026)

Entrega de Gemini, revisada y completada. En Comercial y en Post-fiesta hay ahora
un botón que escribe el mensaje de WhatsApp personalizado para cada cliente: el
seguimiento del que no contestó, el pedido de testimonio, el permiso para usar
las fotos y el texto para publicar en redes.

**Nadie manda nada solo.** El botón escribe, la persona lee y recién ahí copia o
guarda. Si la inteligencia artificial no responde, queda el mensaje de siempre.

**Lo que faltaba y se agregó acá:** estas dos llamadas **no anotaban lo que
gastan**. Todas las demás de la app sí. Ahora pasan por el mismo contador y el
mismo tope mensual: si se llegó al tope, el botón no gasta y deja el texto de
siempre, igual que hace la fotocabina. Sin esto el gasto aparecía recién en la
factura.

**Otras dos cosas que se corrigieron de la entrega:** el listado de páginas que
se le da a Google había perdido la fecha de actualización, y quedó un archivo de
notas suelto en la raíz del proyecto.

**Lo que sí estaba bien hecho y se deja como está:** pide sesión antes de
generar, limita el largo de lo que se le manda, trata los datos del cliente como
texto no confiable —para que nadie pueda meter órdenes escondidas en el nombre de
un evento— y le prohíbe inventar promociones, descuentos, cupos o fechas
disponibles. Eso último importa: un descuento inventado por una máquina es plata
de verdad.

## El aviso de margen, ahora sí visible (17 de agosto de 2026)

Se había fusionado el cálculo pero **no estaba enchufado a ninguna pantalla**: el
archivo existía, la prueba pasaba, y en la app **no lo veía nadie**. Ahora aparece
en la pantalla del presupuesto.

- **Sólo lo ve el equipo.** Esa pantalla también se comparte con el cliente por
  enlace público, y cuánto se pasó el costo de lo estimado no es algo que el
  cliente tenga que ver. El aviso está dentro del bloque de operador y la acción
  del servidor pide sesión.
- **Compara por tipo de evento, salón y cantidad de invitados**, y sólo habla si
  hay al menos dos fiestas parecidas con gastos cargados y el desvío supera el 5%.
- **No toca el precio**, y lo dice en pantalla: "es sólo un dato para tenerlo en
  cuenta, el presupuesto no cambia".
- **Falla en silencio:** si no se puede calcular, no se muestra nada. Un
  presupuesto no se traba por un aviso informativo.

**La lección, anotada para no repetirla:** una funcionalidad puede tener el
cálculo bien, la prueba en verde y los cuatro controles pasando, **y no existir
para el usuario**. Al revisar una entrega hay que preguntar además *"¿desde qué
pantalla se ve esto?"*.

## La entrega 1: trivia, secretario que habla y llegada del equipo (17 de agosto de 2026)

Entrega de Gemini, revisada y reparada. **Esta vez los archivos coincidían con lo
pedido**, a diferencia de la anterior.

**Lo que quedó andando:**

- **La trivia de la cena está enchufada.** El invitado responde desde el celular,
  la pantalla gigante marca la respuesta correcta en verde y muestra el **podio
  por mesa**, que es el que enciende el salón porque las mesas compiten.
- **El secretario que habla.** Botón de micrófono en el asistente interno, en
  castellano uruguayo, y contesta en voz con opción de silenciarlo.
- **La llegada del equipo.** Cada uno marca "llegué" desde el celular y en el
  centro de la fiesta se ve quién falta.
- **La pantalla de logística, en oscuro**, para usarla de noche.

**Lo que hubo que reparar, y es importante:**

- **El "llegué" no se hubiera guardado en ningún lado.** Escribía el archivo del
  proyecto a mano en vez de usar el guardado común de la app. En producción los
  datos viven en la base, no en esos archivos: la persona tocaba el botón y la
  pantalla la seguía mostrando en rojo. Ahora usa `updateDataPartial`, como todo
  lo demás.
- **Esas dos acciones no pedían sesión.** Cualquiera podía marcar que llegó
  cualquiera, y leer en qué fiestas trabaja cada empleado. Ahora piden sesión,
  como el resto de la app. **Hay una prueba nueva que cuida las dos cosas.**
- **Un error de tipos rompía la compilación** del muro social, por armar la
  configuración con un esparcido suelto.
- **Marcar dos veces la llegada pisaba la hora original.** Ahora se conserva la
  primera, que es la que sirve para saber si alguien llegó tarde.

**Falso positivo verificado, para que no se vuelva a reportar:** se revisó si el
secretario por voz podía disparar herramientas que mueven plata sin confirmación.
**No puede.** Ese asistente sólo maneja tres acciones —crear tarea, crear
recordatorio y navegar—. Las herramientas de cobros y contratos son de otro
componente y no están a su alcance.

## Entregas 2 y 3 y el centro de presencia digital (17 de agosto de 2026)

Dos propuestas de Gemini, revisadas y fusionadas. **Separadas compilaban las dos;
juntas no.** Es el caso que el proyecto ya tenía anotado con el archivo de
facturas, y por eso los controles se corren sobre el conjunto.

**Lo que hubo que reparar al juntarlas:**

- **Las plataformas nuevas de redes.** Una propuesta agregó YouTube, Threads y X
  a las tablas de colores e íconos y la otra no los tenía en el tipo. Se sumaron
  al tipo y se completaron las dos tablas, ahora con tipado explícito para que el
  compilador avise si mañana falta alguna.
- **El control de gasto de inteligencia artificial recibía un texto donde
  esperaba una fecha.**

**Lo que se reparó de seguridad, y es lo importante:**

- **El freno de la reserva de turnos se podía saltear.** Contaba por el contacto
  que escribe el visitante, así que cambiando el teléfono arrancaba de cero.
  **Ahora cuenta por el origen de la conexión**, que es lo único que el visitante
  no elige.
- **El registro de prospectos desde la fiesta no tenía freno.** Es una acción
  pública que escribe en el CRM: sin límite, se podía llenar la lista de
  prospectos falsos. Diez por hora.

**Y una prueba que gastaba plata:** la del centro de presencia digital llamaba de
verdad al contador de gasto de inteligencia artificial, que pega contra la base.
Tardaba más de cinco segundos y se cortaba. **Una prueba nunca puede gastar ni
depender de la red**: se corren decenas de veces por día. Ahora está simulada y
tarda medio segundo.

**Falsos positivos verificados, para que no se vuelvan a reportar:**

- Se avisó que `getSimulatorAvailableSlots` expone datos de citas. **No los
  expone:** devuelve sólo días y horas libres, sin nombres ni contactos. Es
  pública a propósito.
- Se avisó que `registerQuinceaneraPartyLead` no la llama nadie. **Sí la llama**
  la pantalla que le pregunta a la invitada cuándo cumple quince.

**Lo que queda sin enchufar y hay que avisar:** el botón para descargar el libro
de la fiesta existe pero **ninguna pantalla lo muestra**, así que esa función no
se puede usar todavía.

## Cuatro pantallas que existían y no se podía llegar (17 de agosto de 2026)

Al revisar que estuviera todo lo planeado, apareció otra vez el mismo problema:
**el archivo escrito, compilando, con pruebas en verde, y ninguna pantalla que lo
muestre.** Cuatro casos de una sola tanda.

- **El libro de la fiesta en PDF.** El generador y su botón existían; el botón no
  estaba en ninguna pantalla. Va al centro de la fiesta, que es donde se maneja la
  noche y donde se entra al día siguiente a cerrarla.
- **"Lo tuyo, ahora"**, el cronograma por rol de cada uno del equipo. Existía sin
  enlace. Va al centro de la fiesta.
- **El video del recuerdo.** Igual. Va al centro de la fiesta.
- **El configurador para la reunión de cierre.** Existía sin enlace, así que el
  vendedor no tenía cómo abrirlo. Va a la central de presupuestos, que es donde
  arma el presupuesto antes de la reunión.

**Por qué se repite:** los cuatro controles no lo detectan. Un archivo puede
compilar y pasar las pruebas sin que exista para el usuario. **El control que sí
lo agarra es preguntar, por cada cosa nueva, desde qué pantalla se ve.** Quedó
pedido en la orden.

**Decisión tomada, para que no la revierta nadie:** hay un segundo panel de
preguntas de trivia (`TriviaAdminPanel`) que ninguna pantalla usa. **No se
enchufa a propósito.** El panel del muro social ya permite escribir las preguntas,
y tener dos formas de hacer lo mismo es peor que tener una.

## Lo que se guardaba sin señal no se mandaba nunca (17 de agosto de 2026)

Las tres pantallas de la fiesta guardaban lo pendiente en el celular y le decían
al invitado *"se envía solo"*. **Pero nadie vaciaba la cola.** El pedido de trago
no llegaba nunca a la barra y la foto no se publicaba nunca.

**Es peor que fallar de frente**: la persona se queda tranquila esperando algo que
no va a pasar. Sólo la pantalla de la puerta reintentaba.

- **La barra** ahora reenvía los pedidos guardados apenas vuelve la señal.
- **El muro** vacía la cola y, si quedó una foto sin subir, la vuelve a ofrecer.

**Y algo que había que decir con la verdad:** la cola del celular **no puede
guardar la foto**. Una foto de celular pesa varios megas y ahí no entra. Lo que se
guardaba era sólo el nombre y el texto, así que la promesa *"tu foto se publicará
automáticamente"* era falsa: la foto ya no estaba.

Ahora el cartel dice lo que de verdad pasa: *"Sin señal por ahora. No cierres esta
pantalla: lo subimos solos apenas vuelva la señal."* La foto queda en memoria
mientras la pantalla esté abierta, y al volver la señal se le ofrece publicarla.

**La regla que queda:** una pantalla nunca promete algo que no puede cumplir. Si
no se puede guardar, se dice.

## Publicar de verdad en las redes (17 de agosto de 2026)

Antes el botón de publicar **marcaba el posteo como publicado y no mandaba nada a
ninguna red**. Ahora publica de verdad en Facebook e Instagram, con el camino de
dos pasos que pide Instagram. Sigue aprobando una persona: nada sale solo.

**Dos cosas que hubo que corregir al revisarlo:**

- **El permiso para publicar se guardaba en un archivo que se sube al
  repositorio.** Ese permiso deja publicar en las cuentas de la empresa. La
  primera vez que se conectara la página, hubiera viajado ahí. Se sacó del control
  de versiones y se ignora, igual que los contratos y los respaldos. **Hay una
  prueba que falla si alguien lo vuelve a versionar.**
- **El importador de historial duplicaba todo.** Recorría el archivo entrando
  también dentro de cada publicación, así que la foto adjunta —que trae su propio
  título— se contaba como un posteo aparte. Ahora, cuando un registro ya es una
  publicación, no se sigue bajando adentro: lo que cuelga de ella es parte de
  ella.

**La regla que queda:** cualquier dato que sirva para entrar o publicar en una
cuenta de la empresa **nunca se guarda en un archivo versionado**.

## Los números de las redes se guardan solos, todos los días (17 de agosto de 2026)

El guardado del historial **corría únicamente cuando alguien abría la pantalla de
presencia digital**. Como las plataformas **no entregan los números viejos hacia
atrás**, una semana sin entrar era una semana de historia perdida para siempre. Y
era justo el bloque más importante del pedido: empezar a acumular desde hoy.

Ahora hay una tarea diaria en `/api/cron/metricas-de-redes`, protegida con la
misma clave que las otras dos que ya existían. **Sin esa clave no corre**, a
propósito.

**Por qué el guardado vive en `src/lib/presencia-digital/guardado-diario.ts` y no
en una acción:** una tarea programada no tiene sesión, y una acción exportada que
escribe sin control rompe el guardián del proyecto —que efectivamente la agarró al
primer intento—. Es el mismo camino que ya se había usado para el escaneo de
recordatorios de pago: la lógica en una biblioteca, y la usan tanto la pantalla
como la tarea.

No guarda dos veces el mismo día.

## De quién es cada foto, y la invitada sin teléfono (17 de agosto de 2026)

Las dos partes del recuerdo del invitado que tocaban permisos y datos
comerciales. El resto de esa orden es de Gemini.

- **La foto del muro ahora guarda de quién es.** El dato llegaba al subirla, se
  usaba sólo para comprobar el permiso y después se tiraba. Sin eso no se puede
  armar "tus fotos de la fiesta" para nadie.
- **Por qué se guarda con candado y no a secas.** El dueño se anota **sólo si la
  persona probó tener el enlace personal de ese invitado**. Si el identificador
  viene suelto, no se guarda: si no, cualquiera manda el de otro y se queda con
  sus fotos. La foto se sube igual, sin dueño. Esa misma regla vale para las
  estaciones cuando Gemini las enganche, y está escrita en la orden.
- **Sirve de acá en adelante.** Las fiestas ya pasadas no tienen el dato y no se
  puede recuperar. No es un error: no hay de dónde sacarlo.
- **Se dejó de inventar un teléfono.** Cuando una invitada contestaba la pregunta
  de los quince sin dejar contacto, se la guardaba con `099000000`. Alguien del
  equipo iba a perder el viaje llamando a un número que no existe. Ahora se
  guarda sin teléfono y la ficha lo aclara.
- **Por qué no se aflojó el control en general.** El simulador **sigue exigiendo
  un celular uruguayo**: ahí sin teléfono no hay a dónde mandar el presupuesto.
  El permiso de guardar sin contacto es sólo para la pregunta que se le hace al
  invitado en la fiesta, donde el dato vale igual.
- **Dos invitadas que se llaman igual no se juntan en una ficha.** Sin teléfono
  se las distingue por de qué fiesta y de qué invitación vinieron. Antes el
  número inventado las habría pegado a todas en una sola.

## Reparaciones al recuerdo del invitado (17 de agosto de 2026)

La entrega venía con la parte linda bien hecha —el pase de fotos filtrado, el
video vertical, el enlace que el invitado se manda a sí mismo— y con **tres
agujeros en lo que decide de quién es cada foto**. Se repararon y se fusionó todo
junto.

- **Se guardaba el dueño de la foto sin comprobar nada.** Alcanzaba con mandar el
  identificador de otro invitado para que esa foto le quedara marcada como suya —
  y le apareciera después en **su** recuerdo de la fiesta. Ahora sólo se guarda si
  la persona probó tener el enlace personal de ese invitado, en el muro **y** en
  las estaciones. Sin comprobar, la foto se publica igual pero sin dueño.
- **La pantalla del recuerdo armaba "tus fotos" con sólo poner un identificador
  en la dirección.** No mostraba nada oculto (esas fotos ya son públicas), pero
  dejaba ver de quién es cada una. Ahora pide el enlace personal; si no comprueba,
  muestra el recuerdo de la fiesta entera sin romperse ni dar error.
- **El prospecto sin teléfono se escribía a mano en el archivo**, salteando la
  función del CRM. Eso lo dejaba sin etapa del embudo, sin historial, y en
  producción **ni siquiera llegaba a la base**: el prospecto se perdía. Ahora pasa
  por la misma función que todos, con permiso explícito de guardar sin contacto.
- **Se había borrado el texto de las fotos de estación.** Lo leen el muro social,
  la pantalla de moderación y la pantalla gigante, que reconoce por ahí las fotos
  de misión. Restaurado.
- **Una prueba llamaba a una función que no existe.** Se sacó: lo que probaba ya
  está cubierto contra la función de verdad.

## Auditoría de Ajustes, Empresa y permisos (17 de agosto de 2026)

Era lo último que quedaba sin revisar. Se encontró poco, y lo poco ya está
arreglado.

### Arreglado

- **Un cupón se podía guardar terminando antes de empezar.** Quedaba guardado y
  no servía un solo día; nadie se enteraba hasta que un cliente lo intentaba usar
  en la caja. Las promos ya lo controlaban, los cupones no.
- **Anotar un aparato para recibir avisos no pedía sesión, y dejaba elegir a
  nombre de quién quedaba anotado.** Hoy nada manda avisos desde esa lista, así
  que no había nada filtrándose; el día que se enchufen, un extraño habría
  recibido los del equipo. Ahora pide sesión y el dueño del aparato sale de la
  sesión, no de lo que manda el navegador. La pantalla que la usa es la del panel
  interno, que ya pedía sesión: no le cambia nada a nadie.
- **Anotarse en el sorteo de redes no tenía ningún freno.** El control de
  repetidos mira nombre + red, así que con nombres inventados se cargaba la lista
  entera y el premio se lo llevaba cualquiera. Se le puso el mismo freno que usan
  las otras interacciones del muro, cuyo primer tope cuenta por fiesta y **no
  depende del nombre**, así que cambiarlo no lo esquiva. Ninguna pantalla la
  llama hoy, pero queda expuesta igual por ser acción de servidor.

### Falsas alarmas verificadas (no volver a reportarlas)

- **"El título de Cupones se desborda en el celular."** Ya tiene el ajuste de
  ancho puesto. Mirado línea por línea.
- **"Los campos del formulario de cupones no tienen explicación."** La tienen:
  usos máximos aclara que cero es ilimitado, tipo de evento aclara que vacío
  aplica a todos, y monto mínimo dice "sin mínimo".
- **Empresa está sana.** Todas sus acciones de escritura piden sesión o permiso,
  no hay plata ni datos de clientes a la vista de quien no corresponde, y los
  borrados están bloqueados cuando la cosa está en uso.
- **Las demás acciones públicas sin sesión están bien**: muro, encuestas,
  dedicatorias, pedidos de canciones y la encuesta de opinión. Todas tienen tope
  de uso, que es lo que corresponde para algo que usa el invitado sin cuenta.

## Cuatro pantallas internas entraban con una cookie inventada (17 de agosto de 2026)

**El agujero más grande que apareció en toda la auditoría.** `/admin/finanzas`,
`/admin/ventas`, `/admin/carga-historicos` y `/admin/asistente-ak` quedaron
**fuera** del grupo `(app)`, que es donde vive la guardia de sesión. Sin ella:

- El middleware protege todo lo que no esté en la lista pública, pero **sólo
  comprueba que exista la cookie, no que sea válida** — no puede leer el secreto
  para verificar la firma. Está documentado y es a propósito.
- Quien valida de verdad es `AuthGuard`, en el navegador. Esas cuatro no lo
  tenían.
- Las funciones que traen las fiestas **no piden sesión a propósito**, porque las
  usan también las pantallas del invitado.

Resultado: cualquiera que se inventara una cookie con ese nombre abría
`/admin/finanzas` y veía **la plata de todas las fiestas** —totales, cobros y
saldos—, o `/admin/ventas` y **movía el embudo de ventas**.

**Arreglado con un `layout.tsx` propio en `/admin` que las pone detrás de la
guardia.** Va sólo la guardia, sin el marco de navegación: esas pantallas ya
venían sin él y se veían bien así.

**Por qué el candado va ahí y no en las funciones de fiestas:** pedirles sesión
rompería el portal del invitado, el muro y las estaciones, que las usan sin
cuenta. Hay una prueba que cuida que ninguna pantalla interna quede sin guardia y
que `/admin` no se agregue a la lista de rutas públicas.

## Cuatro páginas de venta estaban tapadas por el login (17 de agosto de 2026)

**Lo más caro que apareció en toda la auditoría, y no se veía por ningún lado.**

`/bodas`, `/quinceaneras`, `/cumpleanos` y `/experiencia-ak` son las cuatro
páginas de venta del negocio. La app **se las ofrece a Google** y les arma título
y descripción propios, pero **no estaban declaradas como abiertas**, así que el
middleware mandaba al visitante a la pantalla de ingreso.

Qué significaba en la práctica: el prospecto que llegaba desde Google o desde un
enlace compartido por WhatsApp **veía un formulario de contraseña en vez de la
página de bodas**. Y Google tampoco podía leerlas, así que todo el trabajo de
posicionamiento sobre esas cuatro no servía de nada.

**Es la tercera vez que pasa lo mismo.** Ya había pasado con `/catalogo` y con
`/galeria-led`, y las dos veces se arregló a mano sin dejar nada que lo evitara.

**Ahora hay una prueba que ata las dos listas**
(`src/__tests__/paginas-de-venta-abiertas.test.ts`): si alguien agrega una página
al listado que ve Google y se olvida de abrirla, la prueba falla y dice cuál. La
misma prueba comprueba que abrirlas no haya abierto de paso nada del equipo
—contabilidad, presupuestos, empleados, finanzas y la distribución de mesas
siguen pidiendo cuenta—.

**Cómo se verificó:** corriendo las funciones de verdad del middleware contra el
listado de Google, no leyendo el código a ojo.

## El barrido completo de puertas (17 de agosto de 2026)

Después de encontrar dos casos sueltos, se revisaron **todas** las carpetas de
pantallas, una por una, cruzando dos preguntas: ¿está declarada como abierta? y
¿tiene la guardia de sesión? Lo que no tenga ninguna de las dos entra con una
cookie inventada; lo que debería ser abierta y no lo está, no la puede abrir el
cliente.

### Se abrieron dos que estaban tapadas

- **El QR inteligente de la fiesta (`/q`).** Dice "Elegí cómo querés entrar" y su
  primer botón es "Entrar como invitado": lo escanea el invitado con su celular,
  sin cuenta. Estaba tapado, así que **el que escaneaba el QR en plena fiesta
  caía en la pantalla de ingreso**.
- **La demostración de tecnología (`/marketing/demo-tecnologia`).** La enlaza la
  presentación LED, que es pública, desde una de sus láminas. El prospecto la
  tocaba delante del vendedor y caía en el login. El resto de `/marketing` es del
  equipo y sigue pidiendo cuenta.

### Se les puso guardia a ocho del equipo

`analytics`, `compras`, `control-tower`, `marketing`, `post-fiesta`, `recepcion`,
`recursos-multi-evento` y `secretaria-ak`. Todas viven fuera del grupo `(app)`,
que es donde está la guardia, y ninguna la tenía propia.

**Por qué no alcanzaba con el middleware:** sólo comprueba que la cookie exista,
no que sea válida. Es a propósito y está documentado. Con una cookie inventada se
veía la lista de invitados de la puerta, las dedicatorias con datos personales, y
los números del negocio.

**Poner la guardia no le cambia nada a quien ya entra bien**, y las rutas
declaradas como abiertas siguen pasando: `AuthGuard` las deja pasar.

### Falsas alarmas verificadas (no volver a reportarlas)

- **`/personal/[empleadoId]` muestra sueldo y teléfono pero NO filtra nada.** La
  función que trae los datos pide sesión y sin ella devuelve vacío. Está bien
  como está.
- **`/album` no necesita nada**: sólo redirige a `/evento/album`, que ya es
  abierta.
- **`/prospectos` tampoco**: comprueba la sesión por su cuenta antes de mandar al
  CRM.
- **`/signup` está obsoleto**: sólo redirige al login, y así queda a propósito.
- **`/evento` no está "sin declarar"**: sus pantallas se declaran una por una, y
  eso es a propósito, porque algunas son del equipo.

## Los accesos "generales" del colaborador: RESUELTO el 18 de agosto de 2026

**Se sacaron los nueve.** El dueño lo dejó a criterio de Claude y se eligió
sacarlos, no abrirlos: abrirlos de verdad significaba dejar entrar con un
enlace, y sin cuenta, a la contabilidad, las facturas y la base de clientes. Un
enlace se reenvía por WhatsApp sin pensar.

Quedan los seis del evento —música, itinerario, carga, decoración, repostería y
foto/video—, que son los que el fotógrafo, el DJ y el catering necesitan de
verdad, y ésos sí llevan la llave, que se comprueba contra esa fiesta.

Dos detalles de cómo quedó:

- **El portal filtra por su cuenta**, no sólo la pantalla que los crea. Un acceso
  creado antes puede tener los nueve guardados; ahora no muestra botones muertos.
  Si le quedan cero módulos, lo dice en criollo en vez de mostrar una lista vacía.
- **La lista de lo que anda vive en un solo lugar**
  (`src/lib/auth/permisos-por-enlace.ts`) y hay una prueba que impide que las dos
  pantallas se separen. Si algún día se quiere abrir alguno de los nueve, no
  alcanza con volver a ponerlo en la lista: hay que hacer que esa pantalla acepte
  y compruebe la llave, como ya hacen las del evento.

Abajo queda el diagnóstico original, por si hace falta entender el porqué.

## Los accesos "generales" del colaborador no llevan a ningún lado (17 de agosto de 2026)

**Encontrado, no arreglado: conviene que lo decida el dueño.**

Al crear un acceso para un colaborador se pueden marcar nueve permisos
"generales": prospectos, presupuestos, clientes, facturación, personal,
proveedores, empresa, contabilidad y calendario.

**Ninguno de los nueve funciona.** El colaborador entra con su enlace, ve los
botones en su portal, los toca y **cae en la pantalla de ingreso**. La razón: los
módulos del evento (música, itinerario, carga, decoración, repostería,
fotografía) se enlazan con `&token=` y el sistema los deja pasar comprobando ese
token; los nueve generales se enlazan **sin token**, apuntan a pantallas internas,
y abrir el enlace del colaborador **no le da ninguna sesión**.

**Por qué no se arregló solo:** las dos salidas cambian el negocio y ninguna es
de una línea. O se les agrega soporte de token a esas nueve pantallas —que son
justo las de plata y datos de clientes—, o se sacan de la lista de permisos que
se ofrecen. La primera abre la contabilidad a gente de afuera; la segunda le
quita al dueño una opción que hoy cree tener.

## El control de acentos también mira los documentos, y hay una prueba que lo cuida (17 de agosto de 2026)

`docs/YA-RESUELTO.md` es lo que todos leen antes de auditar, y ya juntó 427
acentos rotos una vez sin que nadie lo viera, porque la revisión completa sólo
miraba el código. Se arregló agregando `*.md` al barrido.

**Ahora hay una prueba que cuida esa línea** (`src/__tests__/acentos-en-docs.test.ts`):
si alguien vuelve a sacar los documentos del barrido, falla. La misma prueba
comprueba que la documentación esté limpia.

**Ojo al arreglar acentos:** `AGENTS.md` y `ESTADO-AUDITORIA.md` escriben los
ejemplos rotos **a propósito** para explicar el problema —ahí se ve cómo queda un
menú o un plato con el acento partido—. Arreglarlos les saca el sentido a esas
frases, así que están excluidos del control y de la prueba. Ya pasó una vez:
alguien los "reparó" y dejó dos explicaciones sin ejemplo.

## El panel de redes mostraba números inventados (18 de agosto de 2026)

**Lo más peligroso encontrado hasta ahora, porque no se veía: los números
mentían con la misma cara que los de verdad.**

El centro de presencia digital mostraba 1420 seguidores en Instagram y 2850 en
Facebook, 48 seguidores nuevos por semana, 5240 de alcance, 14,2% de crecimiento,
y una ficha de Google con **4,9 de puntaje y 38 opiniones**. Ninguno existía:
estaban escritos a mano en el código.

Peor todavía: **la tarea que corre todos los días guardaba esos mismos números**,
más un alcance calculado a ojo (`interacciones * 4 + 350`), así que el historial
de crecimiento que se iba armando era falso de punta a punta — y parecía real
justamente porque se movía día a día.

El dueño podía tomar decisiones de plata sobre eso, y hasta repetirle a un
cliente un puntaje de Google que no existe.

**Ahora:** lo que no se midió va vacío y la pantalla dice "sin dato" con lo que
hay que conectar para tenerlo. Lo que sí es real se mantiene tal cual: gasto de
publicidad, fiestas cerradas por avisos, costo por fiesta cerrada, posteos
esperando aprobación, e interacciones y cantidad de posteos, que salen de los
posteos de verdad.

**El reparto del gasto de publicidad entre redes también era inventado** (un
60/40 puesto a ojo). Ahora el total va donde se mide y no se reparte adivinando.

**Una prueba vieja estaba del lado equivocado:** exigía `followers > 0`, o sea
comprobaba que el número inventado siguiera ahí. Se dio vuelta. Hay una prueba
nueva que impide que los siete números vuelvan.

### Lo que falta para tener los datos de verdad

Seguidores y alcance reales salen de las estadísticas de Meta, con las
credenciales comerciales cargadas. El puntaje de Google se ve en el panel de
Google del dueño. Mientras no estén, **vacío es la respuesta correcta**.

## Presencia digital: la revisión del panel del 18 de agosto de 2026

- **Publicar en las redes de la empresa estaba abierto al público.** El ejecutor
  que manda el posteo a Facebook e Instagram no pide permiso —a propósito, porque
  la tarea programada no tiene sesión—, pero estaba exportado desde un archivo de
  acciones, y **todo lo que se exporta desde ahí queda accesible desde afuera**.
  Se mudó a `src/lib/presencia-digital/publicador.ts`, junto con la cola de
  posteos programados. Ahora lo usan sólo la acción que sí pide permiso y la
  tarea programada. **Por eso vive en `lib` y no en `actions`: no moverlo de
  vuelta.**
- **El monto contratado que se le atribuía a cada red daba siempre cero.** Se
  buscaba el total del presupuesto por un nombre que no existe. El total real es
  el que quedó con descuento y, si no hay, el estimado.
- **El nombre del salón en los textos sugeridos** se buscaba por un campo que no
  existe: quedaba siempre "Salto, Uruguay".
- **La publicación programada no publica sola nada que nadie haya decidido:**
  saca únicamente los posteos que una persona dejó programados con su texto, con
  tope de tres por corrida para que un servidor caído no vacíe la cola de golpe.
- **El gasto de inteligencia artificial de los textos sugeridos está contado**
  (`material-post-evento`) y, sin presupuesto, cae solo a las plantillas
  escritas a mano. Verificado, no es un pendiente.

## Una entrega duplicada que NO se fusiona (18 de agosto de 2026)

La rama `feat/panel-presencia-digital-usable` es **la misma orden del panel de
presencia digital hecha por segunda vez**, por otro camino. Lo que pedía ya entró
por `feat/panel-presencia-digital-completo` (propuesta #1053), verificado y con el
publicador cerrado.

**No se fusiona, y el motivo importa:**

- **Duplica todo con otros nombres:** otra tarea programada, otra biblioteca de
  atribución por red, otros tipos. Fusionarla deja dos de cada cosa.
- **Borra la prueba** `panel-presencia-digital-cuatro-bloques.test.ts` y los tipos
  de atribución que ya están en la versión principal.
- **Saca el aviso de inactividad** de la pantalla, que es uno de los cuatro
  bloques que pedía la orden.
- **Trae otra vez la configuración de Firebase escrita adentro de**
  `public/firebase-messaging-sw.js`. **Es la tercera vez que se cuela.** Ese
  archivo lo genera el compilador y en la versión principal queda el que no hace
  nada.

Si alguien vuelve a encontrar esa rama abierta: se descarta, no se rescata.

## Que la encuentren en Google (18 de agosto de 2026)

- **Pinterest ya reconoce el sitio como de la empresa.** La etiqueta de
  confirmación va en la portada (`src/app/layout.tsx`). **Es pública a propósito**:
  aparece en el código de la página, no es una clave y no da acceso a nada. Con
  eso, cada foto que se sube a Pinterest lleva el enlace al sitio y se ven las
  estadísticas.
- **Las dos fichas de negocio le declaraban a Google cuentas distintas.** La de
  las páginas de venta nombraba una dirección de Instagram que no coincidía con la
  del resto del sitio. Con dos identidades distintas Google no confirma ninguna y
  el resultado de búsqueda sale más chico. Ahora las dos declaran las mismas siete
  cuentas, y hay una prueba que lo controla.
- **Google Analytics ya estaba instalado y midiendo desde antes.** No es un
  pendiente: lo que falta es mostrar esos números adentro del panel, y está pedido
  en la orden. Verificado, no lo vuelvan a reportar como que falta.

## Una sola cuenta de Instagram en toda la app (18 de agosto de 2026)

Había **tres direcciones distintas** de Instagram escritas a mano en la app. El
dueño confirmó que la que usa es **`akproduccionesfiestasyeventos`**; las otras
dos (`akproduccioneseventos` y `ak_producciones_eventos`) quedaron de cuentas
viejas.

Se emparejaron todos los botones y textos que ve el público: la galería de la
web, los avisos de las páginas de venta, la portada, el pie, la conexión que
viene por defecto y el nombre de la marca que se muestra en el muro de la fiesta.

**Por qué importa:** un botón que lleva a una cuenta vieja es una venta que se
pierde sin que nadie se entere, y no se nota mirando la pantalla. Hay una prueba
que controla que ninguna de las dos direcciones viejas vuelva a aparecer.

## La web que figura en el presupuesto (18 de agosto de 2026)

El presupuesto impreso, el PDF que se le manda al cliente y la pantalla del
presupuesto mostraban **`www.akproduccioneseventos.com`**, que no es el sitio de
la empresa. El cliente que la escribía no llegaba a ningún lado, **justo en el
momento en que está mirando el precio y decidiendo**. Ahora figura
`www.akproducciones.uy` en los cuatro lugares, con una prueba que lo controla.

## La tanda del posicionamiento (18 de agosto de 2026)

- **La entrega llegó con marcas de conflicto sin resolver** dentro de un archivo de
  la web pública. No compilaba. Se arregló: se dejó la versión que usa la lista
  única de cuentas oficiales.
- **La tarjeta de la ficha de Google inventaba datos.** Traía un cartel fijo que
  decía "Ficha Verificada en Google", un identificador de Google escrito a mano y
  un enlace de reseñas con un código que nadie pudo confirmar. Es el mismo error
  de los números inventados del panel de redes. Ahora: si no hay puntaje medido lo
  dice, y el enlace para pedir reseñas sale de Ajustes. Hay una prueba que lo
  controla.
- **Los testimonios de las páginas de venta eran inventados y se sacaron.** No es
  una cuestión de estilo: la ley uruguaya de defensa del consumidor prohíbe la
  publicidad falsa **y pone la carga de la prueba en el anunciante**. Si se
  denuncia, hay que demostrar que el cliente y el evento existieron. **No se
  vuelven a poner testimonios que no se puedan probar.**
- **Los accesos de Google Analytics van por configuración del servidor**, nunca en
  un archivo del repositorio. Verificado en esta entrega.
- **Pinterest, X y Threads quedaron en modo "listo para copiar"**, igual que
  TikTok. Publicar automático en X se paga y Pinterest exige aprobación: no es una
  falta, es la decisión correcta.

## Los testimonios de las páginas de venta SON REALES (18 de agosto de 2026)

**No se borran. Confirmado por el dueño.**

En `src/data/event-catalogs/*.ts` hay 22 testimonios con nombre y fecha. Salieron
de **comentarios de Facebook que el dueño tenía guardados en su catálogo impreso**
y se transcribieron al armar la web.

**Qué salió mal:** una auditoría los tomó por relleno y los borró de los seis
catálogos (propuesta 1059). El dueño avisó que eran suyos y se repusieron tal cual
estaban. Quedan anotados acá y en el propio código para que no vuelva a pasar, más
una prueba (`src/__tests__/testimonios-reales.test.ts`) que falla si alguien deja
las listas vacías.

**Por qué se confundieron:** les falta la captura del comentario, que es lo único
que los hace verificables. El campo `screenshotUrl` y el carrusel ya existían;
faltaba la pantalla para subir la imagen, que entró en esta misma tanda.

**Ojo con dos cosas distintas:** los testimonios que el cliente deja después del
evento (con doble aprobación) son otro sistema, ya anotado más arriba. Éstos son
los del catálogo impreso.

## Tope de gasto al traer los comentarios de las redes (18 de agosto de 2026)

El botón "Historial completo" del centro de presencia digital trae años de
comentarios de una sola vez, y **cada comentario se manda a la inteligencia
artificial para clasificarlo, lo que cuesta plata** y se descuenta del tope
mensual del dueño. Tal como venía, un solo toque con miles de comentarios atrás le
gastaba el presupuesto entero del mes de una sentada, sin avisarle nada.

**Qué se hizo:** se revisan como máximo cien comentarios por corrida
(`MAX_REVISIONES_POR_CORRIDA` en `src/lib/social-media/comments-backfill.ts`). Los
que sobran **se guardan igual**, sin revisar, y los toma la corrida siguiente
empezando por los más nuevos. La pantalla ahora dice cuántos quedaron pendientes y
por qué. Si la inteligencia artificial no responde tres veces seguidas, la corrida
se corta sola en vez de seguir gastando.

**Por qué así y no con un cartel de confirmación:** un cartel se acepta sin leer.
El tope protege la plata aunque el botón se toque de apuro.

## Los cinco controles de los comentarios de las redes (18 de agosto de 2026)

La orden pedía cinco pruebas y la entrega no las traía (sólo probaba los
testimonios con captura). Se escribieron en
`src/__tests__/comentarios-redes-sincronizacion.test.ts`, llamando al código de
verdad: que un comentario agresivo **se oculte pero nunca se borre**, que una queja
legítima **no se oculte sola**, que correr dos veces no duplique nada, que si falla
la inteligencia artificial el comentario quede **sin clasificar** en vez de mal
clasificado, y que una red sin configurar no rompa la traída de las otras.

## El título de la portada en Google (18 de agosto de 2026)

El sitio estaba indexado como **"Inicio - AK Producciones"**. Ese renglón es lo
único que ve la persona antes de entrar, y no decía ni que es un salón de fiestas
ni que está en Salto. Salía de un campo de Ajustes con una palabra genérica
cargada.

Ahora, si en Ajustes queda una palabra que no dice nada —inicio, home, portada,
página principal, index—, **se ignora y se usa el nombre de la empresa**. El
control vive en `src/lib/seo/titulo-de-la-portada.ts`, con prueba.

**Verificado en la misma tanda, y no son pendientes:** los datos estructurados del
negocio ya declaran el teléfono y la ciudad; los accesos de Google Analytics van
por configuración del servidor.

## El pedido de reseña filtraba por nota (18 de agosto de 2026)

**La app ya pedía la reseña de Google al cliente** —está en
`src/app/actions/feedback.ts`, con su enlace y su interruptor en Ajustes →
Empresa—. **Eso no era un pendiente: se reportó mal una vez y se llegó a pedir que
se construyera de nuevo. Verificar antes de pedir.**

Pero **se la pedía sólo a los clientes que ponían 9 o 10**. Eso se llama filtrar
reseñas y **Google lo sanciona borrando todas las reseñas del negocio**, no sólo
las filtradas, aunque el pedido sea amable y no se ofrezca nada a cambio.

Ahora se le pide **a todos**, con el mismo enlace. Al que quedó disconforme se le
manda un texto distinto, que primero se hace cargo y avisa que lo van a llamar.
Sigue sin pedirse dos veces por la misma fiesta. Hay una prueba que impide que el
filtro vuelva.

**Y queda anotado el falso positivo que lo desencadenó:** los testimonios de las
páginas de venta **son reales**, transcritos de comentarios que el dueño tenía
guardados. Una auditoría los tomó por relleno y los borró; se repusieron. **No se
vuelven a borrar.** Lo que sí falta es la captura de cada uno, que es lo que los
hace verificables, y para eso ya existe la pantalla para subirlas.

## El enlace de reseñas escrito a mano en la encuesta (18 de agosto de 2026)

La pantalla de gracias de la encuesta traía la dirección de la ficha de Google
**escrita a mano en el código**, en vez de leer la que el dueño carga en Ajustes.

Dos problemas en pantalla: si el dueño cambia el enlace en Ajustes, el botón sigue
mandando al viejo; y si nunca lo cargó, el cliente igual ve el botón y termina en
una ficha que puede no ser la suya.

**Cómo quedó:** el enlace se pide con `getEnlaceDeResenaPublico()`
(`src/app/actions/feedback.ts`), que devuelve **sólo** esa dirección — que de por sí
es pública — y nada más de la ficha de la empresa. Si está vacía, el bloque entero
no se muestra. La prueba ahora exige eso y **prohíbe** que vuelva a aparecer una
dirección de Google escrita a mano en esa pantalla.

**Es la tercera vez que pasa lo mismo** con identificadores de Google escritos a
mano. Por eso la prueba, y no sólo la corrección.

## La entrega de reseñas venía con la anterior adentro (18 de agosto de 2026)

La rama del panel automático estaba hecha sobre una versión principal vieja y
**volvía a traer entera la entrega de comentarios de redes**, en su forma original:
sin el tope de gasto de inteligencia artificial, sin las cinco pruebas y sin los
testimonios repuestos. Fusionarla de una habría borrado las tres cosas sin que se
notara.

**Cómo se reparó:** se fusionó contra la versión principal de ahora resolviendo
seis choques, quedándose con lo nuevo de la entrega y con lo ya corregido de la
anterior. Quedaba además el panel de presencia digital con **la solapa de
comentarios duplicada** — dos copias del mismo bloque en el mismo archivo, que no
compilaba. Se sacó la copia vieja.

**La regla que esto confirma:** una rama se compara siempre contra la versión
principal de ahora, no contra la que tenía cuando se creó.

## Buscar la mesa por el nombre es a propósito (18 de agosto de 2026)

**Falso positivo verificado. No se toca.**

En `/evento/mi-mesa` cualquiera que tenga el identificador de la fiesta puede
escribir tres letras y ver hasta seis nombres de invitados con su número de mesa,
sin cuenta y sin enlace personal (`searchPublicGuestTable` en
`src/app/actions/public-guest-portal.ts`).

**Está bien así**: la pantalla es para que el invitado que llega a la fiesta y
escanea el código encuentre su mesa. Pedirle un enlace personal dejaría afuera
justo a los que no lo recibieron, que son los que más la necesitan. Devuelve
**sólo nombre y número de mesa** — nunca teléfonos, ni platos especiales, ni notas
—, exige tres letras como mínimo y está limitada a dieciocho búsquedas por minuto.

Si se vuelve a reportar como filtración, es falso positivo.

## El asistente de ventas SÍ funciona: había un archivo muerto que confundía (18 de agosto de 2026)

**Falso positivo, y casi se reporta como problema.** Una auditoría encontró
`src/components/asistente-ak/AkAssistant.tsx` sin usar y se concluyó que el
asistente de ventas estaba desenchufado. **No es así.**

Ese archivo eran seis líneas que devolvían nada, con un comentario que decía
"desactivado temporalmente". El asistente de verdad es
`src/components/public/AsistenteVirtual.tsx`, se monta en el armazón general, viene
apagado de fábrica y sólo aparece en las páginas de venta. Funciona.

El archivo muerto se borró, que es lo que hizo falta: mientras existía, cualquiera
que lo abriera concluía lo mismo.

**La lección:** un componente que nadie importa no significa que la función falte.
Antes de decir que algo no está, hay que buscar la función, no el archivo.

## Los cinco componentes que nadie mostraba (18 de agosto de 2026)

Se revisó uno por uno y se resolvió cada caso:

- **`AkDifferenceSection`** (los tres motivos para elegir AK: "disfrutá que
  nosotros nos encargamos", "cero intermediarios", "presupuesto sin sorpresas").
  **Enchufada a la portada.** El armazón ya tenía el hueco reservado y alguien lo
  había dejado vacío. Es buen material de venta y no costaba nada ponerlo.

- **`ConfigFormItem`** (un campo de formulario de ajustes). **Borrado**, no lo
  usaba nadie y no aporta.

- **`CommercialJourneySection`** (el recorrido comercial). **Queda como está, a
  propósito.** El hueco existe en la portada, pero la sección necesita saber de
  dónde vino cada visitante, y ese dato no está disponible cuando la página se
  arma en el servidor. Enchufarla mal mostraría un recorrido equivocado.

- **`CateringSimulator`** y su archivo de acciones `catering-change.actions.ts`.
  **Borrados: eran un duplicado abandonado de algo que ya funciona.** El pedido de
  cambio de cantidad de invitados y el de menú ya están hechos y enchufados, con
  sesión del portal, pantalla del cliente y pantalla del equipo para aceptar o
  rechazar (`submitClientGuestCountChangeRequest` y compañía, en
  `src/app/actions/fiesta/portal.actions.ts`).

  **Y el duplicado era además un agujero:** sus tres funciones eran públicas y
  **ninguna pedía sesión**. `resolveCateringChangeRequest` dejaba que cualquiera de
  afuera aprobara o rechazara pedidos de cambio de cualquier fiesta. No había hecho
  daño porque ninguna pantalla lo usaba, pero el punto de entrada estaba vivo.

  Encima calculaba el menú de los chicos al 70% del de adultos, escrito a mano, sin
  relación con cómo se cotiza de verdad.

- **`ConvertToClientDialog`**. **Borrado: también existía ya.** Pasar un prospecto a
  cliente se hace en Contabilidad → CRM con el botón de confirmar reserva
  (`BookingConfirmationDialog` → `confirmBookingWithContract`), que además toma el
  contrato y la seña, y el alta de prospectos ya controla teléfonos repetidos.

**La lección, otra vez:** dos de los seis parecían funciones que faltaban y las dos
existían con otro nombre. Antes de construir, buscar la función, no el archivo.

## Revisión a fondo con la app andando (18 de agosto de 2026)

Se recorrieron las pantallas públicas en un navegador de verdad, en celular y en
escritorio, además de cuatro auditorías del código por viaje de usuario. **De diez
avisos, siete eran falsa alarma.** Quedan anotados para no volver a gastarlos:

- **`/q` da 404.** Falsa alarma: el código QR real de la fiesta es `/q/<id>`, que
  responde bien. La dirección pelada nunca se usa.
- **La barra fija del celular tapa el formulario** en las páginas de venta. Falsa
  alarma: se midió con el navegador y **ningún campo queda tapado**; el celular
  sube el campo por encima de la barra al tocarlo.
- **"Faltan -1 días" en el planificador.** Falsa alarma: el aviso no se muestra si
  faltan menos de cero días, y 0 y 1 dicen "¡HOY ES EL EVENTO!" y "¡MAÑANA ES EL
  EVENTO!".
- **La fecha del historial de precios no muestra la hora.** Falsa alarma: se probó
  y muestra "18 ago 2026, 15:30".
- **El cliente no puede pedir cambios ni pagar desde su portal.** Falsa alarma, y
  al revés: el enlace que el equipo le manda al cliente es `/portal/c/<clave>`, que
  sí tiene todo. `/portal-cliente/<id>` es la pantalla de demostración que se le
  muestra al prospecto.
- **Nada roto ni feo en el viaje del invitado ni en el del cliente.** Dos
  auditorías completas sin hallazgos.

### Lo que sí era de verdad

- **El botón de las páginas de venta decía "Verificar Disponibilidad" y no
  verificaba nada:** guardaba la consulta y abría WhatsApp. Prometerle al que
  recién llega una respuesta que la pantalla no da es la forma más rápida de perder
  su confianza. Ahora dice **"Consultar por WhatsApp"**, que es lo que pasa.

- **Entrar por el atajo `/blog` deja un error interno.** `/blog` redirige a
  `/public/blog`; entrando derecho no pasa nada, y por el atajo la pantalla **se ve
  igual y completa**, con los siete artículos. No se toca: cambiarlo es más riesgo
  que beneficio, y no hay nada que el visitante note.

### Una decisión que le queda al dueño, no es un error

**El simulador pide nombre y celular antes de mostrar un solo precio.** Es a
propósito: sin teléfono no se puede contestar. Pero el que entra curioso a "ver
cuánto sale" se va sin ver nada. Es una decisión de venta —capturar más contactos
contra dejar mirar— y la toma el dueño, no una auditoría.

## El simulador pide el contacto antes del precio: decisión tomada (18 de agosto de 2026)

**Decisión del dueño. No se vuelve a proponer.**

El simulador de presupuesto exige nombre y celular en el paso 2, antes de mostrar
un solo número. Se le planteó cambiarlo por un precio aproximado primero y el
contacto después, y **dijo que no**: quedarse con el contacto es el objetivo del
simulador.

Si una auditoría lo marca como "el prospecto se va sin ver nada", es falso
positivo.

## Qué hay de la barra de tragos, verificado (18 de agosto de 2026)

Inventario hecho pantalla por pantalla, para no volver a averiguarlo:

- **La pantalla grande de la barra** (`/evento/barra/<fiesta>`) es la que se pone
  en el salón y se toca. La carta **ya se muestra como carrusel**: las tarjetas se
  pasan de costado con el dedo y se acomodan solas al soltar
  (`snap-x snap-mandatory`), con animación al tocarlas. Tiene además solapas por
  categoría, sacar foto con cuenta regresiva de 3, y "sugerirme uno" que hace pasar
  los tragos rápido como una tragamonedas antes de frenar en uno.
- **La pantalla del barman** (`/evento/barra/<fiesta>/barman`) recibe los pedidos y
  los va marcando. **Las estadísticas** están en `/evento/barra/<fiesta>/stats`.
- **El invitado SÍ puede pedir el trago desde su celular**, con su enlace personal
  de invitado. Elige de la carta, confirma, y ve en qué estado está su pedido
  (pedido, preparándose, listo). Puede cancelarlo o cambiar de trago mientras no
  esté listo.
- **El "tótem"** (`/evento/totem/...`) **no tiene nada que ver con los tragos**: es
  la pantalla que pasa las fotos del muro con efectos que siguen la música. Son dos
  cosas distintas.

**El tótem hace las tres cosas que tiene que hacer:** pedir el trago, sacarse foto y
grabar video con él. Verificado en el código: la carta en carrusel, la cuenta
regresiva de tres, la grabación en video con tope de 60 MB, las plantillas de marco
y el envío a la pantalla gigante.

**Lo que se le escapa, y quedó pedido:**

1. **El invitado se va sin su foto.** Sube, sale el cartel "se envió a la pantalla
   gigante", y la pantalla vuelve al inicio. La persona que acaba de posar con su
   trago no se lleva nada. Y el dato ya está: la subida **devuelve la dirección de la
   foto y un texto listo para compartir** con el hashtag y el Instagram de AK, y la
   pantalla lo tira. Con un código en pantalla, esa foto termina en las redes del
   invitado. Es publicidad gratis que hoy muere en el salón.
2. **La foto no guarda con qué trago se sacó.** La función acepta el trago y arma
   sola el texto "Disfrutando de un Mojito en la barra interactiva", pero el tótem no
   se lo manda.
3. **El interruptor de "confirmá que seguís las redes de AK antes de subir" no
   funciona en el tótem:** la pantalla manda siempre que sí, sin preguntar. El dueño
   lo prende y no pasa nada.

**Y en el celular del invitado la carta es una grilla quieta** de dos columnas, con
la foto del trago del tamaño de una estampilla. La pantalla del salón se ve mejor que
la que el invitado tiene en la mano, siendo la que más mira en toda la noche.

## La barra de tragos, terminada de este lado (19 de agosto de 2026)

Dos cosas hechas acá, y tres que quedaron pedidas.

**El video del tótem bajó de 15 a 8 segundos.** Es un saludo con el trago en la
mano, no un video: a los quince segundos la persona ya no sabe qué decir, y el que
lo ve pasar en la pantalla del salón se aburre. La duración vive en una constante
con nombre (`DURACION_VIDEO_SEGUNDOS`) para que no haya que buscar un número suelto.

**La carta de tragos del celular del invitado pasó a ser un carrusel.** Antes era
una grilla quieta de dos columnas con la foto del tamaño de una estampilla: el trago
se leía, no se veía. Ahora son tarjetas grandes con la foto de protagonista, que se
pasan de costado con el dedo y se acomodan solas al soltar, igual que en la pantalla
del salón. Las tarjetas ocupan el 78% del ancho **a propósito**, para que asome la
siguiente: si ocupan todo, el invitado cree que hay un solo trago. El botón de pedir
va abajo y ocupa el ancho entero, para alcanzarlo con el pulgar sin apuntar.

Un trago sin foto cargada **no deja un hueco gris**: se arma una tarjeta con el
color de la fiesta y el ícono grande.

**No se tocó nada de cómo se pide:** confirmar, cancelar, cambiar de trago y el
estado del pedido quedaron igual.

**Decisión del dueño, anotada para no volver a preguntarla:** el tótem de la barra
es **como la fotocabina pero sin impresión**. Lo que se saca va a la pantalla
gigante y queda guardado; nunca se imprime.

## Un pedido se perdió al rotar la orden (19 de agosto de 2026)

**Pasó de verdad y hay que cuidarlo.**

El inventario decía que faltaba que las estaciones (fotocabina, espejo mágico,
plataforma 360) guardaran de quién es cada foto, y que eso estaba "pedido en la
orden vigente". Pero la orden **se reescribió tres veces desde entonces** y el
pedido quedó afuera. Nadie lo iba a hacer nunca, y el inventario seguía diciendo
que estaba pedido.

Se verificó que sigue sin hacerse —en las tres pantallas el identificador del
invitado no aparece— y se repuso en la orden.

**La lección:** cuando el inventario dice "está pedido en la orden vigente" y la
orden se rota, **hay que llevarse el pedido a la orden nueva**. Antes de rotar una
orden, buscá en `docs/QUE-HAY-EN-LA-APP.md` qué apunta a ella.

Mejor todavía: no escribir "está pedido en la orden vigente" sino **describir qué
falta**, así el pedido se puede reponer aunque la orden cambie.

## La invitacion mostraba una vida inventada y hoteles de Buenos Aires (19 de agosto de 2026)

**Es la cuarta vez que aparece contenido inventado con cara de real.** Esta fue la
peor, porque la veian los invitados de todas las fiestas.

Toda invitación digital mostraba dos secciones con contenido escrito a mano en el
código, que **el anfitrión no podía cambiar porque no había dónde cargarlo**:

- **Una historia de vida inventada.** "El Nacimiento — 2011", "Mi Infancia — 2018",
  "Mis 15 Años — 2026". Para una boda, un noviazgo inventado con fechas. Los
  invitados leían la vida de otra persona.
- **Dos hoteles que no existen**, con direcciones de Buenos Aires ("Av. Libertador
  1234", "Calle de las Rosas 567, Palermo") y teléfonos argentinos (+54 11). Un
  invitado de una fiesta en Salto recibía una recomendación de hotel a 500
  kilómetros, en otro país.
- **Y música de prueba.** Sin música cargada, el botoncito de música sonaba una
  canción de piano de un sitio de demostración ajeno (`soundhelix.com`). El
  anfitrión nunca la eligió, y si ese sitio se cae deja de sonar en las
  invitaciones de todos.

**Cómo quedó:** las dos secciones ahora salen **sólo si el anfitrión cargó lo
suyo**, y si no cargó nada no se muestran. Se agregaron los campos `hitos` y
`hospedajes` a la configuración de la invitación para que se puedan cargar. El
reproductor de música **no se muestra** si no hay música propia.

**Vacío es mejor que inventado:** una sección que no aparece no molesta a nadie; una
que miente, sí.

**Falta la pantalla para cargarlos**, que quedó pedida. Hasta entonces las dos
secciones simplemente no salen, que es lo correcto.

## Los textos de venta con números NO son un error (19 de agosto de 2026)

Una auditoría reportó como "datos inventados" los textos "+10 años de experiencia",
"Atención 100% personalizada" y "Respuesta en 24 hs" de la portada y los catálogos.

**No son inventados: son los textos de venta del dueño**, y él sabe si son ciertos.
No se tocan sin que lo pida.

Lo único cierto del aviso es que **están escritos en el código**: si el dueño quiere
decir "15 años" en vez de "10", hoy hay que tocar código. Queda anotado como cosa a
mejorar, no como error.

## Ahora la app no deja entrar contenido inventado (19 de agosto de 2026)

**Cinco veces pasó lo mismo**, así que se dejó de auditar y se puso un control.

`src/__tests__/nada-inventado-en-pantalla.test.ts` recorre todas las pantallas que
ve un cliente, un prospecto o un invitado, y **falla** si encuentra: fotos traídas
al azar de internet, audio o video de sitios de prueba, direcciones de mentira,
lugares o teléfonos de otros países, o texto de relleno.

**Encontró seis que no se habían visto:** las dos plantillas de invitación caían en
`picsum.photos` —una foto CUALQUIERA de internet— cuando no había foto cargada. El
equipo veía una imagen linda y creía que la invitación ya tenía foto. Ahora usan un
degradé suave hecho en el propio archivo, sin pedirle nada a ningún sitio de afuera.

**Si esta prueba falla, la solución NO es sacar el patrón de la lista.** Es dejar el
dato afuera del código: que salga de lo que carga el equipo, y si no hay dato, que
la sección no se muestre.

## Publicar con los datos del ejemplo ya no se puede (19 de agosto de 2026)

El control que corre antes de compartir la invitación miraba que los campos
**estuvieran llenos**, no que fueran de verdad. Así que "Catedral de San Juan,
Calle Falsa 123, Ciudad" —la boda de ejemplo con la que arranca el editor— pasaba
sin problema, y la invitación podía salir con una calle que no existe.

Ahora también revisa que el salón, la dirección y el lugar de la ceremonia **no
sean los del ejemplo**, y si lo son avisa cuál quedó sin cambiar
(`src/lib/invitacion/datos-minimos.ts`).

La boda de ejemplo del editor ("María y Juan", `#BodaJuanYMaria`, Salón El Paraíso)
**se deja como está**: es el punto de partida para que el equipo no arranque de una
pantalla en blanco. Lo que se arregló es que no pueda llegar publicada.

## El buzón de saludos ya tiene puerta (19 de agosto de 2026)

El buzón donde el invitado le deja un saludo grabado a los dueños de la fiesta
existía y funcionaba, pero **al invitado no había por dónde llegar**: sólo se
entraba por un enlace que abría el equipo desde su propia pantalla. Un buzón sin
puerta es un buzón que nadie usa.

Ahora está en el portal del invitado, al lado del muro y la galería, como **"Dejar
un saludo"**. Respeta el interruptor: si la fiesta no contrató el buzón, la opción
no aparece.

**Falta todavía** que se pueda dejar el saludo con una foto: hoy están grabar video
—que corta a los 15 segundos, y está bien así porque es un saludo, no un brindis— y
grabar audio. Queda pedido.

## Pantallas hechas a las que no se llegaba (19 de agosto de 2026)

Se revisaron **las veinticinco pantallas de la fiesta** contando desde cuántos
lugares se enlaza cada una. Dos tenían cero:

- **El moderador móvil** (`/evento/moderacion/<fiesta>`): la pantalla para aprobar
  o esconder fotos **desde el celular, caminando por la fiesta**. Estaba hecha
  entera y había que escribir la dirección a mano para entrar. **Ya está enchufada**
  en la pantalla del muro del equipo, como "Moderar desde el celular", al lado de
  "Pantalla en vivo". (Aprobar desde el panel de escritorio ya se podía, así que
  ninguna foto quedaba trabada: lo que faltaba era hacerlo desde el celular.)

- **La estación de impresión** (`/evento/impresion/<fiesta>`): la pantalla donde el
  que maneja la impresora ve las fotos aprobadas y va marcando cuál salió. **Ya está
  enchufada.** El dueño confirmó dónde se imprime: **en la fotocabina, en la
  plataforma 360 y en el 360 con inteligencia artificial**. La barra no imprime —
  ahí la foto va a la pantalla grande y el invitado se la lleva en el celular.

  El botón "Cola de Impresión" aparece en Fiestas → Entretenimiento, al lado de
  "Consola Operador", **sólo en esas tres estaciones**. Hay prueba que lo cuida
  (`src/__tests__/cola-de-impresion.test.ts`): si mañana alguien agrega una estación
  que imprime, se agrega a la lista y la prueba lo confirma.

**El método sirve y conviene repetirlo:** contar desde cuántos lugares se enlaza
cada pantalla encuentra en un minuto lo que una auditoría de código no ve, porque el
código está bien — lo que falta es la puerta.

## Los impresos de las mesas salían con el nombre y la fecha de mentira (19 de agosto de 2026)

**Éste llegaba impreso a la mesa, delante de los invitados.**

Los números de mesa, el menú de mesa y la carta de tragos arrancaban con
`protagonistaNombre: "La Agasajada"`, `fechaEvento: "01/01/2025"` y una foto de
fondo traída al azar de internet.

El código para poner el nombre y la fecha **reales** de la fiesta existía y estaba
bien escrito: `if (!mergedData.protagonistaNombre) mergedData.protagonistaNombre =
fiestaData.configuracion.protagonista1Nombre`. Pero **nunca se ejecutaba**, porque
el campo jamás estaba vacío: el ejemplo ya ocupaba el lugar.

Resultado: se imprimían con "La Agasajada" y "01/01/2025" salvo que alguien los
escribiera a mano.

**Cómo quedó:** los tres arrancan **vacíos**, y así el relleno con los datos de la
fiesta funciona como estaba pensado. Con prueba
(`src/__tests__/impresos-con-los-datos-reales.test.ts`).

**Y había un cuarto caso, encontrado en el inventario del 19 de agosto:**
`numeroPrincipal: 'Mis XV'` en la carta de tragos. En una **boda**, la carta impresa
decía **"Mis XV"**: el código que pone "Nuestra Boda" según el tipo de fiesta
preguntaba si el campo estaba vacío, y nunca lo estaba. Corregido igual, y la prueba
ahora lo cubre.

**La lección, que vale para toda la app:** un valor de ejemplo puesto como defecto
**desactiva el código que pondría el dato real**, porque ese código casi siempre
pregunta "¿está vacío?". Un defecto de relleno no es sólo feo: rompe en silencio el
mecanismo que lo iba a reemplazar.

**Dónde más mirar si aparece de nuevo:** todos los rellenos de este tipo viven como
`if (!mergedX.campo)` en las pantallas de `fiestas/nueva/`. Se listan con una
búsqueda de `if (!merged` y se compara cada campo contra su valor por defecto en
`src/lib/fiesta-defaults.ts`. Si el defecto no está vacío, el relleno está muerto.

## Tres controles automáticos que hacen la auditoría sola (19 de agosto de 2026)

**Los dos hallazgos reales del día no salieron de leer código: salieron de contar.**
Los ayudantes opinando dieron 70% de falsas alarmas; las cuentas mecánicas dieron
100% de aciertos. Así que las cuentas quedaron convertidas en pruebas.

1. **`auditoria-defectos-tapados.test.ts`** — junta todos los campos que alguna
   pantalla intenta rellenar con el dato real de la fiesta (`if (!algo.campo)`) y
   verifica que el valor por defecto esté vacío. Si alguien pone un ejemplo, falla
   acá y no en una mesa impresa. **Probado a propósito:** se le volvió a meter
   `numeroPrincipal: 'Mis XV'` y lo agarró al instante, nombrándolo.

   Ojo con la distinción que lo hace útil: los rellenos con valor fijo
   (`fontFamily = 'Playfair Display'`) son inofensivos y no se cuentan; sólo importan
   los que van a buscar el dato a la fiesta.

2. **`auditoria-pantallas-sin-puerta.test.ts`** — cuenta desde cuántos lugares se
   enlaza cada pantalla del evento. Encuentra lo que ninguna auditoría de código ve,
   porque el código está bien: lo que falta es el enlace. Ya aparecieron cuatro así.
   Las que se abren por QR o por enlace del equipo van declaradas con su motivo.

3. **`auditoria-puertas-abiertas.test.ts`** — lista las funciones de servidor que no
   comprueban quién las llama. **Encontró una real:** `updateFiestaDate` estaba
   abierta, así que cualquiera que supiera el número de una fiesta podía cambiarle
   la fecha sin tener cuenta. Se cerró, junto con las tres lecturas de la agenda,
   que exponían el calendario entero y las reuniones con clientes.

### Cómo funciona el tercero, que es distinto

Quedan **255 funciones en 99 archivos sin revisar una por una**, congeladas en
`src/__tests__/puertas-pendientes-de-revisar.json`. No significa que estén mal: la
mayoría son de leer y varias se protegen de formas que el control no reconoce.
Significa que nadie las miró con esta lupa.

**Desde hoy, cualquier función NUEVA que quede abierta hace fallar la prueba.** La
lista vieja se vacía de a poco y **no se agranda nunca**. Cuando se revisa una y se
protege, se saca del archivo y se baja el número del tope.

**Lo que NO hay que hacer si falla:** agregarla al archivo de pendientes. Ese archivo
sólo se achica.

### Falsas alarmas del control, ya contempladas

- **Los atajos que sólo delegan** (`export async function X() { return Modulo.X(); }`)
  no se cuentan: la comprobación está en la función de destino. Así se protege
  `deleteAllFiestas`, que sí pide sesión de administrador.
- **El cambio de contraseña** se protege pidiendo la contraseña actual, no una
  sesión. Vale igual.

## Triaje de las puertas abiertas: once cerradas (19 de agosto de 2026)

Tres ayudantes revisaron las 255 funciones congeladas, un tercio cada uno. **De todo
lo que reportaron, verificado a mano una por una, resultaron reales cuatro cosas** —
el resto era protección que el control no sabía reconocer.

### Lo que se cerró

- **`updateFiestaDate`** — cambiar la fecha de una fiesta no pedía cuenta. Cualquiera
  que supiera el número de una fiesta podía moverle la fecha desde afuera.
- **`getCalendarEvents`, `getAppointments`, `getOcupiedDates`** — dejaban ver el
  calendario entero, con todas las fiestas y las reuniones con los clientes.
- **`deleteDocumento`** — el caso más sutil del día. Parecía protegida porque el
  guardado final sí pide permiso. Pero **el archivo se borra del almacenamiento
  ANTES de ese guardado**: un desconocido borraba el contrato o la factura de verdad,
  el guardado le fallaba después, y quedaba la ficha apuntando a un archivo que ya no
  existe. Subir un documento sí pedía permiso; borrarlo, no.
- **Nueve funciones de multiagente** — escribían aprendizaje, tareas y avisos sin
  comprobar nada, aunque sus pantallas están detrás del ingreso.
- **`saveSimuladorV2Lead`** — pública a propósito, pero **sin freno**: un robot podía
  llenar el CRM de presupuestos falsos hasta volverlo inservible. Ahora tiene el
  mismo freno que el formulario de la portada: cuatro por hora y por teléfono.

### Las falsas alarmas, para no volver a gastarlas

- **`deleteAllFiestas` y `resetAllActiveFiestas`** parecían abiertas: delegan en
  funciones que sí piden sesión de administrador.
- **`clearSessionCookie`** borra **tu propia** cookie: es el "cerrar sesión". No
  puede afectar a nadie más.
- **`addPagoClienteFromPortal`** está bien diseñada: el cliente **informa** un pago,
  no lo da por cobrado —queda pendiente de confirmación— y valida que no supere el
  total.
- **El cambio de contraseña** se protege pidiendo la contraseña actual.

**El tramo de los primeros 33 archivos no tenía ninguna para cerrar.**

**Quedan 247 pendientes de revisar** (eran 255). La lista sólo se achica.

## Cómo es el impreso de verdad de AK (19 de agosto de 2026)

**Dato del dueño, con foto del impreso real.** Sirve para no volver a averiguarlo:

- Papel de **10 x 15 cm**, vertical.
- **Tres fotos**: una grande arriba a lo ancho, y dos chicas abajo lado a lado.
- Abajo, el **nombre del homenajeado en letra manuscrita grande** y el motivo más
  chico ("mis 15 años").
- **Logo de AK abajo a la izquierda**, sobre **fondo decorado** que combina con la
  fiesta, no sobre blanco.
**Cuántas fotos lleva cada estación** (corregido por el dueño el 19 de agosto,
después de una primera versión equivocada):

- **La fotocabina: TRES fotos** — una grande arriba y dos chicas abajo lado a lado.
- **El espejo mágico: UNA sola foto.** Mismo papel de 10x15 y misma
  personalización, pero una sola.
- **El 360 con inteligencia artificial: UNA sola foto**, igual que el espejo.
- **La plataforma 360** también imprime.
- **La barra NO imprime**: ahí la foto va a la pantalla grande y el invitado se la
  lleva en el celular.

**Qué coincide y qué no con lo que arma la aplicación hoy:**

- **El tamaño está bien**: `src/lib/entretenimiento/tira-fotocabina.ts` arma
  1200x1800, que es exactamente 10x15. **No se toca.**
- **El reparto no**: hoy apila tres fotos iguales sobre fondo blanco, con el nombre
  del evento y la fecha en letra común.
- **El espejo mágico saca una sola foto** y la manda a imprimir directo, no arma la
  hoja de tres.

Queda pedido en el bloque 8 de la orden vigente.

## Las fotos de las estaciones ya tienen dueño (20 de agosto de 2026)

Este pedido **se había perdido una vez** al rotar la orden y hubo que reponerlo. Ya
está hecho.

La fotocabina, el espejo mágico, la plataforma 360 y el 360 con inteligencia
artificial reciben el enlace personal del invitado y lo mandan junto con la foto.
Antes, el invitado se sacaba la foto en la fotocabina, después entraba a buscar sus
recuerdos y no estaba: las mejores fotos de la noche eran justo las que se perdían.

**La regla se respetó, verificada línea por línea:** el identificador solo no prueba
nada. El dueño se guarda **únicamente si el comprobante del invitado es válido**
(`hasPublicGuestAccess`); si no lo es, la foto se sube igual pero sin dueño. Así
nadie puede mandar el identificador de otro y adueñarse de sus fotos.

**Una punta suelta que se ató al fusionar:** la lista interna de la estación guardaba
el identificador tal como llegó, sin comprobar, mientras el muro guardaba el
comprobado. No era grave —el recuerdo del invitado sale del muro— pero el mismo dato
quedaba comprobado en un lado y sin comprobar en el otro, que es como empiezan los
errores raros. Ahora los dos toman el valor comprobado.

## El anfitrión ya carga su historia y sus hoteles (20 de agosto de 2026)

Cierra lo que había quedado abierto cuando se sacaron la historia de vida inventada y
los hoteles de Buenos Aires: ahora hay dónde cargar los propios.

**Con el cuidado que pedía la orden:** los ejemplos van como **texto gris dentro del
campo vacío** ("Hotel Salto", "25 de Agosto 5" — direcciones de Salto), nunca como
dato cargado, y las filas nuevas nacen vacías. Si el anfitrión no carga nada, la
sección no aparece en la invitación.

## La ficha de Google ya está verificada (20 de agosto de 2026)

**Confirmado por el dueño.** La cuenta de la ficha de Google está verificada y el
enlace de reseñas lo pasó él.

**No se le vuelve a pedir** que la reclame ni que confirme el enlace. Si alguna
auditoría o alguna hoja vieja lo lista como pendiente, está desactualizada.

**Lo que esto NO resuelve todavía:** que la aplicación pueda **leer** el puntaje y la
cantidad de reseñas para mostrarlos en el panel y encender el aviso de menos de 4
estrellas. Tener la ficha verificada es el paso previo, pero leer esos números
necesita además acceso a los datos de Google Business Profile, igual que las visitas
de la web necesitan las credenciales de Analytics. Hasta que eso exista, el puntaje
queda sin dato y el aviso apagado, que es lo correcto: **nunca inventar un número**.

## El enlace de reseñas de Google es el correcto (20 de agosto de 2026)

**Confirmado por el dueño: lo pasó él.** No se vuelve a preguntar ni a pedir que lo
verifique.

**El enlace es `https://g.page/r/CUagrfscj_5yEAE/review`.** El dueño lo volvió a
pasar el 20 de agosto y coincide exactamente con el que está cargado.

Se había pedido confirmarlo porque **desde el contenedor no se puede abrir una
dirección de Google** (la conexión las bloquea), no porque hubiera algo mal. Esa
comprobación sólo la puede hacer él, y ya está hecha.

Como su ficha está verificada, **ese enlace no cambia**: queda para siempre.

Vive en `src/lib/public-contact.ts`, que es donde el proyecto guarda las cuentas
oficiales, y la pantalla de la encuesta lo lee de Ajustes.

## El botón que lleva a la ficha llevaba a una búsqueda (20 de agosto de 2026)

**Estaba mal y se arregló.** En la solapa "Ficha de Google" del centro de presencia
digital, el botón de abajo decía "Abrir en Google Maps" y no llevaba a la ficha de
AK: llevaba a una **búsqueda** de Google armada con el nombre de la empresa. Ahí
aparece una lista de resultados donde puede figurar cualquiera, incluida la
competencia. Además, ese mismo enlace era el que se usaba de respaldo para pedir
reseñas cuando todavía no hay enlace cargado en Ajustes: un cliente al que se le
pedía una reseña podía terminar dejándosela a otro.

**El dueño pasó el enlace real de su ficha el 20 de agosto:
`https://share.google/isy4SniannZd1Fdv5`.** Es el que quedó cargado, y el botón
ahora dice "Ver mi ficha en Google".

Por qué se eligió así: el enlace estaba **inventado** por la aplicación (armado con
el nombre, no dado por Google), que es exactamente lo que la regla de "nada
inventado en pantalla" prohíbe. Como la ficha está verificada, este enlace tampoco
cambia más.

Vive en el mismo archivo de cuentas oficiales.

## Se cerraron las puertas abiertas a internet (20 de agosto de 2026)

De las 247 funciones de servidor que estaban sin revisar una por una, **quedan 84**.
Cómo se hizo, para que no se repita el trabajo: se calculó, siguiendo el código, qué
funciones puede llegar a tocar una pantalla que se abre **sin cuenta**. Las 150 que
ninguna pantalla pública alcanza se cerraron de una vez. Las que sí, se miraron a
mano.

### Lo que estaba de verdad mal

- **El permiso para publicar en Facebook e Instagram viajaba a cada invitado.** La
  pantalla de la invitación, el muro en vivo y la página del evento pedían "las redes
  de AK" para mostrar los botones de seguir, y esa lista venía con el permiso de
  publicación adentro. Como esas pantallas son públicas, el permiso quedaba a la
  vista en el código de la página, en el celular de cada invitado de cada fiesta. Con
  eso, cualquiera podía publicar en las cuentas de la empresa. Ahora esas pantallas
  usan una versión que trae sólo el nombre, el enlace y el logo.
- **La lista completa de fiestas se podía pedir sin cuenta.** Con el cliente, su
  teléfono, el presupuesto y los invitados de cada una. Ahora pide cuenta. Las
  pantallas que un desconocido sí tiene que poder abrir y que necesitan mirar las
  fiestas —el simulador, para decir si una fecha está libre, y el portal del cliente,
  que entra con su clave— usan una lectura interna que **no es una dirección de
  internet**.
- **La página de Video de Vida listaba las próximas fiestas a cualquiera.** El índice
  mostraba nombre del homenajeado y fecha, y enlazaba a pantallas internas. Estaba
  abierto de rebote, porque `/video-vida` tiene que ser público para que el cliente
  suba sus fotos. **Eso no se tocó**: la subida del cliente sigue igual que siempre.
  Lo que se cerró es sólo el índice.
- **Salían datos del negocio en pantallas de venta.** Los menús iban con la receta de
  cada plato, lo que cuesta cada ingrediente y el margen de ganancia; los servicios,
  con el costo y el proveedor; los salones, con el WhatsApp y el correo del gerente;
  los roles, con el sueldo por evento; los empleados, con cédula y teléfono. Ahora
  cada una de esas pantallas recibe **sólo lo que se ve**: nombre, foto y precio de
  venta. La versión completa pide cuenta.
- **El asistente multiagente se podía usar de costado.** La pantalla pedía sesión,
  pero la función de atrás no: se la podía llamar directo y gastarnos la inteligencia
  artificial pedido tras pedido.

### Dos cosas que NO se tocaron, a propósito

- **El arranque del primer administrador no puede pedir cuenta**, porque lo llama el
  propio ingreso cuando todavía no existe ninguna. Quedó declarado como público a
  propósito, con el motivo escrito.
- **`saveFiesta` ya estaba protegida** de una forma que el control no reconocía: deja
  pasar al equipo o al cliente con la clave de su propia fiesta. Casi todas las
  escrituras de una fiesta pasan por ahí. Se le enseñó al control a reconocerla, en
  vez de agregar una comprobación encima.

### El error que casi se cuela, y cómo se agarró

Cerrar 150 puertas de una vez tuvo un efecto de rebote: **algunas funciones públicas
llamaban a otras del mismo archivo que quedaron cerradas**. El cálculo de "quién
llega hasta acá" miraba los otros archivos y salteaba el propio, así que esas no se
vieron.

Lo que se rompía, y quedó arreglado:

- **La promo de la portada desaparecía.** La portada pide la promo activa, y esa
  función leía la lista de promociones, que había quedado cerrada.
- **El enlace corto de la invitación y la pantalla de mesas de la fiesta en curso**
  dejaban de encontrar la fiesta.
- **El cliente no podía avisar desde su portal que iba en camino.**
- **El copiloto del simulador se quedaba sin sus textos** y contestaba con los de
  fábrica.

Cómo se agarró: comparando la portada compilada contra la versión principal. Antes
se armaba una sola vez y quedaba guardada; después de los cambios se rearmaba en
cada visita, que es la señal de que algo adentro estaba pidiendo la sesión. Vale la
pena recordarlo: **si una pantalla pública pasa de "armada una vez" a "armada en
cada visita", casi siempre es que le metieron un control de sesión sin querer.**

### Por qué el control ahora acepta declarar una función suelta

Antes sólo se podía declarar "todo este archivo es público". Eso obligaba a abrir de
más: en el archivo de ingreso hay funciones del equipo y también el arranque del
primer administrador. Ahora se puede declarar **una sola función**, con su motivo.

## Los dos chats de inteligencia artificial no tenían freno (20 de agosto de 2026)

**Es plata.** El chat del simulador (el que le arma el presupuesto al prospecto) y el
asistente del invitado en la fiesta le preguntan a la inteligencia artificial, y eso
**se paga por pedido**. Los dos estaban abiertos a internet sin ningún tope: un
programa automático podía dejarlos preguntando toda la noche y vaciar la cuenta.

Ahora tienen freno, como ya lo tenían la fotocabina con IA, el espejo mágico y el
asistente virtual:

- **Simulador:** 30 mensajes cada 15 minutos, contados por el contacto que dejó el
  prospecto. Si se pasa, le dice que vaya más despacio y le ofrece el WhatsApp.
- **Asistente del invitado:** 120 mensajes cada 15 minutos por fiesta. El número es
  alto a propósito, porque en una fiesta hay muchos invitados preguntando a la vez y
  **no puede cortarse en el medio de un evento**.

Por qué se cuenta así y no por persona: desde el celular de un invitado no hay nada
que lo identifique, así que lo único que se puede contar es la fiesta.

## Los frenos contra robots, y la plata de los chats (20 de agosto de 2026)

Los dos chats de inteligencia artificial que usa gente de afuera —el del
simulador y el de la fiesta— **estaban abiertos sin tope y sin contador**. Cada
pregunta se paga: un programa automático los podía dejar preguntando toda la
noche. Ahora:

- **Freno por celular** en los dos, y **techo por fiesta** en el de la fiesta.
- **Los dos pasan por el contador de gasto.** Si no hay presupuesto contestan
  igual, con las respuestas escritas a mano.

**Dos errores que se corrigieron en el mismo pase, y que ya habían pasado antes:**

- **El freno del simulador contaba por el nombre o el contacto que escribía el
  prospecto.** Un robot cambia el nombre en cada pedido y el freno no frenaba
  nada. **Nunca contar por un dato que escribe el visitante.**
- **Los techos "por fiesta" del espejo mágico y del 360 no eran por fiesta:** la
  cuenta incluía la dirección de quien llamaba, así que cien celulares distintos
  pidiendo una vez cada uno pasaban igual. Se agregó `ignoreClientAddress` al
  freno para poder poner un techo compartido de verdad.

Hay una prueba (`los-frenos-contra-robots.test.ts`) que controla las tres cosas.

**Sobre los errores de robots que muestra Firebase: son normales y no se
investigan.** Cualquier sitio en internet recibe programas automáticos buscando
la puerta abierta todo el día; que aparezcan esos errores es la señal de que los
está rechazando. Lo que sí importa es que nada de lo que se paga quede sin freno.

## Las páginas que venden no nombraban Salto (20 de agosto de 2026)

El dueño avisó que la web **no aparece** en las búsquedas. Dos causas concretas,
las dos arregladas:

- **Casamientos, quince y cumpleaños decían "Uruguay" y nunca "Salto"**, ni en el
  título ni en la descripción. Eso es lo único que ve la persona en el buscador y
  lo que define si aparecemos cuando alguien busca desde Salto. El negocio trabaja
  en una sola ciudad: no nombrarla es regalar la búsqueda. Los tres títulos ahora
  la llevan, y la descripción arranca por lo que se ofrece, no por adjetivos.
- **De las seis notas del blog, Google conocía tres.** La lista se escribía a mano
  y se desincronizó. Faltaba, entre otras, **la única que habla de Salto**. Ahora
  la lista sale de `src/data/blog-posts.ts`, así que agregar una nota la publica
  sola.

Hay una prueba (`las-paginas-que-venden-dicen-salto.test.ts`) que controla que los
tres títulos nombren Salto, que entren en el largo que muestra Google, y que
ninguna nota del blog quede afuera.

**Verificado en el mismo pase, y no son pendientes:** no hay ningún `noindex` en
la app, y la lista de páginas permitidas está bien armada (cerrada por defecto).

## Las notas del blog no se abrian, y el mapa no las conocia (20 de agosto de 2026)

Tres cosas rotas alrededor del blog, encontradas al revisar por que la web no
aparece:

- **El archivo con las notas guardadas estaba mal escrito** y no se podia leer:
  faltaban las comillas en una clave (`data/blog-posts.json`). Con eso, en local
  no habia blog.
- **Abrir una nota escrita a mano daba "no encontrada".** El listado mostraba las
  dos fuentes —las que escribe la inteligencia artificial, que van a la base, y
  las seis del codigo— pero abrir una sola miraba unicamente la base. En cuanto la
  base tuvo una nota adentro, las seis del codigo quedaron rotas, con sus
  direcciones ya publicadas y en el mapa que lee Google. Ahora busca en las dos.
- **El mapa para Google no incluia ninguna nota nueva** y el permiso tampoco: la
  lista era fija y las notas generadas se guardan en la base. Ahora el mapa junta
  las dos fuentes y el permiso abre `/public/blog/` entero.

## Cuatro tareas automáticas que nunca corrieron (20 de agosto de 2026)

**El hallazgo más importante de la sesión, y el que explica el resto.** La app
tiene cuatro tareas que promete hacer sola, y **ninguna tenía quién la disparara**:
el blog, el guardado diario de los números de las redes, la publicación de los
posteos programados y los recordatorios de cuota vencida. Las cuatro compilaban,
tenían pruebas en verde, y no habían corrido nunca. No hay `vercel.json`, ni
programación en `apphosting.yaml`, ni GitHub Actions, ni Cloud Scheduler.

**Por qué las auditorías no lo agarraron, que es lo que hay que corregir:**
preguntaban **"¿está programado?"** y la respuesta era sí. Nunca preguntaron
**"¿esto pasó alguna vez?"**. Las pruebas prueban el código, no el resultado: una
tarea que nadie dispara pasa todas las pruebas del mundo.

**Lo que se hizo:** `src/lib/automatico/tareas-automaticas.ts` declara las cuatro,
con el nombre en criollo y qué se pierde si no corre. Cada una deja su marca al
terminar bien, y `estadoDeLasTareas()` responde "nunca", "atrasada" o "al día".
Una prueba recorre `src/app/api/cron/` y **falla si aparece una tarea que no esté
declarada o que no deje constancia**.

**Lo que el código no puede resolver solo:** que se disparen. Eso se prende una vez
por fuera. Mientras no esté, la lista va a decir "nunca corrió", que es la
respuesta honesta.

**El generador de notas, además:** estaba puesto para **una nota cada siete días**,
cuando lo pedido eran tres por semana. Ahora genera las tres juntas y pasa por el
contador de gasto, que tampoco tenía.

**Y las fotos de las notas ya no se inventan.** Se elige una foto real del catálogo
de trabajos, con un texto alternativo que describe lo que se ve. Una foto real de
la barra montada en Salto muestra algo que se puede contratar; una imagen generada
no muestra nada, y era la parte cara de la nota.

## La cola sin señal se borraba entre pantallas (20 de agosto de 2026)

Primer hallazgo del método nuevo, y es de los caros.

**La cola del celular es una sola y la comparten tres pantallas**: la barra, la
recepción y el muro. **Cada una la vaciaba entera**, y para lo que no sabía mandar
devolvía "enviado". Como el éxito borra el elemento, **una pantalla borraba los
pedidos de otra sin mandarlos**. El muro era el peor: su enviador no enviaba nada
y daba todo por enviado.

En una fiesta con mala señal eso era: el invitado pide un trago, lee "se envía
solo", abre el muro para ver las fotos, y **el pedido desaparece**. No se entera
nadie, ni el invitado ni la barra.

Ahora `flushOfflineQueue` recibe `types` y cada pantalla toca únicamente lo suyo.
El muro no encola nada, así que dejó de vaciar la cola. Hay una prueba que
controla las tres pantallas y que ninguna vuelva a dar por enviado lo que no sabe
mandar.

**Y una promesa que no se cumplía:** el portal del cliente decía que su lista de
música *"se sincroniza en tiempo real con el DJ"*. La lista se guarda pero **la
pantalla del DJ nunca la lee**. Se corrigió el texto a lo que pasa de verdad, y
que el DJ la vea quedó pedido en la orden. **No se deja una promesa en pantalla
sin alguien que la cumpla.**

## Cuáles tareas se disparan y cuáles no: el dato exacto (20 de agosto de 2026)

**Corrección de un dato que se dijo mal y hay que dejar claro.** Se afirmó que las
cuatro tareas automáticas no las dispara nadie. **Son tres, no cuatro.**

- **El blog, la sincronización de Instagram y el recontacto SÍ tienen disparador.**
  `MarketingAutomationTrigger`, montado en `src/components/app-shell.tsx`, llama a
  `/api/marketing/automation` a los ocho segundos de que alguien abre la app
  interna, como mucho una vez cada media hora por navegador. **Con dos
  condiciones:** que quien entre tenga perfil de administrador, y que el equipo
  entre. Si nadie abre la app en toda la semana, no corre.
- **Las otras tres no tienen absolutamente nada que las llame:** los números de las
  redes, la publicación de posteos programados y los recordatorios de cuota
  vencida. Ninguna referencia en el código, ni configuración de tareas programadas
  en ningún archivo.

**Lo que hay que recordar:** que una tarea dependa de que una persona abra una
pantalla **no es lo mismo que estar automatizada**, pero tampoco es lo mismo que
no correr nunca. Al inventariar, la respuesta correcta tiene tres estados: *la
dispara algo*, *sólo si alguien abre la app*, *nadie*.

**Y el número que ordena todo:** hay **24 cosas pensadas para pasar solas**. Tres
sin disparador, siete que viajan con la automatización de marketing, y catorce que
son refrescos de pantalla y sólo corren con la pantalla abierta, que es lo
correcto.

## El chat de la fiesta le inventaba datos al invitado (20 de agosto de 2026)

Hallazgo de la pasada "¿muestra datos inventados?", y es de fiesta.

Cuando la fiesta no tenía un dato cargado, **el chat lo completaba solo y lo decía
con total seguridad**, al invitado, la misma noche:

- Sin hora cargada: *"empezamos puntual a las 21:00 hs"*.
- Sin salón cargado: *"te esperamos en el Salón Principal"*.
- Sin código de vestimenta: *"Elegante Sport"*.

**Y estaba en los dos caminos**: en la respuesta de reserva y también en lo que se
le cuenta a la inteligencia artificial, que es peor, porque el modelo lo repite
con más seguridad todavía.

Un invitado que llega a las 21:00 a una fiesta que empieza a las 22:00 se come una
hora en la puerta. El que se viste elegante sport en una de etiqueta pasa
vergüenza. Y el que va al salón equivocado no llega.

Ahora, si el dato no está, **se dice que no está** y se manda a mirar la
invitación o a preguntarle al anfitrión. A la inteligencia artificial se le pasa
"NO CARGADO" y la instrucción de no inventarlo. Hay una prueba que controla los
dos caminos.

**Falso positivo verificado en la misma pasada:** los testimonios de las páginas de
venta volvieron a reportarse como inventados. **Son reales**, el dueño ya lo
confirmó. No se vuelven a tocar.

## Los robots se cortan en la puerta (20 de agosto de 2026)

Todo el día llegan programas automáticos probando direcciones de otros sistemas:
`/wp-admin`, `/phpmyadmin`, `/.env`, `/backup.sql`. **Ninguna existe en esta
aplicación**, pero cada intento entraba igual, terminaba en la pantalla de ingreso y
quedaba anotado como error. Eso tapaba los errores de verdad: entre cien avisos de
robots, el aviso que importaba no se veía.

Ahora se les contesta "no existe" antes de hacer nada. La lista vive en
`src/lib/auth/rutas-de-robots.ts`.

**El riesgo de esta lista es bloquear de más**, y eso sería peor que el robot: dejaría
al cliente o al invitado mirando un "no existe" en plena fiesta. Por eso hay una
prueba que revisa las dos puntas: que los pedidos de robot se corten, y que **ninguna
pantalla real quede afuera** — se comprueba contra la lista oficial de pantallas
públicas, así que si mañana se agrega una, la prueba avisa sola.

**Lo que NO hace, para no prometer de más:** medido en la versión compilada, cortar
al robot en la puerta no hace que la aplicación ande más rápido — un pedido de robot
costaba cuatro milésimas de segundo y sigue costando lo mismo. Lo que se gana es que
el registro de errores queda limpio y que la pantalla de ingreso deja de quedar
expuesta a quien la anda buscando.

## Cuánto tarda la aplicación de verdad (20 de agosto de 2026)

Medido sobre la versión compilada, no sobre la de desarrollo. Cada pantalla, con el
servidor ya despierto:

| Pantalla | Tarda |
|---|---|
| Portada | 13 milésimas |
| Bodas / Quince | 8 a 9 milésimas |
| Simulador de presupuesto | 5 milésimas |
| Presentación LED | 5 milésimas |
| Catálogo por tipo de fiesta | 25 milésimas |
| Ingreso | 6 milésimas |

**La aplicación no es lenta.** Si se la nota lenta en vivo, no es el código.

**Dónde está la causa probable:** en `apphosting.yaml`, `minInstances: 0`. Eso
significa que **cuando pasa un rato sin visitas el servidor se apaga entero**, y el
primero que entra tiene que esperar a que arranque de nuevo una aplicación con más de
250 pantallas. Los que entran después lo ven rápido.

### DECISIÓN TOMADA: se queda dormido. No volver a proponerlo.

**El dueño decidió el 20 de agosto de 2026 que NO se toca la configuración del
servidor**, porque ponerlo siempre despierto se paga todos los meses. Se llegó a
cambiar `minInstances` a `1` y `memoryMiB` a `1024`, y **se dejó todo como estaba**.

Si una auditoría futura marca `minInstances: 0` como problema, **es un falso
positivo**: está así a propósito.

### Y la buena noticia, que hace que la decisión sea barata

Mirando cómo se sirve cada pantalla, resulta que **el que espera no es el cliente
nuevo**:

- **La portada y todas las páginas de venta** (bodas, quince, cumpleaños, Club
  Uruguay, el simulador, la presentación LED) **ya salen armadas de antes**. No
  esperan al servidor: el prospecto que llega desde Google o desde un enlace de
  WhatsApp entra al instante aunque el servidor esté dormido.
- **Las que sí esperan** son las que dependen de una fiesta concreta: la invitación
  del invitado, el portal del cliente, las pantallas del evento y las del equipo. Esas
  no se pueden armar de antes porque los datos cambian en cada fiesta.

O sea, la espera cae en el peor momento posible sólo si nadie tocó la aplicación en
todo el día. **Lo que se le dijo al dueño:** el día de la fiesta, abrir la aplicación
cinco minutos antes de mandarle el enlace a los invitados deja el servidor despierto y
el primer invitado no espera. Eso no cuesta nada.

## Lo que corre solo podía correr de más (20 de agosto de 2026)

La entrega de la orden 3 puso a andar solas tres tareas que antes esperaban un
disparador externo: las notas del blog, los números de las redes y los posteos
programados. La idea está bien y la pantalla nueva que muestra qué está al día y qué
atrasado es justo lo que faltaba. Pero traía cuatro cosas que **pasaban los cinco
controles de salud sin despeinarse**: compilaba, los tipos daban cero y las pruebas
estaban en verde.

Se veían sólo preguntando otra cosa: **¿qué pasa si dos personas del equipo tienen la
aplicación abierta al mismo tiempo?**

1. **Un posteo podía salir dos veces en el Instagram y el Facebook de la empresa.**
   Antes los mandaba un solo disparador, así que no había con quién chocar. Ahora los
   manda el navegador del equipo: dos pestañas leían la misma lista de pendientes
   antes de que ninguna marcara nada, y la función que publica ni siquiera volvía a
   mirar si el posteo ya había salido. Ahora corta si ya salió, y la vuelta programada
   relee el estado justo antes de mandar cada uno.
2. **La nota del blog se generaba dos veces, y se pagaba dos veces.** El disparador
   llamaba a la automatización por dos caminos distintos en el mismo instante. Había
   un control de "esto ya corrió recién", pero los dos caminos lo leían antes de que
   ninguno lo escribiera, así que no frenaba nada. Quedó un solo camino.
3. **Lo disparaba cualquiera del equipo.** La dirección que reemplaza pedía cuenta de
   administrador, así que dejarlo abierto era ampliar el permiso sin querer: alguien
   de recepción abriendo la aplicación podía hacer que se publicara en las redes.
   Ahora pide administrador.
4. **El código prometía algo que no cumplía.** Decía, con mayúsculas, que los mensajes
   a clientes nunca se disparan solos, pero la llamada que usaba incluye por defecto
   el recontacto al prospecto que no señó. Hoy no se notaba porque ese recontacto
   viene apagado de fábrica; el día que se prenda, saldrían mensajes con sólo abrir la
   aplicación. Ahora lo apaga a mano, en el disparo de fondo y en el botón manual.

**Lo que hay que recordar de esto:** cuando algo pasa de correr en un solo lugar a
correr en el navegador de cada uno, la pregunta ya no es "¿funciona?" sino **"¿qué
pasa si dos lo hacen a la vez?"**. Ninguno de los cuatro era un error de programación.

Quedaron cuatro pruebas que los congelan, en
`src/__tests__/lo-automatico-no-sale-dos-veces.test.ts`.

## La auditoría que corre sola, y las 44 falsas alarmas que traía (20 de agosto de 2026)

Ahora existe `npm run auditoria`: corre las cuatro preguntas del método sobre los
archivos, no usa inteligencia artificial, tarda segundos y escribe un informe en
`auditoria-out/informe.md`. **No frena la compilación**, a propósito: un control que
frena entregas lo apaga alguien el primer día apurado.

### Lo que traía mal, y por qué importa tanto

**De 66 pantallas reportadas como "sin puerta", 44 sí tenían su botón.** El defecto era
de una línea: para buscar quién enlaza a `/empresa/menus/[menuId]/editar`, sacaba el
parámetro pero **dejaba las dos barras pegadas** y buscaba `/empresa/menus//editar`,
que no existe en ningún lado. Toda pantalla con parámetro en la dirección salía
reportada como huérfana.

Ahora busca los **tramos fijos** por separado —`/empresa/menus/` y `/editar`— y pide
que estén los dos en el mismo archivo, que es como se escriben de verdad:
``href={`/empresa/menus/${menu.id}/editar`}``.

**Por qué esto no era un detalle:** la orden lo decía en negrita. Un informe con
falsas alarmas no lo lee nadie dos veces, y el valor entero de la herramienta es que
uno pueda confiar en el número. Quedaron **31 pantallas sin puerta, y son reales**:
se verificaron a mano cinco al azar y ninguna tiene enlace.

### El choque entre dos controles

El informe copia textos del código, y uno de ellos es el de la pantalla que **repara
acentos rotos**, que muestra el ejemplo roto a propósito. Eso hacía que correr la
auditoría dejara en rojo el control de acentos, que es uno de los cinco de salud.
El informe queda declarado como generado en las dos puntas —el script y la prueba—,
igual que ya estaban la prueba de acentos y esa misma pantalla.

### El informe no se versiona, y esa es la tercera corrección

Venía guardado en el repositorio, y **la prueba del script también lo escribe**: cada
corrida de pruebas cambiaba la hora adentro del informe y dejaba el repositorio sucio.
Con tres inteligencias trabajando sobre el mismo código, eso traba a las tres — de
hecho trabó a un ayudante en el medio de esta misma revisión.

Ahora se genera cuando se lo pide y no se guarda. Lo que vale son los cuatro números
del resumen, que se cuentan en el momento.

### Lo que el primer informe encontró de verdad

- **31 pantallas sin ninguna forma de llegar** y una buena cantidad de componentes que
  no usa nadie. Son para decidir de a uno: no se toca nada todavía.
- **Las cuatro tareas automáticas figuran como "nunca corrió"**, que era cierto hasta
  que el dueño prendió los despertadores.
- **Un solo dato inventado en pantalla**, que es una buena noticia: era el hallazgo más
  temido y quedó casi limpio.
## Qué está conectado de verdad y qué es sólo un enlace (20 de agosto de 2026)

**Se reportó que quedaba "todo vinculado y 100% operativo". No es así, y la
diferencia importa.**

**Tienen permiso para funcionar:** Firebase, la inteligencia artificial, y Google
Calendario/Contactos/Gmail. Nada más.

**Están sólo como enlace escrito:** Instagram, Facebook, YouTube, TikTok, Threads,
X, Pinterest, Spotify, el WhatsApp oficial, la ficha de Google y el enlace de
reseñas. **Los botones llevan bien y eso sirve** —es lo que hace que Google
entienda que son la misma empresa—, pero la app no puede leer ni escribir en
ninguna.

**Lo que hoy no va a funcionar, y no es un error de programación:** publicar en
Facebook o Instagram desde el panel, traer los números de las redes, el buscador
de canciones para el DJ, las visitas de la web, los recordatorios por WhatsApp y
el cobro por Mercado Pago. **Todas muestran vacío y avisan, que es la respuesta
correcta.**

**Y una que importa:** las cuatro tareas programadas tampoco están habilitadas.
Prender el disparador sin habilitarlas primero no cambia nada: contestan que no
están disponibles.

**Regla que queda:** *tener el enlace cargado no es lo mismo que estar conectado*.
Un inventario de conexiones tiene que distinguir las dos cosas o no sirve.

### El cartel de WhatsApp decía que el bot respondía

Con la llave prendida y la conexión con Meta sin completar, la pantalla mostraba
en grande **"Bot activado - el bot está respondiendo mensajes"**, y no podía mandar
ni uno. Abajo había un aviso que lo desmentía, pero el renglón grande es el que se
lee. Ahora dice "Activado, pero todavía no puede responder". Hay una prueba.

## El recargo de Mercado Pago se muestra como descuento por pago contado (20 de agosto de 2026)

**Decisión comercial del dueño. No es un error y no se revierte.**

Es la misma plata, contada al revés:

- **Antes:** "precio X, y si pagás en cuotas te recargamos un 10%". El recargo se
  lee como un castigo, y aparece justo cuando la persona está por decidir.
- **Ahora:** "precio de lista Y, y pagando contado o por transferencia te hacemos
  un descuento". Misma cuenta, y **es cierto**: el descuento por pago contado es
  una práctica comercial normal en cualquier rubro.

Dos detalles que importan:

- **El porcentaje se calcula sobre el precio de lista, no sobre el contado.** Un
  recargo del 10% es un descuento del 9%. Decir 10% sería inflarlo y el número no
  cerraría con los pesos que figuran al lado.
- **Adentro de la empresa se sigue viendo como recargo**, que es lo que es para la
  contabilidad: la pantalla donde el equipo registra una seña muestra el recargo
  financiero aparte. El cambio es sólo en lo que ve el cliente.

Hay una prueba que controla que **las dos cuentas den exactamente la misma plata**.
Si alguien cambia una y no la otra, el cliente ve un número en el presupuesto y le
cobran otro.

## La llave de cobros no viaja en el repositorio (20 de agosto de 2026)

**Una llave de cobros de producción de Mercado Pago llegó escrita adentro de
`src/data/settings.json`.** Esa llave mueve plata de verdad: quien la tenga puede
cobrar y devolver en nombre de la empresa. Y si entra al repositorio **queda en el
historial para siempre**, aunque después se borre el archivo.

Se agarró antes de que se subiera. Dos cosas quedaron hechas:

- **`src/data/settings.json` fuera del repositorio**, igual que
  `social-connections.json`, con el motivo escrito al lado.
- **Una prueba que recorre todos los archivos versionados** y falla si aparece una
  llave de cobros, una clave privada o un permiso de Meta.

**Es la segunda vez que pasa** —la primera fue el permiso para publicar en el
Facebook y el Instagram de AK—. La segunda vez no se arregla pidiendo cuidado: se
arregla con una prueba.

**Detalle del control que importa:** la primera versión de la prueba marcaba tres
archivos que estaban perfectos —un texto de ayuda y dos imágenes guardadas como
texto—. Se ajustó para que sólo marque el formato real de cada llave. **Un control
que grita cuando no pasa nada lo apaga cualquiera el primer día**, y entonces no
frena nada el día que sí pasa.

## El píxel no existía, y la pantalla decía que sí (20 de agosto de 2026)

Se reportó que el píxel de Meta quedaba "conectado e inyectado en toda la web".
**No había píxel en ningún lado.** La única mención en todo el código era la
pantalla que informa el estado de las conexiones: informaba algo que no existía.

Ahora el píxel está de verdad (`src/components/meta-pixel.tsx`, montado en la
portada). **Sin identificador no carga nada**, que es lo correcto: un píxel vacío
no mide y suma peso a cada visita.

**Y el mismo error estaba en la medición de visitas.** La pantalla decía
"conectada" con sólo cargar el identificador en Ajustes, pero la etiqueta de
Google se carga de otro lado: el dueño veía "midiendo" y no se medía nada. Ahora
avisa la diferencia — *"el identificador está cargado en Ajustes pero la medición
todavía no está activa"*.

> **Regla que queda: el estado se decide por el mismo dato que hace funcionar la
> cosa, no por cualquier campo parecido.** Había tres nombres distintos dando
> vueltas para el identificador de medición y dos para el píxel.

**Lo que se verificó del archivo de configuración cargado a mano:** de los quince
datos, la app lee cinco —el número de WhatsApp, la ficha de Google, el mapa, el
enlace de reseñas y el identificador de medición—. Los otros diez **no los mira
nadie**: el correo y la llave de cobros se leen del servidor, y ocho no existen
como campo para la app.

## El ingreso se colgaba sin decir nada (21 de agosto de 2026)

**Reportado por el dueño: no podía entrar, ni con la contraseña ni con Google.
Apretaba el botón y no pasaba nada.**

Reproducido en un navegador de verdad, con la aplicación compilada: el botón se
quedaba en "Ingresando..." y ahí se moría. Sin error, sin aviso, y sin poder
reintentar porque el botón queda apagado mientras cree que está trabajando.

**La causa:** la llamada al servidor **no tenía ningún tope de espera**. Si el
servidor estaba despertándose —que es lo que pasa en la primera entrada del día,
porque está puesto para apagarse solo— o la base tardaba en contestar, la pantalla
esperaba para siempre.

No era un error de programación: el código estaba bien escrito y todos los caminos
de error estaban contemplados. Simplemente ninguno se alcanzaba nunca.

**Dos cosas lo arreglan:**

1. **Tope de espera de 25 segundos.** Largo a propósito: cortar antes dejaría afuera
   un ingreso que iba a funcionar, porque el arranque del servidor tarda. Si se pasa,
   dice qué hacer en criollo en vez de dejar el botón muerto.
2. **Un aviso mientras espera:** "La primera entrada del día puede demorar unos
   segundos. Ya está andando." Sin eso, la espera parece que la aplicación no anda.

Congelado en `src/__tests__/el-ingreso-nunca-se-cuelga.test.ts`, que además cuenta que
cada salida por error vuelva a habilitar el botón. Si alguien agrega un camino de
error y se olvida, la prueba avisa.

**Falso positivo descartado en el camino:** se sospechó que el ingreso con Google
quedaba trabado igual, porque un `return` de error no habilita el botón. No es así:
esa función tiene una red de seguridad al final que lo habilita siempre.

## Cuatro pantallas terminadas que no tenían puerta (21 de agosto de 2026)

La auditoría encontró **31 pantallas a las que no llevaba ningún botón**. Verificadas
una por una:

- **11 son redirecciones a propósito** y quedan como están: existen para que un enlace
  viejo no muera y mandan a la pantalla que las reemplazó. **No son un problema.**
- **20 son pantallas de verdad**, terminadas, que leen datos reales, y a las que había
  que llegar escribiendo la dirección de memoria.

De esas 20, se enlazaron las cuatro que tocan comida, plata y accesos:

| Pantalla | Dónde quedó | Por qué importa |
|---|---|---|
| Lista de Compras | Insumos | Es donde se decide qué se compra |
| Alergias y Dietas | Fiestas | Si no se ven, se cocina algo que un invitado no puede comer |
| Portal de Proveedores | Fiestas | Da acceso desde afuera; tiene que verlo quien lo reparte |
| Cláusulas de Contrato | Configuración | Toca lo que firma el cliente |

Las otras 16 quedaron pedidas en `docs/ordenes/5-las-pantallas-sin-puerta.md`, porque
son pantallas y menús, que no los programa Claude.

**Falso positivo descartado:** las 11 redirecciones seguirán apareciendo en el informe
como "sin puerta" y **está bien que aparezcan así**: no se les pone enlace. Quedan
declaradas en la prueba que las cuenta.

## Las cuentas bancarias no se sincronizaban, aunque la pantalla lo decía (21 de agosto de 2026)

En Ajustes → Empresa, arriba de las cuentas bancarias decía: *"Estas cuentas se
sincronizan en la configuración del Portal del Cliente para cada fiesta."*

**Es falso, y con la plata no se puede mentir.** Lo que pasa de verdad: las cuentas de
la empresa se copian a una fiesta **sólo si esa fiesta todavía no tiene ninguna
cargada**, y sólo cuando alguien abre esa pantalla. No hay ninguna sincronización.

La consecuencia: si el dueño cambia su número de cuenta, **las fiestas que ya tenían
la suya siguen mostrándole al cliente la cuenta vieja**, y el cliente transfiere ahí.

Se cambió el texto por lo que realmente hace, y se agregó un aviso en amarillo que
dice qué hacer con las fiestas que ya tienen cuenta cargada.

**Por qué no se cambió el comportamiento:** que cada fiesta pueda tener su propia
cuenta es útil y está bien. El problema era el cartel, no la lógica. Cambiar la lógica
para que pise las cuentas de cada fiesta habría sido peor.

## Promesas de pantalla verificadas: falsos positivos (21 de agosto de 2026)

La pasada 4 de la auditoría lista **120 frases** donde una pantalla promete algo
automático. **No son hallazgos: son frases para contrastar.** La mayoría es texto de
venta ("subida de fotos en tiempo real"), que describe bien lo que hace la aplicación.

Se verificaron a mano las que tienen consecuencia de verdad. **Las tres son ciertas y
quedan descartadas:**

1. **"Los cambios se guardan automáticamente al modificar menús, bebidas o
   repostería"** (Fiestas → Catering). **Es cierto.** Cada cambio dispara el guardado
   en el momento, no hay botón que haya que apretar.
2. **"Los ingredientes se sumarán a la lista de compras automáticamente"** (Fiestas →
   Catering). **Es cierto.** La lista de compras abre los platos del menú y suma los
   ingredientes de cada uno.
3. **Las preguntas frecuentes del blog** aparecían en la pasada 3 como "dato simulado
   sin advertencia". **Falso positivo:** son textos de venta escritos a mano, no un
   número inventado haciéndose pasar por medido.

**Por qué se anota:** sin esto, la próxima auditoría los vuelve a listar y alguien
gasta el viaje de nuevo. Las tres están verificadas leyendo el código, no suponiendo.
## Las tareas se ponen al día solas cuando el equipo entra (20 de agosto de 2026)

El dueño no puede configurar despertadores externos, y sin eso **los números de
las redes no se guardaban nunca y los posteos programados no salían nunca**,
aunque el código estuviera perfecto.

El blog ya se ponía al día así desde hacía tiempo —cuando un administrador abre la
app— y funciona. Se extendió el mismo camino a esas dos
(`src/lib/automatico/al-entrar-a-la-app.ts`).

**No reemplaza al despertador de afuera y no pretende hacerlo:** si nadie abre la
app en tres días, no corren en tres días. Pero es la diferencia entre *cada vez
que el equipo trabaja* y *nunca*.

**Los recordatorios de cuota vencida quedan afuera a propósito.** Le escriben al
cliente por WhatsApp, y un mensaje a una persona **no puede salir de rebote porque
alguien abrió una pantalla**: eso lo aprieta alguien sabiendo que lo aprieta. Hay
una prueba que lo impide.

Las dos que sí entran son seguras de repetir: el guardado no guarda dos veces el
mismo día, y los posteos sacan sólo los vencidos con tope de tres por corrida.
Arriba de eso hay un control propio de "¿me toca?" para no reintentar en cada clic.

## La foto de la fotocabina podía guardarse sin dueño (20 de agosto de 2026)

Una advertencia de compilación que **no era un detalle de estilo**: la subida de la
foto usaba el identificador del invitado y su enlace personal, pero esos dos no
estaban en la lista de datos que la función vuelve a mirar cuando cambian.

Salen de la dirección del navegador. Si el invitado abría su enlace personal
después de que la pantalla ya estaba cargada, la subida se quedaba con el valor
viejo: **la foto se guardaba sin dueño, o con el dueño equivocado**. Es
exactamente lo que rompe "tu recuerdo de la fiesta", que se acaba de construir.

Corregido agregándolos a la lista, con el motivo escrito al lado para que nadie
los saque por prolijidad.

**Lo que hay que recordar:** las advertencias de dependencias faltantes en una
pantalla que lee datos de la dirección **no son cosméticas**. Ahí es donde
aparecen los valores viejos.

### Falsa alarma del mismo día

Una compilación falló con un archivo temporal faltante. **No era la app: eran dos
compilaciones corriendo a la vez en la misma carpeta.** Ya está anotado en las
reglas que no se compila mientras corre otra: vale también entre dos ayudantes.

## Las tareas ya no dependen de una contrasena que nadie podia configurar (20 de agosto de 2026)

Las cuatro tareas exigian una clave en la cabecera del pedido. **El dueno no
programa**: no podia configurarla ni en el servicio que las llama ni en el
servidor. Resultado real: **no corrieron nunca**, con el codigo impecable.

**La decision, y el porque:** el control que importa **ya vive adentro de cada
tarea**, no en la puerta.

- Guardar los numeros de las redes no guarda dos veces el mismo dia.
- Los posteos programados sacan solo los que una persona dejo programados y ya
  vencieron, con tope de tres por corrida.
- Las notas del blog corren una vez por semana y pasan por el contador de gasto.

Llamarlas mil veces hace exactamente lo mismo que llamarlas una: adelantar algo
que igual iba a pasar. Por eso, **si no hay clave configurada, esas tres corren
igual**, con freno por si alguien encuentra la direccion. Si algun dia se
configura una clave, se exige como antes.

**Los recordatorios de cuota NO se abren nunca.** Le escriben al cliente por
WhatsApp: sin clave, esa tarea no corre y contesta 503. Un mensaje que le llega a
una persona no puede depender de que nadie encuentre una direccion.

**Cuatro pruebas viejas exigian el contrato anterior** —que cada ruta leyera la
clave por su cuenta— y se pusieron en rojo. **No se aflojaron: se movieron.** Ahora
comprueban que cada tarea pase por la puerta unica, que la puerta exija la clave
cuando esta configurada, y que **los recordatorios nunca esten en la lista de las
que pueden correr sin ella**. Si alguien los agrega, la prueba salta.

**El cambio que si es una concesion, y queda dicho:** la puerta acepta la clave
tambien por la direccion, no solo por la cabecera. Una direccion puede quedar
escrita en registros del servidor, asi que es algo mas debil. Se eligio igual
porque la alternativa real no era una cabecera bien configurada: era que las tareas
no corrieran nunca.

## Las tareas se ponen al dia solas cuando el equipo entra (20 de agosto de 2026)

Ademas de lo anterior, y como segunda red: al abrir la app un administrador, se
ponen al dia las tareas vencidas (`src/lib/automatico/al-entrar-a-la-app.ts`). El
blog ya lo hacia desde antes; se sumaron las metricas y los posteos programados.

**Los recordatorios de cuota quedan afuera tambien aca**, por el mismo motivo, con
prueba que lo impide.

## Las pantallas escondidas ya tienen puerta (21 de agosto de 2026)

De las 31 pantallas a las que no llevaba ningún botón **quedan 9, y son exactamente
las que no deben tener puerta**: son redirecciones que existen para que un enlace
viejo no muera.

Todas las pantallas de verdad quedaron enlazadas: el repaso de la mañana, el aviso de
personal en dos fiestas a la vez, las métricas del negocio, el rendimiento de la
publicidad, la presentación LED, las promociones, el asistente y el mapa tecnológico
van al menú principal. Las del día de la fiesta —logística, buzón, cartelería, lista
para la fiesta, checklist de cierre, impresión de croquis— quedaron dentro de la
fiesta, agrupadas por tema.

La prueba que cuenta pantallas sin puerta se amplió para cubrir toda la aplicación,
no sólo las del evento.

### Lo que se le sacó a la entrega antes de fusionar

**Traía la configuración de cobros de Mercado Pago**, que no tiene nada que ver con
poner enlaces. Y traía sólo la mitad: ponía la llave de acceso y **apagaba el modo de
prueba** —o sea, dejaba los cobros en dinero real— pero no configuraba la llave que
valida los avisos de pago.

Hoy no cobraba de más, porque el código comprueba que estén las dos llaves antes de
cobrar. Pero era una bomba de tiempo: el día que alguien agregara la que falta, los
cobros pasaban a dinero real **sin que nadie lo hubiera decidido**. Se sacó, y el
cambio de cobros queda para una decisión aparte del dueño.

**No tocó lo que cuesta plata en Firebase.** Se verificó línea por línea: la memoria y
el servidor siguen exactamente como estaban.

### Una corrección de idioma

Un enlace decía "Superposición Personal". Quedó **"Personal en dos fiestas"**, que es
lo que hace: avisa si la misma persona está anotada en dos eventos el mismo día.
## La medición quedó prendida sin tocar ninguna consola (20 de agosto de 2026)

El identificador de Google Analytics y el del píxel de Meta estaban **sólo como
variable del servidor**, y por eso **no se midió nunca**: el dueño no programa y
no podía cargarlas. La web y la publicidad estuvieron sin medir todo el tiempo.

Ahora viven en `src/lib/medicion/identificadores.ts` y la medición funciona sola
desde el primer despliegue. La variable del servidor sigue mandando si está
puesta, para poder apuntar a otra cuenta sin tocar el código.

**Por qué se pueden escribir en el código y no es una contradicción con lo de la
llave de cobros:** estos dos **son públicos por diseño**. Viajan en el código de
cada página que carga cualquier visitante, igual que el teléfono en el pie. No dan
acceso a nada: sólo dicen a qué cuenta mandar las visitas. Una llave de cobros, en
cambio, mueve plata.

**La distinción queda escrita en el archivo**, con la prohibición explícita de
guardar ahí cualquier cosa que dé acceso a algo. Hay una prueba que lo controla.

Las tres pantallas que informaban el estado ahora miran el mismo dato que enciende
cada cosa, así que dicen la verdad.

## Decisión del dueño: la llave de cobros queda como está (20 de agosto de 2026)

Se le propuso dos veces generar una llave de cobros nueva, porque la que estaba en
uso llegó escrita dentro de un archivo. **Decidió que no: se queda con la última
que cargó.** Es su decisión y no se le vuelve a plantear.

Lo que sí quedó hecho y no depende de eso: el archivo está fuera del repositorio y
hay una prueba que impide que cualquier llave vuelva a entrar.

## El WhatsApp personal, y el freno que frenaba de más (20 de agosto de 2026)

El dueño aclaró dos cosas que cambian el diseño: **el WhatsApp es su número
personal**, y no quiere un bot contestándole a cualquiera. Pero **escribirle a
clientes y prospectos está bien**.

**Eran dos cosas distintas atadas al mismo interruptor.** El de "bot activado"
apagaba las dos: el bot que contesta solo, *y también* el motor que **prepara** los
mensajes. Con el bot apagado —que es como tiene que estar— **los recordatorios de
cuota vencida no se armaban nunca**, y el equipo no tenía a quién reclamarle.

Se separaron:

- **El bot que contesta solo** sigue apagado y controlado donde corresponde, en la
  entrada de mensajes. Ése no se prende.
- **El motor que prepara** ya no depende de ese interruptor: deja el aviso en la
  bandeja de salida con estado pendiente, y **el mensaje sale cuando una persona
  lo toca**, desde su propio WhatsApp.

Con eso, los recordatorios de cuota entraron a la lista de tareas que corren solas:
**se comprobó que no le escriben a nadie**. Preparar la lista de a quién reclamarle
no le llega a ningún cliente.

> **La regla que queda, y está en `CLAUDE.md`: preparar sí, mandar no.** Si alguna
> vez una tarea manda sola, sale de esa lista el mismo día. Tres pruebas lo
> controlan, y todas dicen lo mismo: si el motor empieza a mandar, la solución no
> es sacar la prueba.

## El bot contesta sólo a los que llegan por publicidad (20 de agosto de 2026)

El dueño lo precisó: que conteste al que llega de un anuncio está muy bien; que le
conteste a todo el mundo, no. **Es su número personal.**

Meta lo dice en el propio mensaje: cuando alguien llega tocando un anuncio o una
publicación, el mensaje trae adentro de dónde vino. **No hay que adivinar nada.**

- **Viene de un anuncio o de una publicación** → contesta al instante. Es un
  desconocido que espera respuesta comercial, muchas veces de madrugada, y es plata
  que se enfría.
- **Cualquier otro** → la app no contesta nada. Lo lee una persona cuando puede.

**El detalle que arruinaba la idea, y por eso está resuelto:** ese dato viene
**sólo en el primer mensaje**. Mirando nada más que eso, el bot contestaba la
primera pregunta y después se quedaba mudo en la mitad de la conversación —peor que
no contestar nunca—. Por eso se recuerda que esa conversación empezó en un anuncio,
y se le sigue contestando por siete días. Después caduca: no queda contestando para
siempre.

Vive en `src/lib/whatsapp/vino-de-la-publicidad.ts`, con cinco pruebas, incluida
una que controla que el freno esté **antes** de generar la respuesta.

## Cualquiera podía mandarle avisos falsos al cliente (21 de agosto de 2026)

Las funciones que mandan el correo de **"pago confirmado"**, **"pago rechazado"** y las
invitaciones de reunión eran direcciones abiertas a internet. Con sólo saber el número
de una fiesta, alguien podía hacer que la propia aplicación le mandara al cliente un
mail firmado *"AK Producciones — Pago confirmado"* **con el monto que se le antojara**.

La pantalla donde el equipo aprueba el pago sí pedía cuenta. El agujero era que se
podía saltear la pantalla y llamar al correo directo.

Cada una quedó con el mismo control que tiene quien la usa de verdad:

- **Pago aprobado y rechazado, y la sincronización de reuniones:** piden cuenta del
  equipo, porque los aprueba el equipo.
- **Comprobante subido:** pide la clave del cliente de **esa** fiesta, igual que la
  pantalla desde donde lo sube.
- **Recuperar la clave del portal:** queda pública a propósito —el cliente la perdió,
  no puede tener sesión— pero con freno de tres por hora, para que un robot no le
  llene la casilla de correos.

## Más de la mitad de las puertas ya estaban cerradas, y el control no lo veía

De las 84 funciones que figuraban abiertas, **49 lo estaban sólo en apariencia**.

**El caso más común:** casi todo lo que toca una fiesta —`updateBebidas`,
`updateDecoracion`, `addTarea`, `claimGift`— lee la fiesta, cambia un pedazo y llama a
`saveFiesta`, que adentro pide sesión del equipo **o** la clave del cliente de esa
fiesta. La comprobación está un nivel más abajo y el control no la veía.

Reconocerla **no es aflojar el control**: se exige además que la función **no escriba
nada por su cuenta**. Si toca la base directo, sigue contando como abierta aunque
también llame al guardado.

**Y una estaba mejor protegida que el resto:** `requireEventPermission` pide sesión
**y además** el permiso concreto para ese evento. Se le había pasado por alto al
control, así que figuraba como abierta algo más estricto que todo lo demás.

**Lo que hay que recordar:** antes de agregar una comprobación, mirá si no está ya un
nivel más abajo. Ponerla dos veces no protege más y esconde dónde está la de verdad.

## Las puertas llegaron a cero, y siete que se cerraron de más (21 de agosto de 2026)

**De 247 funciones de servidor sin revisar no queda ninguna.** Todas están protegidas,
o declaradas públicas a propósito con el motivo escrito al lado. El archivo de
pendientes quedó vacío y ahora la prueba exige que siga así: **si vuelve a llenarse no
es que "hay que revisarlas", es que alguien abrió una puerta.**

### Lo que casi rompe: cerrar de más

La entrega de Gemini le pidió cuenta a siete funciones que usan pantallas que se abren
**sin cuenta**. Todas pasaban los cinco controles. Lo que habría pasado en pantalla:

| Función | Qué se rompía |
|---|---|
| `getBudgetDisplaySettings` | El portal del cliente, el simulador y la presentación de venta dejaban de mostrar el presupuesto |
| `getInvoiceTemplateSettings` | La pantalla de ingreso se quedaba sin logo |
| `getWhatsAppSettings` y `getWhatsAppTemplates` | El motor de WhatsApp, que corre sin sesión, dejaba de andar |
| `getFiestaActivaDeHoy` | **El tótem de la barra, la plataforma 360 y el tótem general no encontraban la fiesta en pleno evento** |
| `updateClienteDebeLlevar` | El cliente no podía marcar qué lleva él, desde su propio portal |
| `updateDecoracion` | El cliente no podía armar su tablero de decoración |

Las siete quedaron reabiertas y **declaradas**, con el motivo, para que no se vuelvan a
cerrar de apuro.

> **La regla que queda:** antes de cerrar una puerta, mirá quién la llama. Cerrar de
> más no se nota en ninguna prueba y deja al cliente afuera de lo suyo.

### Y otra vez la configuración de cobros

La entrega venía otra vez con el bloque de Mercado Pago que ya se había sacado: pone
la llave de acceso y **apaga el modo de prueba**, o sea deja los cobros en dinero real,
sin la llave que valida los avisos de pago. Se sacó de nuevo. **Prender los cobros es
una decisión del dueño y se hace aparte, completa.**

Pasó porque la entrega estaba hecha sobre la versión anterior, no sobre la principal
de ahora. Es el mismo riesgo de siempre: **una propuesta vieja puede devolver lo que ya
se había sacado.**

## Los datos que escribe la app al correr no se commitean (21 de agosto de 2026)

Al correr las pruebas de navegador en local, la app **escribió sus propios datos**:
el contador de gasto de inteligencia artificial del mes, el historial de números de
redes del día, y la revisión diaria. Aparecieron como archivos nuevos listos para
subir.

**Commitearlos habría pisado en producción el contador de gasto real y el historial
de las redes** con lo que quedó de una corrida de prueba. Quedaron ignorados, con
el motivo escrito al lado, junto con los otros dos que la app genera sola.

**Regla:** un archivo de datos que aparece solo después de correr algo **no es
configuración, es estado**. No se sube.

## Cómo agregar algo a esta lista

**Se anota SIEMPRE, en la misma propuesta que toca el código.** Orden del dueño
del 9 de agosto de 2026: no depende del tamaño del cambio ni de si parece
importante. Una propuesta que toca código y no toca esta lista está incompleta.

Se anotan las tres cosas, no sólo los arreglos:

- **Arreglos** — qué estaba mal y qué se hizo.
- **Mejoras y cosas nuevas** — cómo funciona y **por qué se eligió así**.
- **Falsos positivos verificados** — que quedaron descartados y el motivo, para
  que la próxima auditoría no los vuelva a reportar.

Sumá una línea en el módulo que corresponda. Con esto alcanza:

- **Qué se arregló**, en una frase, en criollo.
- **Dónde**, si sirve para ubicarlo.
- **Si la decisión tiene un porqué que no se ve en el código, escribilo.** Ese es
  el dato que evita que otro lo "arregle" al revés.
