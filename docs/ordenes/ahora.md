# El panel de presencia digital que el dueño pueda usar solo

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 18 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**.

## Cómo se entrega

**UNA SOLA PROPUESTA con los cuatro bloques.** No una por bloque. Cada fusión
dispara un despliegue y se paga. Si un bloque se traba, entregá los otros tres en
la misma propuesta y avisá cuál faltó y por qué.

Antes de subir, los cuatro controles **sobre el conjunto entero**:
`npx tsc --noEmit`, `npx jest --silent`, `npm run check:acentos`, `npm run build`.
**Si el revisor de tipos da un solo error, no subas.** Guardá en UTF-8.

Anotá lo hecho en `docs/YA-RESUELTO.md` y actualizá `docs/QUE-HAY-EN-LA-APP.md`,
en esta misma propuesta. Y al terminar, mové este archivo a `hechas/`.

---

## Lo que YA EXISTE. No lo rehagas.

Verificado archivo por archivo el 18 de agosto. Si algo de esto te parece que
falta, mirá de nuevo antes de escribirlo:

- **Publicar de verdad en Facebook e Instagram**: `publishApprovedSocialPost()`
  en `src/app/actions/presencia-digital.ts:191`. Ya valida que la red esté
  conectada, que haya credenciales, y rechaza WhatsApp y TikTok con su motivo.
- **De dónde vino cada prospecto**: `CommercialAttribution` en
  `src/lib/commercial/acquisition.ts:17`, con `source` que ya incluye
  `instagram`, `facebook`, `youtube`, `whatsapp`, `landing_bodas` y más. Se
  guarda en el prospecto (`acquisition` en `src/types/crm.ts:79`).
- **El reporte de atracción por fiesta**: `/contabilidad/crm/atraccion-fiestas`.
- **El agente de marketing que escribe textos**:
  `src/ai/flows/marketing-agent-flow.ts`, registrado como herramienta
  (`crearPublicacionMarketingTool` en `src/lib/assistant/tool-registry.ts:332`).
  **Se puede llamar desde cualquier pantalla**: no está atado a `/marketing`.
- **El campo de fecha del posteo**: `publishDate` en `src/types/social-media.ts:22`,
  y el estado `Programado` ya existe en `PostStatus`.
- **Cuántos días hace que no se publica en cada red**: ya se calcula, en
  `buildDigitalPresenceDailyReview()`.

## Reglas que valen para los cuatro bloques

**1. Nada se publica sin que el dueño haya aprobado ESE posteo.** No alcanza con
que exista un interruptor general. La app publica lo que él marcó, cuando él dijo,
y nada más. Un posteo que sale sin que lo hayan mirado es un problema serio: eso
lo ven sus clientes.

**2. Todo lo que gaste en inteligencia artificial pasa por el contador.**
`hayPresupuestoParaIA()` de `@/lib/ai/consumo-servidor` antes; si devuelve
`false`, **no se llama al servicio** y se cae al camino simple. `registrarConsumoIA()`
después. Si agregás una función nueva que gasta, sumala a `FuncionConCosto` y a
`COSTO_ESTIMADO_UYU` en `src/lib/ai/consumo.ts`.

**3. NO se inventan números.** Se acaba de arreglar un problema grave: el panel
mostraba 1420 seguidores, 5240 de alcance y 4,9 de puntaje en Google, todos
escritos a mano, y la tarea diaria los guardaba como si fueran medidos. **Si un
dato no se midió, va vacío y la pantalla dice "sin dato".** Nunca un número de
relleno, ni siquiera "para que se vea lindo".

**4. Plata, cobros, comida y permisos los escribe Claude.** Si te cruzás con algo
de eso, avisá y seguí con el resto.

**5. Si algo falla, la pantalla no se rompe.** Siempre hay un camino simple.

---

# BLOQUE 1 — Que lo programado salga de verdad

**Es el más importante de los cuatro.**

## El problema, verificado

El dueño puede marcar un posteo como `Programado` y ponerle fecha en
`publishDate`. **No sale nunca.** No hay nada que lo dispare: busqué en
`src/app/api/cron/` y ninguna tarea mira los posteos programados. Hay
`scheduled-messages.ts`, pero es para WhatsApp, no para esto.

O sea: programa la publicación del sábado, se va tranquilo, y el sábado no pasa
nada.

## Qué hacer

- Una tarea que corra sola y publique los posteos que estén en `Programado` y
  cuya `publishDate` ya haya pasado. Podés colgarla de la tarea que ya existe
  (`src/app/api/cron/metricas-de-redes/route.ts`) o hacer una nueva al lado.
- **Usá `publishApprovedSocialPost()`, no escribas otro camino para publicar.**
  Ya valida credenciales y rechaza las redes que no se pueden automatizar.
- **Si estuvo caído tres días, no vacíes la cola de golpe.** Publicar seis
  posteos juntos un martes a la mañana queda peor que no publicar. Poné un tope
  de cuántos salen por corrida (dos o tres) y dejá el resto para la siguiente.
- **Un posteo que falla no se reintenta para siempre.** Que quede marcado con el
  motivo y aparezca en la pantalla para que el dueño lo vea. Tres intentos y
  para.
- **Lo que no se puede publicar solo** (TikTok, Threads, X, WhatsApp) **no se
  programa como si se pudiera.** Al elegir esas redes, la pantalla tiene que
  decir que va a quedar listo para copiar y pegar, y avisarle ese día. Prometer
  algo que no pasa es peor que no ofrecerlo.

---

# BLOQUE 2 — Que los textos no sean siempre los mismos cuatro

## El problema, verificado

El botón "Generar desde fiesta" **no usa inteligencia artificial**, aunque todo
el mundo cree que sí. Son **cuatro textos fijos** en
`src/app/actions/social-media.ts:393-410`, donde lo único que cambia es el nombre
del evento y un hashtag.

Si el dueño publica los de dos fiestas seguidas, su Instagram queda con el mismo
texto repetido palabra por palabra. Eso se nota y le hace mal a la marca.

## Qué hacer

- Que los textos los escriba **el agente de marketing que ya existe**
  (`chatWithMarketingAgent`), usando lo que se sabe de esa fiesta: tipo de
  evento, salón, cantidad de invitados, qué se contrató, y qué muestra la foto si
  hay dedicatoria o etiqueta de momento.
- **Pasá por el contador de gasto**, regla 2. Si no hay presupuesto, se cae a las
  plantillas de hoy: es un camino peor, pero no deja al dueño sin nada.
- **Cuatro textos distintos entre sí**, no cuatro variantes de lo mismo.
- Tono rioplatense, como habla el equipo. Nada de "¡Descubre nuestra propuesta!".
- **No inventa datos de la fiesta.** Si no sabe cuántos invitados hubo, no lo
  escribe.

---

# BLOQUE 3 — Qué red le trae clientes de verdad

## Para qué sirve

Hoy el dueño no sabe si vale la pena el esfuerzo en TikTok. Necesita ver, en una
pantalla: **de qué red vinieron los que pidieron presupuesto, y cuántos
contrataron.** No seguidores: consultas y contratos.

## Qué hacer

- Una vista en el centro de presencia digital que agrupe los prospectos por
  `acquisition.source` y muestre, por red: **cuántos consultaron, cuántos
  contrataron, y cuánta plata** de esos contratos.
- **Reusá lo que ya está**: la atribución ya se guarda, y
  `/contabilidad/crm/atraccion-fiestas` ya hace algo parecido agrupando por
  fiesta. Mirá cómo lo resuelve antes de escribir nada.
- **Para la plata usá los cálculos que ya existen**, no hagas cuentas nuevas: ya
  pasó que dos pantallas mostraban totales distintos del mismo cliente.
- **Si de una red no vino nadie, decilo con todas las letras**: "De TikTok no
  vino ninguna consulta en estos 90 días". Ese cartel es justamente el dato que
  el dueño necesita.
- Que se pueda mirar por período: últimos 30, 90 días y el año.

---

# BLOQUE 4 — El aviso de que está desapareciendo

## Para qué sirve

La gente no lo contrata porque no lo ve. Un cartel simple cambia el hábito más
que cualquier tablero.

## Qué hacer

- Arriba del panel, bien visible: **"Hace 12 días que no publicás en
  Instagram"**, por cada red que esté callada.
- El dato **ya se calcula** en `buildDigitalPresenceDailyReview()`: engancharlo,
  no rehacerlo.
- Al lado, el botón que ya lleva a armar un posteo con las fotos de la última
  fiesta. Que el aviso tenga la salida al lado, no en otra pantalla.
- **Si está todo al día, que lo diga**: "Venís publicando parejo". Una pantalla
  que sólo reta cansa y se deja de mirar.

---

## Cómo se comprueba

Además de los cuatro controles:

1. **Una prueba de que un posteo programado con fecha pasada se publica**, y de
   que uno con fecha futura NO.
2. **Una prueba del tope por corrida**: con diez programados vencidos, salen dos
   o tres, no diez.
3. **Una prueba de que si falla el servicio de inteligencia artificial, el
   generador de textos cae a las plantillas** y no deja al dueño sin borradores.
4. **Una prueba de que la vista por red no inventa números**: si de una red no
   vino nadie, muestra cero y el cartel, no un número de relleno.

**Que las pruebas llamen al código de verdad.** Ya pasó dos veces que una prueba
armaba una lista adentro y la filtraba ahí mismo: probaba su propio filtro y
seguía en verde aunque la aplicación estuviera rota.

## Las tres cosas que trabaron entregas anteriores

1. **Antes de usar una función o un campo, abrí el archivo y confirmá que
   existe.** El revisor de tipos lo agarra en un minuto; las pruebas no.
2. **Decí desde qué pantalla se ve cada cosa nueva.** Ya hubo cuatro pantallas
   escritas que no se podían abrir desde ningún lado.
3. **Anotá sólo lo que hiciste de verdad.** Comparar contra los archivos que
   cambiaron, no contra lo que se pensaba hacer.

## Cuando termines

Avisá el número de la propuesta.
