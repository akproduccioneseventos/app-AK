# 64 - Auditoria integral: evidencia y limites, 2 de octubre de 2026

## Veredicto

**NO certificado para publicar sin errores.** Hay cinco casos contables reproducidos
(uno necesita confirmar la politica de moneda), dos defectos en el mecanismo de cierre
de auditoria y recorridos que todavia no tienen comprobacion completa. Esto no significa
que todos los modulos esten rotos. Tampoco autoriza volver a programar lo ya resuelto.

Codex revisa, reproduce y documenta; Claude corrige cobros/permisos/comida y compila;
Gemini programa el resto. Orden consolidada: `docs/ordenes/111-cobros-y-cierre-de-auditoria-con-evidencia.md`.
No se fusiono ninguna PR ni se modifico codigo de produccion durante esta auditoria.

## Versiones contrastadas

- Main y fuente de las pruebas: `c13073f692691fc48e6d9f71f287e5c0451019f8`.
- Tanda pendiente PR 1251, `feat/super-asistente-unificado`:
  `ea2cb46d732b815492ee5c176cd9ea6e61e867de`.
- `/api/health` publico: `0864e136189a0e3a630d7db108d4edbe655d7f6d`, compilado
  `2026-10-02T02:29:00.553Z`. No confundirlo con la fusion 1253 de main.
- Los siete archivos contables y la lectura de invitados son identicos en las tres
  versiones. Los archivos de fotocabina, cola offline, indicador y pruebas 81/90 no
  difieren entre main y PR 1251. El contador nuevo solo pertenece a main/PR 1253.
- Revalidar las ramas antes de programar. Este informe no aprueba la PR 1251 completa.

## Entorno y ahorro de trabajo

Se uso una copia limpia separada, datos sinteticos, camara simulada y servidor en
`127.0.0.1:3311`. El ejecutor hereda solo variables del sistema y rechaza archivos
`.env`; no usa credenciales reales. Las claves de prueba son ficticias. No hubo
cobros, envios de correos/WhatsApp, publicaciones comerciales ni cambios sobre las
19 fiestas reales. El navegador cargo telemetria de Google Analytics existente en
la app: esto NO equivale a una prueba de la integracion ni a trafico comercial real.

Graphify: 10.994 nodos, 41.718 relaciones, 2.170 archivos de codigo; 25 advertencias
del extractor AST, que no se tomaron como errores de la aplicacion. Agentes economicos
hicieron inventarios acotados; sus opiniones no se contaron como pruebas aprobadas.
Las sondas contables anteriores se reutilizaron por identidad de blobs, no por fecha.
No se agregaron dependencias de produccion ni se ejecuto una compilacion final.

## Pruebas ejecutadas

| Ejecucion | Resultado | Que demuestra / limite |
|---|---|---|
| Jest completo, modo JSON local | 581 suites, 3.334 tests: 3.320 pasan, 14 fallan en 9 suites | Los fallos iniciales se contrastaron; no se enviaron como nueve defectos de app. |
| Repeticion solo de esas 9 suites con sus mocks | 9 suites, 35 tests, todos pasan | Resuelve los 14 fallos iniciales. Hay solapamiento; no sumar 35 al total de 3.334. Son DOS configuraciones, no una validacion final unica. |
| Web publica y simulador, escritorio | 9/9 pasan | Inicio, login/recuperacion visible, hub, escritura, navegacion y presupuesto futuro/PDF. NO envio real de recuperacion ni Gemini real. |
| Corrida amplia de navegador | 480 seleccionados: 21 pasan, 8 fallan, 451 no ejecutados por limite de fallos | Los 451 NO fueron auditados mediante esta corrida. |
| Repeticion de los 8 casos | 5 pasan, 3 fallan | El recorrido prospecto, cambio de paso, CRM Ads, origen UTM y captura A/B pasan al repetir. |
| Organizador, cliente, invitado y barra | 10 casos: 7 pasan, 3 fallan; repeticion acotada 2 pasan y 1 falla | Pasan barra agotada, mensaje persistente, RSVP/QR/cambio de respuesta y vista del organizador. La repeticion aprueba apertura interna y portal con guardado del mural; stock sigue sin confirmar. |
| Sonda de movimiento adicional | Movimiento comprobado, sin pageerror | La prueba de dos muestras empezaba antes de la hidratacion. Ver el descarte mas abajo. |
| Sondas originales contables | 12 grupos; 7 esperados y 5 defectos reproducidos | Entrada/persistencia simuladas, funciones originales y hashes verificados. NO cargos bancarios reales. |
| Sondas de cierre/permisos | AUD01/AUD02 reproducidos; PER01 solo fuente | No se comprobo extraccion de datos por HTTP. |

La corrida amplia anterior se interrumpio cuando Next dev reiniciaba por memoria.
Se aumento SOLO el heap del proceso local de auditoria a 3.072 MB. No se cambio
`apphosting.yaml`, la memoria del servidor publicado ni sus costos. Los tiempos de
este Next dev bajo carga no son una medicion valida del rendimiento publicado.

Sin sumar reintentos: **46 de los 480 casos de escritorio seleccionados fueron
ejecutados; 434 no fueron ejecutados.** El ultimo resultado por caso conserva
cuatro rojos: movimiento (descartado como ausencia de animacion por la sonda),
reconexion de fotocabina, rechazo de fotocabina y aviso de stock. No se corrio la
matriz de celular completa ni el inventario separado `recorrido-de-pantallas.spec.ts`.
Una repeticion lanzada con otro directorio de salida no encontro el registro de
fallos y selecciono la suite entera: se detuvo y se sustituyo por seleccion explicita
de los tres casos. Esa corrida interrumpida no se cuenta en la aceptacion.

## PDF del simulador: visto, no solamente generado

Descarga automatica del recorrido: 2 paginas A4, numeracion 1/2 y 2/2, filas de
servicios/regalos, tipografia legible, sin firmas ni recortes vistos en las dos
paginas renderizadas. Caso sintetico: 80 personas, neto actual 121.184 UYU,
1.515 por persona; proyeccion 2027 de 139.362 con ajuste 15%. El enlace era del
entorno local y la oferta no se publico para un cliente real. No afirmar que este
resultado corresponde al PDF de la version publicada sin probar esa descarga.

## Hallazgos por area, mismo SHA

**Area: plata. Commit: `c13073f692691fc48e6d9f71f287e5c0451019f8`.**

- **COB01 P1:** `addPaymentToInvoiceInner`, `src/app/actions/invoices.ts`.
  La excepcion del espejo deja registrado el pago de una operacion rechazada;
  repetirla deja 2 pagos por 200. El fallo DEVUELTO si compensa. No es un cargo
  duplicado a una tarjeta demostrado. Reproduccion: sonda `invoice-mirror-throws-and-retry`.
- **COB02 P1:** `updateCuotaEstado`, `src/app/actions/payment-plans.ts`.
  Dos cuotas leidas antes de guardar el array completo: dos exitos y una sola
  cuota pagada con un stub de documento completo. Reproduccion
  `two-quota-updates`; confirmar tambien en backend/emulador. No basta serializar
  solo la ultima escritura.
- **COB03 P2:** `handleAddPaymentSubmit`, `src/app/(app)/invoices/[id]/page.tsx`.
  `{success:false}` no produce aviso; la interfaz solo maneja exito/excepcion.
  Reproduccion `invoice-ui-swallows-returned-failure`.
- **COB04 P2:** factura independiente totalmente cobrada: la tolerancia por
  operacion deja sumar tres pagos de 1 y llegar a 1.003 sobre total 1.000.
  Reproduccion `standalone-paid-invoice-repeats-tolerance`. No generalizar a la
  factura vinculada, donde el segundo control limita el pago.
- **COB05 P2, condicionada:** la moneda libre permite USD, pero 12,50 se guarda
  13 y el recibo tiene rotulo UYU. Reproduccion `non-uyu-payment-loses-decimals`.
  Confirmar politica con el dueno; no introducir multimoneda ni cambiarla sin aprobacion.

Son los mismos cinco de la evidencia 63, rama anterior
`codex/auditoria-cobros-2026-10-02`, commit documental `6e86b2613fbe960676548b928b7f55ed1dd02712`.
La sonda conserva `676a1a8d...` como origen historico y verifica sus blobs antes de
reutilizarla. Hoy se ejecuto contra los archivos identicos de c13073f, no contra
una correccion nueva. Salida 0 de la sonda significa REPRODUCIDO, no RESUELTO.

**Mecanismo de auditoria, fuera de las 14 areas de negocio. Mismo commit.**

- **AUD01 P2:** el mapa cubre 184 de 416 rutas (370 paginas, 46 API); 232 quedan
  fuera y 35 de 46 API no invalidan el contador. Con areas HIPOTETICAMENTE limpias,
  cambiar `portal-cliente/[id]/page.tsx` sigue dando terminado. Las 14 reales estan
  sin revisar: no se acusa una aprobacion historica concreta ni 232 errores de app.
  Tambien deben cubrirse consumidores de dependencias/configuracion compartidas.
- **AUD02 P2:** `scripts/codex-limpio.mjs` no entra al CLI en Windows por comparar
  una ruta con `new URL(...).pathname`. Termina 0 y no imprime nada. Consumidores:
  `package.json` y `.claude/hooks/session-start.sh`. Las pruebas importadas no
  comprueban ejecutar el comando real en Windows.

**Area: permisos. Mismo commit. Observacion, NO hallazgo remoto confirmado.**

- **PER01:** `getInvitados` de `src/app/actions/fiesta/invitados.actions.ts`
  solicita `LECTURA_COMPLETA`; en la sonda sin sesion devuelve contacto/credencial
  sinteticos, a diferencia de la lectura normal. Consumidores: recepcion y cron
  de recordatorios. Verificar si ese transporte permite una consulta no autorizada
  antes de corregir. No confundirlo con el getter legacy que si recorta ni romper
  el cron/QR. No se probaron datos de invitados reales ni explotacion por HTTP.

## Fallos de navegador que NO se convierten automaticamente en orden

- **Portada, prueba 46:** falla dos veces midiendo al cargar. Sonda adicional de
  10 muestras muestra ancho 384 -> 460,58 -> 386,72 y opacidad 1 -> 0,68 -> 0,41,
  animacion `running`. No falta codigo de movimiento; el test mide demasiado
  pronto en este entorno. No reescribir el hero por este rojo.
- **Fotocabina, prueba 81:** captura offline y presencia en IndexedDB pasan;
  al reconectar la lista del servidor sigue en 0 tras 30 segundos. La cola esta
  conectada en la fuente, pero la publicacion usa Storage/Firestore no disponibles
  aqui. No se certifica entrega ni duplicacion; falta correrlo con esos servicios
  de prueba y observar respuesta, cola y dato guardado.
- **Fotocabina, prueba 90:** el trace contiene la respuesta transformada
  `success:false/error:Contenido inapropiado`; el aviso esperado no se ve. Tambien
  falla abrir la sesion por Firestore ausente, y la pantalla vuelve al inicio.
  No se probo que el rechazo sea el unico causante del reinicio. Repetir con sesion
  de estacion funcional antes de atribuirlo al producto. No aceptar como causa
  comprobada la suposicion de un agente sobre `retake`.
- **Carga operativa, aviso de stock:** primer intento no muestra "Falta Stock";
  segundo no llega a mostrar el input de cantidad, tras recompilacion/reinicio.
  Se verifica item sembrado, su ID y consumidor; no se confirma el catalogo que
  recibio la pantalla en el primer intento. No cambiar reglas ni eliminar el
  aviso por este rojo. Repetir cantidad 5 -> 12 con stock 10 y guardar evidencia
  de input, respuesta del chequeo y persistencia en el entorno estable.
- **Descartes adicionales:** apertura de dashboard, contabilidad, pagos rapidos,
  presupuestos, clientes y eventos pasa al repetir. El cliente tambien pasa login
  de portal, invitados, saldo y guardado de configuracion del mural. El primer
  rojo de ese recorrido NO demuestra que el cliente no pudiera entrar.

## Integraciones y publicacion: lo que realmente se sabe

`/api/health` responde HTTP 200, pero su SHA no es main. Firebase false corresponde
a una lectura `_health_check` con tope de 2 segundos: se comprobo que ese control
no dio positivo, NO que toda la base este perdida. Gemini true indica una clave
configurada, NO una inferencia ejecutada. Instagram false solo mira variables de
entorno; el importador tambien admite credenciales guardadas en `socialConnections`.
No basta ese false para acusar desconexion. Mercado Pago false indica que faltan
las variables que mira ese control; no se probaron checkout ni webhook reales.

No se enviaron correos de recuperacion, mensajes reales, cargos, publicaciones ni
solicitudes de IA pagas. No se comprobaron los registros actuales de las 19 fiestas.
GitHub Actions en rojo por facturacion no se uso como senal de defecto.

## Cobertura restante y criterio para cerrar

Las 14 areas NO se marcan limpias por un conteo global. Contrato, comida, personal,
automatismos, asistente, redes y permisos tienen evidencia unitaria/lecturas acotadas,
pero no todo su recorrido actual observado de punta a punta. Web, fiesta, portal,
invitado, barra y estaciones tienen recorridos parciales, no aceptacion completa.
Plata conserva los hallazgos de arriba. Las propuestas esteticas nuevas no bloquean
el cierre ni reemplazan decisiones aprobadas del dueno.

**Bloqueo comprobado de continuacion del barrido:** las dos copias de auditoria
locales no tienen `.next/BUILD_ID`; tampoco lo tiene el directorio base de la sesion.
El camino historico `C:/Users/Usuario/Desktop/app/app-AK` no existe en este host.
La consulta `http://127.0.0.1:3300/api/health` falla con conexion rechazada.
El servidor 3311 creado para esta auditoria era Next dev, con reinicios repetidos.
Se detuvo SOLO ese arbol de procesos al terminar los recorridos para liberar memoria.
Esto no demuestra que la version publicada este caida ni que el entorno de Claude
sea defectuoso. No se inspeccionaron otros equipos ni se invento acceso a ellos.

Claude debe compilar el conjunto congelado, registrar SHA y ejecutar los casos de
navegador que faltan en entorno aislado estable. Luego Codex repite solo recorridos
afectados y completa la matriz faltante. El ensayo fisico de camara, impresora, 360
y barra, y las integraciones externas autorizadas, quedan explicitamente separados.
No prometer "ningun error" sin esas comprobaciones ni reemplazarlas con mocks.

Los datos sinteticos y caches generados por los tests se mantienen fuera del
commit documental. No se incluyen cambios en `data/` ni `src/data/`, dependencias,
archivos de servidor o assets de la app.

Evidencia mecanica: `64-resultados-integrales.json`; sondas en
`docs/evidencias/sondas/64-*.cjs`. Los JSON crudos, videos, traces y PDF se conservan
en la carpeta local `audit-runtime-results-20261002` de esta sesion. El resumen
incluye SHA-256 de cada resultado crudo y no suma reintentos como casos nuevos.

Comandos reproducibles, SIN servicios reales:

```powershell
node docs/evidencias/sondas/64-cobros-source-probe.cjs "$PWD"
node docs/evidencias/sondas/64-integral-source-probes.cjs "$PWD"
node docs/evidencias/sondas/64-isolated-audit-runner.mjs "$PWD" jest
```

El ejecutor aislado es una herramienta de auditoria, no configuracion de produccion.
Las nueve suites de mocks se repiten en modo `jest-mocked` tal como se lista en el
resumen JSON; no establecer ese modo para pruebas que necesitan JSON local.
