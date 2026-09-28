# Recorridos reales, 28/09/2026

Auditor: Codex. Base de app 621f41c, checkout documental f428d35.
No hay PR abierta al inicio. No se alteraron registros de produccion.

## Preparacion

Dependencias instaladas. El arranque oficial falla como documenta la orden 94.
Se preparo un adaptador EXTERNO al repo (.audit-tools/run-isolated-windows.mjs):
enlace junction y lista explicita de ocho variables de sistema agregadas por Windows.
Conserva las claves ficticias, proyecto demo, worktree sin .env y control de nombres.
No es una correccion entregada de la app ni sustituye las pruebas de Claude.

## Navegacion publica realizada

- PASS: blog -> enlace al Club Uruguay en pie de pagina navega a la portada y su seccion.
  Se descarta el supuesto fallo del href transitorio antes de hidratar: el clic real funciona.
- PASS limitado: Club Uruguay -> Cotizar mi fiesta abre simulador con salon=club y portada.
  No se creo prospecto ni presupuesto real; no prueba el calculo ni descarga.
- P2 DEFECT reproducido: portada -> demo Barra y Totem -> Pedir en barra de Citrus
  Mocktail (Sin Alcohol) confirma Pedido #42: Mojito, primero preparacion y luego listo.
  Es solo la demostracion comercial, NO la barra real del evento. El prospecto ve que
  su eleccion no se respeta. Codigo contrastado: ambos botones llaman
  handleSimularPedidoTrago sin argumento y el resultado tiene Mojito fijo,
  src/components/landing/LaAppDeTuFiestaSection.tsx:550,562,573; consumidor
  src/app/page.tsx:727. Correccion para Gemini: conservar nombre del trago elegido
  durante todos los estados de la demo; probar ambas opciones y un segundo pedido.

## Limite

Este documento se actualiza con los resultados del entorno aislado. Las visitas
publicas anteriores no constituyen aprobacion global ni recorrido interno completo.
- Al 28/09/2026, las pestañas de prueba `127.0.0.1:3300` para login, invitado,
  portal de cliente y barman muestran “No se puede acceder a este sitio”. Se clasifica
  como entorno local no disponible, NO como defecto de la app. Sin una sesión de prueba
  operativa, no se puede completar en esta pasada el recorrido interno autenticado.

## Recorrido aislado de cliente e invitado

- PASS: portal de invitado carga credencial, mesa, programa y accesos. Busqueda
  manual de mesa con la identidad ficticia "Lucia Fernandez" devolvio mesa 1.
- PASS limitado: barra del evento mostro el pedido ficticio "Gin con Pomelo" como
  listo al volver al portal despues de que el operador lo marco listo. Persistio
  tras recarga en el almacen JSON de respaldo local; no valida Firestore ni produccion.
- DEFECTO reproducido en portal cliente: el bloque de pendientes muestra el boton
  "Confirmar menu", pero al pulsarlo no navega ni abre contenido. En esta misma
  ejecucion no aparece la seccion "Menu e Itinerario". Codigo: el pendiente se
  agrega por `modulosContratados.catering` y apunta a `#catering` (page.tsx:852),
  mientras que la seccion solo se renderiza si `showCatering || showTimeline`
  (page.tsx:1031); `showCatering` se desactiva con `simplicityMode` (page.tsx:539).
  Contrastar en la tanda y con la configuracion real del portal antes de asignarlo
  a Gemini. No es un cambio implementado.
- NO CONTRASTADO: acciones que escriben desde el portal social. En el ensayo el
  envio del saludo devolvio "Firestore no disponible" porque el entorno local
  usa fallback JSON sin Firestore; por tanto no concluye nada sobre produccion.
- NO PROBADO: carga de fotos/recuerdos, confirmacion de asistencia desde invitacion,
  pagos reales, WhatsApp, Firebase/Firestore productivo, ni recorridos de hardware.
- DATO DE PRUEBA INCONSISTENTE: el registro aislado combina fecha 28/09/2026,
  160 asistentes en resumen, 61 registros de invitados y estado de evento concluido.
  No atribuir estos cruces a datos productivos; revisar primero el sembrado de prueba.
- NO VÁLIDO COMO PRUEBA DE AUTORIZACION: se abrio una ruta interna desde otra
  pestaña, pero ambas pestañas compartian la sesion local del organizador. No se
  uso un contexto de navegador limpio para verificar aislamiento cliente/invitado.

## Continuacion: web publicada y simulador

Entorno: https://akproducciones.uy/, exploracion de solo lectura el 28/09/2026.
El SHA exacto que sirve produccion no quedo visible; contrastar contra el deploy.

- PASS: navegacion principal muestra Inicio, Servicios, Simulador, Blog y Club Uruguay.
- PASS: portada abre el simulador. Se completaron los pasos de presentacion y llegada
  al paso 2; no se ingresaron datos ni se envio formulario para evitar crear un lead
  o guardar un borrador en produccion.
- PASS limitado: galeria publica inicia con 12 tarjetas; el boton anuncia el total que
  quedara despues de la siguiente carga (24 de 144), no el total actual. Tras cargar un
  lote, quedan 24 tarjetas y anuncia 36. No se probo la deduplicacion contra Instagram.
- PASS puntual de categoria: filtro Catering dejo elementos etiquetados como Catering;
  se abrio "Kebab gourmet para eventos" y foto/caption describen brochetas para
  recepcion. Esto refuta el caso puntual de kebab mal puesto en Decoracion, no valida
  la clasificacion del resto de las 144 imagenes.
- P2 FRICCION observada: al abrir el paso 1 y el paso 2 del simulador, el pie muestra
  `TOTAL VIGENTE: $0` antes de seleccionar servicios. Puede ser un estado inicial,
  pero presentado como total contradice el lenguaje de precio vigente y puede
  interpretarse como cotizacion gratuita. Validar despues de seleccionar el paquete
  en entorno de pruebas, sin enviar datos de prospecto.
- P2 CONFIANZA / copy observado en portada: indicadores publicos `+0 eventos`,
  `+0 anos`, `0% clientes satisfechos`, `0/7 soporte`. No se verifico su fuente ni
  si son contadores animados que no hidrataron. En produccion, contrastar dato real;
  ocultar los no disponibles en vez de mostrar cero.
- P2 CONFIANZA / copy observado en simulador: expresiones `garantia absoluta`,
  `cero fallas` y promocion `Club Uruguay 50% OFF`; no se verificaron legalidad,
  vigencia ni condiciones de la promocion. Mantenerlas solo con respaldo y terminos
  claros; no es una conclusion de falsedad.
- NO PROBADO: datos de contacto, fecha futura, calculo anual, precio/persona,
  paquetes, detalle de regalos y servicios, persistencia CRM, descarga PDF,
  compartir por WhatsApp, vista movil, analitica de conversion.

## Paginas de contenido publico

- PASS: encabezado de Club Uruguay presenta foto real del salon montado, titulo y
  acciones separadas para cotizar y coordinar visita. El recorrido visual lista tres
  imagenes/contextos del salon; no se probaron dimensiones movil ni links externos.
- OPORTUNIDAD P3: la pagina del salon solo comunica ciudad y frases genericas; no
  muestra capacidad, medidas, accesibilidad, estacionamiento, mapa/direccion precisa
  ni restricciones del lugar. Para una decision de visita/cotizacion, agregar solo
  especificaciones confirmadas por AK y enlazar mapa validado.
- PASS: Blog abre articulo, muestra imagen de portada separada del titulo, cuerpo,
  CTA al simulador/WhatsApp, compartir y preguntas frecuentes. No se envio contenido
  ni se verifico la accion final de compartir.
- PENDIENTE CONTABLE/GASTRONOMIA (Claude): el articulo de bebidas da cifras concretas
  de litros, tragos, hielo y rendimientos. No se validaron contra el criterio de AK;
  comprobarlas con responsable antes de usarlas como calculo de compras o promesa.
- PASS móvil 390x844: el menú hamburguesa abre y expone Inicio, Servicios, Galería,
  Simulador, Blog, Preguntas, Club Uruguay y Cotizá. No se detectó desborde horizontal
  en la portada (`scrollWidth` 384 <= viewport 390). Solo se verificó esta página y
  este tamaño; el árbol AX marco el botón inicialmente disabled, pero el DOM reportó
  enabled y el clic real abrió el menú.
- OPORTUNIDAD P3: en 390px la hero usa una foto concurrida detrás del título. El texto
  entra y los CTA son accionables, pero la lectura depende del oscurecimiento de la
  imagen; revisar contraste con fotos de otros eventos antes de aprobar todas las
  variantes.

## Tecnología en la portada: primer control de fichas

Entorno: `https://akproducciones.uy/`, navegador público, 28/09/2026. Despliegue sin SHA
confirmado. Código consultado en `origin/main` local (`621f41c`); no es prueba de identidad
con el código que sirve producción ni con la tanda pendiente.

- PASS parcial: desde la ficha inicial Fotocabina, se pulsó un botón visible de la fila
  (Muro Social en Pantalla Gigante) y cambiaron tanto la ficha como el estilo seleccionado.
- P2 REPRODUCIDO en PC (vista de 1274px): las primeras fichas del selector quedan
  recortadas fuera del viewport horizontal. En la sesión observada, el botón de
  Plataforma 360° tenía su rectángulo completamente fuera a la izquierda (x=-333..-120);
  Espejo Mágico también quedaba parcialmente recortado (x=-110..126). La ficha 360 y la
  de Espejo sí cambiaron al activarlas con teclado y mostraron contenido distinto, pero
  sus controles no quedaron plenamente visibles para elegirlos con puntero. No se probó
  en móvil. Reproducido en web publicada; SHA del despliegue y contraste con tanda siguen
  pendientes. Revisar alineación/posición inicial del carrusel sin ocultar tecnologías.
- PASS de carga/inventario (28/09/2026): cargué en secuencia las 144 tarjetas de la
  galería pública. Las 144 imágenes completaron carga sin errores; las 144 URL y los
  144 títulos son únicos en el DOM. Esto descarta duplicados exactos por URL/título en
  el lote publicado, pero no detecta archivos distintos con contenido visual repetido
  ni prueba deduplicación futura con Instagram.
- PASS puntual de imagen: “Kebab gourmet para eventos” carga una fotografía de brochetas
  de carne, coherente con su rótulo/categoría Catering, aunque el nombre del archivo
  contenga `boda-decoracion-dorada`. No marcar este caso como foto mal clasificada.
- PENDIENTE NO CLASIFICADO: con las acciones de puntero de este navegador automatizado,
  “Ver más fotos y videos” no avanzó; activarlo con Enter sí cargó 12 tarjetas cada vez.
  No atribuirlo a la web hasta repetir el clic con puntero humano/dispositivo real.
- P2 REPRODUCIDO, metadatos de galería: 117/144 tarjetas (81%) muestran títulos de
  inventario como `Img 035 P04 X1123`, no nombres que orienten al cliente. En el lightbox
  también aparece una descripción genérica (“Foto de decoración del catálogo…”). Ejemplo
  visual abierto: foto del equipo en el salón etiquetada Decoración; confirmar categoría
  con AK, no reclasificar por inferencia. En la copia `7724ec9`, los metadatos están en
  `src/data/catalogo-fotos.json` y los consume `src/components/landing/GallerySection.tsx`.
  El inventario no detecta repeticiones exactas de URL/título, pero no compara similitud
  visual ni duplicados con Instagram.
- NO CONTRASTADO CON LA TANDA: la copia disponible está en `codex/entorno-windows-94`,
  HEAD `f428d35c`; `origin/main` es `621f41c`. El selector de `origin/main` contiene
  `setSelectedStation` y `onClick`, pero esto no valida despliegue ni cambios pendientes.
- P2 CONFIANZA, observado en portada pública: se presentan contadores `+0 eventos`,
  `+0 años`, `0% clientes satisfechos` y `0/7 soporte`. No se identificó su origen ni
  se contrastó contra registros reales. Verificar fuente; ocultar un dato sin fuente o
  no disponible en lugar de mostrar cero. Repetido también en el resumen de web arriba;
  mantener una sola incidencia, no duplicarla.
- P2 CONFIANZA, observado en copy público: “cero fallas”, “garantía absoluta” y “menos
  proveedores, cero fallas”. No se probó ni se afirma que sean falsas; requieren respaldo
  y lenguaje compatible con el servicio real. Repetido en el resumen previo: no duplicar.

No se contactó WhatsApp, no se envió formulario ni se cambiaron datos productivos.

## Simulador público: entrada y paso de datos

Entorno: `https://akproducciones.uy/simulador-de-presupuesto`, 28/09/2026. Recorrido
de solo lectura hasta el paso 2; no se usaron datos reales ni se envió el formulario.

- PASS: la portada se abre y el botón “Comenzar mi presupuesto” lleva a “Paso 1 de 5”.
  El CTA visible “Cotizar mi fiesta en 2 minutos” lleva al formulario “Paso 2 de 5”.
- PASS limitado: al entrar al paso 2 se ven campos de nombre, WhatsApp, tipo de evento,
  adultos, niños/adolescentes, duración, salón y fecha. Se ven valores iniciales de 50
  adultos y 0 menores; no se validó si convienen como valores predeterminados.
- P2 FRICCIÓN (misma incidencia ya anotada arriba, no duplicar): tanto en paso 1 como
  paso 2 el pie muestra “TOTAL VIGENTE: $0” antes de seleccionar servicios. No se evaluó
  la exactitud del cálculo posterior.
- NO PROBADO: validación de campos/fecha, recomendación de paquetes, fotos de menús,
  cálculo anual, precio por persona, edición de servicios, resumen, CRM, PDF y WhatsApp.
  No se ingresó nombre ni teléfono para no crear o guardar un prospecto.
- PASS técnico acotado: no había errores ni advertencias de consola al inspeccionar
  el paso 2. Esto no sustituye E2E ni verifica Firebase o persistencia productiva.
- La prueba E2E `tests/e2e/simulator-budget-journey.spec.ts` en el `origin/main` local
  cubre el flujo y el PDF; no se ejecutó aquí y no equivale a haberlo observado en vivo.

## Video público: apertura y cierre

Entorno: portada pública en PC, 28/09/2026.

- PASS: “Testimonios de clientes satisfechos” abre modal con reproductor YouTube
  embebido y el video vertical renderiza imagen. “Cerrar video” cierra el modal y
  devuelve el foco al botón de reproducción.
- PASS técnico limitado: sin errores ni advertencias de consola observados durante
  este recorrido. No se verificaron todos los 143 medios ni la reproducción en móvil.
- Repetición de control en la misma URL pública, más tarde el 28/09: “Testimonios de
  clientes satisfechos” abrió un marco vacío (`about:blank`); “Clientes cuentan su
  experiencia AK” mostró el reproductor de YouTube pero permaneció cargando; “XV años
  Valentino” llegó a mostrar el video y la pantalla final. El filtro “XV Años” redujo
  la lista accesible a nueve tarjetas. Resultado parcial: reproducción intermitente en
  esta sesión; no se atribuye aún a código, porque el embebido externo/red puede influir.
  La observación posterior matiza el PASS anterior; no se probó móvil ni otros videos.

## Blog público: artículo de seguridad del salón

Entorno: web publicada, PC, 28/09/2026. Artículo abierto desde la portada; sin enviar
consultas ni usar botones para compartir.

- PASS: título, imagen principal, secciones, checklist, FAQs y botones de regreso/blog,
  WhatsApp y simulador están presentes; el cuerpo es legible y el artículo ofrece
  asesoramiento o simulador como siguientes pasos. No se comprobó envío externo.
- PASS: una reseña de la portada abre un diálogo legible con cita y CTA; cerrar vuelve
  a la página. La pregunta FAQ “¿Qué incluye el servicio integral?” se expande con una
  respuesta concreta de servicios. No se siguió el enlace a WhatsApp.
- P2 COPY/CONFIANZA: la idea principal dice que revisar potencia, acústica y seguridad
  “te garantiza” que todo funcione “perfecto sin riesgos ni cortes”. La propia lista es
  orientativa y no puede asegurar esos resultados. El CTA de simulación dice “base
  exacta”; tampoco se verificó que sea un precio contractual. Recomendar redacción que
  prometa ayuda a evaluar/reducir riesgos y a obtener una estimación, no garantía o
  exactitud contractual. Mantener pendiente de decisión/aprobación de AK.
- La información sobre habilitaciones y límites municipales de ruido aparece sin fuente
  oficial enlazada. No se verificó su exactitud normativa; no reutilizarla como asesoría
  regulatoria hasta contrastarla con una fuente de la Intendencia de Salto. Búsqueda
  oficial puntual encontró el Decreto 7.291/2021, que regula pirotecnia sonora; no prueba
  los límites de decibelios para música de salones que sugiere el artículo:
  https://juntadesalto.gub.uy/2021/07/decreto-no-7-291-2021/.

## Blog público: guía de bebidas

Entorno: web publicada, PC, 28/09/2026. Abierto desde la tarjeta destacada del índice.

- P2 COPY/CONFIANZA: presenta cantidades precisas (1,5 L sin alcohol/persona; 2 L por
  adolescente; 3–4 tragos por adulto; 1 kg de hielo por invitado) y un ajuste de 20%
  por calor, sin fuente, supuestos de duración ni perfil de consumo. El artículo afirma
  además que el stock queda cubierto al contratar la barra AK. No se validaron estos
  valores contra costos, operación ni catálogo real. Claude debe confirmar los números
  y el alcance del servicio; hasta entonces, marcarlos como orientación aproximada o
  retirar precisión/promesa. No completar compras ni cambiar el cálculo contable desde
  este artículo.
- PASS parcial: la página muestra secciones, checklist, FAQ, lectura relacionada y CTA;
  el contenido es accesible en texto. No se contactó a AK ni se probó el formulario/compra.

## Blog público: catering y tecnología

Entorno: web publicada, PC, 28/09/2026. Lectura de las guías desde el índice y enlaces
relacionados. Sin contactar a clientes ni activar CTA externos.

- P2 COPY/PRUEBA SOCIAL: la guía de catering presenta las islas como “la opción preferida
  para las quinceañeras en Salto” y dice que “la mayoría de los clientes de AK” elige la
  propuesta mixta, sin citar encuesta, fechas ni base observada. Validar con datos reales
  de pedidos/contratos; si no hay evidencia, cambiar a recomendación editorial claramente
  identificada como tal. No inventar porcentajes ni tratarlo como investigación de mercado.
- P2 SEGURIDAD: la guía de iluminación aconseja “chispas frías homologadas y seguras para
  interiores” de forma general, sin especificar equipo, distancia, condiciones del salón
  ni autorización. La información oficial de Bomberos consultada advierte que la
  pirotecnia puede causar incendios/lesiones, pero no certifica este producto ni su uso
  interior. Validar cada efecto con proveedor habilitado, ficha técnica y requisitos del
  salón/autoridad antes de prometer seguridad. Fuente consultada:
  https://www.gub.uy/ministerio-interior/comunicacion/noticias/causes-siniestros-fiestas-tradicionales.
- PASS limitado: las dos páginas cargan estructura, guía, checklist y accesos al simulador
  y asesoramiento; no se siguieron enlaces externos ni se verificó que el simulador incluya
  todos los equipos citados.

## Blog público: presupuesto y planificación

Entorno: web publicada, PC, 28/09/2026. Rutas públicas abiertas directamente desde enlaces
visibles en portada/blog; no se enviaron datos.

- PASS: la guía de presupuesto explica servicios, regalos, seña, saldo, vigencia e ítems
  para comparar. La guía de organización prioriza fecha, invitados y prioridades; la guía
  de menú pide separar adultos/menores y considerar precio por persona/costo. Sus checklists
  son legibles y concretos.
- P2 COHERENCIA: la guía de presupuesto dice que el ajuste para años futuros “se revisa al
  confirmar o actualizar la propuesta”, mientras la solicitud aprobada de AK pide que el
  simulador muestre aparte el precio actual y la proyección anual del año elegido. Contrastar
  el copy con la versión/entrega activa y el comportamiento actual antes de ajustar texto;
  esta pasada no probó el cálculo del simulador.
- P2 COPY/COSTOS (misma línea catering): la guía menú formal/islas asegura que el formato
  reduce vajilla/mozos y costos operativos; resultado depende de aforo, montaje y servicio.
  Validar con Claude contra costeo real y no vender ahorro garantizado. También queda
  pendiente validar las afirmaciones de preferencias de catering ya anotadas arriba.
- PASS limitado: las dos guías recientes de planificación y menú abren; no se crearon
  prospectos, no se guardaron cotizaciones y no se completó compra/contratación.

## Entrada al simulador desde una categoría de evento

Entorno: web publicada, PC, 28/09/2026. Recorrido sin completar datos personales ni
enviar el presupuesto.

- PASS parcial: la tarjeta “Bodas” de la sección de servicios abre el simulador en
  `/simulador-de-presupuesto?tipo=boda` y permite avanzar hasta el paso 2.
- P2 REPRODUCIDO: en el paso 2, “Tipo de evento” aparece con “Cumpleaños” aunque la URL
  todavía contiene `tipo=boda`. No se eligió una fecha, no se completó el formulario y
  no se confirmó si el cálculo final cambia. En la copia auditada (`f428d35c`),
  `src/components/landing/ServicesSection.tsx` envía el parámetro `tipo` para las cuatro
  categorías; `src/app/simulador-de-presupuesto/page.tsx`, en `normalizePrefillEventType`
  y su consumidor, solo lee `eventType`. Es una discrepancia comprobada en esa copia y
  coherente con la reproducción en la web publicada; SHA del despliegue y rama de tanda
  siguen sin confirmar. Control positivo: al abrir la web publicada con
  `?eventType=boda`, el paso 2 sí preseleccionó “Boda”. No se probaron en vivo las otras
  tres categorías ni el cálculo final.
- No se observó un prospecto creado: nombre y teléfono quedaron vacíos; no se continuó
  ni se envió el formulario. SHA de producción y tanda de trabajo sin confirmar.

## Demostración pública de tecnología para clientes

Entorno: portada publicada, sección “La app de tu fiesta”, PC, 28/09/2026.

- PASS: los controles “Menú & Platos”, “Música elegida” y “Mural de Deco” cambian el
  contenido de la muestra. La demo identifica “15 de Camila (Muestra)”, “Modo seguro” y
  declara que no publica ni emite mensajes reales. La vista muestra cada estado esperado
  (propuesta gastronómica/adaptaciones, canciones para DJ y paleta/fotos de decoración).
- PASS: los cinco controles narrativos “Antes”, “Invitación”, “Durante”, “Barra y tótem”
  y “Después” sustituyen el encabezado principal por una explicación distinta para cada
  etapa (portal cliente, invitación/RSVP, mural, carta de tragos y álbum).
- Alcance: se valida solo la interactividad demostrativa pública. No prueba sincronización,
  permisos ni contenido de portales reales de cliente/invitado.
- PASS limitado: la pregunta “¿Cómo reservo mi fecha?” de FAQ expande y muestra que la
  reserva se asegura mediante una seña, tras una entrevista. No se contactó a AK ni se
  validaron importes o condiciones comerciales.
