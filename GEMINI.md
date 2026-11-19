# Instrucciones para Gemini (Antigravity)

## TU TRABAJO DE HOY (lo actualiza Claude; leelo primero, siempre)

**Actualizado el 19/11/2026.** El dueño no te va a pasar mensajes: lo que tenés que hacer está acá.

- **PRIMERO: orden 322 (`docs/ordenes/322-gemini-terminar-la-1443.md`).** Tu 1443 **todavía no se publicó**: 39 pruebas de
  pantallas fallan. Seguí en la rama `claude/juntar-1443` (tiene tu entrega y los arreglos de Claude) y hacé que pasen
  todas. Claude devolvió cinco pantallas que borraste y se usan (Entrar, decoración y moodboard del portal, simulador y
  Sofía): no las vuelvas a sacar.
- **DESPUÉS de la 322, en la misma propuesta: orden 323 (`docs/ordenes/323-gemini-mejor-que-veamoslasfotos.md`).** Pedido del
  dueño: ser mejor que VeamosLasFotos. Un solo armador de invitación con el celular al lado, biblioteca de fondos, la
  invitación viva el día de la fiesta, transiciones, moderación completa, trivia con IA, y tres funciones nuevas **con
  interruptor apagado de entrada** (en vivo desde el celular, libro de firmas en audio y video, imprimir desde el celular).
- **AL FINAL, en la misma propuesta: orden 324 (`docs/ordenes/324-gemini-decisiones-rapidas-con-ia.md`).** La API de
  Gemini Decisions para revisar solo el muro, elegir las mejores fotos del álbum y revisar los comprobantes del portal.
  Lo de comprobantes es plata: sólo avisa, nunca aprueba; lo revisa Claude.
- **AL FINAL, en la misma propuesta: orden 325 (`docs/ordenes/325-gemini-todos-los-mensajes-al-crm.md`).** Los WhatsApp y
  mensajes de redes de prospectos llegan al CRM con su conversación, la IA trabaja ahí, y el asistente contesta solo a los
  prospectos de las tres puertas. **Lo personal no se guarda ni se contesta.** Toca quién ve qué: lo revisa Claude.
- **AL FINAL, después de la 325: orden 326 (`docs/ordenes/326-gemini-el-centro-de-redes-contesta-todo.md`).** El centro de
  redes con todas las conversaciones de todas las redes, una solapa de Comentarios, y que conteste y dé me gusta solo (las
  quejas se ocultan, nunca se borran; nunca un precio en público).
- **Tu 1443 (318 bloque 2, 320, 321: de 382 a 180 pantallas), con los arreglos de Claude que ya tiene `claude/juntar-1443`:**
  (1) `/presupuestos/:id` y `/fiestas/:id` en `next.config.js` tapaban `/presupuestos/nuevo` (la lista) y `/fiestas/nueva`
  (crear fiesta): Next mira las redirecciones antes que las pantallas. Ahora excluyen los nombres fijos y lo frena
  `una-redireccion-no-tapa-una-pantalla.test.ts`. (2) `data/fiestas.json` y `src/data/fiestas.json` (la fiesta de muestra
  que crea la app al entrar) no van al repositorio: quedaron ignorados.
- **LO QUE FALTA, en la misma propuesta de la 322, sobre `claude/juntar-1443`:**
  1. **321, bloque 7: el menú digital** en `src/app/evento/hub/[fiestaId]/page.tsx` (con `menuAsignadoId`). La papelería
     ya salió: sin esto, el invitado se queda sin menú.
  2. **321: la prueba `src/__tests__/las-direcciones-viejas-siguen-andando.test.ts`** (cada página borrada redirige a una
     que existe; abrir 10 direcciones viejas en el navegador y ver que llegan). Es la que habría frenado el error de arriba.
  3. **321, bloque 5:** la fiesta de 83 a unas 35 pantallas, en las 5 pestañas.
  4. **320:** sacar "las 4 tareas" de `settings/tareas-automaticas` y que `recursos-multi-evento` no cuente las fiestas
     suspendidas (`suspendid`). **319:** "Generar balance de cierre" en el panel de acciones del asistente. **317:**
     `getDashboardKpiData` en alertas y "últimos 12 meses" en analíticas.
  5. **Achicar sin perder:** Claude devolvió `/entrar`, y la decoración y el moodboard del portal (`/portal/[fiestaId]/`),
     que la 1443 había borrado: son del cliente. Si querés juntarlas, que sean pestañas del portal con su función entera,
     nunca una redirección a la portada. El tope quedó en 185 (con el simulador y Sofía).
  6. Las líneas `comprobar` de las órdenes 311, 317, 319 y 320 que apuntan a pantallas que pasaste a paneles: actualizá la
     ruta al panel nuevo (sin cambiar lo que comprueban).

- **Tu 1406 quedó publicada** (Claude reempaquetó el editor y adaptó la prueba del menú a las 7 casas).
- **Play Store (16/11, el dueño ya creó su cuenta de desarrollador):** en su computadora, seguí `docs/GUIAS-PLAY-STORE-Y-PC.md`
  desde el paso 2: armá el paquete con Bubblewrap (`uy.akproducciones.app`), creá la app en Play Console, poné la huella
  SHA-256 de "Firma de aplicaciones" en `public/.well-known/assetlinks.json` (en lugar de `REEMPLAZAR_HUELLA_PLAY`) y dejá
  el lanzamiento en **prueba interna**. Lo que pida datos o pagos del dueño (identidad, ficha de la tienda, envío a
  producción) se lo pedís a él en la pantalla; no inventes datos. Guardá la llave de firma fuera del repositorio.
- **Nuevo: orden 319** (auditoría integral, 17/11): empleados que no se guardan (medir primero), salones, check-in sin
  deshacer, guías y detalles. En la misma propuesta, al final.
- **Nuevo: orden 318** (pruebas funcionales del auditor, 17/11): hora del evento, modificar confirmación, panel de la fiesta,
  prospecto→presupuesto con teléfono, enlace apagado, agenda del CRM y más. **Bloque 0 en la computadora del dueño:** el permiso
  de Google para firmar archivos y borrar los datos PRUEBA del auditor (ids en la orden). En la misma propuesta, al final.
- **Nuevo: orden 317** (revisión transversal del auditor, 17/11): alertas del panel y del centro, rótulos de los tableros y
  cuentas de prueba por perfil para el auditor. Lo contable ya lo arregló Claude. En la misma propuesta, al final.
- **El auditor ahora guarda en toda la app** (decisión del dueño, 17/11): si una prueba tuya contaba con que el auditor no
  guarda, cambió. Sólo sigue frenado lo que sale a clientes, publica, cobra o borra todo (`src/lib/auth/solo-lectura.ts`).
- **Nuevo: orden 316** (auditoría de aceptación, 17/11): en la misma propuesta, al final. El bloque 1 ya lo arregló Claude; te queda su prueba.
- **Nuevo: orden 315** (auditoría funcional de botones, 17/11): en la misma propuesta, al final.
- **Nuevo: orden 314** (el simulador vende primero el valor, aprobada por el dueño): en la misma propuesta, después de la 312.
- **REGLA NUEVA (17/11, pedido del dueño): primero se terminan las órdenes abiertas, completas y de a una.** Orden de hoy:
  **313 primero** (la lista de cierre: el recorrido mira las pantallas en tres tamaños como el auditor), después la 310
  completa (bloque 1 de fiestas antes que nada), la 311 y la 312. Una entrega que deja bloques sin hacer vuelve.
- **Nuevo: orden 312** (auditoría responsive y del simulador, 17/11): también en la misma propuesta que la 310 y la 311.
- **Nuevo: orden 311** (nuevo escaneo del auditor), en la misma propuesta que lo que falta de la 310. El bloque 1 (datos
  personales en el repositorio) va primero junto con el conteo de fiestas.
- **Publicadas tu 309 y una parte de la 310** (esFiestaDemo en 3 archivos y horaFin del calendario). **FALTA de la 310, y es lo que
  sigue, en una sola propuesta:** bloque 1 (contar fiestas contra los respaldos y anotar los ids que faltan: **lo primero**),
  esFiestaDemo en `alertas-errores-humanos.ts`, `commercial-intelligence.ts`, `multiagent.ts` y Eventos con el rótulo "Fiesta
  de muestra", tablero y configuración con el mismo cálculo, y los bloques 3 a 8 enteros. El ZIP del editor ya no se rompe en
  Windows (`.gitattributes`); igual corré `npm run editor:empaquetar` si tocás el editor.
- **Nuevo, pedido del dueño:** orden **309** (el blog trae noticias y tendencias del mundo, todos los días, y vende al final).
  Rama nueva desde `origin/main`, una sola propuesta.
- **Lo primero, en la computadora del dueño (pedido del dueño, 14/11):**
  1. **Borrar las dos fiestas de Lorena Ferreira** (`fiesta_doc_lorena_ferreira_2026_05_30` y `fiesta_verified_lorena_ferreira_2026_12_12`): se suspendió.
     Si alguna tiene seña o cuotas cobradas, **no la borres**: anotá cuánto y avisá. No le mandes nada a la clienta.
  2. **Desplegar el despertador** (`firebase deploy --only functions:despertadorTareasAutomaticas`) y la orden 278 bloque 1.
- No saques `puedeVerLaPlataDelCliente` (el personal no ve contrato ni pagos).
- **Una sola propuesta.** No abras una por orden: cada fusión se paga.
- **Antes de decir "terminé":** `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 118.

Para programar y asistir en este proyecto de forma óptima:
0. **Si vas a auditar, leé antes `docs/YA-RESUELTO.md`**: es lo que ya está
   arreglado y las decisiones tomadas del dueño. Si un hallazgo tuyo figura ahí,
   es falso positivo.
0aa. **SIEMPRE propuestas grandes, nunca muchas chicas.** Orden del dueño del 9
   de agosto de 2026: cada fusión dispara un despliegue y eso se paga. Juntá todo
   el trabajo de la tanda en UNA propuesta y fusionala una vez, al final. Si una
   orden de trabajo te pide varios bloques, **podés entregarlos juntos en una
   sola propuesta**: eso es preferible a abrir una por bloque. Y cuanto más
   grande, más importa correr los cuatro controles sobre el conjunto entero antes
   de subir.
0a. **ANOTÁ SIEMPRE lo que modificás en `docs/YA-RESUELTO.md`, en la misma
   propuesta.** Orden del dueño del 9 de agosto de 2026: no es opcional ni
   depende del tamaño del cambio. Se anotan los arreglos (qué estaba mal y qué
   hiciste), las mejoras y lo nuevo (cómo funciona y **por qué lo elegiste
   así**) y los falsos positivos que descartaste (con el motivo). Una propuesta
   que toca código y no toca esa lista está incompleta: es la única memoria
   compartida entre las tres IA.
0b. **Leé la lista de errores ya cometidos** en `AGENTS.md`, sección "Errores ya
   cometidos". Son diez cosas que salieron mal de verdad en este proyecto y cada
   una costó tiempo, plata o una propuesta entera a la basura. Dos te tocan
   especialmente: los **acentos rotos** (guardá siempre en UTF-8) y las
   **comillas invertidas borradas** de los textos armados, que ya rompieron el
   proyecto tres veces seguidas.
1. **Antes que nada, leé `ESTADO-ACTUAL.md`**: es la hoja de traspaso entre chats
   (corta, máximo 40 líneas) y dice en qué se está trabajando, en qué rama y qué
   quedó a medias. Al terminar tu tanda, reescribila. El histórico largo está en
   `ESTADO-AUDITORIA.md` y sólo se abre si hace falta buscar algo viejo.
   Recordá que este proyecto lo programan Codex, Gemini y Claude en paralelo:
   cada tarea va en una rama nueva desde `main` actualizado.
2. **Siempre consulta el grafo de conocimiento** en `graphify-out/graph.json` y el reporte `graphify-out/GRAPH_REPORT.md` antes de realizar cambios estructurales o responder preguntas complejas de arquitectura.
3. **Lee las directrices principales** en `AGENTS.md`.
4. **Respeta las reglas de calidad**:
   - Asegúrate de que el código compile ejecutando `npm run typecheck`.
   - Verifica el formato con `npm run lint`.
5. **Si haces cambios estructurales**, recuerda actualizar el grafo usando `npm run graphify:update`.
6. **Usa los mismos controles que el resto de las IA**:
   - `npm run quality:quick` para cambios normales.
   - `npm run quality:full` si modificas logica o datos.
   - `npm run quality:security` si modificas Firebase o sus reglas.
   - `npm run test:e2e` si cambias flujos visibles o navegacion.
   - `npm run audit:dead-code` solo como auditoria; nunca borres codigo automaticamente por un reporte de Knip.
