# La asistente que sabe manejar la app, y los tres puntos de marketing

**Para:** Gemini (Antigravity)
**Escrita:** 21 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta de cambios con los CUATRO bloques adentro.** Cada fusión
dispara un despliegue y eso se paga. Si un bloque se traba, **entregá el resto
igual, en la misma propuesta**, avisando cuál faltó y por qué. No abras una
propuesta por bloque.

**Arrancá desde la versión principal de ahora.** Las entregas hechas sobre una
base vieja ya borraron trabajo sin que se notara.

Antes de tocar nada, leé `docs/MANUAL-DE-LA-APP.md` (es nuevo y es el mapa
completo), `docs/YA-RESUELTO.md` y `docs/QUE-HAY-EN-LA-APP.md`.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

---

## Lo que YA ESTÁ HECHO — no lo rehagas

- **El manual de la app** (`docs/MANUAL-DE-LA-APP.md`), con el mapa en criollo y
  el índice técnico.
- **El mapa de pantallas que se arma solo**: `npm run mapa:generar` escribe
  `src/lib/multiagent/mapa-app.generado.ts` con las 341 pantallas y las 39
  opciones de menú.
- **El candado**: `src/__tests__/mapa-de-la-app-al-dia.test.ts` se pone en rojo si
  alguien agrega una pantalla y no regenera el mapa.
- **Las dos rutas rotas de la asistente** ya están corregidas (el plan de pagos y
  las reuniones llevaban a pantallas que no existen).

---

## BLOQUE 1 — Que la asistente sepa manejar la app

**El problema, en criollo:** la app tiene 341 pantallas. Nadie se acuerda dónde
está cada cosa: ni el dueño, ni alguien nuevo que entre a trabajar. La asistente
de la app puede llevar a una pantalla, pero **conoce sólo 10 rutas escritas a
mano**. Si le preguntás "¿dónde cargo la lista de compras?", no sabe.

**Qué hay que hacer:**

1. En `src/ai/flows/multiagent-flow.ts`, **sacar la lista de 10 rutas escritas a
   mano** del texto que se le manda al modelo y reemplazarla por el mapa que se
   arma solo: usá `mapaParaLaAsistente()` de
   `src/lib/multiagent/mapa-app.generado.ts`. Ese texto trae las 39 opciones del
   menú con su etiqueta y su ruta, que es lo que el equipo dice en voz alta
   ("llevame a la lista de compras", "quiero ver las facturas").

2. **Antes de ejecutar una navegación, validarla** con `esPantallaReal()` del
   mismo archivo. Si el modelo devuelve una ruta que no existe, **no navegar**:
   contestar en texto y ofrecer la opción del menú más parecida. Hoy, si se
   equivoca, manda al usuario a una pantalla en blanco.

3. **Que sepa contestar "¿dónde se hace tal cosa?"** aunque no le pidan ir. Con
   el mapa en el contexto ya alcanza; agregá una regla al texto del agente:
   cuando le pregunten dónde se hace algo, decir el nombre de la opción del menú
   y ofrecer llevarlo.

4. **Sumar el manual al contexto.** Hoy la asistente lee
   `src/lib/multiagent/manual-ak.ts`. Sumale la parte de "Cosas que la asistente
   tiene que saber contestar bien" y "Lo que NO existe" del manual nuevo, para
   que deje de prometer lo que la app no hace (por ejemplo, que ella puede mandar
   un WhatsApp: no puede).

5. **Cuidá el gasto.** Ese texto viaja en cada pregunta. Meté el menú completo
   (39 líneas) y NO la lista entera de 341 pantallas. La lista completa se usa
   sólo para validar, del lado del servidor, sin mandarla al modelo.

**Cómo se prueba que quedó bien:** una prueba nueva que le pregunte "¿dónde cargo
la lista de compras?" y verifique que la respuesta nombra la opción del menú
correcta, y otra que verifique que una ruta inventada no dispara navegación.

---

## BLOQUE 2 — Instagram: que se pueda conectar sin ayuda

**El problema, en criollo:** la galería de la web trae sola los videos del canal
de YouTube y anda perfecto. Instagram no trae nada: necesita la conexión
comercial de Meta cargada y no está. La app no miente —avisa que falta— pero el
dueño no sabe cómo conectarlo y no hay pantalla que se lo explique.

**Qué hay que hacer, en `/settings/sincronizaciones`:**

1. **Una tarjeta de Instagram con el estado real**, en tres estados: conectado
   (con la fecha de la última vez que bajó fotos), no conectado, o conectado pero
   fallando (con el motivo en criollo, no el error técnico).

2. **El paso a paso para conectarlo**, escrito para alguien que no programa: qué
   cuenta hace falta, dónde se saca el permiso, y dónde se pega. Sin jerga.

3. **Un botón de "probar la conexión"** que baje una sola foto y diga "anduvo" o
   "no anduvo, por esto". Hoy no hay forma de saber si quedó bien sin esperar seis
   horas.

4. **Que la galería no se vea rota cuando Instagram no está:** si no hay fotos,
   que se luzcan los videos de YouTube y no quede un hueco vacío.

**Lo que NO hay que hacer:** no muestres fotos de ejemplo en producción. Eso ya
está bien resuelto y es una decisión tomada: la app no inventa datos.

---

## BLOQUE 3 — El blog, repartido en la semana

**El problema, en criollo:** hoy se escriben 3 notas juntas, una vez por semana.
Funciona, pero repartidas rinden más en Google: una publicación cada dos días le
dice a Google que el sitio está vivo; tres el mismo día y silencio seis, no.

**Qué hay que hacer, en `src/lib/marketing-automation.ts`:**

1. Cambiar a **una nota cada dos días** en vez de tres juntas por semana. Son las
   mismas tres notas por semana: cambia el reparto, no la cantidad. **No subas la
   cantidad**: cada nota se paga en inteligencia artificial.

2. **Que la tarea siga poniéndose al día sola** cuando alguien entra a la app,
   como ahora. Si pasaron cuatro días sin que nadie entre, se escribe la que
   corresponde, **una sola, no las atrasadas todas juntas**.

3. **Dejar la frecuencia en un solo lugar**, con un comentario que explique por
   qué está repartida. Si alguien la vuelve a juntar, que sepa qué está
   deshaciendo.

**Ojo con esto:** las notas se publican directo, no pasan por aprobación. Es así
hoy y se deja así, para que Google no dependa de que alguien apruebe. No agregues
un paso de aprobación.

---

## BLOQUE 4 — Posicionamiento: que se pueda ver cómo va

**El problema, en criollo:** el posicionamiento funciona solo —cada nota nueva
entra al mapa que lee Google, y las páginas de venta tienen su título, su
descripción y la ficha del negocio— pero **no hay nadie mirando cómo va**. Nadie
sabe si la app aparece cuando alguien busca "fiesta de 15 en Salto".

**Qué hay que hacer:** una pantalla nueva en `/empresa/presencia-digital`, o una
sección adentro si ya encaja:

1. **Qué tiene la app para Google, hoy**: cuántas páginas de venta y cuántas notas
   del blog están en el mapa del sitio, y cuándo se publicó la última nota.

2. **Un aviso cuando una página de venta se queda sin título o sin descripción.**
   Eso pasa cuando alguien agrega una página nueva y se olvida. Hoy no lo detecta
   nadie. Si podés, dejalo como control automático en las pruebas.

3. **Posiciones de verdad, si se puede conectar**: leer Google Search Console para
   mostrar por qué palabras entra la gente y en qué puesto aparece. Si la conexión
   no está cargada, la pantalla lo dice y explica cómo conectarla, igual que
   Instagram en el bloque 2. **Nunca muestres números inventados de ejemplo.**

4. **Que se entienda sin saber de esto**: nada de "impresiones", "CTR" ni
   "keywords". Decí "cuánta gente lo vio", "cuántos entraron" y "qué buscaron".

**Si el bloque 3 de este punto se traba** porque la conexión con Google pide algo
que no tenés, **entregá los puntos 1, 2 y 4 igual**, en la misma propuesta, y
avisá qué faltó.

---

## Lo que no se toca en ningún bloque

- `apphosting.yaml`: `minInstances: 0` y `memoryMiB: 512` se quedan como están. El
  servidor se duerme a propósito y eso ya está decidido.
- Nada que aumente lo que se paga por mes.
- El WhatsApp prepara mensajes y no los manda. No lo cambies.
- Si tocás una pantalla o agregás una, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.
