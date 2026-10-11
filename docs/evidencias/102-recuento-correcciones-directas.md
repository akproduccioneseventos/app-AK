# Recuento y correcciones directas - Codex102 (11/10/2026)

## Version y alcance

- Base contrastada: main `99faf4eb061fa46341cfdde6f81b93b3bfb9c73c`.
- Primer codigo congelado: `4c4656d3fb497f00297725059fda5227e979779b`.
- Extension por defectos de sus consumidores: `99ecda4a`, `a6d20861`.
  No trasladar automaticamente las pruebas4c a estos commits.
- Rama: `codex/auditoria-97-ia-contexto-20261011`; PR1288, sin fusionar.
- Autorizacion nueva del dueno: corregir directamente, usar agentes economicos.
  No sustituye aprobacion de cambios de negocio, fusion o datos reales.
- Se reutiliza el recuento84 y evidencias88-101: no se vuelven a ejecutar
  recorridos sin cambios solo para aumentar el numero de pruebas.

## Corregido directamente

| Defecto real | Cambio acotado | Evidencia disponible |
| --- | --- | --- |
| Un fallo de Query.get en fiestas se convertia en vacio/local JSON y hacia parecer inexistente un portal valido | throwOnError optativo en lector compartido, exigido por leerColeccion de fiestas; no fallback tras fallo de base | 16 pruebas: frontera Query.get -> lectores reales -> portal/fechas; conservan vacio verdadero y modos locales/build |
| El decoder no leia el PNG UUID exacto101, aunque era valido | Reintentos del archivo a90/180/270 despues del fallo original; no cambio de token, PNG, camara o checkInGuest | Prueba permanente PC/movil2pass y pantalla real+SDK103 ocho casos: cuatro formatos, entrada y reentrada sin duplicar |
| Chat secundario pendiente impedia pintar fotos aprobadas del mural | Primarias renderizan sin esperar secundarias; guardas de generacion/montaje y bloqueo de peticiones hasta su final real | Sonda falla contra main y pasa corregida; 19 pruebas/4suites, mas navegador103 cuatro casos de vacio/foto PC/movil sin overrideCSS |
| Cupones vencian antes del final del ultimo dia del negocio | Limites por dia de Uruguay, hora de inicio explicita conservada y fecha imposible rechazada | Siete casos pasan tanto TZ=UTC como America/Montevideo; sin cambiar descuento ni contador de usos |
| Reintentar en el portal repintaba el mismo error de Server Components sin otra lectura | Recarga del mismo enlace publico, sin modificar datos ni enviar al administrador | Reintento4c falla PC/movil; navegador104 sobrea6: cuatro pruebas pasan, distingue inexistente de fallo real y recupera dejando SDK intacto |

Commits fuente: `a9c22bb7`, `284747af`, `3e6dd842`, `4c4656d3`, `99ecda4a`, `a6d20861`.
Cupones extendido: selector de regalos/etiquetas usan regla comun, fecha de
calendario y de uso distinguida; Nuevo recalcula hoy al abrir en Uruguay y no
mantiene la fecha UTC del arranque. Nueve casos de reglas/selector y cuatro
casos del componente de ajustes pasan; click real del error de portal pasa.

## Validacion, sin convertir presencia de codigo en aprobacion

- TypeScript completo: exit0 sobre `4c4656d3` (y antes sobre3e6).
- Acentos: 2754 archivos, exit0.
- Regresiones relacionadas previas: 32 pruebas en cinco suites pasan.
- Primera corrida general: 683/686 suites y4117/4120 pruebas pasan. Tres
  fallos: cupon real, test de permisos con Firestore no aislado, contrato de
  mural que esperaba nombres anteriores. No se presenta esa corrida como verde.
- Los tests de permisos y contrato se ajustaron sin relajar permiso alguno:
  15 pruebas focalizadas pasan. El mural ademas tiene prueba de comportamiento.
- Corrida general final: 686/686 suites, 4122/4122 pruebas, exit0 sobre4c4656d3.
  Resumen con SHA y hash del JSON completo en102-jest-resumen.json.
- Corrida general de la extension completa104:688/688suites,4129/4129pruebas,
  cero fallidos/omitidos, exit0 sobrea6d20861. Resumen104-jest-resumen.json y
  JSON entero en104-jest.json.gz con hashes, no un resumen inventado del log.
  Se ejecuto en copia propia sin credenciales reales, sin emuladores activos;
  ningun dato del negocio se usa ni modifica en esta regresion.
- Formas nuevas que mienten: exit0. Trinquete: baja132->125 en codigo sin prueba
  de resultado; no equivalente a125 errores reales ni a aceptacion completa.
- Build4c completo: exit0, lint y tipos SIN desactivar comprobacion; avisos
  existentes y de mocks de tests documentados, no afirmacion de cero avisos.
- Navegador4c+SDKdemo103: QR8pass (cuatro formatos por PC/movil, entrada y
  reentrada sin duplicar); fechas2pass; mural4pass (vacio/foto, PC/movil,
  medidas sin overrideCSS). Se cierra la incertidumbre visualPC de101 para ese
  criterio, no una aprobacion estetica de toda la app.
- Portal4c: inexistente2pass; reintento real2fail. No ocultar este hallazgo
  detras de los16 Jest del lector. Fuente99ec solicita recarga; navegador104
  sobrea6:4pass, recupera con boton visible y conserva exactamente el documento.
- Compilacion final104 de a6d20861: exit0, tipos/lint comprobados sin omitirlos.
  Health confirma ese mismoSHA compilado; serviciosfalse son intencionados en
  el entorno demo sin cuentas reales, no un diagnostico de produccion.
- 3D4c: WebGLtrue y canvas0 PC/movil, errorReactCurrentBatchConfig;2fail.
  Cuatro pruebas de geometria y el test que admite fallback NO cierran escena.
  Prototipo de compatibilidad en copia privada separado, no aceptado/publicado.
  React19/Fiber9/Drei10 requerian tambien DayPicker9/QR4. El typecheck real
  con4096MB termino exit1: consumidores de QR sin export default, calendario
  incompatible y componentes con props inferidas como never. El lock heredado
  tampoco resolvio sin ERESOLVE; prepare no admite.git de un worktree. No se
  integran estos cambios ni se fuerza npm ni se ocultan los errores de tipos.
  El intento inicial del agente con heap por defecto termino sin memoria; NO
  prueba defecto de la app. El segundo si produjo los diagnosticos anteriores.
- Revision separable por agente economico: inventario (se descarto su falso
  positivo149), QR, geometria3D, primer borrador mural y revision final QR/mural.
  El director corrige y valida; ningun borrador fallido se publica como terminado.
- Graphify final: npm run graphify:update exit0; AST sin API/LLM,
  13603nodos/42342relaciones/838comunidades,2515archivos reextraidos.
  25 avisos del parser no son errores TypeScript. Documentos semanticos se
  omiten, etiquetas de comunidades por sus hubs y HTML omitido por tamano.
  Grafo local generado; no afirmar que el JSON ignorado se subio a GitHub.
  Solo script de desarrollo cambiado despues del codigo compiladoa6; fuentes,
  dependencias y comando build de produccion son iguales a la version verificada.

## Lo anterior que sigue aceptado (no reabrir por el historial)

- 88: controles135-138,112 comprobaciones y28 casos financieros/14E2E.
- 89: color del portal PC/movil persistido por SDK.
- 92: comida/compras, documentos A4 y archivo de video/HTTP bytes.
- 93: recordatorios HTTP sin envio real, barra entregada y stock10->8.
- 94: album/reintento, foto real/pixeles, recibos, QR revocado, llegada y cocina.
- 97: chat real/API/SDK y aislamiento de historialesA/B, sin tarea inventada.
- 98: voz cancelacion/reintento, lector fotos/error/vacio, Touchpix real y espejo
  pendiente de moderacion excluido del mural, sin duplicacion al recargar.
- 101: IA149 SDKalias/nativo/control y respaldo de FiestaA sin informacionB;
  ese resultado es correcto. No repetirlo como supuesto defecto nuevo.

## Huecos reales de aceptacion

1. Salon3D: escena NO acreditada; reproduce fallo en compilacion con WebGL
   disponible, no una falta de GPU. Sin actualizacion verificada no esta resuelto.
   El candidato React19 NO paso y no se publica en esta propuesta.
2. Los19 originales manuales, cuentas/integraciones reales, Hosting mismoSHA y
   hardware se comprueban con sus datos/entorno. No inferir que faltan fiestas
   por JSONlocal0 o gRPC7, ni declarar sincronizacion real por una pantalla.

## Incidentes de QA (no errores nuevos de la app)

-102: TSC/Graphify/Nextdev simultaneos agotaron memoria; se detuvieron procesos
  propios y se paso a validaciones secuenciales. Dos suites no completaron su
  recorrido; no se cuentan como pass ni como defecto nuevo sin reproduccion.
- Se habia lanzado dates junto con portal, compartiendo bandera/configuracion:
  se detuvo dates y queda registrado el error de coordinacion del auditor.
- La copia TEMP102 luego contenia solo.git; guardas impidieron ejecutarla.
  Causa no establecida, no atribuida a app ni a otra IA. Copia103 nueva fuera
  de TEMP, sin credenciales reales y con SHA fijo.
- Limpieza102: un intento de Storage sin emulador fallo;102 no subio archivos.
  Se limpiaron solo fixtures propios y se detuvo Java demo identificado.
- Jest escribe avisos/preferencias ficticios en esta copia local; esos cambios
  no forman parte de la PR ni de los datos reales del negocio. Se restauraron
  solo los efectos propios identificados, comprobando que no hubiera otra delta.
- El reporter QR usaba una ruta relativa repetida; se reubico su JSON sin
  cambiar el resultado y se corrigio la configuracion para futuras corridas.
- El graphify:update anterior requirio llaveLLM por dos documentos y fallo.
  Se corrige su modo habitual a --code-only y el comando completo SI pasa,
  sin API pagas ni dependencia nueva de produccion. No es analisis semantico
  del manual; la memoria compartida conserva esas decisiones por separado.
- Una primera unidad del portal importo una biblioteca inexistente y luego
  intento redefinir location inmutable de jsdom: errores propios de QA. Usa
  ahora ReactDOM existente; la limitacion de navegacion de jsdom se contrasta
  con navegador real, no se vende esa unidad como recuperacion del servidor.
- La primera sonda3D importaba pngjs ausente: no corrio ningun test. Se reemplazo
  por lectura nativa de pixeles de canvas, sin nueva dependencia de produccion;
  luego SI se reprodujeron los dos fallos reales (WebGL disponible/canvas0).
-104: entorno cerrado; portal conserva documentoSDK exactamente antes/despues.
  Las pruebas retiran sus fixtures; limpieza posteriordeleted[] y conserva
  doce documentos automaticos demo no creados como fixture del recorrido.
  Ninguna publicacion/mensaje/cobro real. El exit1 al detener el runtime es
  intencionado; no es un fallo del recorrido ni una compilacion rechazada.

## Veredicto

Cinco grupos de defectos corregidos en fuente con evidencia, no un certificado global de cero
errores. Los pendientes se cierran por su resultado observable, no por repetir
auditorias, sumar tests o encontrar un simbolo en Graphify.
