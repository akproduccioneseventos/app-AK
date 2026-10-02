# Continuación de auditoría contra main — 2026-10-02

## Base de revisión

- Repositorio: `akproduccioneseventos/app-AK`
- SHA exacto de main revisado: `c92ee4224da3b440ad91d72f06d03c6672f44e33`
- PR abiertas al consultar GitHub: ninguna.
- Producción: no verificada en esta pasada; el endpoint de salud tuvo timeout en la comprobación anterior. No asumir que el SHA está desplegado.
- No se modificó código de la aplicación ni se ejecutó compilación.

## Orden 110: contraste, sin rehacer lo ya incorporado

- **Recetas de barra:** corregido en main respecto del defecto descrito: al comparar las 36 referencias `insumoId` con los 40 insumos del catálogo, no faltan IDs. Esto sólo acredita que las referencias existen; no verifica por sí solo unidades, cálculo real ni escritura en Firebase.
- **Voz:** el reproductor del Parte de la mañana usa `SpeechSynthesisUtterance` del navegador. No encontré `src/lib/asistente/voz-parte.ts` en main y la consulta de ruta devolvió 404. Gemini TTS no queda demostrado ni implementado por esta evidencia; seguir como pendiente de funcionalidad, no corregir otra vez el tono sintético ya retirado.
- **Catálogo público de tecnología:** `src/app/tecnologia/page.tsx` recorre `TECNOLOGIAS_AK`, pero las tarjetas renderizan nombre, descripción, ruta en texto y botón; no renderizan `item.foto` ni un ícono de respaldo. La propiedad `foto` del catálogo no tiene consumidor en esta página. La vista no está mostrando las imágenes de producto/capturas que el catálogo promete. No afirmar que los archivos son imágenes rotas en pantalla: las rutas listadas no se renderizan.
- **Prueba de imágenes:** `src/__tests__/las-imagenes-de-tecnologia-son-imagenes.test.ts` retorna temprano si no existe `public/tecnologia`; por tanto la prueba puede pasar sin verificar una sola imagen. Además, esa prueba sólo inspecciona archivos locales, no que la página los muestre. Falta prueba que falle con carpeta ausente y compruebe el uso del activo en la página.
- **Video de muestra:** no se concluye en este registro si el archivo fue quitado o si existe video de fiesta real; queda sin contrastar.

## Hallazgo de seguridad para contraste específico

- `src/app/actions/fiesta/invitados.actions.ts:getInvitados` lee `getFiestaById(fiestaId, LECTURA_COMPLETA)` y devuelve el arreglo completo de invitados, sin llamar `requireAppSession` ni validar un token de invitado.
- La acción se importa desde un componente cliente del muro social. El helper `getFiestaById` sólo recorta los datos cuando no hay sesión válida **y** no se pidió `LECTURA_COMPLETA`; este consumidor pide explícitamente lectura completa.
- Las pantallas de recepción están detrás de AuthGuard, pero eso no demuestra que la acción remota esté protegida: el propio test `pantallas-internas-con-guardia.test.ts` explica que middleware sólo comprueba presencia de cookie y que la validación efectiva es cliente. No localicé prueba focalizada que invoque `getInvitados` sin sesión.
- **Clasificación:** riesgo de autorización/privacidad confirmado en el código; explotación remota no reproducida. Puede exponer nombres, contactos, alergias, canciones u otros campos de invitados si se puede invocar la acción sin sesión. No marcar como fuga explotada hasta hacer la sonda con la acción real.
- **Contraste pendiente para Claude (permisos/datos):** probar la acción directa sin cookie, con cookie inventada y con sesión AK; exigir denegación en los dos primeros casos y acceso al equipo autorizado en el último. Comprobar que la respuesta pública del portal siga limitada al invitado con token. Añadir una prueba ejecutable de regresión sobre la acción, no sólo sobre el layout.
- Rutas verificadas: `src/app/actions/fiesta/invitados.actions.ts`, `src/app/(app)/fiestas/nueva/muro-social/page.tsx`, `src/lib/fiesta/fiesta.actions.ts`, `src/app/recepcion/layout.tsx`, `src/__tests__/pantallas-internas-con-guardia.test.ts`.

## Resultado

La lista de invitados y la autorización de acciones requieren la sonda prioritaria antes de llamar al módulo seguro. La parte visual de tecnología y Gemini TTS siguen incompletas según el código observado. No se declara la app completa ni desplegada: faltan pruebas de acción remota y verificación de producción sobre el SHA actual.

## Reproducción visual añadida — catálogo público inaccesible

- Abrí en el navegador real `https://akproducciones.uy/tecnologia` sin iniciar sesión.
- Resultado observable: redirigió a `/login?redirect=%2Ftecnologia` y mostró Acceso Protegido.
- En el SHA revisado, `src/lib/auth/public-paths.ts` contiene `/experiencia-ak`, pero no `/tecnologia`; por eso el middleware trata el catálogo como ruta privada.
- **Clasificación:** fallo confirmado en la web publicada al momento de la prueba; impide que un prospecto sin cuenta vea el catálogo público. No confundido con el fallo de imágenes ni con Gemini TTS.
- Reproducción visual independiente del código: la versión desplegada y su SHA no fueron identificados, así que no atribuir este comportamiento a `c92ee42` publicado hasta verificar `/api/health`.

## Segundo destino comercial bloqueado

- Desde `src/app/tecnologia/page.tsx`, cada CTA **Probalo** enlaza a `/experiencia?paso=...`; la ruta existe en `src/app/experiencia/page.tsx`.
- Abrí `https://akproducciones.uy/experiencia` sin sesión: redirige a `/login?redirect=%2Fexperiencia`.
- `src/lib/auth/public-paths.ts` tampoco declara `/experiencia` pública (sólo declara `/experiencia-ak`).
- **Clasificación:** reproducción confirmada en la web publicada y enlazada por el propio catálogo. El cliente no puede abrir la demostración desde esos botones. SHA de producción aún no identificado.

## Inspección visual de `/experiencia-ak` (navegador, viewport móvil)

- La landing alternativa sí carga sin sesión y expone CTAs a WhatsApp y simulador.
- En la captura del primer viewport, el botón blanco de **Calcular Presupuesto Online** no muestra texto legible aunque el árbol accesible conserva ese nombre; comprobación visual directa, reproducible en viewport móvil. Revisar contraste/fondo del botón antes de dar la conversión por usable.
- En los dos viewports capturados, el tratamiento es predominantemente oscuro y las tarjetas de servicios usan íconos, no fotografía o video real. Es una fricción de marca/venta observada, no un error funcional del enlace. Las animaciones visibles se limitan a transiciones de tarjetas; no validé movimiento a lo largo de toda la página.
- Código relacionado: `src/app/experiencia-ak/page.tsx`. La sección termina en servicios + CTA; su footer ofrece acceso a galería/blog, pero no se comprobó la carga de esos destinos.

## Sonda segura del simulador publicado

- `/simulador-de-presupuesto` abrió sin sesión. Pude avanzar desde la presentación al paso 2 sin cargar información personal.
- Al intentar continuar vacío, bloqueó el avance y enumeró nombre, WhatsApp uruguayo, opción de salón y fecha faltantes. No envié ni guardé datos de prospecto.
- La forma visible en la captura móvil es legible y ordenada en fondo claro. **No probé** cálculo final, proyección anual, selección de menú, paquetes, servicios dinámicos, PDF ni persistencia: esos recorridos requieren completar datos y no se ejecutaron en producción para evitar crear un lead real.


## Inspección de artículo del blog publicado

- Abrí `/public/blog/como-calcular-bebida-evento-salto` sin iniciar sesión. Carga título, bajada, artículo, checklist, FAQ, artículo relacionado y CTA de WhatsApp/simulador.
- **Fricción visual confirmada:** el encabezado principal se monta sobre una fotografía oscurecida de fondo. En la captura móvil, el título y la bajada ocupan la imagen; no es el formato solicitado de publicación con imagen separada del texto. No comprobé superposición que impida leer: el texto sí resulta legible en la captura.
- Los botones de compartir y el enlace de simulador están presentes; comprobé que el acceso del footer al simulador abre la ruta pública correcta. No envié mensajes ni datos.
- **Clasificación:** mejora de presentación pendiente, no defecto funcional bloqueante. No se verificó atribución de visitas/conversión ni analítica.


## Navegación desde artículo hacia la galería: evidencia corregida

- **Rol/recorrido:** prospecto; artículo público → pie → “Galería de Eventos Reales”.
- El primer registro atribuyó el problema a un ancla inexistente. **Esa explicación era incorrecta y queda retirada.** El DOM real contiene tanto `landing-gallery` (envoltorio) como `galeria` (sección interna); `LandingSpaContainer` crea el primero.
- **Reproducción adicional, viewport 390×844:** abrir `/public/blog/como-calcular-bebida-evento-salto`, activar el enlace del pie. URL final `https://akproducciones.uy/#landing-gallery`; después de cargar la portada y volver a observarla, la pantalla sigue en el hero. El ancla existe, pero está a 15743 px por debajo del viewport; título a 15856 px. El defecto de desplazamiento sí se reproduce.
- **Clasificación:** DEFECTO P2 publicado, causa exacta pendiente de comprobar. No ordenar renombrar el ancla ni agregar una segunda: ya existe.
- Código: `src/components/public-footer.tsx:94`, `handleAnchorClick` usa `scrollIntoView` cuando el destino existe y `window.location.assign('/'+href)` cuando viene de otra página. `src/components/landing/LandingSpaContainer.tsx` crea `landing-gallery` en `dashboardSection('gallery', gallery)`.
- Contraste: el menú Servicios de la portada sí llegó a su sección (top observado ~160 px). El problema comprobado es el recorrido entre páginas hacia galería, no todos los enlaces internos.
- Retest: artículo → galería y navegación directa al enlace con hash, celular/escritorio y carga inicial; debe quedar visible el título de galería. Revisar si el destino termina de montarse después del desplazamiento inicial. Esta causa es una hipótesis, no una prueba.

## Continuación: galería, video y tecnología

### Base actual y alcance

- Main sigue en `c92ee4224da3b440ad91d72f06d03c6672f44e33`.
- Ahora hay PR abierta **1251**, rama `feat/super-asistente-unificado`, HEAD `ee7ada01c7fb52ac000f4da68f5114d4e4a612c7`, base c92ee42. Sus ocho archivos cambiados son de voz/asistente. Esto actualiza la consulta inicial sin PR; no se afirma que la entrega de voz esté validada.
- Los blobs de `GallerySection.tsx` y `gallery-media-utils.ts` son idénticos en main y en ese HEAD. El nuevo fallo de clasificación sigue presente en la tanda.
- Pruebas en navegador publicado, anónimo. Vista estrecha habitual y tamaños explícitos 390×844 y 1440×900; el tamaño fue restaurado al terminar. El SHA desplegado continúa sin verificar.
- Graphify: la copia local no estuvo disponible en esta sesión; consultar `graphify-out/GRAPH_REPORT.md` en c92ee42 devolvió 404. Se usaron búsquedas puntuales y rangos de los consumidores reales.

### P2: una categoría editorial correcta se pisa por una palabra ambigua

- Galería → Catering → abrir **Recepcion y display personalizado**. La imagen muestra un cartel de quinceañera, flores y decoración de bienvenida; la etiqueta visible es **Catering**.
- Registro identificado: `ak-serv-recepcion-display-01`, URL `/media/catalogo-servicios/recepcion-display-evento-01.jpeg`, en `src/data/galeria-publica.json`. Su categoría de origen YA ES `Decoracion`; descripción: “Display de bienvenida y ambientacion personalizada para evento.”
- Causa rastreada: `src/components/landing/gallery-media-utils.ts`, `CATEGORY_RULES` incluye `recepcion` dentro de Catering. `classifyGalleryCategories` prioriza esa coincidencia de título antes de consultar la categoría editorial. `toLandingGalleryItem` en `src/components/landing/GallerySection.tsx:131` consume ese resultado para etiqueta y filtro.
- **Estado:** reproducido en producción; lógica y dato presentes en main y clasificador idéntico en PR 1251. Programación a cargo de Gemini.
- Corrección propuesta: resolver la ambigüedad entre recepción gastronómica y decoración de bienvenida sin perder el arreglo del kebab. No alcanza editar el JSON: ya está bien categorizado.
- Pruebas propuestas, pendientes: esta foto debe quedar en Decoración; kebab en Catering incluso con descripción de ambientación; recepción de bocados en Catering; entrada con cartel/flores no debe convertirse en comida. Revisar los filtros y etiquetas usando la foto real.

### P3: texto ambiguo en carga incremental

- Con Catering había 12 fotos renderizadas y el botón decía “Ver más fotos y videos (24 de 28)”. Tras pulsarlo, había 24 fotos y decía “(28 de 28)”. Tras otro clic aparecieron las 28 y desapareció el botón.
- **No faltan esas cuatro fotos:** la paginación se completó. El contador expresa la cantidad del siguiente lote, no la que está visible; el texto puede interpretarse como progreso actual.
- Causa verificada en `GallerySection.tsx:378`: muestra `Math.min(visibleCount + BATCH_STEP, filtered.length)`. Sugerencia opcional: “Mostrar 12 más” y “12 de 28 visibles”, o texto equivalente sin ambigüedad.

### Comprobaciones de comportamiento aprobadas en este recorrido

- Filtro Catering: cambia el conjunto; ampliación del kebab muestra la imagen correcta con categoría Catering. Su antiguo error de clasificación NO se vuelve a reportar.
- Foto ampliada: siguiente cambia al siguiente elemento y Escape cierra la vista.
- Carga incremental: 12 → 24 → 28 fotos del filtro, sin bloqueo.
- Videos → Testimonios reales → Testimonios de clientes satisfechos: abrió reproductor YouTube `f0o5FIRS_wo`, mostró “Pausar video” y tiempo de reproducción; Cerrar video retiró el reproductor. No se validó todo el catálogo de videos.
- Demostración pública Barra y Tótem (expresamente rotulada muestra con datos de prueba): pedido Mojito #42 pasó de preparación a listo para retirar; segundo pedido Citrus Mocktail #43 inició preparación. Sólo acredita la demo local, no una comanda real a un barman ni sincronización de una fiesta.
- Selector comercial: 360 y Espejo cambian título, prestaciones y destino contextual del enlace WhatsApp. No se enviaron mensajes. Las fichas son consultables en celular y escritorio.

### Presentación de tecnología: oportunidad concreta

- En 1440×900 la ficha del Espejo presenta un ícono genérico y una lista de prestaciones donde el prospecto necesita ver el equipo y el resultado de la foto. Lo mismo ocurre en la ficha 360 examinada.
- Propuesta para Gemini: usar fotografía del equipo real y un ejemplo corto del resultado, conservando visibles los selectores de Fotocabina, 360 y Espejo. Aprovechar activos propios ya aprobados; no añadir otra sección repetida.
- Éxito observable: se reconoce qué se contrata y qué recibe el invitado sin tener que interpretar una lista de texto. Esto es una mejora comercial propuesta, no un fallo de captura/impresión.

### Límites de esta pasada

No se probaron impresora, cámara, equipo 360, transformación IA, pedidos reales, sincronización de Instagram, deduplicación visual de todo el catálogo ni sesiones privadas. No se corrió compilación ni se tocó código de la aplicación. Las comprobaciones de demo no certifican los módulos operativos.


## Continuacion: sincronizacion Instagram y YouTube - sonda aislada

### Base, contraste y alcance

- Main revisado: `c92ee4224da3b440ad91d72f06d03c6672f44e33`; tanda contrastada: PR 1251, HEAD `ee7ada01c7fb52ac000f4da68f5114d4e4a612c7`.
- Identicos entre ambos: `public-feed.ts` blob 5b6eb258255c28b380203af46d41e18cf3a036e9, `social-media.ts` a3a5f00e10d39a8dd6959348fc0817556260a5a7, `marketing-automation.ts` ec2625112895575a7bf9d0ec3b035825a0aec07b, `meta-history-backfill.ts` cce3965ae788d2814c38e5973636c4f27f7892ef, `youtube-history-backfill.ts` 8a517f613ed593a20fec0fd5062fb7c6c3296c8d.
- No se recompilo, no se uso una cuenta real de Meta, no se escribieron datos de produccion y no se identifico el SHA publicado.
- Se reutilizaron decisiones de YA-RESUELTO: filtro contra borradores, prohibicion de datos demo en produccion, lector publico rapido desde historial, importacion historica y refresco de YouTube. No se piden de nuevo.
- Esta pasada NO valida la nueva entrega de voz de PR 1251 ni la auditoria completa de la app.

### P2 reproducido: importador automatico retroalimenta IDs locales

- Consumidor real: `src/lib/marketing-automation.ts:159` llama `syncInstagramPosts(MARKETING_AUTOMATION_INTERNAL_TOKEN)` cuando vence su intervalo.
- `src/app/actions/social-media.ts:244-253` obtiene la entrada de `getPublicInstagramFeed` y conserva `post.id`, pero descarta `post.sourceId` y `post.publishedAt`.
- El lector `src/lib/instagram/public-feed.ts` devuelve IDs `ig_${sourceId}`; si una fila carece de sourceId, usa su ID local. El importador crea `ig_sync_${post.id}`, busca solo ese ID y no guarda sourceId ni sourceUrl en las filas nuevas (social-media.ts:361-380). Cada vuelta puede tratar la copia anterior como otra publicacion.
- Sonda ejecutada con Node v24.19.0: `node docs/evidencias/sondas/62-instagram-source-probe.cjs`, equivalente al archivo local audit-probes/instagram-source-probe.cjs. Exit 0.
- Caso legado: fila sin sourceId `ig_sync_ig_123456` produce `ig_sync_ig_ig_sync_ig_123456`; el lector devuelve dos registros para la misma mediaUrl.
- Caso con historial correcto: fila `ig_history_123456`, sourceId `123456`. Tras dos ciclos de mapeo/guardado quedan TRES registros para una sola mediaUrl: `ig_123456`, `ig_ig_sync_ig_123456`, `ig_ig_sync_ig_ig_sync_ig_123456`.
- La sonda ejecuta el cuerpo del lector y el objeto de guardado obtenidos del SHA indicado, retirando anotaciones TypeScript; simula readData/fetch y los ciclos de upsert. NO ejecuta la accion entera, Firebase, locks ni el importador historico completo.
- **Clasificacion:** defecto de identidad reproducido en fragmentos reales de main; codigo identico en tanda abierta. No afirmar duplicados visibles en produccion: la galeria tiene deduplicacion adicional por URL. El defecto agrega identidades/registros internos, aunque una vista pueda ocultar las copias.
- Dato adicional de codigo: `publishDate: now` reemplaza la fecha original al copiar; la sonda no certifica el orden de la galeria real.

### P2 acotado: esta automatizacion no garantiza consultar publicaciones nuevas

- Con publicaciones guardadas elegibles, `getPublicInstagramFeed` retorna el historial antes de consultar Meta. Esto es correcto para una lectura publica rapida, pero no sirve como unica fuente de una importacion que debe buscar novedades.
- La sonda configura credenciales ficticias y una respuesta Meta con una foto nueva: el contador fetch queda en **0**, incluso despues de los ciclos. No se ejecuta ninguna peticion real.
- **Importante: no concluir que toda la sincronizacion Instagram esta rota.** Hay otro proceso real: `src/app/api/cron/metricas-de-redes/route.ts` llama `syncMetaPublicHistory`; `meta-history-backfill.ts:286-287,397-413` consulta Graph con paginacion. Guarda sourceId/sourceUrl, fecha de origen y busca coincidencias por identidad/enlace (187-258).
- La pantalla de sincronizaciones tambien tiene importacion historica manual con forceFull. Por tanto el fallo es del recorrido de marketing automatico auditado, no prueba ausencia total de conexion ni que nunca lleguen novedades.
- Falta comprobar en produccion el token autorizado, account ID, ultima ejecucion y resultado del trabajo historico. No se inspeccionaron secretos ni se certifica la configuracion de la cuenta.

### Correccion concreta propuesta para Gemini; validacion de Claude

1. Separar lectura publica del historial y adquisicion de novedades; reutilizar el importador historico existente cuando corresponda. No quitar la cache de la portada ni implementar una segunda integracion de Meta sin necesidad.
2. Conservar identidad original, enlace y fecha de publicacion durante todo el mapeo. Repetir el mismo contenido no debe crear otra fila ni anidar prefijos.
3. Revisar registros ya duplicados antes de cualquier migracion: no borrar publicaciones manuales, borradores o historias legitimas. Si se requiere depuracion de datos, Claude valida el procedimiento.
4. Pruebas propuestas **pendientes de implementar y correr contra la accion completa**: mismo historial sincronizado tres veces mantiene cantidad; publicacion nueva externa entra una sola vez con cache no vacia; importador historico y de marketing no duplican entre si; error/revocacion de Meta no se rotula como lectura externa exitosa; fecha original se conserva; borradores continúan excluidos.
5. Probar el consumidor runMarketingAutomation, no solo un helper desconectado. Compilacion y resultado final corresponden a Claude; no se ejecutaron aqui.

### YouTube: mecanismos encontrados y limites, sin nuevo defecto confirmado

- `src/lib/youtube/ak-channel.ts` ofrece RSS publico con revalidate 21600 y fallback curado; ese intervalo de seis horas ya estaba registrado. No tratarlo como hallazgo nuevo ni prometer sincronizacion instantanea.
- Existe ademas `syncYouTubePublicHistory`: usa YouTube Data API para historial cuando hay API key y RSS como respaldo. Cuando usa RSS, deja `complete:false`; cuando completa Data API, registra ese modo (youtube-history-backfill.ts:240-281).
- La tarea metricas-de-redes consume ese importador; la portada consume videos publicos y galeria. El reproductor publicado del testimonio ya se probo en la pasada anterior: no se repitio.
- NO se verificaron todas las subidas historicas, credencial efectiva, tarea en produccion, cuotas o incorporacion de un video recien publicado. Eso permanece **sin probar**, no aprobado ni denunciado como roto.

### Entrega reproducible

- Sonda: `docs/evidencias/sondas/62-instagram-source-probe.cjs`, subida en commit `cffc3d3e7ebd0bdb39dee5666ebc593e0ec86503` a `codex/entorno-windows-94`.
- Esta es documentacion/evidencia de revision; no un arreglo de la app. Ninguna PR fue fusionada ni se afirma que otra IA recibio o comenzo la correccion.
