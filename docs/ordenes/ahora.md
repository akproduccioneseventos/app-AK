# La reseña de Google y el panel que trabaja solo

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 18 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

> **Ésta es la segunda orden en la fila.** Primero se termina y se entrega
> `docs/ordenes/ahora.md` (leer los comentarios de las redes). Recién después se
> arranca ésta. **No se mezclan las dos en la misma propuesta:** si algo se rompe,
> con diez bloques juntos no se sabe cuál fue.
>
> **Cuando le toque el turno: los cinco bloques de acá van en UNA sola propuesta.**
> Cada fusión dispara un despliegue y eso se paga. Si un bloque se traba, entregá
> los otros cuatro igual, en la misma propuesta, y decí cuál faltó y por qué.

## Por qué esto ahora

Se investigó cómo se gana el primer puesto en las búsquedas de Salto. El
resultado, en corto: **la ficha de Google pesa cerca del 32% y las reseñas otro
16%** — juntas, más que el sitio web entero. Y cuando alguien le pregunta a Google
o a un asistente de inteligencia artificial quién organiza fiestas en Salto, la
respuesta nombra **uno a tres negocios**, casi nunca los que están por debajo de
cuatro estrellas.

La empresa hoy no tiene reseñas visibles. Un competidor tiene ciento veinticinco.

---

# BLOQUE 1 — El botón de la reseña en la pantalla de gracias

> **CORREGIDO EL 18 DE AGOSTO.** La versión anterior de esta orden pedía construir
> el pedido de reseña entero. **Estaba mal: ya existe.** El dueño lo hizo notar.
> Lo que sigue es sólo lo que falta de verdad.

## Lo que YA existe (verificado, NO lo rehagas)

- **El pedido de reseña por WhatsApp ya está hecho:** `src/app/actions/feedback.ts`.
  Cuando el cliente completa la encuesta, la app le manda el enlace de Google.
- **El enlace y el interruptor ya están en Ajustes → Empresa**
  (`googleReviewsLink`, `enableGoogleReviewsAutoRequest`).
- **Ya controla que no se le pida dos veces** por la misma fiesta.
- **Ya se corrigió el filtro por nota.** Pedía la reseña sólo a los que ponían 9 o
  10; eso hace que Google borre **todas** las reseñas del negocio. Ahora se le
  pide a todos, con un texto distinto para el que quedó disconforme. **Hay una
  prueba que lo frena** (`la-resena-se-le-pide-a-todos.test.ts`): **no la borres y
  no vuelvas a poner el filtro.**

## Lo único que falta

El pedido sale por WhatsApp, y **el WhatsApp puede no estar configurado o el
cliente puede no tener teléfono guardado**. En esos casos hoy no se le ofrece
nada.

- En la pantalla de gracias de `src/app/feedback/[fiestaId]/page.tsx`, después de
  enviar la encuesta, **mostrar también el botón de dejar la reseña**, con el
  enlace guardado en Ajustes.
- **Si el enlace no está cargado, el bloque no se muestra.** Nada de inventar una
  dirección de Google.
- **Se le muestra a todos los que terminan, sin importar la nota.** Al que puso
  nota baja se le muestra el mismo botón, con una línea arriba diciendo que el
  equipo lo va a contactar. **No se le esconde.**

# BLOQUE 2 — Que el equipo sepa a quién le falta pedirle

Sirve de poco si nadie manda la encuesta.

- Una lista, adentro del centro de presencia digital: **fiestas terminadas en los
  últimos treinta días y si ya se le pidió la opinión al cliente o no.**
- Un botón por fiesta que abre el WhatsApp del cliente con el mensaje escrito y el
  enlace de la encuesta. **Lo manda la persona, no el sistema.**
- Que quede registrado a quién se le pidió y cuándo, para que no se le pida dos
  veces.
- **La regla que ordena todo esto: una reseña por fiesta, todos los meses.** Lo
  que más pesa no es el total acumulado sino que sigan llegando.

# BLOQUE 3 — Aviso cuando el puntaje baja de cuatro estrellas

Debajo de cuatro estrellas el negocio casi desaparece de las respuestas que arman
los buscadores con inteligencia artificial, aunque siga saliendo en la búsqueda
común.

- Si el promedio de Google baja de 4,0, **avisar el mismo día**, arriba de todo en
  el panel, con el texto en criollo: qué pasó y por qué importa.
- **Sólo si hay puntaje medido de verdad.** Sin dato, no hay aviso: no se inventa
  un promedio para poder mostrar la alerta.
- Engancharlo a la tarea que ya corre todos los días
  (`src/app/api/cron/metricas-de-redes/route.ts`), no a una tarea nueva.

# BLOQUE 4 — El tablero de altas

El dueño tiene que darse de alta en unos dieciséis lugares. Hoy esa lista vive
afuera de la app y se pierde.

- Una sección en el centro de presencia digital: **cada lugar con su nombre, si es
  gratis o pago, el enlace, y un tilde de hecho o pendiente** que el dueño marca a
  mano.
- Arriba, cuántos lleva de cuántos.
- Los lugares, en este orden: Google Perfil de Empresa, Casamiento.com.uy,
  Gallito, Mercado Libre Servicios, WhatsApp Business con catálogo, Waze,
  Foursquare, Guía Comercial UY, Evisos Salto, Yelu Uruguay (gratis); Centro
  Comercial e Industrial de Salto, Cámara de Eventos del Uruguay, TuFiesta, Guía
  Móvil 1122, Revista Bodas Uruguay, Salto Al Mundo (pagos o con cuota).
- **Es una lista para marcar, no una integración.** No intentes darlo de alta
  automáticamente en ningún lado: todos piden confirmar un correo o un teléfono
  del dueño.

# BLOQUE 5 — Que el calendario se llene solo, también en las semanas flojas

## Lo que ya existe (no lo rehagas)

- **Generar publicaciones desde las fotos de una fiesta ya está hecho:**
  `generateDraftPostsFromPartyPhotos()` en `src/app/actions/social-media.ts`. Usa
  inteligencia artificial con vuelta a plantillas si no hay presupuesto, y ya pasa
  por el contador de gasto.
- **El aviso de inactividad ya está** en el panel.

Lo que falta es que **no dependa de que el dueño se acuerde de apretar el botón**.

## Qué hacer

1. **Después de cada fiesta**, que el panel deje sola la semana de publicaciones
   armada, en borrador, con las fotos aprobadas de esa fiesta. El dueño entra,
   mira y aprueba. **Nada se publica sin que una persona apruebe.**
2. **En las semanas sin fiestas**, que arme igual la propuesta, con dos fuentes:
   fotos de fiestas anteriores que anduvieron bien, y **las preguntas que más se
   repiten** (cuánto sale, qué incluye, cómo se reserva, cuántas personas entran).
   Los huecos largos sin publicar son lo que hace perder posición.
3. **Sin fiestas nuevas y sin fotos viejas aprobadas, no inventes nada:** el panel
   dice que no hay material y ofrece subirlo.

## Sobre la plata

Esto usa la misma generación que ya existe, así que **pasa por el contador que ya
está**: `hayPresupuestoParaIA()` antes, `registrarConsumoIA()` después. **No
agregues llamadas nuevas de inteligencia artificial por fuera del contador.** Si
no hay presupuesto, las plantillas escritas a mano alcanzan.

---

## Lo que NO se toca

- **Plata, cobros, comida y permisos: eso lo escribe Claude.**
- **No muestres ningún dato que no esté medido.** La tarjeta de la ficha de Google
  ya llegó una vez con un cartel de "verificada" y un identificador escrito a
  mano, y hubo que sacarlo. Hay una prueba que lo frena
  (`la-ficha-de-google-no-inventa-nada.test.ts`): no la borres.
- **No pongas ningún acceso ni clave dentro de un archivo del repositorio.**
- **No toques `public/firebase-messaging-sw.js`.** Lo genera el compilador.
- **Nada se publica ni se manda solo.** La app prepara y ofrece; la persona
  decide y aprieta.
- **No rehagas** la generación de publicaciones, el aviso de inactividad, la
  encuesta al cliente ni la tarea diaria: están y funcionan.

## Los controles antes de entregar

1. `npx tsc --noEmit`
2. `npx jest --silent`
3. `npm run check:acentos`
4. `npm run build`

Sobre el conjunto entero. **Si el revisor de tipos da un solo error, no subas.**

## Las cuatro cosas que trabaron entregas anteriores

1. **Antes de usar una función o un campo, abrí el archivo y confirmá que existe.**
   Una entrega usó cuatro nombres de campo que no existían.
2. **Resolvé los conflictos antes de subir.** Llegó una entrega con marcas de
   conflicto adentro de un archivo: no compilaba.
3. **Decí desde qué pantalla se ve cada cosa nueva.**
4. **Que las pruebas nuevas prueben lo que la pantalla usa de verdad.** Hubo
   pruebas que reemplazaban funciones que la pantalla no llama: pasaban en verde
   sin medir nada.

## Cuando termines

Anotá en `docs/YA-RESUELTO.md` sólo lo que hiciste de verdad, actualizá
`docs/QUE-HAY-EN-LA-APP.md`, avisá el número de la propuesta y mové este archivo
a `hechas/` **en la misma propuesta**.
