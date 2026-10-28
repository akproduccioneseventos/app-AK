# Decoraciones AK: biblioteca y propuestas del catalogo

## Autorizacion y base
- El 28/10/2026 el dueno autorizo expresamente a Codex a implementar esta tarea:
  "ya hacelo tu con todas las decoracion del catalogo y audita que funcione se sincronice solo".
- Aclaro que tambien incluye fotos de decoraciones nuevas que vayan surgiendo.
- Base main: `0abe9199ddb7281a945fd0f000a1a89f25b8fa8e`.
- Rama: `codex/758-decoracion-plantillas-automaticas`. No fusionar: Claude revisa y fusiona.
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
  maximo 20 intentos/dia y presupuesto IA existente. El modulo procesa hasta tres
  por apertura; puede continuar con Procesar siguiente. Un error queda visible,
  no se reintenta ciegamente ante resultado incierto.

## Evidencia en curso
- Primer control: 20 criterios PASS; prueba UI no ejecutable por usar una libreria
  que NO esta instalada. Se preserva `decoracion-758-tests.json`; fue fallo QA, no app.
- Se reescribio UI con ReactDOM existente, sin instalar dependencias:
  `decoracion-758-tests-v2.json`: 3 suites, 25 criterios PASS, 0 FAIL.
- SDK real al emulador, fotos/IA/consumo controlados: prueba preparada separada,
  exige proyecto demo y no credenciales. No marcar aprobada hasta ejecutarla.
- Navegador: galeria, biblioteca y canvas reales con transporte ficticio; no es
  una llamada Next autenticada ni un proveedor externo. Primer intento timed out
  esperando el boton; sin diagnostico de app. Arnés ajustado para el entorno Next.
- TypeScript completo: intento 2048MiB termino por limite de heap; intento3072
  detenido para no solapar una compilacion ajena. NO son certificados de tipos.

## Limites que se deben conservar
- Esto produce composiciones 2D aproximadas, NO 86 modelos 3D geometricos exactos.
  Los pixeles NO prueban medidas fisicas, inventario, precio ni disponibilidad.
- No se ejecutaron sincronizaciones Meta reales ni analisis pagos de fotos del negocio.
  El ingreso automatico depende del conector y cron existentes; no se certifica su despliegue.
- Los elementos desconocidos NO se agregan solos al stock ni como modelos inventados.
- Pruebas ficticias no sustituyen la aprobacion visual de cada decoracion propuesta.
- Sin fusion, datos reales, mensajes, pagos ni dependencias nuevas de produccion.
