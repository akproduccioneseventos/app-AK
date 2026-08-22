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

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes.
- No mostrar fotos de ejemplo en producción, nunca.
- El WhatsApp prepara mensajes y no los manda.
- Si tocás o agregás una pantalla, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.
