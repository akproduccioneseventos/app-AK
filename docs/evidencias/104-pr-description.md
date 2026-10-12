## Descripcion del Cambio

El dueno autorizo correcciones directas. Se conserva esta PR existente, sin
fusionar ni abrir otra. Se contrasta main99faf4eb, se reutiliza el historial
84/88-101 y se documentan resultados observables, no aprobaciones por simbolos.

- Lectura de fiestas: una consulta fallida no se transforma en vacio/JSON local.
- QR: reintentos por orientacion del archivo, sin cambiar token/PNG/camara/llegada.
- Mural: contenido primario pinta sin esperar chat; respuestas viejas descartadas.
- Portal: Reintentar solicita una lectura nueva del mismo enlace, SDK intacto.
- Cupones: dia de Uruguay en reglas, regalos, etiquetas y Nuevo; importes intactos.
- Graphify: actualizacion AST local por defecto, sin llamadasLLM ni API pagas.
- Recuento/registro compartido actualizados; evidencia completa comprimida y
  resumen con SHA/hash para no leer miles de resultados en cada chat.

## Tipo de Cambio
- [x] Correccion de errores
- [ ] Nueva funcionalidad comercial
- [ ] Refactorizacion ajena al alcance
- [x] Documentacion / configuracion de herramientas de desarrollo

## Lista de Verificacion
- [x] TypeScript validado en build completo de fuentea6d20861.
- [x] Lint validado en ese build; avisos existentes documentados, no cero avisos.
- [x] Graphify actualizado con extraccion local del codigo y comunidades.
- [x] Pruebas en Next production build + emuladores demo sin credenciales reales.
- [x] Regresion general:688suites/4129pruebas pasan, sin fallidas ni omitidas.
- [x] Acentos y controles de nuevas formas/deuda pasan.

Validaciones: build104 de a6d20861 (tipos/lint habilitados), Jest104 sobre esa
fuente y portal4pass PC/movil, inexistente vs fallo y recuperacion con SDK intacto.
QR8pass/fechas2pass/mural4pass en103 fuente4c; esos consumidores no cambiaron
despues. El cambio posterior del manifest SOLO afecta graphify:update, no
dependencias ni build de produccion. No traslada la aprobacion a toda la app.

## Impacto en Firebase
- [ ] Cambia reglas de Firestore / Storage
- [ ] Modifica Cloud Functions
- [x] Modifica frontend y acciones de Next (requiere publicar la version)
- [ ] Requiere nuevas variables de entorno en produccion

## Pendientes Y Limites

Salon3D sigue fallando con WebGL disponible. El candidato React19/Fiber9/Drei10
no paso tipos/lock; no se integra ni se fuerza npm. Una foto fallback no aprueba3D.
19 originales manuales, cuentas reales, modelos pagos, Hosting del mismoSHA y
hardware requieren su comprobacion autorizada. No se tocaron datos reales.
Las pruebas no demuestran cada boton ni todas las variantes de cada pantalla.

Ver `docs/evidencias/102-recuento-correcciones-directas.md`,
`docs/evidencias/104-jest-resumen.json`, `docs/YA-RESUELTO.md` y `ESTADO-ACTUAL.md`.
Esta PR queda ABIERTA para revision del dueno; no es certificado de cero errores.
