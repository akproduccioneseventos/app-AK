# El plan completo: catorce bloques en tres entregas

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 16 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. Reemplaza a la anterior.

## Estado al 17 de agosto de 2026 — leé esto antes que nada

**La ENTREGA 1 está HECHA y fusionada. No la rehagas.**

- **Bloque A (trivia) — HECHO.** El invitado responde del celular, la pantalla
  gigante marca la correcta en verde y muestra el podio por mesa. **Falta sólo la
  parte de las misiones secretas**, que quedó sin enchufar.
- **Bloque B (secretario que habla) — HECHO.** Micrófono en el asistente interno,
  en castellano uruguayo, contesta en voz y se puede silenciar.
- **Bloque C (quién llegó) — HECHO.** Se reparó al fusionarlo: escribía el archivo
  del proyecto a mano y no pedía sesión.
- **Bloque D (pantallas de noche) — HECHO.** Logística y recepción en oscuro.

**De la orden anterior también quedó hecho:**

- **Bloque F (aviso de margen) — HECHO y visible** en la pantalla del presupuesto,
  sólo del lado del equipo.
- **Bloque H (sin internet) — A MEDIAS.** La cola anda y está enchufada a **la
  llegada de invitados** nada más. **Faltan la foto al muro y el pedido de la
  barra.**
- **Bloque J (videos) — apenas empezado.** Sólo el resumen de la mañana ordena por
  corazones. Falta todo el video.
- **Bloque I (configurador) — SE DEVOLVIÓ.** Ver abajo por qué.

### LO QUE FALTA, que es tu trabajo ahora

**ENTREGA 2:** bloque E (la reunión que se agenda sola — **el más importante**),
bloque G (la pregunta de los quince), lo que falta del bloque H (foto al muro y
pedido de barra) y las misiones secretas del bloque A.

**ENTREGA 3:** bloques I, J, K, L, M, N.

### Antes de rehacer el configurador (bloque I)

Se escribió contra funciones y campos **que no existen**, así que nunca compiló:

- Para guardar un presupuesto es **`savePresupuesto()`**, no `createPresupuesto`.
- `ServicioEmpresa` **no tiene** `descripcion`, ni `activo`, ni `esRecomendado`.
- `calculateSimulatorPricing()` no recibe `selectedServiceIds`.

**Antes de usar un campo o una función, abrila y confirmá que existe.**

### Tres cosas que trabaron las entregas anteriores

1. **Anotá en `docs/YA-RESUELTO.md` sólo lo que hiciste de verdad.** Un informe
   dijo siete bloques y eran cuatro.
2. **Todo lo que escribe datos usa `updateDataPartial`/`writeData` y pide
   `requireAppSession()`.** Escribir el archivo del proyecto con `fs` no sirve: en
   producción los datos viven en la base y no se guarda nada.
3. **Decí desde qué pantalla se ve cada cosa nueva.** Un cálculo que no está
   enchufado no existe para el usuario, aunque compile y pase las pruebas.

## DEVOLUCIÓN del 17 de agosto — las tres ramas están sin terminar

Se revisaron `feat/entrega-2-final`, `feat/entrega-3-bloques-finales` y
`agent/historial-redes-sociales`. **No se fusionó ninguna: no compilan.** Casi
treinta errores de tipo en ocho archivos, y el mismo patrón de siempre: código
escrito contra funciones y campos **que no existen**.

**No es para desanimarse: el trabajo está bien encaminado.** Lo que falta es
abrir cada archivo antes de usarlo. Acá van los nombres de verdad, uno por uno.

### Los nombres correctos, verificados a mano

- **`SalonScene` se exporta por defecto**, no con nombre. El import correcto es
  `() => import('@/components/salon-3d/SalonScene')`, sin `.then(mod => mod.SalonScene)`.
- **`updateFiestaData` y `getFiestaData` NO existen en `@/lib/data-service`.**
  `streaming.actions.ts` los importa de ahí y por eso no compila. Mirá cómo lo
  hace `src/app/actions/fiesta/fiesta.actions.ts`, que usa `readData`,
  `writeData` y `updateDataPartial`.
- **`cumple15` no existe en el tipo `Invitado`** (`src/types/invitado.ts`). Si el
  campo hace falta, **primero se agrega al tipo**.
- **`'social_guest'` no es un origen válido** en `CommercialSource`
  (`src/lib/commercial/acquisition.ts`). Usá uno de los que ya están o agregalo
  ahí primero.
- **`getAvailableAppointmentSlots()` devuelve un objeto**, no un arreglo: hay que
  leer `.slots`. En el simulador se lo trata como arreglo y se le pide `[0]`.
- **La pantalla `lo-tuyo` llama una función con un argumento y espera tres.**
  Nueve errores salen de ese archivo: es el que está más lejos de andar.
- **`SocialMediaCalendar` quedó incompleto** al agregar YouTube, Threads y X al
  tipo: las dos tablas de colores e íconos necesitan las tres entradas nuevas.

### El importador de historial no lee ni su propio archivo de prueba

`parseHistoricalSocialArchive` falla con *"El archivo no tiene un formato JSON/JS
válido de exportación"* **contra el ejemplo que trae su propia prueba**. O sea que
la función principal de ese bloque no funciona. Hay que hacerla andar contra los
archivos de verdad que exportan Instagram, Facebook y X.

### Y algo de seguridad que hay que agregar sí o sí

**`createPublicAppointment` no tiene ningún freno.** Es una acción pública, sin
sesión: cualquiera puede llamarla en un bucle y **llenar la agenda entera de citas
falsas**, y cada una dispara además una invitación de Google y una reunión en el
CRM. Hace falta:

1. **Límite de uso**, con `enforcePublicRateLimit` de
   `src/lib/commercial/public-rate-limit.ts`, que ya existe y usa el asistente.
   Cinco por hora alcanza.
2. **Validar nombre y contacto** (largo mínimo y máximo).
3. **Volver a verificar el horario contra `getAvailableAppointmentSlots()` en el
   servidor.** La lista que vio la persona en pantalla pudo quedar vieja, y sin
   esa verificación se puede agendar dos veces la misma hora o en el pasado.

### Cómo entregar de nuevo

**Una sola rama con todo**, y **los cuatro controles en verde antes de subir**.
Si `npx tsc --noEmit` da un solo error, no se sube.

## Cómo se entrega esto

**El dueño pidió que hagas TODO lo que falta de una sola vez, en UNA propuesta.**
Las entregas 2 y 3 juntas.

**El orden en que conviene hacerlo, si tenés que priorizar:**

> **E** (la reunión que se agenda sola) → **G** (la pregunta de los quince) →
> lo que falta de **H** (foto al muro y pedido de barra) → las misiones del
> **A** → **I** (configurador) → **M** (cada uno ve lo suyo) → **K**
> (termómetro) → **L** (libro) → **J** (videos) → **N** (transmisión).

**Si no llegás con todo, entregá igual lo que esté terminado de verdad y decí
qué faltó.** Eso es una respuesta válida. Lo que no sirve es entregar ocho cosas
a medias: una sola rota traba a todas las demás en la revisión.

**Y algo que importa con una propuesta grande:** corré los cuatro controles
**sobre el conjunto entero**, no bloque por bloque. Dos cosas que pasan por
separado pueden romper juntas; ya pasó con el archivo de facturas.

## La regla que más plata ahorra en esta orden

> **Casi nada de esto se construye de cero. Buscá antes de escribir.**

Ya pasó dos veces: se pidió construir algo que **ya estaba escrito y sin
enchufar**. Un ayudante que buscó estas mismas piezas se perdió cinco archivos
enteros. **Las rutas de abajo las verifiqué a mano, abriendo cada archivo.** No te
fíes de una sola búsqueda: buscá con acentos y sin acentos, en castellano y en
inglés.

## Dos cosas que valen para los catorce bloques

1. **Nada se manda ni se publica solo.** Ni un video, ni un posteo, ni un mensaje,
   ni un aviso al cliente. La app prepara, **una persona aprueba**.
2. **Toda llamada de inteligencia artificial que se paga pasa por el contador.**
   `hayPresupuestoParaIA()` antes y `registrarConsumoIA()` después, como ya lo
   hacen la fotocabina y el vendedor virtual. Si agregás una función que gasta,
   agregala también a `COSTO_ESTIMADO_UYU` en `src/lib/ai/consumo.ts` y a la
   prueba `la-ia-que-se-paga-siempre-se-cuenta.test.ts`.

---

# ENTREGA 1 — Lo que ya está construido y no está enchufado

**Es la entrega más barata de las tres y la que más se nota.** Casi todo es
plomería: conectar cosas que alguien escribió y quedaron muertas.

---

# BLOQUE A — La trivia de la cena y las misiones secretas

## Qué tiene que pasar

**La trivia:** antes de la tanda de baile, en la pantalla gigante aparece una
pregunta —*"¿Cuál es el blooper más grande de la quinceañera?"*—. Todos responden
del celular en quince segundos. Sale el podio.

**Las misiones:** cada invitado recibe una misión distinta y personal: *"buscá a
alguien de corbata azul y sacate una selfie"*, *"armá un trencito con cinco
personas que no conozcas"*. Es lo que hace que la gente que no se conoce se hable,
y llena el muro de fotos.

## Lo que ya existe (verificado)

**Enchufado y andando** — sirve para encuestas, no para trivia con ganador:

- `src/app/actions/fiesta/screen-mode.actions.ts` — `launchGame()`,
  `voteActiveGameOption()` (con transacción, no se pierden votos simultáneos),
  `clearActiveGame()`.
- `src/app/(app)/fiestas/nueva/muro-social/page.tsx` — panel del equipo con seis
  plantillas, **una ya es de tipo `trivia`**.
- `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx` — la pantalla gigante dibuja
  la pregunta con barras de porcentaje. Refresca cada 2 segundos.
- `ActiveGameData` en `src/types/fiesta.ts` **ya tiene `correctOptionId`** —la
  respuesta correcta— **y nadie lo lee**.

**Escrito, terminado y MUERTO** — no lo usa ninguna pantalla:

- `src/lib/games/game-engine.ts` — `checkTriviaAnswer()` y **`calculateLeaderboard()`,
  que devuelve los tres primeros Y el ranking por mesa**. También
  `getSecretMissionForGuest()`, que reparte las misiones sin repetir.
- `src/components/games/TriviaGameScreen.tsx` — pantalla del invitado.
- `src/components/games/TriviaAdminPanel.tsx` — panel para cargar preguntas.
- `src/components/games/LeaderboardDisplay.tsx` — el podio dibujado.
- `src/components/games/PhotoMissionScreen.tsx` — las misiones.

## Qué hacer

**No escribas una trivia ni un sistema de misiones. Enchufá los que hay.**

1. **El podio en la pantalla gigante al cerrar la trivia.** Hoy se ven las barras
   mientras se vota y después nada. **El ranking por mesa es el que enciende el
   salón**: las mesas compiten.
2. **Usar la respuesta correcta.** Marcarla en verde al cerrar, antes del podio.
3. **Que el invitado responda desde el celular**, enganchándose donde ya vota.
4. **Que el equipo escriba sus propias preguntas** desde el panel del muro social.
   Las buenas son las de esa familia, no las genéricas del motor de ejemplo.
5. **Quince segundos con cuenta regresiva visible** en la pantalla grande.
6. **Las misiones**: que cada invitado vea la suya en su celular y que al cumplirla
   suba la foto al muro. Una por persona, distinta.

Si algo de esos cinco archivos está a medio hacer, decilo y rehacelo limpio. **Pero
miralos primero.**

## Cómo tiene que verse

Televisor mirado **de lejos, en un salón oscuro, por gente parada y con ruido**:
letras enormes, el podio con animación —es el momento del aplauso—, y nada de
textos chicos ni explicaciones.

# BLOQUE B — El secretario que habla

**Éste es el que más le cambia el día al dueño, y está casi hecho.**

## Qué tiene que pasar

El dueño abre la app, aprieta un botón y habla:

> — *¿Cuánto me debe la fiesta del sábado?*
> — *Te deben 42.000 pesos. Vencía el martes pasado.*
>
> — *Anotame que hay que llamar al de las luces.*
> — *Anotado para hoy.*

Contesta **en voz y por escrito**, para poder usarlo manejando o en el salón con
ruido.

## Lo que ya existe (verificado, y es casi todo)

- **El asistente interno ya existe y ya lee los datos de verdad.**
  `src/ai/flows/multiagent-flow.ts` elige entre siete agentes —central, fiesta,
  fiestas general, secretaria, contable, marketing, comercial— según en qué
  pantalla estás y qué preguntás. Lee fiestas, presupuestos, pagos, prospectos y
  los números del tablero.
- **Ya tiene doce herramientas** en `src/lib/assistant/tool-registry.ts`: crear
  presupuesto, crear cliente, crear prospecto, **agendar cita**, registrar pago,
  crear evento, generar contrato, consultar disponibilidad, y las de marketing.
- **Ya hay un botón flotante en todas las pantallas internas**:
  `src/components/multiagent/multiagent-widget.tsx`. Pide sesión.
- **Y el reconocimiento de voz en castellano uruguayo YA ESTÁ ESCRITO** en otro
  módulo: `src/components/reuniones/MeetingIntelligenceRecorder.tsx` usa
  `SpeechRecognition` con `lang = 'es-UY'`.

## Qué hacer

**Falta el micrófono y la voz. Nada más.**

1. **Un botón de micrófono en el widget que ya existe.** Se aprieta, se habla, el
   texto entra como si se hubiera escrito. Copiá el patrón del grabador de
   reuniones, que ya funciona en `es-UY`.
2. **Que la respuesta se lea en voz alta**, con un botón para silenciarla.
3. **Que se vea lo que entendió** antes de mandarlo, por si el ruido del salón le
   hizo escuchar cualquier cosa. Con un toque para corregir.
4. **Que funcione con una mano y de pie.** Botón grande, redondo, abajo.

## Lo que NO se toca

- **No hagas otro asistente.** Hay uno y anda.
- **Las herramientas que mueven plata** —registrar pago, generar contrato— **piden
  confirmación escrita en pantalla antes de ejecutarse.** Por voz se pide, por
  pantalla se confirma. Un "sí" mal escuchado no puede registrar un pago.
- **Confirmá que el asistente interno pase por el contador de gasto de IA.** Si no
  pasa, hacelo pasar: es una llamada que se paga.

# BLOQUE C — Quién llegó y quién falta

## Lo que se verificó

El centro de la fiesta (`src/app/(app)/fiestas/[id]/centro/page.tsx`) muestra
"quién trabaja esta noche" con nombre y rol, sacado de `personalAsignado`. **Pero
es una lista escrita: nadie marca que llegó.**

Los invitados **sí** tienen `checkedIn` y `checkInTimestamp` en
`src/types/fiesta.ts`. **El personal no tiene el equivalente.**

A las ocho de la noche el dueño no sabe si el fotógrafo está en el salón o en la
casa. Se entera llamándolo.

## Qué hacer

- Un campo de llegada para el personal asignado, igual al que ya tienen los
  invitados.
- **Un toque de "llegué"** desde el celular de cada uno.
- En el centro de la fiesta: **los que llegaron en verde, los que faltan en rojo**,
  con la hora. De un vistazo se sabe a quién llamar.
- Si falta alguien y ya pasó su horario, que se note **sin ser un alertadero**: un
  color, no un cartel que parpadea.

# BLOQUE D — Las dos pantallas de la noche que quedaron claras

**Ojo: este bloque es MUCHO más chico de lo que parece. Leé antes de tocar.**

## Lo que se verificó, y corrige una suposición

Se pensaba que había que oscurecer todas las pantallas de la noche. **Falso: casi
todas ya están oscuras a propósito.**

- El centro de la fiesta ya usa `bg-slate-950` y tiene un comentario que lo
  explica: *"pensado para el celular, de pie y con poca luz"*.
- Moderación, impresión y el DJ también están en oscuro.

**Las que quedaron claras son dos:** `src/app/evento/logistica/[fiestaId]/` y
`src/app/evento/accesos/[fiestaId]/`. Y accesos es justo la que se usa **en la
puerta, de noche, apuntando a la cara del que llega**.

## Qué hacer

**Sólo esas dos**, con el mismo criterio que ya usa el centro de la fiesta: fondo
oscuro, números grandes, textos cortos, botones para el dedo.

> **NO agregues modo oscuro a la app.** No hay interruptor ni proveedor de tema, y
> la migración completa ya se descartó con razón. Son dos pantallas pintadas a
> mano, como las otras.

---

# ENTREGA 2 — Lo que trae clientes y protege la plata

**No la empieces hasta tener la entrega 1 terminada y entregada.**

---

# BLOQUE E — Que la reunión se agende sola, sin que nadie conteste

**Es el bloque más importante de toda la orden.**

## El problema, con números

Hoy alguien completa el simulador un domingo a las once de la noche. Al final le
aparece un botón **"Coordinar Reunión"** que **abre WhatsApp para que ELLA le
escriba a AK**. Y AK no contesta hasta la mañana.

Lo que dice la industria: contestar en **un minuto** multiplica por casi cinco las
chances de cerrar. El salón promedio tarda **once horas**. Pasar de once horas a
diez minutos **triplica** lo que se cierra. Una madre que mira cinco salones le
escribe a los cinco: **el primero que responde se lleva la visita, y el que
consigue la visita se lleva la fiesta.**

**El dueño dijo, textual, que no se va a levantar a contestar.** Así que la
solución no es avisarle más rápido: **es que no haga falta que conteste.**

## Qué tiene que pasar

Que al terminar el simulador, la persona **elija sola el día y la hora**:

> **¿Cuándo querés venir a verlo?**
> Martes 10:00 · Martes 16:00 · Miércoles 11:00 · Jueves 17:00

Toca uno, recibe la confirmación, y **al dueño le aparece la reunión agendada
cuando se despierta**. Nadie contestó nada y la venta ya arrancó.

## Lo que ya existe (verificado)

- **La agenda está hecha.** `src/app/actions/agenda.ts` tiene `createAppointment()`,
  `updateAppointment()` y `cancelAppointment()`. El tipo `CrmAppointment` está en
  `src/types/crm.ts` con `leadId`, `presupuestoId`, `fechaHora`, `estado`.
- **Ya se sincroniza sola con Google Calendar** al crear o modificar una cita
  (`syncAppointmentToGoogleWorkspace()`), y manda la invitación por Gmail.
- **Ya se crea el prospecto y el presupuesto** desde el simulador:
  `generateBudgetAndLeadFromSimulator()` en `src/app/actions/armado-rapido.ts`.
- El paso final del simulador está en
  `src/app/simulador-de-presupuesto/page.tsx`, cerca de la línea 1528.

## Lo que falta (y es todo lo que hay que hacer)

1. **Los horarios en que AK atiende.** No existe nada de esto: sólo hay un
   verificador de **fechas** ocupadas (`checkDateAvailability()`), que mira si ese
   día ya hay una fiesta. Hace falta algo simple: **qué días y en qué franjas se
   atiende**, configurable desde ajustes. Nada complicado: "martes a viernes, de
   10 a 12 y de 16 a 19".
2. **Descontar lo ya ocupado.** Que no ofrezca una hora que ya tiene una cita.
3. **El elector de turno en el paso final del simulador**, en lugar del botón que
   abre WhatsApp. Pocas opciones, grandes, tocables con el dedo.
4. **Que al elegir se cree la cita de verdad** con `createAppointment()`, ligada al
   prospecto y al presupuesto que se acaban de generar. Google Calendar se
   sincroniza solo, ya está hecho.
5. **Confirmación en pantalla al toque**: "Listo, te esperamos el martes a las 10".
   Y que se pueda cambiar o cancelar con el mismo enlace.

## Cuidados

- **Que no se pueda agendar dos veces la misma hora**, aunque dos personas toquen
  al mismo tiempo. Es el mismo cuidado que ya tiene el voto de la trivia.
- **Dejá el botón de WhatsApp también**, más chico. El que prefiere escribir, que
  escriba.
- **No inventes urgencia nueva.** El contador de quince minutos que ya está en esa
  pantalla es una decisión del dueño y no se toca, pero no le agregues otra.

# BLOQUE F — Al cotizar, avisar si el margen no se va a cumplir

**Éste roza plata. Leé la restricción antes de escribir una línea.**

## Lo que se verificó

El cotizador **nunca mira lo que costaron las fiestas anteriores**. No hay ninguna
referencia a históricos en `src/lib/simulator/` ni en `src/lib/budget/`.

Los datos existen y están cargados: costos reales por fiesta
(`src/app/actions/fiesta/costos.actions.ts`), la pantalla de gestión de costos y
rentabilidad, y la comparativa de ganancias. **Pero eso vive aparte y no se cruza
nunca con el presupuesto que se está armando.**

Se puede cotizar unos quince en el Club Uruguay para 150 personas con un margen
que **en las últimas tres fiestas iguales no se cumplió**, y nadie avisa hasta que
la fiesta ya pasó.

## Qué hacer

Un renglón discreto al lado del presupuesto, comparando contra fiestas parecidas
—mismo tipo de evento, salón parecido, cantidad de invitados parecida—:

> *En las últimas 3 fiestas parecidas, la comida costó un 12% más de lo estimado.*

- **Avisa, no frena.** El dueño decide igual.
- **Si no hay suficientes fiestas parecidas, no muestres nada.** Un promedio de una
  sola fiesta confunde más de lo que ayuda.
- En criollo: "costó más de lo estimado", no "desvío de margen".

## La restricción

> **Este bloque MUESTRA un aviso. NO toca el cálculo del precio.**

El precio lo sigue calculando `calculateSimulatorPricing()` en
`src/lib/simulator/pricing.ts`, exactamente igual que hoy. **No cambies un número,
ni una regla, ni el ajuste anual, ni un descuento.** Leés lo que pasó antes y lo
ponés al lado, como un cartel.

Si te encontrás modificando cómo se arma un total, **parate y avisá**: eso lo
escribe Claude.

# BLOQUE G — Las que cumplen quince el año que viene

## Lo que se verificó

Un invitado entra a la lista de prospectos **sólo si él mismo se pone a pedir un
presupuesto** (`src/lib/crm/public-lead-persistence.ts`). Los otros ciento noventa
y pico de cada fiesta se van y no queda nada.

La atribución ya está construida: se guarda de qué fiesta y de qué invitado vino
cada consulta (`refFiestaId`, `refGuestId`).

## Qué hacer, y el detalle que lo hace posible

**La app no sabe la edad de nadie y adivinarla sería un desastre. No se adivina: se
pregunta**, en el mejor momento posible, que es cuando la chica está bajando su
foto de la fotocabina, contenta, en la fiesta:

> **¿Cuándo cumplís tus quince?**
> **[Ya los festejé] · [Este año] · [El año que viene] · [No es lo mío]**

Cuatro botones, un toque, sin escribir nada. **La que toca "el año que viene" acaba
de decir la edad, dejó el contacto y se convirtió en prospecto.**

En la pantalla del equipo, una lista ordenada por cuándo cumplen: *"estas ocho
cumplen entre marzo y julio, vinieron de la fiesta de Sofía"*.

## Y lo que lo cierra: reconocerla cuando vuelva

Cuando una de esas chicas consulte el año que viene, **que el sistema lo sepa y se
lo diga al vendedor**: *"vos estuviste en los quince de Sofía, en el Club Uruguay"*.
Empezar así no se parece en nada a empezar de cero. La atribución ya guarda ese
dato: falta mostrarlo en el momento de la venta.

## Ampliación pedida por el dueño el 17 de agosto de 2026

**La pregunta no va sólo en la fotocabina. La app tiene que vender en todos
lados, sin invadir.** Va también en la galería, en el muro, en "mi mesa" y en la
invitación: en cualquier pantalla donde el invitado esté contento y ya haya
terminado lo suyo. **Nunca antes de que consiga lo que vino a buscar.**

### Y sobre a quién se le muestra: hay un paso previo

El dueño propuso usar la categoría del invitado para mostrarla sólo a quien
corresponde. **Es la idea correcta, pero hoy no se puede: la categoría es
`'Adulto' | 'Niño/Adolescente'`** (`src/types/invitado.ts`), o sea que **junta a
un nene de seis con una chica de quince**.

Entonces, en este orden:

1. **Separar la categoría en tres: adulto, niño y adolescente.** En la invitación,
   donde hoy se elige entre dos.
2. **Mostrar la pregunta de los quince sólo a los adolescentes.** Al adulto y al
   nene no se les muestra nada.

### La regla dura de este cambio, y es de plata y de comida

> **Separar la etiqueta NO puede cambiar ni lo que se cocina ni lo que se cobra.**

El dueño lo marcó y tiene razón: **el menú de niños y adolescentes es el mismo.**

La buena noticia es que el sistema **ya los suma juntos**: en
`src/lib/simulator/pricing.ts`, `getGuestCountForItem()` hace
`ninosYAdolescentes = ninos + adolescentes` para los servicios de menores. Así
que separar la etiqueta en la lista de invitados **no toca el precio ni la lista
de compras**, siempre que se siga sumando igual.

**Verificalo con una prueba**: mismo presupuesto, mismos invitados, y que el
total y la cantidad de platos den exactamente igual antes y después del cambio.
Si da distinto, algo se rompió.

### Lo que NO hay que hacer

- **No adivines el género por el nombre.** Falla, y cuando falla queda mal. **No
  hace falta:** si se le muestra a todos los adolescentes, el varón toca "no es lo
  mío" y listo. La pregunta filtra sola, sin equivocarse con nadie.
- **No cambies el menú ni los precios.** Ver arriba.

## Lo que está prohibido

> **No se le manda nada a nadie que no haya apretado el botón.**

Nada de agarrar la lista de invitados y usarla. Nada de casillas ya marcadas. **Eso
quema la marca en Salto en una semana** y es exactamente lo contrario de lo que se
busca. Y como siempre: **no se manda nada solo**, la lista queda para que el equipo
decida.

# BLOQUE H — Si se cae el internet en la fiesta, hoy no pasa nada

## Lo que se verificó

No hay reintentos, ni cola, ni aviso. Se buscó `navigator.onLine`, escuchas de
`offline` y colas de envío en todo `src/app/evento/`: **no aparece ninguna**. El
service worker de `public/sw.js` hace que la app **abra** sin conexión, pero
**ninguna acción sobrevive**.

Y todo funciona por consulta repetida cada pocos segundos —el muro cada 2, el DJ
cada 5, la barra cada 2,2— **sin ninguna conexión viva**. Cuando el wifi se cae,
simplemente fallan en silencio.

En la fiesta: el invitado sube una foto, se corta el wifi en ese segundo, **la foto
se pierde y él no se entera**. Un salón lleno con doscientos celulares en el mismo
wifi es exactamente donde eso pasa.

## Qué hacer

**Sólo las tres acciones que duelen en una fiesta.** No inventes un sistema general
de sincronización.

1. Subir una foto al muro.
2. Anotar la llegada de un invitado en la puerta.
3. El pedido de la barra.

Para las tres:

- **Que lo pendiente se guarde en el celular y se mande solo cuando vuelve la
  señal.**
- **Que la persona vea qué está pasando**: "se está guardando, no cierres", y
  después "listo". Nunca un botón que parece que anduvo y no anduvo.
- **Que no se duplique** si el envío sale dos veces. Una foto repetida en el muro
  es feo; **un pedido de trago repetido en la barra es un problema de plata**.

---

# ENTREGA 3 — Lo grande y lo que nadie puede copiar

**No la empieces hasta tener la entrega 2 terminada y entregada.**

---

# BLOQUE I — El configurador visual para la reunión de cierre

## Qué tiene que pasar

Los padres van a la oficina a cerrar. Hoy AK les explica con palabras qué es la
pista LED, la pantalla gigante y la cabina 360. Ellos asienten pero no lo están
viendo, se llevan un PDF y se van a pensarlo. **Ahí se pierden las ventas.**

Con esto: se abre una tablet, se ve el salón, y **los padres tocan**. Tocan "pista
LED" y el salón cambia. Tocan "pantalla gigante" y aparece. Abajo, el precio se
mueve en el momento.

## De qué colgarse (verificado)

- **El cálculo: `calculateSimulatorPricing()` en `src/lib/simulator/pricing.ts`.**
  Devuelve subtotal, descuentos, ajuste anual, total y precio por persona.
- **El catálogo: `getServiciosEmpresa()` en `src/app/actions/servicios-empresa.ts`.**
  Cada servicio ya trae nombre, precio, foto y forma de cobro.
- **El salón en 3D YA EXISTE: `src/components/salon-3d/SalonScene.tsx`.** Dibuja
  mesas, pista, escenario, barra e iluminación, y tiene `captureScreenshot()`. Lo
  usan el croquis del salón y el armado de mesas.

## La restricción, igual que en el bloque F

> **El precio lo calcula `calculateSimulatorPricing()` y nadie más.**

Una suma escrita a mano acá queda vieja el día que cambie un precio, y el cliente
ve dos números distintos en dos pantallas. **Eso mata la venta más que cualquier
otra cosa.**

## Cómo tiene que verse

Una tablet apoyada en un escritorio, **mirada por dos padres y un vendedor al mismo
tiempo**:

- **El salón ocupa la mayor parte de la pantalla.**
- **Los extras son botones grandes, de un toque**, con la foto del servicio. Los va
  a tocar alguien que no conoce la app, con el dedo, sin que le expliquen.
- **Al tocar tiene que verse que pasó algo.** Si un extra no se puede dibujar en el
  3D, que al menos se prenda su tarjeta y aparezca en un resumen al costado.
- **El precio abajo, grande y siempre visible**: total y precio por persona. Que se
  vea moverse. **Ése es el momento en que deciden.**
- **Nada de jerga ni botones de administración**: el cliente está mirando.

Vive en una ruta interna (pide sesión), y al terminar **un botón que lo convierta
en presupuesto de verdad** por el camino que ya existe.

# BLOQUE J — El video de la mañana, y uno para cada invitado

**El dueño desconfía de que salga bien automático, y tiene razón. Por eso este
bloque se hace en dos pasos y el primero es una prueba.**

## Qué tiene que pasar

**Paso 1:** cuando la quinceañera se despierta, ya tiene un video corto y vertical
con lo mejor de la noche, listo para sus historias, con la marca de AK. Hoy ella
sube lo que le mandó una amiga por WhatsApp.

**Paso 2, el que multiplica:** **cada invitado recibe su propio video** con las
fotos donde sale él. Ciento cincuenta personas subiendo ciento cincuenta videos con
la marca de AK, el mismo domingo. Ninguna fotocabina del mundo puede hacerlo porque
**ninguna sabe quién es quién**. AK sí: tiene la lista de invitados, las mesas y las
fotos de cada estación.

## Lo que ya existe (verificado)

- **Las fotos con sus corazones.** `SocialGalleryPost` en
  `src/types/social-gallery.ts` tiene `timestamp`, `likes`, `moderationStatus`,
  `mediaType` y `sourceModule`.
- **Elegir las mejores por corazones ya está resuelto** en
  `generateDraftPostsFromPartyPhotos()` (`src/app/actions/social-media.ts`): filtra
  aprobadas, ordena por corazones y se queda con las cuatro mejores. **Usá ese
  mismo criterio.**
- **El recap de la mañana existe, pero es sólo datos, no video**:
  `src/lib/recap/recap-engine.ts` y `src/app/invitacion/[fiestaId]/recap/page.tsx`.
  **Ojo: hoy toma las primeras doce fotos sin ordenar por corazones.**

**No existe nada que arme un video.** Lo único parecido es el boomerang del Bogue,
que es otra cosa.

## Cómo hacerlo, y esto no es negociable

1. **Primero UNO SOLO, el de la quinceañera, y probado en una fiesta de verdad.**
   Si sale feo en esa, se tira y no se perdió casi nada. **Recién si sale bien, los
   ciento cincuenta.** No al revés.
2. **La app propone, no publica.** Arma el video y lo deja para que una persona lo
   mire diez segundos y lo apruebe. Si hay una foto movida, se cambia.
3. **La inteligencia artificial ELIGE y ARMA fotos reales. No inventa nada.**
   Descartar las movidas y las de ojos cerrados, elegir las mejores caras, recortar
   bien para el celular, ordenar con la música. **Nunca generar caras ni escenas:
   un recuerdo inventado no es un recuerdo, y sería un problema serio con el
   cliente.**
4. **Antes de elegir cómo armarlo, mirá qué se puede hacer sin agregar
   herramientas pesadas al servidor.** Si se puede armar en el propio celular
   —fotos pasando con música, grabado desde el navegador— es mucho mejor. **Si te
   convencés de que no se puede sin agregar algo pesado, no lo hagas: entregá el
   resto y explicá por qué.** Es una respuesta válida y esperada.
5. **Ciento cincuenta videos por fiesta se pagan.** Pasá por el contador de gasto
   de IA y agregá la función a `COSTO_ESTIMADO_UYU`.

## Reglas

- **Sólo fotos aprobadas.** El `moderationStatus` manda. Una foto sin moderar en
  las historias de la clienta es un problema serio.
- **La marca de AK en el video**, discreta. El enlace al simulador va en el texto
  sugerido, no encima de la imagen.
- **Publica la persona, no el sistema.**

# BLOQUE K — El termómetro de la fiesta

## La idea

Durante la noche la app ya recibe señales que **nadie mira juntas**. Cuando el
movimiento baja, la pista se está apagando, y el DJ es el último en enterarse
porque está mirando su consola.

Un aviso discreto en la pantalla del DJ y en la del encargado:

> *Bajó el movimiento en los últimos 10 minutos. Es momento de la tanda fuerte.*

**Nadie hace esto porque nadie tiene las señales juntas. AK sí.**

## Lo que se verificó, y sirve para no equivocarse

Estas señales **sí** tienen fecha y hora, así que se pueden contar por minuto:

- **Fotos al muro** — `timestamp` en `SocialGalleryPost`.
- **Pedidos de la barra** — `createdAt` en `BarDrinkOrder`
  (`src/types/barra-tecnologica.ts`).
- **Canciones pedidas** — `timestamp` en `SongRequest`.
- **Llegada de invitados** — `checkInTimestamp`.

**Estas NO sirven, no las uses:** los corazones y las reacciones con emoji **sólo
guardan el total, no cuándo se dieron**. No se puede saber si un corazón es de
ahora o de hace dos horas.

**Y ya hay por dónde entrar:** la pantalla del DJ
(`src/app/evento/dj/[fiestaId]/page.tsx`) ya consulta cada 5 segundos.

## Qué hacer

- Contar **fotos por minuto, pedidos de barra por minuto y canciones por minuto**,
  y compararlo con el rato anterior de la misma fiesta —no con otra fiesta, que
  cada una es distinta—.
- Cuando cae fuerte y sostenido, **un aviso discreto**, no una alarma.
- **Nunca más de un aviso cada veinte minutos.** El dueño ya pidió bajar el ruido:
  un cartel cada dos minutos es peor que no tener nada.
- **Que se pueda apagar** desde la configuración de la fiesta.

# BLOQUE L — El libro de la fiesta

## La idea

Terminada la fiesta, la app arma sola un libro: las mejores fotos, los mensajes que
dejaron los invitados, las canciones que pidieron, el podio de la trivia, quién
vino y en qué mesa estuvo.

**Se vende como extra**, digital o impreso. AK es la única que puede armarlo porque
es la única que tiene todos esos pedazos.

## Lo que ya existe (verificado)

Todo el contenido está guardado y sobrevive a la fiesta:

- Fotos aprobadas, con corazones.
- **Dedicatorias y mensajes** — colección `social_dedications`.
- **Canciones pedidas** — colección `social_song_requests`.
- **Encuestas y juegos** — colección `social_polls` y `activeGame`.
- **Quién vino y en qué mesa** — `checkInTimestamp` y `tableNumber` de cada
  invitado.
- **Los momentos de la noche** — `momentosActivos`, con hora.

**Y ya hay un generador de PDF andando**: `src/lib/budget/simulator-budget-pdf.ts`
usa `jspdf`. **Usá esa misma herramienta**, no agregues otra.

**No existe** ningún armado de libro ni PDF de la fiesta. El recap
(`src/app/invitacion/[fiestaId]/recap/page.tsx`) es una página web con doce fotos,
no un libro.

## Qué hacer

- Un libro en PDF, con portada —nombre de la fiesta, fecha, salón—, las fotos
  grandes, los mensajes de los invitados y una página con la noche hora por hora.
- **Que el equipo pueda sacar o cambiar cualquier foto antes de entregarlo.** Es un
  producto que se cobra: no puede salir con una foto fea.
- **Sólo contenido aprobado.**
- Que se pueda descargar y mandar por WhatsApp, como ya se hace con el álbum.

# BLOQUE M — Que cada uno vea sólo lo suyo

## Lo que se verificó

El cronograma de la noche (`ProgramaEventoItem` en `src/types/fiesta.ts`) tiene
`hora`, `titulo`, `descripcion` y `completado`, **pero no tiene a quién le toca**.
No hay campo de responsable ni de rol.

Hay **dieciséis roles** cargados en `src/data/roles.json` —mozo, DJ, cocinero,
fotógrafo, coordinador, barman y demás— y el centro de la fiesta **muestra** el rol
de cada uno, pero **ninguna pantalla filtra por rol**.

Resultado: el plan de la noche es una pantalla igual para todos. El mozo ve lo
mismo que el dueño.

## Qué hacer

- **Que cada punto del cronograma pueda tener un rol asignado** (o ninguno, y
  entonces lo ven todos).
- **Una pantalla "lo tuyo, ahora"**: la persona abre su celular y ve **lo que le
  toca a ella**, grande, y lo que viene después. Al mozo el plato principal, al DJ
  el vals, a cocina la torta.
- **Un aviso cuando le toca**, usando el sistema de avisos que ya existe, que tiene
  campo de rol destino (`rolDestino` en `Notificacion`).
- **Sin ruido**: un aviso por punto del cronograma, no un recordatorio cada cinco
  minutos.

# BLOQUE N — Transmitir la fiesta para los que no pueden venir

## La idea

En Uruguay casi toda familia tiene gente afuera: la abuela que no viaja, el tío en
España. Un enlace privado, sólo para la familia, donde ven el vals y los discursos
en vivo.

**Es un extra que se cobra aparte y no lo ofrece nadie en la zona.**

## Lo que se verificó

**No existe nada de transmisión en vivo en la app.** Se buscó 'streaming',
'transmision' y 'livestream': cero.

## Qué hacer, y hasta dónde llegar

**Empezá por lo más simple que funcione**, que es una página privada donde se ve la
transmisión, no un sistema de video propio:

- Una pantalla pública protegida por enlace privado —del mismo estilo que el portal
  del cliente— donde se ve el video en vivo con la marca de AK y el nombre de la
  fiesta.
- **Que se encienda y apague desde el centro de la fiesta**, porque no se
  transmiten las seis horas: se transmiten **los momentos** —la entrada, el vals,
  la torta—, que es lo que la abuela quiere ver.
- Que el enlace se pueda mandar por WhatsApp a la familia.
- **Cuando no está transmitiendo, que la pantalla lo diga con gracia**: "Todavía no
  empezó. Te avisamos cuando arranque el vals".

## Lo que hay que decir claro en la entrega

**Esto depende del internet del salón.** Si el wifi no aguanta, la transmisión se
corta y queda peor que no hacerla. **Antes de que se venda como servicio hay que
probarlo una noche entera.** Dejalo anotado en la entrega.

---

## Lo que NO se toca nunca, en ninguno de los catorce bloques

- **Plata, cobros, comida y permisos: eso lo escribe Claude.** En esta orden hay
  dos bloques que rozan plata —el F y el I— y los dos tienen la misma regla:
  **se reusa y se muestra, no se recalcula**. Si te encontrás escribiendo cómo se
  arma un total, parate y avisá.
- El ajuste anual del 15%, el descuento del Club Uruguay y el descuento del
  presupuesto: **son decisiones de marketing del dueño**, no errores.
- La validación del token de proveedor en `fotografia` y `catering`.
- Los tiempos de la fotocabina: 10 segundos la primera foto, 4 las demás.
- Los topes del contrato: 10% de reducción, 30% de aumento.
- **Nada se publica ni se manda solo.**
- **No vuelvas a subir el ruido** que se bajó: nada de carteles de éxito nuevos, ni
  parpadeos, ni globitos rojos que cuenten de más.
- **No migres colores al tema.** La app no tiene modo oscuro.
- **No hagas otro CRM, otra galería, otro asistente ni otro motor de
  automatización.** Hay uno de cada cosa y funcionan.

## Los controles antes de cada entrega

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx jest --silent`
4. `npm run check:acentos`

**Sobre el conjunto entero de la entrega, no bloque por bloque.** Dos cosas que
pasan por separado pueden romper juntas; ya pasó con el archivo de facturas.

Y para lo que se ve, **sacá las fotos antes y después**:

```
AK_FOTOS=true node scripts/run-playwright-production.mjs tests/e2e/fotos-de-la-app.spec.ts
```

Mirá las que empiezan con `celular-`: **es donde se va a ver casi siempre**. Las
excepciones son la trivia y el termómetro, que se miran en un televisor y en una
consola de DJ.

## Cuando termines cada entrega

Avisá el número de la propuesta, anotá lo hecho en `docs/YA-RESUELTO.md` —con el
**porqué** de cada decisión, no sólo qué hiciste— y marcá en este archivo qué
bloques quedaron listos. **El archivo se mueve a `hechas/` recién cuando estén las
tres entregas.**
