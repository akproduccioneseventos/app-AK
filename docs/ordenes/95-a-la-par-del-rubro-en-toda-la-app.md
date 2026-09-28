# 95 — Toda la app a la par de las plataformas líderes, y un paso arriba

**Para:** Gemini.
**Escrita por:** Claude, el 28 de septiembre de 2026.
**Pedido del dueño:** se comparó cada área de la app contra las plataformas líderes (HoneyBook,
Tripleseat, Zola, Caterease, Current RMS, Metricool, ManyChat, Pic-Time y otras) y el dueño eligió
estas doce mejoras. Palabras suyas: *"que haga todo Gemini y tú revisas"*.

## Cómo se entrega

- **UNA SOLA propuesta con los doce bloques.** Si un bloque se traba, entregá el resto igual en la
  misma propuesta y avisá cuál faltó.
- **Arrancá desde la versión principal de ahora.** No uses una rama vieja.
- Antes de decir "terminé", pasá por **`docs/ANTES-DE-ENTREGAR.md`** sobre lo que tocaste.
- Tipos en cero, `npx jest` en verde, `npm run check:acentos` limpio y `npm run "publicar?"` en
  verde. Si agregás una pantalla, corré `npm run mapa:generar`.
- Anotá cada bloque en `docs/YA-RESUELTO.md` con qué se hizo y **por qué**. Sumá la línea de cada
  función nueva a `docs/COMPARACION-CON-EL-RUBRO.md`, en el bloque del rubro que corresponda o en
  uno nuevo.

## Lo que NO se toca

- **Nada cobra, marca pagado ni emite factura.** Nada da por aceptado un presupuesto.
- **Los mensajes a clientes se preparan y los manda una persona.** Hay tres excepciones, y las
  eligió el dueño: el recontacto a prospectos (bloque 2), el recordatorio al invitado que no abrió
  la invitación (bloque 7) y la respuesta a preguntas en comentarios (bloque 5). Las tres llevan un
  interruptor en Ajustes.
- **Lo que ya anda sigue andando.** No se cambian textos que ve el cliente, ni el simulador, ni el
  reloj de la promoción.
- **No se agrega ningún servicio pago por mes.**
- **Dejá como están** la comisión de Mercado Pago en la ganancia, el seguimiento del pedido al
  proveedor y el cierre de barra. Ya están hechos (`src/lib/costos/ganancia-evento.ts`,
  `src/lib/catering/seguimiento-del-pedido.ts`, `src/lib/barra/cierre-de-barra.ts`).
- **No los pidió el dueño; no se hacen:**
  - recargo por atraso;
  - seña reembolsable;
  - merma de comida;
  - propina;
  - preguntas propias en el RSVP;
  - transporte;
  - cartelito de alérgenos;
  - venta de fotos impresas.

## Cómo se engancha una tarea automática nueva

Copiá cómo está registrada `recordatorio-a-los-invitados`, en los mismos cuatro lugares:

- `src/lib/automatico/puerta-de-las-tareas.ts` (el tipo, ~línea 52, y la lista, ~línea 65);
- `src/lib/automatico/tareas-automaticas.ts` (~línea 81);
- `src/data/tareas-automaticas.json`;
- `src/lib/automatico/al-entrar-a-la-app.ts`.

La ruta va en `src/app/api/cron/<id>/route.ts`, igual que `src/app/api/cron/recordatorio-a-los-invitados/route.ts`.
El control `src/__tests__/lo-automatico-que-se-ve-y-panel-dj.test.ts` tiene que conocerla.

---

## Bloque 1 — Los avisos al cliente quedan listos para mandar (ítem 8)

**Qué hay hoy.** Hay cuatro reglas en `src/lib/automatizaciones-engine.ts` con
`accion.tipo === 'recordatorio_cliente'`: `faltan-canciones` (~l.36), `faltan-fotos-video-vida`
(~l.44), `menu-sin-definir` (~l.76) e `invitados-sin-confirmar` (~l.84). Detectan bien, pero sólo
las ve el equipo, en `/alertas` y `/admin`. Al cliente no le llega nada.

**Qué hay que hacer.**

- En la tarjeta de cada alerta de tipo `'recordatorio'` (`src/app/(app)/alertas/page.tsx`), agregá
  el botón **"Preparar WhatsApp al cliente"**. Ese botón:
  - arma el texto con `rellenarPlantilla` (`src/lib/whatsapp/plantilla-mensaje.ts`), con una
    plantilla por regla, amable, en criollo y sin promesas;
  - lo guarda en la bandeja con `saveScheduledMessage` (`src/app/actions/scheduled-messages.ts`
    ~l.33) y `sendingMode: 'manual_click'`;
  - usa el teléfono de `fiesta.configuracion.telefonoAsistencia` (`src/types/fiesta.ts` ~l.169).
- Si no hay teléfono, el botón lo dice ("Esta fiesta no tiene teléfono del cliente") y **no** guarda
  nada.
- **Automático:** la tarea diaria nueva `avisos-al-cliente` prepara sola esos mensajes, una vez por
  regla y por fiesta. Para no repetir, anotá `avisosPreparados: Record<reglaId, fechaISO>` en la
  fiesta. Salen en la bandeja (`src/app/(app)/contabilidad/crm/outbox/page.tsx`) y los manda una
  persona.

**La prueba** (`src/__tests__/los-avisos-al-cliente-quedan-en-la-bandeja.test.ts`) tiene que
comprobar tres cosas:

- una fiesta sin canciones a diez días genera **un** mensaje en la bandeja con el teléfono del
  cliente;
- correr la tarea dos veces no genera dos;
- sin teléfono no genera nada.

## Bloque 2 — Seguimiento de prospectos en varios pasos (ítem 9)

**Qué hay hoy.** El recontacto manda **un** solo mensaje:

- se ejecuta con `correrRecontactoAutomatico` en `src/lib/marketing/recontacto-automatico.ts` ~l.54;
- elige a quién con `src/lib/marketing/candidatos-recontacto.ts` ~l.50, que filtra
  `lead.recontactoAutomaticoAt`;
- manda con `sendMetaWhatsAppMessage` (`src/lib/whatsapp/meta-sender.ts`);
- se prende y apaga con el interruptor `activo` de `marketing-recontacto.json`, desde
  `src/components/marketing/recontacto-automatico-card.tsx`.

**Qué hay que hacer.**

1. **Pasos configurables.** Agregá `pasos?: Array<{ dias: number; plantilla: string }>` a
   `AjustesDeRecontacto`. Por defecto van tres pasos: a los 2, 7 y 15 días del presupuesto sin seña.
   Se editan en la misma tarjeta de Ajustes.
2. **Registro en el prospecto.** En `CrmLead` (`src/types/crm.ts` ~l.96), agregá
   `recontactosEnviados?: Array<{ paso: number; at: string }>`. Un prospecto que ya tenía
   `recontactoAutomaticoAt` cuenta como que ya recibió el paso 1.
3. **Cuándo se corta.** La secuencia se corta si el prospecto contestó, señó, se marcó perdido o
   pidió que no le escriban. Usá los mismos motivos que ya tiene `candidatos-recontacto.ts`.
4. **Qué no se toca.** El interruptor sigue igual y apagado de fábrica; la prueba
   `src/__tests__/recontacto-apagado-de-fabrica.test.ts` tiene que seguir en verde.

**La prueba** (`src/__tests__/el-seguimiento-va-en-pasos.test.ts`) tiene que comprobar estos casos:

- el día 2 manda el paso 1;
- el día 7 manda el paso 2 y no repite el 1;
- si contestó en el medio, no manda nada más;
- apagado, no manda nada.

## Bloque 3 — Mejor horario para publicar (ítem 10)

**Qué hay hoy.** Las publicaciones viven en `social-posts.json`, con el tipo `SocialPost`
(`src/types/social-media.ts`). Tienen `publishDate`, `platform` y
`performance.interactions/likes`.

**Qué hay que hacer.**

- Función pura nueva en `src/lib/presencia-digital/mejor-horario.ts`:
  - firma: `mejorHorario(posts, red)`, que devuelve `{ dia, hora, promedio, basadoEn }`;
  - agrupa por día de la semana y franja de dos horas, **en hora de Uruguay**; usá `hoyEnUruguay` /
    `getUruguayParts` de `src/lib/utils.ts`;
  - devuelve `null` si hay menos de 8 publicaciones con resultados de esa red. **No se inventa un
    horario.**
- En la pantalla donde se programa una publicación (Empresa → Redes sociales), mostrá **"Tu mejor
  horario: jueves de 20 a 22"** y un botón que pone esa fecha y hora. Si devuelve `null`: "Todavía
  no hay suficientes publicaciones para saberlo".

**La prueba** (`src/__tests__/el-mejor-horario-sale-de-tus-resultados.test.ts`) tiene que
comprobar dos cosas:

- con publicaciones sembradas donde los jueves a la noche tienen el doble de interacciones, la
  función elige jueves a la noche;
- con 5 publicaciones, devuelve `null`.

## Bloque 4 — Volver a publicar lo que mejor anduvo (ítem 11)

- En la lista de publicaciones, agregá una sección con **"Las que mejor anduvieron"**: las 5 de
  más `performance.interactions` entre las que tengan más de 60 días.
- Cada una tiene un botón **"Volver a publicar"**. Crea un `SocialPost` nuevo copiando `text`,
  `mediaUrl`, `mediaType` y `platform`, con `status: 'Programado'` y `publishDate` en el próximo
  mejor horario del bloque 3 (o mañana a las 20 si no hay). Lo publica el mismo cron
  `publicar-programados`.
- La copia lleva `recicladoDe: <id original>`. Una misma publicación no se sugiere otra vez hasta 90
  días después de reciclada.

**La prueba** (`src/__tests__/volver-a-publicar-copia-y-programa.test.ts`) tiene que comprobar dos
cosas:

- la copia queda programada con el texto y la imagen de la original;
- la original no vuelve a aparecer como sugerida.

## Bloque 5 — Respuesta automática a preguntas en comentarios (ítem 12)

**Qué hay hoy.**

- Los comentarios se guardan en `social-comments.json` (`src/app/actions/comentarios-redes.ts`
  ~l.15).
- Se clasifican con `clasificarComentario` (`src/lib/social-media/clasificador-comentarios.ts`
  ~l.30), que devuelve `sentiment`, `isInsultOrSpam` e `isLegitimateComplaint`.
- Se sincronizan con `syncCommentsFromNetworks` (`src/lib/social-media/comments-backfill.ts`).
- Se ocultan con `hideCommentInternal`, en el mismo archivo.

**Qué hay que hacer.**

1. **Clasificar las preguntas.** Sumá `esPregunta: boolean` a la clasificación. Cuenta como
   pregunta la que pide precio, fecha, disponibilidad o cómo contratar.
2. **Armar la respuesta.** Para cada comentario nuevo que sea pregunta (y no insulto ni spam), armá
   una respuesta corta con IA:
   - usá **el mismo catálogo real** que el asistente, `getArmadoRapidoConfig()` de
     `src/app/actions/armado-rapido.ts`, como hace `chatWithVirtualAssistant` en
     `src/app/actions/asistente-virtual.ts` ~l.60;
   - **no se dan precios ni se confirma disponibilidad**;
   - termina invitando a escribir por WhatsApp.
3. **Publicar la respuesta.** Va por la API de Meta: `POST /{comment-id}/replies` en Instagram y
   `POST /{comment-id}/comments` en Facebook, con el mismo acceso que usa `hideCommentInternal`.
4. **No responder dos veces.** Anotá `respuestaAutomatica: { texto, at }` en el comentario.
5. **Interruptor en Ajustes**, apagado de fábrica. Copiá el patrón de `recontacto-automatico-card.tsx`
   con el archivo nuevo `marketing-respuestas-comentarios.json`.
6. **El tope de gasto de IA** que ya existe tiene que aplicar. Si se pasa, no se contesta y queda
   anotado.

**La prueba** (`src/__tests__/la-respuesta-a-comentarios-no-inventa.test.ts`) tiene que comprobar
lo siguiente, simulando la IA y la API de Meta:

- una pregunta genera una respuesta que no tiene números de precio;
- un comentario ya respondido no se responde de nuevo;
- apagado, no se llama a Meta;
- un insulto no se contesta.

## Bloque 6 — El cuestionario de la reunión de organización (ítem 13)

**Palabras del dueño:** *"las cosas se definen en la reunión de organización"*. Así que **no es un
formulario que el cliente llena solo**. Es la pantalla que el equipo completa **durante la reunión,
con el cliente adelante**.

**Qué hay hoy.** `Reunion` (`src/types/fiesta.ts` ~l.191) tiene `titulo`, `fecha`, `notas`,
`acuerdos` y `checklist`, y se guarda en `fiesta.reuniones`. Los gustos ya tienen su lugar en la
fiesta:

- música: `fiesta.musica` (`MusicaFiesta` ~l.989);
- decoración: `fiesta.decoracion.tema` y `paletaColores` (`DecoracionData` ~l.318);
- cronograma: `fiesta.programa` (~l.387).

**Qué hay que hacer.**

- **Pantalla nueva** `/fiestas/nueva/reunion-organizacion?fiestaId=`: un recorrido por secciones
  (música, estilo y colores, menú y alergias, momentos del cronograma, invitados, extras).
- **Cada respuesta se guarda en el campo que ya existe** (por ejemplo, la canción de entrada va en
  `fiesta.musica.cancionEntrada`). **Nada de copiar los datos en otro lado:** una pantalla vive en
  un solo lugar y un dato también.
- **Preguntas propias de la empresa.** Además de esas secciones, AK puede agregar sus propias
  preguntas desde Ajustes (plantilla editable, archivo `cuestionario-reunion.json`). Las respuestas
  van en `fiesta.reunionOrganizacion.respuestasExtra: Record<preguntaId, string>`.
- **Al terminar**, un botón **"Cerrar la reunión"** guarda una `Reunion` en `fiesta.reuniones`, con
  los acuerdos resumidos solos a partir de lo que se completó.
- **Accesos:** llevá un enlace desde el tablero de la fiesta y desde el resumen de planificación.

**La prueba** (`tests/e2e/la-reunion-de-organizacion-guarda-donde-corresponde.spec.ts`) tiene que
comprobar dos cosas:

- completar la canción de entrada en el cuestionario la muestra después en la pantalla de música
  de esa fiesta;
- "Cerrar la reunión" deja una reunión nueva con los acuerdos.

## Bloque 7 — Saber quién abrió la invitación, y recordarle solo al que no (ítem 14)

**Qué hay hoy.**

- **Abrir el enlace no deja rastro.** Cuando un invitado abre su enlace personal
  (`src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx`), la carga pasa por
  `getPublicGuestPortalData` (`src/app/actions/public-guest-portal.ts` ~l.77), que no anota nada.
- **Ya hay un patrón seguro para anotar.** `trackGuestCtaClick`
  (`src/app/actions/fiesta/invitados.actions.ts` ~l.530) usa `updateFiestaData` y
  `hasPublicGuestAccess`. **Copiá ese patrón exacto; no inventes otro chequeo de acceso.**

**Qué hay que hacer.**

1. **Anotar la apertura.** Acción nueva `registrarQueAbrioLaInvitacion(fiestaId, guestId,
   guestAccessToken)`, junto a `trackGuestCtaClick`:
   - anota `invitacionAbiertaAt` en el invitado, **sólo la primera vez**;
   - la llama la página del invitado al abrirse, sin esperar la respuesta;
   - con un token inválido no escribe nada.
2. **Mostrarlo en el panel.** En el panel de invitados, poné **"X de Y abrieron su invitación"** y
   una marca en cada invitado.
3. **Recordatorio automático** (lo pidió el dueño: *"que le recuerde automáticamente"*). Tarea
   diaria nueva `recordar-invitacion-no-abierta`:
   - **a quién:** invitados sin `invitacionAbiertaAt`, sin RSVP, con contacto, a 21 y a 10 días de
     la fiesta;
   - **qué le manda:** un recordatorio corto con su enlace personal;
   - **si el contacto es un mail:** sale por Gmail, con `sendGoogleGmailMessage`
     (`src/lib/google-workspace.ts` ~l.626);
   - **si es un teléfono:** sale por el mismo canal que el recontacto, `sendMetaWhatsAppMessage`.
     Si WhatsApp rechaza el envío, queda preparado en la bandeja con `manual_click` y se cuenta
     como no enviado;
   - **para no repetir:** anotá `recordatoriosApertura: string[]` con las fechas;
   - **interruptor** en Ajustes, **prendido** de fábrica (lo pidió el dueño);
   - **no se escribe** a quien ya confirmó o dijo que no.

**La prueba** (`src/__tests__/la-invitacion-no-abierta-se-recuerda-sola.test.ts`) tiene que
comprobar:

- con token válido se anota la apertura una vez; con token inválido, nada;
- a 10 días le escribe sólo a quien no abrió ni respondió;
- no le escribe dos veces el mismo día;
- apagado, no manda nada.

## Bloque 8 — La orden de evento en una sola hoja (ítem 17)

**Pantalla nueva** `/fiestas/nueva/orden-de-evento?fiestaId=`: una sola hoja imprimible, con botón
"Imprimir" (`window.print()` y estilos `print:`). Junta lo que ya existe, **leyéndolo, sin copiarlo**:

| Sección | De dónde sale |
|---|---|
| Datos | `fiesta.configuracion`: `nombreEvento`, `fechaEvento`, `horaEvento`, salón, `tipoCelebracion`, invitados contratados |
| Cronograma | `fiesta.programa`, en orden por hora |
| Cocina | `armarHojaDeCocina` (`src/lib/catering/hoja-de-cocina.ts` ~l.71). Llamala igual que la pantalla `catering/hoja-de-cocina/page.tsx` |
| Bebidas | la carta de tragos de la fiesta |
| Personal | `fiesta.personalAsignado`, con el nombre de cada empleado y su rol |
| Carga | `fiesta.listaDeCargaOperativa`, por categoría |
| Decoración | `fiesta.decoracion.tema` y la paleta |
| Alergias | desde los invitados, igual que la hoja de cocina |

- **Sin precios ni sueldos.** Es para el equipo en el salón.
- Enlazala desde el resumen de planificación (`src/app/(app)/fiestas/nueva/resumen-planificacion/page.tsx`).
- Si a una sección le faltan datos, se ve "Sin cargar" con un enlace a la pantalla donde se carga.

**La prueba** (`tests/e2e/la-orden-de-evento-junta-todo.spec.ts`) tiene que comprobar:

- con una fiesta de prueba con programa y personal, la hoja muestra el título de un ítem del
  programa y el nombre de un empleado;
- **no aparece** ningún signo `$`.

## Bloque 9 — Carga de equipos con QR, como opción (ítem 19)

**Palabras del dueño:** *"como una opción, pero no obligación"*. **La marca a mano sigue igual.**

**Qué hay hoy.** Cada renglón de la carga (`CargaOperativaItem`, `src/types/fiesta.ts` ~l.1115)
tiene `origenId` (el id del equipo), `cargado` y `retornado`. Se guarda con
`updateCargaOperativaItemState` (`src/app/actions/fiesta/carga-operativa.actions.ts` ~l.121). El
lector de QR ya existe en `src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx` ~l.161
(`Html5QrcodeScanner`).

**Qué hay que hacer.**

- En `src/app/(app)/empresa/activos-fijos/page.tsx`, agregá **"Imprimir etiquetas QR"**. Arma una
  hoja con el QR de cada equipo; el QR lleva el texto `ak-equipo:<id>`.
- En la pantalla de carga (`src/app/(app)/fiestas/nueva/carga-operativa/page.tsx`), agregá el botón
  **"Escanear"**:
  - abre el lector;
  - al leer `ak-equipo:<id>`, marca `cargado` en el renglón con ese `origenId`, o `retornado` si
    ya estaba cargado;
  - avisa en pantalla qué marcó;
  - si el equipo no está en la lista, lo dice y no marca nada.

**La prueba** (`src/__tests__/el-qr-marca-el-equipo-correcto.test.ts`) va sobre la función pura que
decide qué renglón marcar:

- un id existente marca cargado;
- escaneado dos veces, marca retornado;
- un id ajeno no marca nada.

## Bloque 10 — Mantenimiento de equipos, como opción (ítem 20)

**Qué hay que hacer.**

- **Campo nuevo, optativo.** En el equipo (`ServicioEmpresa`, `src/types/empresa.ts`), agregá
  `mantenimiento?: { cadaDias?: number; ultimoAt?: string; historial?: Array<{ fecha: string;
  nota: string; costo?: number }> }`.
- **Dónde se edita:** en `src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx`, con el botón
  "Anotar un mantenimiento".
- **Si no se completa, no pasa nada:** es opcional.
- **Aviso:** regla nueva en `src/lib/automatizaciones-engine.ts`, "Equipo con mantenimiento
  vencido". Salta cuando `ultimoAt + cadaDias` ya pasó y el equipo está en la carga de una fiesta
  de los próximos 7 días.
- **Costo del mantenimiento:** no crees un gasto aparte. Si tiene costo, se anota como `GastoGeneral`
  en la categoría "Reparaciones y Mantenimiento" (`src/types/gastos.ts` ~l.4), **por la misma acción
  que ya guarda gastos**.

**La prueba** (`src/__tests__/el-mantenimiento-avisa-antes-de-la-fiesta.test.ts`) tiene que
comprobar:

- un equipo vencido y asignado a una fiesta en 5 días dispara el aviso;
- sin `cadaDias`, no dispara nunca.

## Bloque 11 — Llegada del personal con ubicación, como opción (ítem 21)

**Qué hay hoy.** La llegada se marca con `marcarLlegadaPersonal`
(`src/app/actions/personal-fiestas.ts` ~l.37), que guarda `checkInTimestamp`, desde
`src/components/centro/EquipoCheckIn.tsx`. El salón (`src/types/salon.ts` ~l.38) **no tiene
coordenadas**, sólo `googleMapsUrl`. **No hay ningún uso de `navigator.geolocation` en la app.**

**Qué hay que hacer.**

- **Coordenadas del salón.** Agregá `lat?: number; lng?: number` a `Salon`. En la edición del
  salón, poné un botón que las saque del `googleMapsUrl` cuando el enlace las trae (`@lat,lng` o
  `?q=lat,lng`), o que deje escribirlas.
- **Marcar la llegada desde el portal del personal** (`src/app/acceso-personal/[tokenId]/page.tsx`).
  Agregá "Llegué", que pide la ubicación con `navigator.geolocation`. La acción del servidor:
  - valida el token del personal **igual que `responderAsistenciaPersonal`** en
    `src/app/actions/accesos-personal-view.ts`;
  - calcula la distancia al salón;
  - guarda `checkInTimestamp` y `checkInUbicacion: { lat, lng, distanciaMetros }` sólo si está a
    menos del radio.
- **Es opcional.** Interruptor `llegadaConUbicacion` en Ajustes, **apagado** de fábrica, y radio de
  300 metros. Apagado, o si el salón no tiene coordenadas, el botón de siempre sigue andando.

**La prueba** (`src/__tests__/la-llegada-con-ubicacion-mide-bien.test.ts`) tiene que comprobar:

- la distancia (función pura) entre dos puntos conocidos da lo esperado, con 5% de margen;
- a 1 km no marca;
- con token inválido no marca;
- apagado, marca como hoy.

## Bloque 12 — Plantillas de cronograma según el tipo de fiesta (ítem 22)

**Qué hay hoy.** `ItineraryTemplate` (`src/types/fiesta.ts` ~l.1741) tiene `id`, `name` e
`items`, y se guarda con `saveItineraryTemplate` (`src/app/actions/itinerary-templates.ts` ~l.15).
El tipo de fiesta está en `fiesta.configuracion.tipoCelebracion` y es un `TipoEvento`
(`src/types/presupuesto.ts` ~l.41).

**Qué hay que hacer.**

- **Tipo en la plantilla.** Agregá `tipoEvento?: TipoEvento` a la plantilla. Al guardarla en
  `src/app/(app)/fiestas/nueva/itinerario/page.tsx`, se propone el tipo de la fiesta actual.
- **Sugerencia sola.** Si el programa de la fiesta está vacío y hay una plantilla del mismo tipo,
  aparece arriba: **"Usar la plantilla de Boda"**. Se aplica en un toque y **nunca pisa un
  programa que ya tiene ítems**.
- **Lista ordenada.** En el selector de plantillas, primero van las del mismo tipo.

**La prueba** (`src/__tests__/la-plantilla-se-sugiere-por-tipo.test.ts`) va sobre la función pura
que elige la plantilla:

- con una boda y plantillas de Boda y XV, sugiere la de Boda;
- con el programa ya cargado, no sugiere nada.

---

```comprobar
usa: saveScheduledMessage en src/app/(app)/alertas/page.tsx
prueba: src/__tests__/los-avisos-al-cliente-quedan-en-la-bandeja.test.ts
usa: recontactosEnviados en src/lib/marketing/recontacto-automatico.ts
prueba: src/__tests__/el-seguimiento-va-en-pasos.test.ts
archivo: src/lib/presencia-digital/mejor-horario.ts
prueba: src/__tests__/el-mejor-horario-sale-de-tus-resultados.test.ts
usa: recicladoDe en src/lib/presencia-digital/publicador.ts
prueba: src/__tests__/volver-a-publicar-copia-y-programa.test.ts
usa: esPregunta en src/lib/social-media/comments-backfill.ts
prueba: src/__tests__/la-respuesta-a-comentarios-no-inventa.test.ts
archivo: src/app/(app)/fiestas/nueva/reunion-organizacion/page.tsx
prueba: tests/e2e/la-reunion-de-organizacion-guarda-donde-corresponde.spec.ts
usa: registrarQueAbrioLaInvitacion en src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx
prueba: src/__tests__/la-invitacion-no-abierta-se-recuerda-sola.test.ts
archivo: src/app/(app)/fiestas/nueva/orden-de-evento/page.tsx
prueba: tests/e2e/la-orden-de-evento-junta-todo.spec.ts
usa: ak-equipo: en src/app/(app)/fiestas/nueva/carga-operativa/page.tsx
prueba: src/__tests__/el-qr-marca-el-equipo-correcto.test.ts
usa: mantenimiento en src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx
prueba: src/__tests__/el-mantenimiento-avisa-antes-de-la-fiesta.test.ts
usa: geolocation en src/app/acceso-personal/[tokenId]/page.tsx
prueba: src/__tests__/la-llegada-con-ubicacion-mide-bien.test.ts
usa: tipoEvento en src/app/(app)/fiestas/nueva/itinerario/page.tsx
prueba: src/__tests__/la-plantilla-se-sugiere-por-tipo.test.ts
```
