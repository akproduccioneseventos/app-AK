# Orden 18 — Lo que le falta a la web para estar completa

**Para Gemini. UNA SOLA PROPUESTA con todos los bloques.** Si un bloque se traba,
entregá el resto igual, en la misma propuesta, avisando cuál faltó.

---

## De dónde sale esta orden

El dueño preguntó qué le falta a su web comparada con una web estándar, y qué de lo
que en WordPress se resuelve con un plugin no está. Se barrieron doce funciones y se
verificó cada una en el código.

**Lo que YA TIENE y no hay que tocar** (dos de estas fueron reportadas mal como
faltantes, así que no pierdas el viaje):

- **Anti-spam: existe.** `enforcePublicRateLimit` está puesto en las acciones públicas,
  y **todas las que usan inteligencia artificial lo tienen**, que son las que cuestan
  plata por llamada. Verificado una por una.
- **Textos alternativos en las fotos del blog: existen**, los arma `getBlogPostImageAlt()`.
- Mapa del sitio, permiso a Google, cinco tipos de datos estructurados, Google Analytics,
  blog, redirección de `www`, imagen de 1200px para compartir, botón de WhatsApp.
- **Privacidad y 404: ya se hicieron.** No los toques.

**Y una cosa que NO se hace, es decisión del dueño:** **cartel de cookies, NO.** Su
condición fue *"mientras no molesten"*, y un cartel que hay que cerrar molesta. Las
cookies quedan explicadas dentro de `/privacidad`.

---

## Bloque 1 — Las migas de pan, que hoy son una mentira a Google

En `src/app/public/[eventType]/page.tsx` se usa `BreadcrumbJsonLd`: **se le declara a
Google un camino "Inicio > Fiestas > Bodas" que el visitante NO VE en pantalla.**

Google pide expresamente que los datos estructurados coincidan con lo que se muestra.
Declarar algo invisible es lo que él llama contenido engañoso.

**Qué hacer:** dibujar las migas de pan arriba del título, discretas, con enlaces que
funcionen. Y que salgan **de los mismos datos** que alimentan el JSON-LD, para que no se
puedan despegar nunca.

**Prueba que tiene que quedar:** que el texto visible de las migas coincida con lo
declarado a Google. No alcanza con que "se vean".

## Bloque 2 — Buscador dentro del sitio

Hoy no hay. El blog crece y no hay forma de encontrar nada.

Uno simple alcanza: una casilla que filtre por título y resumen de los artículos y por
nombre de servicio del catálogo. **Sin servicio externo**, sin costo mensual.

## Bloque 3 — Detector de enlaces rotos

Un enlace roto en una página de venta es un cliente que se va. **Ya existe el recorrido
que visita las 348 pantallas**: aprovechalo. Que junte los enlaces de las páginas
públicas, los pruebe, y falle nombrando cuál está roto y en qué página vive.

## Bloque 4 — Página de mantenimiento

Una pantalla que se pueda encender cuando haga falta y diga, en criollo, que volvemos en
un rato y que mientras tanto se puede escribir por WhatsApp. **Que no la pueda encender
cualquiera:** va detrás del acceso del equipo.

## Bloque 5 — Suscripción a novedades

Una casilla para dejar el correo. **Lo que NO se hace:** mandarle nada automáticamente.
Los correos se juntan y **los manda una persona**, como todo lo que sale para afuera. Esa
línea no se cruza.

## Bloque 6 — Compartir el artículo del blog

Hoy sólo por WhatsApp, que para Uruguay está bien. Sumá Facebook e Instagram, que son
donde AK ya publica. **Nada más:** cinco botones de redes que nadie usa ensucian la
pantalla.

---

## Lo que NO entra en esta orden

- **Comentarios en el blog.** Traen spam y hay que moderarlos todos los días. Si el dueño
  los quiere, los pide.
- **Aviso de caída del sitio.** Todo lo que sirve se paga por mes, y **nada que aumente el
  gasto mensual se contrata sin preguntarle**.
- **La lista blanca de seguridad (`Content-Security-Policy`).** Ya está puesta **en modo
  escucha** en `next.config.js`: anota lo que bloquearía sin bloquear nada. Prenderla de
  verdad se hace después de mirar unos días de uso real. **No la prendas vos.**

---

## Cómo se entrega

- **Una sola propuesta**, con todos los bloques que puedas.
- **La documentación viaja adentro:** anotá en `docs/YA-RESUELTO.md` qué hiciste y **por
  qué se eligió así**.
- Antes de subir, `npm run "publicar?"`. Si no pasa, no subas.
- **Cada cosa nueva necesita una prueba que mire el resultado**, o el control te la frena.
