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

## Se sacó el filtro de reseñas de Google (18 de agosto de 2026)

**El pedido de reseña por WhatsApp salía sólo a los clientes que puntuaban 9 o
10.** Estaba en tres lugares de `src/app/actions/feedback.ts`: en el envío, en el
guardado de la encuesta y en el pedido manual.

Eso se llama filtrar reseñas y **Google lo prohíbe**: la sanción es borrar las
reseñas del negocio. En una ciudad chica, quedarse sin reseñas es peor que tener
alguna mala. Todavía no había hecho daño porque el envío automático viene apagado
de fábrica y el enlace de Google venía vacío.

**Cómo quedó:** el pedido sale para todos los que contestan la encuesta, con el
mismo enlace. Lo único que cambia según la nota es el texto del mensaje: con nota
6 o menos se pide disculpas primero y se avisa que el equipo va a llamar, y el
enlace va igual abajo. Con nota alta, el agradecimiento de siempre.

**Por qué conviene además del cumplimiento:** un promedio de cinco perfecto parece
arreglado. Vende más un 4,5 con alguna de cuatro estrellas y respuestas prolijas
abajo. Y cuantas más reseñas hay, menos pesa cada una mala.

**Ojo si aparece de nuevo:** las pruebas de
`src/__tests__/resenas-y-plan-equipo.test.ts` ahora exigen lo contrario de lo que
exigían antes — que con nota baja el pedido se mande igual. Si alguien las ve
fallar, la respuesta no es volver a poner el filtro.

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
