# Instrucciones para Gemini (Antigravity)

## TU TRABAJO DE HOY (lo actualiza Claude; leelo primero, siempre)

**Actualizado el 18/11/2026.** El dueño no te va a pasar mensajes: lo que tenés que hacer está acá.

- **Tu 1406 quedó publicada** (Claude reempaquetó el editor y adaptó la prueba del menú a las 7 casas).
- **Play Store (16/11, el dueño ya creó su cuenta de desarrollador):** en su computadora, seguí `docs/GUIAS-PLAY-STORE-Y-PC.md`
  desde el paso 2: armá el paquete con Bubblewrap (`uy.akproducciones.app`), creá la app en Play Console, poné la huella
  SHA-256 de "Firma de aplicaciones" en `public/.well-known/assetlinks.json` (en lugar de `REEMPLAZAR_HUELLA_PLAY`) y dejá
  el lanzamiento en **prueba interna**. Lo que pida datos o pagos del dueño (identidad, ficha de la tienda, envío a
  producción) se lo pedís a él en la pantalla; no inventes datos. Guardá la llave de firma fuera del repositorio.
- **Tu 1429 (órdenes 310 a 318) quedó publicada (18/11), con arreglos de Claude.** Lo que sigue, en una propuesta nueva
  desde `origin/main`: (1) las pantallas de `docs/pantallas-rotas-conocidas.json`, que tu control de tres tamaños marca con
  texto partido palabra por palabra o que se sale (sin esconder con overflow ni achicar letras); sacá cada una de la lista
  cuando quede bien; (2) lo DEVUELTO de "modificar confirmación" (abajo). Los parches de `docs/parches/` ya están aplicados:
  no los apliques de nuevo.
- **DEVUELTO de tu 1429 (orden 318, bloque 2):** "Modificar confirmación" sigue abriendo el formulario vacío: no se hizo la
  precarga. La prueba que mandaste no lo comprobaba y no corría (usaba `demo_ak_oficial`, que no existe en el entorno de
  pruebas); se sacó. Hacé la precarga y una prueba que cree su propia fiesta e invitado (`crearFiestaDeEstaNoche` en
  `tests/e2e/helpers/fiesta-de-prueba.ts`) y mire que el nombre y la restricción ya vienen puestos.
- **Nuevo: orden 320** (auditoría del 18/11): el sorteo del control remoto que inventa "Mesa 2" (P1), el cronograma que
  cruza la medianoche, el Vendedor que no encuentra un prospecto y cantidades escritas a mano. Y de la continuación: fiestas suspendidas
  contadas como próximas, la galería por tipo, las fotos de ejemplo de Estilo, los avisos de pago del portal en Pagos rápidos
  y el **AK Editor** (bloque 6: primero que "Volver al original" no borre los ajustes del dueño). Lo de plata (plan de pagos,
  anexo y recibo) y la lista de compras sin presupuesto ya los arregló Claude: no los toques. En la misma propuesta, al final.
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
