# Estado actual - 15/10/2026 (Codex126, app sigue b520f7ce)

REPARTO NUEVO: GEMINI PROGRAMA; Codex revisa/prueba/documenta. Claude compila
y fusiona. No usar autorizacion antigua para programar app en otra corrida.
126 no cambio app: reutiliza build125b520 y entrega QA/orden164 en PR1301.
Snapshot1267dcbcdde subido,42blobs remotos iguales; recibo126-entrega-remota.
Main4b6d6620, cabeza documental al iniciar27d024e3; PR1301 ABIERTA.
NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE (HEAD desconocido).
DOS hallazgos nuevos REPRODUCIDOS tambien en tanda, pendientes Gemini164:
- Crear plantilla+perder HTTP200 tras commit+retry identico deja2IDs, espera1.
  PC/Pixel7 FAIL; nuevas creaciones deliberadas conservan2legitimas PASS.
- Portal decoracion boton Quiero cambiar algo contraste1.2016 (esperado4.5).
  PC/Pixel7 FAIL; guardar sugerencia/recarga SDK/pantalla SI pasa ambos.
8casos nativos:4PASS/4FAIL, DOS defectos, NO auditoria global terminada.
Fuente de los tres archivos identica a main4b, recibo en orden164.
NO repetir estos casos antes del parche. Gemini debe corregir, Claude validar
nuevoSHA/build; no usar evidencia b520 como aceptacion de codigo nuevo.
SDK0/bytesrestaurados/serviciosagentescerrados, 126-entorno-detenido.json.
Sonda Jest del ayudante sin resultado, borrador .txt, NO evidencia valida.
Luego brechas funcionales reales109/124, no repetir125 ni inventario=PASS.
Orden163 sigue vigente:11GHSA/87entradas,0critical, no overrides mayores ciegos.
Hosting/OAuth/modelo/voz/19originales/hardware NO certificados. NO0errores.

## Evidencia125 reutilizable (sin cambio de app; registro conservado)

CLAUDE FUSIONA siempre. Codex prepara, prueba y registra; no fusiona.
Base main remoto4b6d6620: Claude integro1297 via1298 y tandas1299/1300.
Rama NUEVA codex/125-kiosco-auditoria-main-20261014, solo delta125 desde main.
NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE: su HEAD se desconoce.
Fuente125b520f7cee28546634e1c87391efd7a80e1a40f48; PR1301 ABIERTA, Claude fusiona.
Entrega919d47df contrastada porAPI:22blobs iguales; recibo125-entrega-remota.
- Kiosco compartido11entradas: labels/IDs, grupo/aria-pressed, h1/alerta;
  se conserva espacio original y SIN PIN, roles, handlers y permisos.
- CLI15.33/UUID11/FTP6 YA mainClaude; propio selector6.1.4, no selector7.
- RE21.27 RECHAZADO por Node20; consumidor1.24 restaurado, sigue aviso.
-Texto del totem invisible en42: contraste REAL1.0013; fix slate100/400,
  b520focal9PASS, amplia759suites4765tests PASS;build tipos/lint exit0.
-6nativos PC/Pixel7 PASS sobreb520:11roles cadauno, guardias/nombres/PWA;
  texto18.414 yplaceholder7.868 decontraste; screenshot despues visible.
-Gate125 PASS_DELTA125_ONLY, NO todaapp. SDK0/servicios/agentescerrados,
  bytesrestaurados. Grafo15117nodos44629enlaces1008comunidades,0LLM local.
- InstalacionPWA:4fallos antes real,7focalesPASS; guardia/catch/resultado real,
  conserva nuevo intento y appinstalled. NO instalacion OS real certificada.
- Java21portable aislado verificadoSHA256; globalJava17 intacto, CI ya21.
- Focales543:4suites17tests; CLI/RE2/tar/selector4smokes;3suites29tests
  Firestore/Storage PASS. Lock igual en586, no repetir por solo espacio CSS.
-Amplia586751/4728 HISTORICA: buildfallo mockdisplayName, corregido;
  buildd200 interrumpido por avance1299. NO validan el conjunto nuevo42.
-42amplia759/4765/build PASS y6nativos limitados HISTORICOS antes del color;
  screenshot descubrio valor invisible pese a assertinputValue; no repetir42.
- Npm42:11avisos unicos/87entradas15high/72moderate,0critical;
  queda1aviso menos que main1300 por selector6.1.4. Orden163no duplicada.
-95seguimientos NO95bugs:32redirects+7wrappers destinos reales,3reexports,
  11kioscos entradas;94GET+1import29originales excluido. NO95modulos aprobados.
- SDK/servicios125previos cerrados, bytes propios restaurados; al terminar125
  cerrar otra vez los nuevos. Originales ajenos NO tocar ni stage.
-124 fuente742750suites4726tests/52nativos/9smokes/build PASS historicos;
  no repetir esos recorridos sin cambio.116-123/resueltos Claude preservados.
- Limites: no todaapp0errores, Hosting/OAuth,19originales, modelo/voz externos,
  hardware ni acciones de todos los roles.95entradas no son cobertura total.
- Memoria8GB: trabajos pesados secuenciales. Conservar incidencias de QA.

## Registro previo de Claude (conservado; no es el estado remoto actual)
### Estado de Claude - 14/10/2026

Rama `claude/app-debug-stabilize-m70e6z`. main = a4b609a00 (PR 1299 fusionada).
Se juntó la rama de Codex hasta d4c05d08 (órdenes 157-160), para publicar con la puerta en verde.

## Qué trae esta tanda
- Mantenimiento (159) y ajuste de costos (160): versión de Codex, con recibo por operación.
  El redondeo quedó en centavos (Codex lo había vuelto a pesos enteros: error del insumo de $6).
- Incidentes (157) y títulos largos (158): versión de Codex.
- Documentos de plata (155): quedó la nuestra; es equivalente a la de Codex y usa sus pruebas.
- Pruebas viejas del mantenimiento que miraban la forma del código: se sacaron; el
  comportamiento lo miran la prueba de navegador y la de Codex.

## Codex trabaja directo (autorización del dueño, 13/10)
- Codex corrige con agentes y sube a la PR 1288; Claude junta, revisa plata y publica.
- Su lote 115 (rama codex/qa-115) quedó superado: lo pedido ya está publicado; no se junta.

## Hecho el 13/10 por pedido del dueño ("mirá cómo lo hacen otras apps")
- Votos: uno por teléfono (como Slido/Mentimeter) y tope de red alto; el wifi del salón no frena.
- Trivia en vivo como Kahoot: el celular muestra la pregunta lanzada, el servidor suma puntos,
  "Mostrar respuesta" y "Terminar trivia y mostrar podio" en el panel del operador.
- Misiones de fotos: la foto sube a la galería y suma una vez; ranking "Cazadores de fotos".
- Una trivia lanzada antes de este cambio no tiene respuesta correcta: hay que relanzarla.

## PR 1293 de Codex (junta el 13/10)
- Chat: no duplica el presupuesto al reintentar; la tarjeta del asistente abre el chat.
- Respaldo de ajustes de costos, flujo de caja por día de Uruguay, logo original en PDFs,
  configurador con identidad por intento. Revisado lo de plata: centavos intactos.
- Codex ahora sube en PRs propias (1288, 1293): suscribirse a cada una nueva.

## Método corregido solo (13/10, pedido del dueño)
- Preguntas 58 (respuesta perdida duplica), 59 (formulario que reabre sucio), 60 (nombre largo en
  celular) y 61 (prueba salteada en celular). Barridas en toda la app y arregladas.
- Control `cada-hallazgo-de-codex-tiene-su-pregunta`: toda orden de Codex necesita su línea
  "- Orden N → pregunta M" en LO-QUE-NO-VI.md o la puerta no publica.
- Pago a proveedor (gestión de costos): agrega uno solo con identidad del intento (14/10).

## PR 1297 de Codex (junta el 14/10)
- Precios del asistente con el mismo motor que el presupuesto manual (por persona, tramos,
  personal); no guarda presupuestos con servicios dudosos ni repite uno.
- Cada intento del chat se guarda aparte; el asistente no tapa "Guardar"; 23 parches de
  dependencias sin cambios mayores. Quedan 30 avisos que piden versiones mayores (orden 163).

## PR 1299 (14/10): cierre de pendientes
- Órdenes 51, 105, 135 y 152-156 completas (tablero de control avisa fallas de lectura; pruebas).
- Asistente: el panel se achica o abre hacia abajo para no salirse de la pantalla.
- Orden 163: firebase-tools 15.33 y uuid 11.1.1; avisos únicos 30 a 13, sin críticos. Lo que
  queda pide versiones mayores (genkit/OpenTelemetry 2, next-pwa, tailwind 4, jest).
- Jest ignora `.claude/` (copias de los ayudantes); antes daba 53 fallas falsas.
- Orden 163 cerrada: basic-ftp 6.2.3; los 12 avisos que quedan no llegan a la app publicada (prueba los-avisos-de-dependencias-no-llegan-a-la-app).

## Límites aceptados
- El candado de crear fiesta desde presupuesto cuida un solo servidor.
- Regalos: uno agregado a la vez desde otra pantalla puede perderse.
