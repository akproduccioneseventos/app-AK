# Orden 255 — La IA de AK, mejor que los asistentes del mercado (28/10/2026)

**Para Gemini. Una sola propuesta**, rama nueva desde `main` actualizada (`gemini/orden-255-asistente-ak`). Son 9
bloques: si uno se traba, entregá el resto **en la misma propuesta** y avisá cuál faltó. Antes de decir "terminé", pasá
`docs/ANTES-DE-ENTREGAR.md` entero. `el-candado-de-la-plata.test.ts` tiene que seguir en verde.

Pedido del dueño, 28/10/2026: que la IA de la app sea mejor que Instinct y que los asistentes de ChatGPT o Anthropic.
Eligió **todo**. Lo que nos hace ganar es que **la IA de AK conoce el negocio por dentro**, y todo se usa por WhatsApp.

## Lo que NO cambia (decisiones del dueño)

- **La IA prepara y avisa. No le escribe sola a clientes ni a prospectos, no cobra, no marca pagado, no cierra
  presupuestos, no toca permisos y no gasta en publicidad.** Eso ya está en `TAREAS_PROHIBIDAS_SOLA`
  (`src/lib/ia/reglas-de-la-ia.ts:92`) y no se toca.
- Cada tarea nueva respeta su regla ("sola", "preguntar" o "apagada") de `getReglaParaTarea`
  (`reglas-de-la-ia.ts:274`) y entra en `TAREAS_SISTEMA` (`:114`) con su línea en criollo.
- Toda llamada a la IA pasa por `hayPresupuestoParaIA` y `registrarConsumoIA` (`src/lib/ai/consumo-servidor.ts:90` y
  `:43`), con una entrada nueva en `FuncionConCosto` y `COSTO_ESTIMADO_UYU` (`src/lib/ai/consumo.ts:14` y `:44`).
- Nada de voz con IA para invitados.
- Los avisos al teléfono de todo el equipo **no llevan plata** (`textoParaElTelefono`).
- **El WhatsApp del dueño es su número personal:** el asistente le contesta sólo a los números del equipo
  (`numerosEquipo`, `por-whatsapp.ts:316-324`). A prospectos, sólo por el camino de anuncios que ya existe.

## Bloque 1 — Un solo cerebro para todos los asistentes

Hoy cada asistente arma su contexto por separado. `src/lib/multiagent/contexto-negocio.ts` (fiestas 30 días ~84, plata
~168, agenda ~220, deudas ~123, cuotas vencidas ~150) lo usan sólo el multiagente y el secretario.

Hacé `armarContextoDelNegocio(usuario)` en ese archivo, **recortado por perfil**: sin plata para quien no tiene
`CONTABILIDAD`, sin sueldos sin `SUELDOS`. Lo usan los cinco asistentes del equipo:

- el WhatsApp del equipo (`atenderAlEquipo`, `src/lib/asistente/por-whatsapp.ts:302`);
- la voz en vivo (`contextoDeVozParaPerfil`, `src/lib/asistente/voz-en-vivo.ts`);
- el multiagente;
- el Centro de control (`darOrdenPorVozOTexto`, `src/app/actions/centro-de-control.ts:430`);
- el asistente proactivo.

El asistente del **cliente** (`chatConAsistenteCliente`, `asistente-virtual.ts:201`) **no** lo usa: ve sólo su fiesta,
como hoy.

## Bloque 2 — Memoria de verdad

Archivo nuevo `src/lib/asistente/memoria.ts` con `recordar(usuarioId, texto, sobre?)` y `loQueSe(usuarioId, consulta)`.
Se guarda en `asistente-memoria.json`, de a un registro con `createDataItem`, registrado en `FILE_TO_COLLECTION`
(`src/lib/firebase-sync.ts`).

- **Cuándo se guarda:**
  - cuando el dueño o el equipo dicen "acordate que…", "anotá que…" o "tené en cuenta que…", por cualquier canal;
  - cuando se cierra una fiesta, con lo que dejó `cerrarFiestaConRetroalimentacion` (`multiagent.ts:670`).
- **Cuándo se usa:** cada respuesta suma, al pedido a la IA, hasta 8 recuerdos relevantes. Se eligen por la fiesta, el
  cliente o la palabra que coincida, sin servicios pagos.
- **"¿Qué sabés de la familia Pérez?"** contesta con lo que hay en la memoria y en la ficha.
- **"Olvidate de eso"** lo borra.
- **Lo que no se guarda:** contraseñas, números de tarjeta ni datos de salud. Se descartan antes de guardar y se avisa.
- **Cada memoria es de quien la dijo**, y la del dueño la ven sólo los perfiles con `ADMINISTRACION`.

## Bloque 3 — Te escribe primero: el resumen de cada mañana por WhatsApp

El asistente proactivo (`src/app/api/cron/asistente-proactivo/route.ts:30`) ya arma el parte de la mañana
(`getParteDeLaManana`, `src/lib/automatico/parte-manana.ts:88`) y lo manda **por push**. El WhatsApp al dueño está
apagado por defecto (`whatsappDuenioHabilitado`).

- **Tarea nueva `resumen_de_la_manana`**, de fábrica en **"sola"**, porque es para el dueño y no para clientes:
  - a las **8:30 de Uruguay** le manda al dueño **un** WhatsApp con 5 líneas como máximo: la fiesta que viene y qué le
    falta, a quién conviene llamar, qué cobro vence esta semana y qué propuestas esperan su OK;
  - lo manda con `sendMetaWhatsAppMessage` (`src/lib/whatsapp/meta-sender.ts:21`).
- **Si falta la conexión con WhatsApp** (`META_WHATSAPP_TOKEN` o `META_WHATSAPP_PHONE_ID`), cae al push y queda
  anotado el motivo. **No dice que mandó si no mandó** (pregunta 92).
- **Cada punto lleva un número.** Si el dueño contesta "1", lo hace o lo prepara según su regla. Si contesta "después",
  lo vuelve a poner mañana.
- **Va una sola vez por día**, aunque el despertador pase varias veces: se marca la fecha adentro del turno.
- **Que lo dispare el despertador de la app** (`functions/src/index.ts`, cada 15 minutos, a `/api/cron-despachador`).
  Comprobá que `asistente-proactivo` esté entre las tareas que despacha.

## Bloque 4 — Fotos y audios por WhatsApp, de verdad

Hoy el webhook (`src/app/api/whatsapp/webhook/route.ts:119-120`) guarda `[AUDIO:id]`, y `atenderAlEquipo`
(`por-whatsapp.ts:336-340`) **no transcribe ni lee la foto**: usa un texto fijo.

- **Audio:**
  - se baja con el `mediaId` desde la API de Meta;
  - se transcribe con Gemini, con el audio como entrada, pasando por el tope de gasto;
  - el texto sigue el camino de siempre.
- **Foto de una boleta o un ticket:** se lee con `extractReceiptData` (que ya existe) y se deja como **propuesta de
  gasto** para el OK del dueño. **No se registra sola**, porque es plata.
- **Otra foto:** se describe y se pregunta qué hacer con ella.
- **Si falla la descarga o la transcripción:** "No pude escuchar el audio, ¿me lo escribís?". Nunca hace como que
  entendió.
- **Respuesta con audio** (el campo `audioEnviado`, ~33): si el dueño mandó un audio, se le contesta con audio usando
  la voz que ya existe (la de Gemini con su tope diario de 100, o el texto si se pasó).

## Bloque 5 — Tareas de varios pasos con un solo pedido

En `atenderAlEquipo` y en `darOrdenPorVozOTexto`, un pedido como "organizá la reunión con los novios del sábado" arma
un **plan** de pasos:

1. busca un horario libre en la agenda (`ver_mi_semana` y `agendar_reunion` del secretario, `multiagent.ts:734`);
2. prepara el mensaje al cliente, **sin mandarlo**;
3. junta el presupuesto y la decoración de esa fiesta.

Lo devuelve como **una** tarjeta en "Para tu OK" con todos los pasos. "Sí, hacelo" ejecuta los que su regla deja, y lo
que sale para afuera queda a un toque.

- Que empiece con estos tres pedidos: **reunión con un cliente**, **preparar la semana de una fiesta** y **perseguir
  presupuestos sin respuesta**.
- Si no entiende el pedido, pregunta. No inventa pasos.

## Bloque 6 — Vende: presupuesto con fotos de fiestas parecidas

Cuando un prospecto llega de un anuncio (`atenderProspectoAnuncioWhatsApp`, `por-whatsapp.ts:110`) y ya hay fecha,
invitados y tipo de fiesta:

- se arma el presupuesto con `generateBudgetAndLeadFromSimulator` (`src/app/actions/armado-rapido.ts:102`), que ya
  existe;
- se eligen **3 fotos de fiestas reales parecidas**, con una función nueva
  `fotosDeFiestasParecidas(tipo, invitados, salon)`:
  - mismo tipo de evento, cantidad de invitados más cercana y mismo salón primero;
  - de las fotos aprobadas de la galería y los álbumes;
  - nunca de una fiesta cuyo cliente no autorizó su imagen (cláusula 12 del contrato, `AUTORIZO`);
- el mensaje con el presupuesto y las fotos **queda en la bandeja para que una persona lo mande con un toque**. No sale
  solo.

Agregá la orden 105 que faltaba: `usa: generateBudgetAndLeadFromSimulator en src/lib/asistente/por-whatsapp.ts`.

## Bloque 7 — Avisa antes de que pase

Agente nuevo `anticipador` en `src/lib/agentes/motor-agentes.ts`, sumado a `ejecutarAgentesAutonomos` (~559) y a
`TAREAS_SISTEMA`, de fábrica en "sola" porque sólo avisa. Mira cada día:

- **prospectos que se enfrían:** sin respuesta hace 5 días o más, con presupuesto enviado. Con lo que ya mira el
  `perseguidor_presupuestos` (~125), no lo dupliques: el aviso sale de ahí;
- **familias atrasadas:** 2 cuotas vencidas o más (`cuotasVencidas`, `contexto-negocio.ts:150`);
- **fiestas de los próximos 14 días a las que les falta personal**, según la regla de personal por invitados
  (`applyAutomaticStaffByGuests`, `src/lib/fiesta/personal-por-invitados.ts`): cuántos hacen falta contra cuántos hay
  asignados.

Cada alerta trae **qué hacer**, por ejemplo "preparé un mensaje para la familia X", y va a "Para tu OK" y al resumen de
la mañana. Lo de plata no va al teléfono de todos.

## Bloque 8 — El cerebro de la noche

`ejecutarVigilanteNoche` (`motor-agentes.ts:456`) hoy sólo lista las fiestas del día. Que mire de verdad, cada 15
minutos, durante las fiestas de hoy:

- **el cronograma:** el momento que tendría que estar pasando contra lo marcado como hecho. Con 20 minutos de atraso,
  avisa;
- **la barra:** los insumos con stock para menos de 10 tragos (con `recetaIngredientes` y el stock de
  `src/data/insumos.json`, el mismo cálculo que la barra);
- **el personal:** quién no marcó llegada a la hora (`personalAsignado[].checkInTimestamp`).

Avisa por WhatsApp al dueño y al encargado de la fiesta, con un máximo de 1 aviso por tema por hora. No le avisa a
invitados.

## Bloque 9 — Aprende de cada fiesta, y escribe como el dueño

- **`armarInformeAutomatico`** (`src/lib/fiesta/informe-automatico.ts:56`) **no lo llama nadie**: está escrito y no
  produce nada.
  - Que se arme solo al día siguiente de cada fiesta, desde el despertador.
  - Que quede en la ficha de la fiesta y vaya un resumen al dueño.
  - Que lo de "qué sobró" y "qué faltó" de comida, bebida y personal se use como **sugerencia** en la lista de compras
    y en el personal de la próxima fiesta parecida: "la última de 150 invitados sobraron 2 cajas de vino". Es sólo una
    sugerencia: no cambia cantidades sola.
- **`aprenderDeLoAprobado`** (`src/lib/ia/aprender-de-lo-aprobado.ts:36`) sólo lo usa la web del evento. Que lo usen
  también:
  - los mensajes de seguimiento (`commercial-followup.ts`);
  - el resumen de la mañana;
  - las tarjetas de "Para tu OK";
  - los borradores de redes (`autoGenerarBorradoresSemanales`, `src/lib/presencia-digital/autogenerador-semanal.ts:60`).

  Así todo sale con las palabras del dueño. Comprobá quién llama a `registrarDecisionDuenio` (`reglas-de-la-ia.ts:339`).
  Si nadie lo llama al aprobar o corregir, engánchalo en `aprobarItemOK` y `rechazarItemOK` (`centro-de-control.ts:293`
  y `:365`).
- **Redes con las fotos de cada fiesta:** el autogenerador ya junta fotos de las fiestas de la semana. Que al día
  siguiente de cada fiesta arme **un** borrador de publicación y uno de video corto con las mejores fotos aprobadas, con
  el texto en el estilo del dueño, y los deje para aprobar. No publica solo.

## Pruebas (que miren el resultado)

**Jest**, en `src/__tests__/el-asistente-de-ak.test.ts`, con la IA y WhatsApp simulados. Tiene que comprobar:

- (1) La secretaria pregunta "cuánto me deben" y el contexto que recibe **no** tiene plata. El dueño, sí.
- (2) "Acordate que a los Pérez no se los llama de mañana" queda guardado y aparece en el pedido siguiente sobre los
  Pérez. "Olvidate de eso" lo borra.
- (3) El resumen de la mañana sale **una vez** con dos pasadas del despertador el mismo día. Sin conexión a WhatsApp
  cae al push y no anota "mandado".
- (4) Un audio simulado se transcribe y se atiende. Si la transcripción falla, contesta "No pude escuchar el audio".
- (5) La foto de una boleta queda como **propuesta**, no como gasto registrado.
- (6) "Organizá la reunión con los novios del sábado" crea **una** tarjeta con 3 pasos y **ningún** mensaje enviado al
  cliente.
- (7) A un prospecto de anuncio con datos completos se le arma el presupuesto y 3 fotos de fiestas del mismo tipo.
  Ninguna es de una fiesta sin autorización de imagen. El mensaje queda en la bandeja, no enviado.
- (8) El anticipador avisa la fiesta de 150 invitados con 3 mozos asignados de 6.
- (9) El cerebro de la noche avisa un atraso de 25 minutos y no repite el aviso en la misma hora.
- (10) El informe automático se arma al día siguiente de una fiesta, una sola vez.
- (11) Ninguna tarea nueva puede ponerse en "sola" si manda algo a un cliente, porque el servidor la rechaza.

Rompé (11) y (6) a propósito y fijate que se pongan en rojo.

**Navegador:** el Centro de control muestra en "Tus reglas" las tareas nuevas con su línea en criollo, y en "Para tu
OK" la tarjeta de varios pasos.

Corré `npx tsc --noEmit`, `npx jest --silent` y `npm run "publicar?:rapido"`, y pegá las últimas líneas de cada uno.
Actualizá `docs/QUE-HAY-EN-LA-APP.md` y regenerá el mapa (`npm run mapa:generar`).

```comprobar
usa: armarContextoDelNegocio en src/lib/asistente/por-whatsapp.ts
usa: armarContextoDelNegocio en src/lib/asistente/voz-en-vivo.ts
usa: armarContextoDelNegocio en src/app/actions/centro-de-control.ts
archivo: src/lib/asistente/memoria.ts
usa: loQueSe en src/lib/asistente/por-whatsapp.ts
usa: resumen_de_la_manana en src/lib/ia/reglas-de-la-ia.ts
usa: sendMetaWhatsAppMessage en src/app/api/cron/asistente-proactivo/route.ts
usa: extractReceiptData en src/lib/asistente/por-whatsapp.ts
usa: generateBudgetAndLeadFromSimulator en src/lib/asistente/por-whatsapp.ts
usa: fotosDeFiestasParecidas en src/lib/asistente/por-whatsapp.ts
usa: anticipador en src/lib/agentes/motor-agentes.ts
usa: checkInTimestamp en src/lib/agentes/motor-agentes.ts
usa: armarInformeAutomatico en src/app/api/cron-despachador/route.ts
usa: aprenderDeLoAprobado en src/lib/commercial/commercial-followup.ts
usa: aprenderDeLoAprobado en src/lib/presencia-digital/autogenerador-semanal.ts
prueba: src/__tests__/el-asistente-de-ak.test.ts
```
