# 150 - Viaje comercial movil: preparacion QA

Estado final: EJECUTADO enmain7230/build135.1PASS Pixel7,0fallos/omitidos,
36segundos. PASS_COMMERCIAL_MOBILE_MAIN_JSON_ONLY. NoSDK/produccion.
Ver150-consolidado.json. Tres intentos previos fallaron por la sonda: columna
CRM plegada (ya conocida136), comparacion de metadatos que se regeneran y
normalizadorQA con nombre de propiedad incorrecto. Todos preservados, NO bugs.

## Fuente y alcance

- Principal identifico1337fuente45a0b1d4783ad58846c2e2d07ad8f318287024bf y
  base860aa8c2641a6b8af3806bae08011dffa6276c80. La nota inicial del agente
  que calificaba eseSHA como ambiguo queda descartada: era unSHA completo
  valido y disponible en objetosGit. El viaje movil se ejecuto deliberadamente
  sobremain7230f9d02b32805952a185f704a0208bd5d643e6/build135, NO sobre45a0.
- `docs/evidencias/133-simulador-whatsapp.md` registra el viaje de escritorio con Facebook UTM, prospecto/presupuesto y contacto interceptado; móvil fue omitido. `docs/evidencias/136-viajes-sin-prueba-vigente.md` confirma que 133 no cubre persistencia CRM desde móvil y advierte no duplicar el recorrido completo del simulador/PDF.
- No rehacer viajes PC, CRM general (136) ni cliente (141). El delta aquí es el mismo trayecto comercial en viewport móvil, con marcadores ficticios únicos, atribución Facebook, captura del presupuesto y comprobación del prospecto tras recargar CRM.

## Compatibilidad que debe resolver el director

- La preparación es parametrizable para un proyecto Playwright cuyo nombre sea `chromium-mobile`; `AK_COMERCIAL_PROJECT` permite sustituirlo si QA143/135 usa otro nombre. **No usar hasta confirmar que runtime, configuración de aislamiento, datos sintéticos y helper de sesión son los mismos** que la QA aprobada que se pretende reutilizar.
- Referencias de QA existentes: `docs/evidencias/143-playwright.config.ts` define `chromium-utc` y `chromium-uy`, no móvil; el recibo/configuración 135 y su build deben contrastarse con la fuente congelada solicitada. No asumir que 143 es el runner de este viaje.
- No se da por vigente ni obsoleto ningún recibo 135/143 respecto a `1337codigo45a0`; falta el contraste del principal contra todos los consumidores en `45a0` y la base `860`.
- El principal elimino falsosPASS: descarga y ambos contactos son OBLIGATORIOS,
  no opcionales por isVisible. PDF descargado2paginasA4,20servicios completos,
  total84838 yvalorporpersona, renderizado/revisado. Enlace dentro de pagina,
  margen derecho40.31pt. No repetirPC: este es el caso movil antes omitido.

## Límites de ejecución y datos

- Prohibido en esta preparación: servidor, navegador, Playwright, Java, build, compilación o modificación de fuentes QA. La RAM disponible indicada es 600 MiB; el director ejecutará serialmente si confirma viabilidad.
- El spec requiere `AK_ENTORNO_AISLADO=true`, perfil de proyecto móvil y runtime que garantice escritura sintética. Si hay credenciales reales, aislamiento no verificable, helper incompatible o consumidores no contrastados, detener antes de ejecutarlo; no sustituir por mocks que produzcan PASS ficticio.
- `Date.now()` más sufijo aleatorio genera nombre/campaña únicos; el teléfono usa un valor ficticio. No tocar cuentas o registros reales.
- La recarga durable se valida en CRM con nombre y origen Facebook después de navegar y de recargar. No inferir que el documento del presupuesto sobrevivió una recarga desde que el resumen lo mostró.

## Selector real y aceptación pendiente

Basado en consumidor 133 existente y símbolos hallados en el checkout actual (no atribuidos aún a 45a0): `simulator-cover-start`, `#simulator-name`, `#simulator-phone`, botones `Continuar`, `Mantener mi selección actual`, `Ver Resumen y Propuesta`, `Compartir WhatsApp`, `Coordinar Reunión`; ruta CRM `/contabilidad/crm`, encabezado `CRM de Prospectos`, placeholder `Buscar por nombre, teléfono, salón`; helper real `ponerSesionDelEquipo` de `tests/e2e/helpers/fiesta-de-prueba.ts`. El test usa proyecto móvil configurable `AK_COMERCIAL_PROJECT`.

- CERRADO solo este viaje movil de fuente7230: presupuesto/prospecto unicos,
  origenFacebook/campanaUTM, PDF y2contactos interceptados, CRMtrasrecarga y
  documentos persistentes. Se excluyen SOLO timestamp e IDs internos de
  renglones, que el recalculo regenera; se exige igualTODO el contenido restante.
- QA135 restaurada61JSONprimer nivel;4archivos cambiados restaurados, diff0,
  servidor/navegador terminados. No Firebase/Google/WhatsApp/modelo externos.
- No probar este resultado contra1337: esa fuente requiere otra compilacion.
  Queda preparado150-entorno para su propio build/test, sin cambiar la app.

Comprobado: docs/evidencias/150-comercial-movil.spec.ts ejecutado enlas rutas
/simulador-de-presupuesto y/contabilidad/crm de7230. Recibo150-comercial-
aceptacion-execution.json, fuente del test SHA256d1666b5b7a130e4bd77bb26d3ab2873162d19685913f786021bdaf667503ae10.
La funcion SimuladorContent mencionada por el borrador NO fue verificada como
simbolo: no usar esa etiqueta para programar. Esta nota no es una orden de app.
