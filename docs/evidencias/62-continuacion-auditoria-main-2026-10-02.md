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
