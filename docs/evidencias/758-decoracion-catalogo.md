# Decoraciones AK: biblioteca y propuestas del catalogo

## Autorizacion y base
- El 28/10/2026 el dueno autorizo expresamente a Codex a implementar esta tarea:
  "ya hacelo tu con todas las decoracion del catalogo y audita que funcione se sincronice solo".
- Aclaro que tambien incluye fotos de decoraciones nuevas que vayan surgiendo.
- Base main: `0abe9199ddb7281a945fd0f000a1a89f25b8fa8e`.
- Rama: `codex/758-decoracion-plantillas-automaticas`. No fusionar: Claude revisa y fusiona.
- Entrega: [PR1372](https://github.com/akproduccioneseventos/app-AK/pull/1372), abierta/borrador.
- PR1370/1371 son otras entregas; no se copiaron sus ramas ni se dan por aprobadas.
  NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.

## Entrega
- Los 86 PNG actuales de `01_IMPORTAR_APP`, 14 categorias, se importan sin alterar
  sus bytes. Manifiesto con SHA256, dimensiones en pixeles y procedencia; 19.548.856 bytes.
  No se importa `02_HISTORIAL_NO_IMPORTAR` ni las planchas de previsualizacion como objetos.
- Biblioteca existente + piezas AK, busqueda, favoritos, proporcion, movimiento,
  escala y tinte conservando la transparencia. No se guardan 86 base64 en cada fiesta.
- Catalogo y galeria categorizados como decoracion alimentan borradores separados
  de las plantillas aprobadas. Ingreso por foto de catalogo/galeria, cron de redes
  y apertura del modulo. El cron sin clave solo reconcilia, no inicia IA de decoracion.
- El analisis usa la foto original y una plancha visual de los 86 objetos reales.
  Solo propone correspondencias conocidas; lo desconocido queda listado para revisar.
  La foto de referencia NO se aplana como fondo de los objetos editables.
- La revision permite corregir posiciones, escala, color y composicion antes de
  aprobar. Solo administracion u organizacion pueden procesar/aprobar/descartar.
- Los aprobados reaparecen en la galeria real de plantillas y se pueden aplicar a
  otra fiesta. Eliminar una plantilla importada la descarta, no vuelve a crearse en el siguiente sync.
- Identidad por ruta normalizada, no por nombre/telefono/fiesta. Copias con los
  mismos pixeles normalizados no vuelven a consumir analisis ni publican otra plantilla.
  No se afirma deduplicacion perceptual de dos fotos distintas o recomprimidas.
- Reserva transaccional antes del proveedor, un trabajo por vez entre instancias,
  maximo 20 intentos/dia y presupuesto IA existente. Cada galeria intenta hasta tres
  por apertura; puede continuar con Procesar siguiente. Un error queda visible,
  no se reintenta ciegamente ante resultado incierto.

## Evidencia final del alcance
- Fuente de la entrega: `b5aac424d83d00009d367bb58d8c74ee8f8d4f24`.
  No se modificara la app en los commits de recibos posteriores.
- TypeScript completo termino con exit0 tras corregir una anotacion de tipo
  de Sharp en la plancha de objetos. Lint focalizado exit0, cuatro advertencias
  (imagenes originales y dependencia deliberadamente acotada del efecto de cola).
- Prueba de regresion final: 11 suites, 63 criterios PASS, 0 FAIL, 0 omitidos.
  Incluye nuevos elementos, rutas de imagen, propuestas, revision UI, lectura
  segura de fotos y plancha real, autoguardado, limite de IA y galeria existente.
- SDK Admin real / emulador Firestore demo: 3 criterios PASS, 0 FAIL, 0 omitidos.
  Se probaron creacion concurrente, una sola llamada al proveedor doble,
  aprobacion reintentada, lectura del consumidor real de plantillas, edicion
  persistente y misma foto bajo otra ruta sin otro analisis. Fotos/IA/consumo y
  autenticacion son dobles controlados, no un proveedor pago ni sesiones reales.
- Navegador Chromium PC y Pixel7: 2 recorridos PASS. Galeria, biblioteca y lienzo
  reales; mover una pieza, tintar, escalar, aprobar, recargar y aplicar conservan
  los valores. Imagen cargada y pieza dentro del lienzo, sin desborde horizontal.
  Transporte de acciones y persistencia del arnes son dobles locales. NO es
  una prueba HTTP Next autenticada ni prueba de modelo/proveedor externo.
- La inspeccion visual detecto recorte inicial en movil de la nueva pantalla;
  se agrego autoajuste optativo, sin cambiar el zoom inicial de las pantallas anteriores.
  Las cuatro capturas finales se revisaron por imagen (PC/movil, revision/aprobada).
- Originales de recibos y fallos QA preservados comprimidos, con hashes en
  `758-qa/manifest.json`. Los criterios de corridas anteriores NO se suman otra vez.

## Historial QA conservado
- Primer control: 20 criterios PASS; prueba UI no ejecutable por usar una libreria
  que NO esta instalada. Se preserva `decoracion-758-tests.json`; fue fallo QA, no app.
- Se reescribio UI con ReactDOM existente, sin instalar dependencias:
  `decoracion-758-tests-v2.json`: 3 suites, 25 criterios PASS, 0 FAIL.
- SDK inicial rechazo una propiedad inexistente del objeto Firestore en el arnes;
  se corrigio a la identidad del Admin app/proyecto. No fue defecto de app.
- Navegador: galeria, biblioteca y canvas reales con transporte ficticio; no es
  una llamada Next autenticada ni un proveedor externo. Primer intento timed out
  esperando el boton; sin diagnostico de app. Arnés ajustado para el entorno Next.
- TypeScript: intento2048MiB termino por heap; intento3072 detenido al aparecer
  otra compilacion. El intento4096 encontro una anotacion incompatible de Sharp,
  se corrigio y el control siguiente termino exit0. No se ocultaron los intentos fallidos.

## Limites que se deben conservar
- Graphify se actualizo sin LLM:25663 nodos/72059 relaciones.27 avisos del parser
  son extracciones parciales, no errores de TypeScript. El grafo local completo
  no se agrega como dependencia: se comparte el modulo y vecinos directos en
  `758-qa/decoration-graph.json`, para que otras IA ubiquen los consumidores.
- Se reutilizaron las dependencias locales, sin `npm ci` limpio. Las versiones
  directas verificadas coinciden con lock: Next15.5.27, React/ReactDOM19.2.8,
  Sharp0.35.5, Genkit1.20.0 y TypeScript5.9.3. No es verificacion de todas las transitivas.
- Esto produce composiciones 2D aproximadas, NO 86 modelos 3D geometricos exactos.
  Los pixeles NO prueban medidas fisicas, inventario, precio ni disponibilidad.
- No se ejecutaron sincronizaciones Meta reales ni analisis pagos de fotos del negocio.
  El ingreso automatico depende del conector y cron existentes; no se certifica su despliegue.
- Los elementos desconocidos NO se agregan solos al stock ni como modelos inventados.
- Pruebas ficticias no sustituyen la aprobacion visual de cada decoracion propuesta.
- Sin fusion, datos reales, mensajes, pagos ni dependencias nuevas de produccion.
