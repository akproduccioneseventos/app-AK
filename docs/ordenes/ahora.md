# La galería tiene que mostrar TODO el Instagram, como ya hace con YouTube

**Para:** Gemini (Antigravity)
**Escrita:** 22 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta de cambios con los tres bloques adentro.** Cada fusión
dispara un despliegue y eso se paga. Si un bloque se traba, entregá el resto
igual, en la misma propuesta, avisando cuál faltó y por qué.

**Arrancá desde la versión principal de ahora.**

Antes de tocar nada, leé `docs/MANUAL-DE-LA-APP.md`, `docs/YA-RESUELTO.md` y
`docs/QUE-HAY-EN-LA-APP.md`.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

---

## Lo que pidió el dueño

> "Quiero que traiga todas las publicaciones desde que comencé mi cuenta. Lo
> mismo de YouTube."

---

## Lo importante: casi todo ya está hecho, falta enchufarlo

**No hay que escribir un bajador de historial: ya existe y funciona.**
`syncMetaPublicHistory()`, en `src/lib/social-media/meta-history-backfill.ts`,
pagina hacia atrás hasta agotar (hasta 100 páginas), guarda en
`social-posts.json` y deja la marca de hasta dónde llegó en
`meta-public-history-backfill.json`. Lo dispara la tarea `metricas-de-redes`, una
vez por día. Es el mismo molde que YouTube.

**El agujero está en la galería.** `src/app/page.tsx` llama a
`getPublicInstagramFeed()` (`src/lib/instagram/public-feed.ts`), que le pide a
Meta **las últimas 24 y nada más**, sin paginar y sin guardar nada. O sea: el
historial se baja todos los días y **no lo mira nadie**.

---

## BLOQUE 0 — QUE CORRA SOLO DE VERDAD (esto es lo primero)

**Lo que pidio el dueño:** *"se debe actualizar automaticamente, la app tiene que
ser automatica toda"*.

**El problema, en criollo:** hoy no es automatica. Las tareas se ponen al dia
**solo cuando alguien del equipo entra al panel**: el disparador vive en
`src/components/app-shell.tsx`, que es la cascara del area con sesion. El
visitante que entra a la web publica **no dispara nada**. Si nadie del equipo abre
la app el fin de semana, no corre nada en todo el fin de semana: ni las notas del
blog, ni la bajada de las fotos de Instagram, ni los recordatorios de cuota.

Ya paso: hubo meses sin numeros de redes guardados y sin posteos programados
saliendo. El propio codigo lo dice en `src/lib/automatico/al-entrar-a-la-app.ts`:
*"No reemplaza al despertador de afuera. Si nadie abre la app en tres dias, estas
tareas no corren en tres dias."*

Y la solucion que habia escrita es `docs/PRENDER-LAS-TAREAS.md`: un instructivo
para que el dueño se cree una cuenta en una pagina de internet y configure cuatro
renglones a mano. **Nunca lo hizo, y no tiene por que hacerlo.** Eso no es
resolver: es pasarle el problema.

### Qué hay que hacer

**1. Un despertador de verdad, dentro del proyecto.** La carpeta `functions/` ya
existe y hoy no tiene ninguna tarea programada. Agregá **una sola** tarea
programada que corra cada 15 minutos y llame al mismo camino que ya usa el
disparador de hoy: revisa que hay vencido y lo corre.

- **Una sola tarea programada, no cuatro.** Una que pregunte "que esta vencido" y
  corra lo que corresponda. Cuatro tareas programadas serian cuatro trabajos
  agendados; una sola entra en lo que ya viene incluido sin pagar.
- **Que no dependa de que nadie abra nada.**
- Dejá anotado en `docs/PRENDER-LAS-TAREAS.md` que ya no hay que configurar nada a
  mano, y por que. Ese documento hoy miente.

**2. Que la web publica tambien lo dispare, como red de seguridad.** El sitio
recibe visitas de prospectos. Que una visita a la portada dispare la misma puesta
al dia, **sin hacer esperar a nadie**: se larga y la pagina sigue, nunca se espera
el resultado. Si el despertador falla, esto lo cubre.

**3. Y aca esta la trampa, que ya nos mordio antes:** cuando algo pasa de correr
en un solo lugar a correr con cada visita, la pregunta no es "¿funciona?" sino
**"¿que pasa si dos lo hacen al mismo tiempo?"**. Diez visitas en el mismo minuto
no pueden generar diez notas de blog ni pagar diez veces la inteligencia
artificial. Ya paso una vez, con dos llamados que salian juntos y leian el
"esto ya corrio recien" antes de que ninguno lo escribiera.

- **La marca de "ya estoy corriendo" se toma ANTES de trabajar, no despues.**
- El que llega y ve que otro esta corriendo, se va sin hacer nada.
- **Una prueba que lo demuestre**: varias llamadas al mismo tiempo tienen que
  dejar una sola corrida.

**4. Que se vea.** En `/settings/tareas-automaticas`, que quede claro cuando corrio
cada tarea por ultima vez y quien la disparo (el despertador o una visita). Si una
tarea no corre hace mas del doble de lo que deberia, que se vea en rojo.

### Sobre lo que cuesta

Una sola tarea programada cada 15 minutos entra en lo que Google ya da incluido:
en la practica **no agrega gasto mensual**. Aun asi, como la regla es no tocar
nada que aumente lo que se paga sin avisar: **es una sola tarea agendada, no
cuatro**, y no se cambian ni la memoria ni las instancias minimas del servidor.
`apphosting.yaml` no se toca.

---

## BLOQUE 1 — Que la galería lea el historial guardado

1. **`getPublicInstagramFeed()` tiene que leer lo guardado**, no pedirle a Meta las
   últimas 24. La fuente es la misma que usa YouTube. Mirá cómo lo hace la parte
   de YouTube en la portada y seguí ese camino.

2. **Meta sigue sirviendo para lo nuevo**, no para armar la galería: si aparecen
   publicaciones que todavía no están guardadas, que las sume la tarea
   automática, no la visita del prospecto. **Ninguna visita a la web puede
   quedarse esperando a Meta.**

3. **Si el historial guardado está vacío** (primera vez, o la conexión recién
   cargada), que la galería siga mostrando los videos de YouTube y no quede un
   hueco. Nunca fotos de ejemplo.

4. **Disparar el bajado completo una vez**, para que el archivo quede lleno desde
   el arranque y no haya que esperar días. Fijate que la tarea acepta el modo
   completo; dejá una forma de dispararlo desde la pantalla de conexiones, con un
   botón que diga qué está haciendo y cuántas publicaciones trajo.

5. **Confirmá la fecha de arranque.** Hoy el bajado empieza en **septiembre de
   2019** (`earliestDate` en `src/app/api/cron/metricas-de-redes/route.ts`). Si la
   cuenta es anterior, se pierden las primeras publicaciones. Dejá esa fecha en un
   solo lugar y con un comentario que explique de dónde sale.

---

## BLOQUE 2 — Que mostrar cientos de fotos no rompa la página

Esto no es un detalle: con años de publicaciones pueden ser cientos. Volcarlas
todas de una hace que la página tarde una eternidad en abrir, justo en la pantalla
que le muestra el trabajo al que está por contratar.

1. **Mostrar una tanda y un "ver más"**, o que vayan apareciendo al bajar. Que lo
   primero que se ve cargue rápido.
2. **Las fotos se cargan cuando se llega a ellas**, no todas al abrir.
3. **Ordenadas de la más nueva a la más vieja.**
4. **Los reels y videos entran igual que las fotos**, no se quedan afuera.
5. Probalo en el celular: es donde mira el cliente, y es donde se nota.

---

## BLOQUE 3 — Que se vea que anda

En `/settings/sincronizaciones`, en la tarjeta de Instagram:

1. **Cuántas publicaciones hay guardadas** y **de qué fecha es la más vieja**. Con
   eso el dueño ve de un vistazo si trajo todo o se quedó a mitad de camino.
2. **Cuándo fue la última vez que buscó nuevas.**
3. **Si el bajado quedó incompleto, decirlo** y ofrecer el botón para seguir. Nunca
   dar por completo algo que se cortó.
4. **Todo en criollo**: nada de nombres de variables ni de errores de Meta en
   inglés.


---

## BLOQUE 4 — El panel de redes con su historial, y un boton para actualizar

**Lo que pidio el dueño:** *"el panel de redes sociales con su historial y que
actualice"*.

Hoy no hay ninguna pantalla donde ver cuanto historial hay guardado ni forma de
traerlo a mano: **la unica manera de que baje es esperar a la tarea automatica**.
Si el dueño acaba de conectar la cuenta, no tiene como saber si trajo todo.

En **`/empresa/redes-sociales`** (Planificador de Contenido), agrega un panel de
historial que muestre, por cada red (Instagram, Facebook, YouTube):

1. **Cuantas publicaciones hay guardadas.**
2. **De cuando es la mas vieja y de cuando la mas nueva.** Con eso se ve de un
   vistazo si trajo todo el historial o se quedo a mitad de camino.
3. **Cuando fue la ultima vez que busco publicaciones nuevas.**
4. **Un boton "Actualizar ahora"** que dispare la bajada completa y, al terminar,
   diga cuantas publicaciones nuevas trajo. Mientras corre, que se vea que esta
   trabajando: puede tardar.
5. **Si la bajada quedo incompleta, decirlo** y ofrecer seguir. Nunca dar por
   completo algo que se corto.

### Lo que ya existe y hay que usar, no rehacer

- `syncMetaPublicHistory({ forceFull: true })` en
  `src/lib/social-media/meta-history-backfill.ts` baja Instagram y Facebook.
- `syncYouTubePublicHistory()` en
  `src/lib/social-media/youtube-history-backfill.ts` baja YouTube.
- `getSocialHistorySummary()` en `src/app/actions/social-history.ts` ya devuelve
  el total, la fecha mas vieja, la mas nueva y el desglose por red.
- **Hoy a las dos bajadas las llama unicamente la tarea automatica**
  (`src/app/api/cron/metricas-de-redes/route.ts`). Falta la accion de servidor que
  las dispare desde la pantalla.

**La accion nueva va protegida** con permiso de administracion, como el resto. No
la dejes abierta.

---

## Como conviene hacer el BLOQUE 1 (ya esta estudiado)

Para no perder el viaje, esto ya esta mirado:

- `getPublicInstagramFeed()` tiene que leer `social-posts.json` con `readData`,
  filtrar `platform === 'Instagram'` con `mediaUrl`, ordenar por `publishDate` de
  la mas nueva a la mas vieja, sacar repetidas por `sourceId` y mapear al mismo
  `PublicInstagramFeedPost` que ya devuelve. **La forma de lo que devuelve no
  cambia**, asi que la portada no se toca.
- Los campos guardados que se necesitan: `sourceId`, `mediaUrl`, `mediaType`
  ('video' o 'image'), `link` o `sourceUrl` para el enlace, `text` para el texto,
  `publishDate`, y `performance.likes`.
- La consulta a Meta se queda **solo como respaldo** para cuando no hay nada
  guardado todavia (cuenta recien conectada), para que la primera visita no vea un
  hueco.

## Como conviene hacer el BLOQUE 2 (ya esta estudiado)

- `src/components/landing/GallerySection.tsx` ya muestra 12 fotos y tiene un boton
  **"Ver todas las fotos"** que las dibuja **todas de golpe**. Con el historial
  completo eso pasa a ser cientos: hay que cambiarlo por **tandas** (12 mas cada
  vez que se toca), volviendo a la primera tanda cuando se cambia de categoria.
- Ojo con el visor de fotos ampliadas: recorre `displayedImages`, asi que si
  cambias como se arma esa lista, revisa que las flechas sigan andando.

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes.
- No mostrar fotos de ejemplo en producción, nunca.
- El WhatsApp prepara mensajes y no los manda.
- Si tocás o agregás una pantalla, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.
