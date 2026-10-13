# Codex105 - salon3D y regresiones de sus dependencias

Estado: criterios de esta tanda aprobados. NO cierre global ni certificado0errores.
PR1288 abierta; NO fusionar automaticamente. Rama:
`codex/auditoria-97-ia-contexto-20261011`.

## Cierre comprobado (prevalece sobre los antecedentes inferiores)

- Fuente app a33a54d91bf704f52fe11d1afbc956ebd8e819a5; build y Jest de esa fuente.
  Harness e7f5e7fccf94af5aa8ff7ef8ae006f8b4eef0773 SOLO corrige un selector
  E2E (Cola de Mensajes es un enlace). git diff a33..e7 devuelve un tests/e2e,
  sin cambios de app/dependencias. Corredor verifica esta igualdad antes de E2E.
- Tipos exit0; acentos2765archivos exit0;690suites/4135tests0fail/0omitidos,
  387.56segundos. JSON comprimido, SHA256 y resumen en105-jest-resumen.json.
- Build canonico exit0: generadorSW/build-next-with-memory, tipos/lint/PWA activos,
  sin FIREBASE_APP_HOSTING para omitir controles. AK_DISABLE_STANDALONE=true SOLO
  QA local: NO acredita empaquetado ni publicacion Firebase. Avisos conservados.
- Health confirma a33 compilado. Flags servicios false por configuracion ficticia;
  no son prueba de cuentas reales ni acreditan solos la lectura SDK del emulador.
- Navegador22pass/0fail/0skip/0flaky, PC/Pixel7 emulado, app compilada a33:
  3D4: reunion/vista cliente, canvas real>100px,>20colores, mouse/tactil mueve camara.
  Calendarios4: flechas sin solapamiento, seleccion/navegacion, accesos en viewport.
  QR4: PNG descargado, lectorSDK real, llegada y relectura sin duplicar.
  Mural4: vacio/foto aprobada, imagen cargada sin CSS forzado, SDK real.
  Fechas2: falla Query.get, aviso del asistente y recuperacion sin guardar presupuesto.
  Portal4: inexistente vs outage, Reintentar recupera; documento antes/despues igual.
- SDK tests reutilizan102/101 con guardas adaptadas al candidato propio; Firestore
  demo127.0.0.1:8085. Corte SOLO en Query.get de fiestas cuando bandera QA existe,
  resto SDK real. No toca cuentas, clientes, cobros ni proyectos productivos.
- Inicial compat4aed6pass/2fail: agenda movil solapaba caption/flecha; redes caption
  interceptaba clicks. Nav z10 sin interceptar fuera de botones, padding reservado,
  chevrons arriba/abajo y accesos agenda flex-wrap. Retest8pass, sin forceclick.
- Capturas 3D/calendarios PC/movil revisadas. Vista cliente3D usa sesion del equipo:
  NO aprobacion de permisos de invitado ni de todos los presets/objetos/gestos.
- FRICCION P2 /empresa/configurador-reunion movil: ayuda inferior solapada con
  controles flotantes,105-3d-007.png. NO arreglada. Propuesta: reubicar la ayuda
  sin tapar controles y comprobar hitboxes; no cambiar el flujo sin aprobacion.
- Audit0critical/27high/65moderate/2low:94reportes agregados,31GHSA unicos pendientes,
  no94errores reproducidos ni seguridad total. Tooling/SDK runtime requieren analisis.
- Compilacion/dependencias propias sin junction, .env ni credenciales reales.
  Notificaciones ajenas no se tocan; servidores/fixtures propios detenidos/limpios.
- Graphify incremental final exit0:13648nodos/42372relaciones/832comunidades.
  Tanda:55archivos reextraidos/1eliminado; cierre:1auxiliar/2530cacheados;0LLM.
  Tres archivos parcialmente interpretados
  por el parser (GraziaTemplate, LaAppDeTuFiestaSection, public-footer): NO prueba
  de sintaxis rota en la app, cuyos tipos/build pasan. Grafo local no publicado.
- No certificar19 originales manuales, cuentas/modelos pagos, Hosting final,
  hardware, cada boton/variante ni0errores globales. Recuento102/matrix84 reutilizados.

## Antecedentes conservados (estado anterior, no pendientes actuales)

## Versiones contrastadas

- Main consultado: `99faf4eb061fa46341cfdde6f81b93b3bfb9c73c`.
- Tanda remota inicial: `d0c8d8588dae37b91419aa6a1574b5b3f7eeb679`.
- Fuente final candidata: `4aed259f53f20fb010a27c270edcec634f1937e7`.
- Candidato privado: `Documents/Codex/ak-codex88/ak-react19-candidato-103`.
  Dependencias propias, sin junction ni .env ni credenciales reales; archivos
  locales y claves ficticias. No toca Hosting ni clientes reales.

## Cambios y motivos

- El defecto103 era real: WebGL disponible, pero ReactCurrentBatchConfig
  impedia crear el canvas. La foto de respaldo no era evidencia de 3D.
- React19.2.8, Fiber9.8.1 y Drei10.7.9 alinean el renderizador. Se elimina
  `react-three-fiber-compat.ts`, que alteraba internals sin resolver la mezcla.
  No se modifica la geometria ni se inventa reconstruccion de salones por fotos.
- QR4 conserva canvas mediante `QRCodeCanvas` en siete consumidores; no cambia
  PNG descargable, token, permiso, checkIn ni la camara del lector.
- DayPicker9 adapta claves de estilos, flechas y boton de dia. El calendario
  social abre el detalle explicitamente porque DayPicker evita el click por
  defecto; se conserva navegacion y foco del boton original.
- Las 32 definiciones de iconos usan tipos SVG concretos, sin cambiar
  dinero, permisos, iconos ni texto. Revision estatica economica sin anomalías.
- Next15.5.27 reemplaza15.5.23 y se alinea eslint-config-next. El lock inicial
  regenerado completo movia442 versiones: fue descartado. Se preservan las
  versiones ajenas al cambio:24 cambios,5altas,12bajas en la primera acotacion,
  mas los dos parches de seguridad siguientes. No force/legacy-peer-deps.

## Seguridad: no confundir alerta con explotacion demostrada

- El audit encontro Handlebars4.7.9 y proxy-addr2.0.7 tambien en d0, no
  introducidos por el candidato. Dependientes: Dotprompt/Genkit y Express.
- Se actualizan SOLO a4.7.10 y2.0.8, dentro de sus restricciones compatibles.
  Las pruebas con librerias anteriores fallan2/2 y con las nuevas pasan2/2.
  Son sondas locales de las librerias: NO prueba de ataque en una ruta publica.
- Handlebars: AST con longitud ejecutable se rechaza sin ejecutar el marcador;
  una plantilla normal sigue funcionando. Proxy: una mascara IPv6 abreviada
  no confia en cualquier IPv4; mascaras correctas conservan su resultado.
- Fuentes oficiales:
  [Handlebars AST](https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-8r5x-fm3f-whwj),
  [Handlebars lookup](https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-p8wg-vrv2-v86f),
  [proxy-addr](https://github.com/jshttp/proxy-addr/security/advisories/GHSA-jqcg-44mw-7w3h).
- Audit productivo final:0critical,27high,65moderate,2low. Son94 reportes
  agregados y31GHSA unicos, NO94 defectos reproducidos de la app.
- Quedan alertas de tooling PWA/Tailwind y SDK runtime Firebase/Google/Genkit,
  entre otras. No se ejecuta audit fix --force: ofrece downgrade PWA10->6 y
  cambios mayores Tailwind4/Admin14. Requieren analisis y validacion propios;
  no se declaran inocuos ni resueltos solo por no ser criticos.

## Pruebas conservadas

- Instalacion privada: npm ci --ignore-scripts --no-audit --no-fund exit0,
  2095 paquetes. Se omite prepare por .git-archivo en worktree; NO prueba del
  hook. npm update acotado cambia SOLO Handlebars y proxy-addr.
- Tipos sobre33ad y4aed: exit0. Acentos33ad:2764 archivos, exit0.
- Jest inicialac1f:4131pass/1fail. Un test estatico exigia renderAs de QR3;
  exige ahora import Y consumo de QRCodeCanvas, conservando los controles de
  token y acceso. Fallo inicial guardado, no borrado.
- Jest33ad:689suites/4132tests,0fallos/0omitidos,363.550segundos.
- Jest4aed:690suites/4134tests,0fallos/0omitidos,396.922segundos.
  JSON completo comprimido y SHA256 en105-jest-pre-calendario-resumen.json.
- Preflightdev ba11: reunionPC quedo cargando y no mostro canvas en60segundos.
  WebGLtrue; causa no identificada por esa sonda. Captura/contexto conservados
  en105-3d-dev-inicial; NO aprobado ni declarado fallo definitivo de produccion.
- Build33ad interrumpido voluntariamente antes de instalar los dos parches;
  NO resultado verde ni fallo de compilacion. Se conserva su log.
- Build4aed canonico en curso: generadorSW + build-next-with-memory, sin
  FIREBASE_APP_HOSTING ni flags para saltar tipos/lint. PWA habilitada.

## Aceptacion pendiente

- Build completo exit0 y health con SHA de fuente4aed.
- Reunion y vista cliente: canvas real visible, colores, movimiento de camara
  por mouse y tactil nativo, PC/movil; no admitir foto/fallback como exito.
- Agenda/redes: navegar meses, seleccionar dia, botones sin tapar encabezado.
- QR: invitacion descarga PNG y lector real lo registra; relectura idempotente.
- Revision visual de las capturas y registro final antes de subir la propuesta.

## Limites que siguen vigentes

- No validar19 presupuestos manuales sin originales/exportacion ni modificarlos.
- No certificado de proveedores/cuentas/modelos reales, Hosting final ni hardware.
- No existe prueba de cada boton/variante ni demostracion de cero errores globales.
- Las aceptaciones102-104 siguen vinculadas a sus SHAs; no trasladar todos sus
  verdes a una actualizacion global de React sin probar consumidores.
- Agentes baratos realizaron busquedas, revision de tipos y clasificacion de
  dependencias; decisiones sensibles y resultados finales a cargo del director.
