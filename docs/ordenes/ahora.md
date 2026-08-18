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

# BLOQUE 1 — La reseña de Google al final de la encuesta

**Es el bloque más importante de la orden. Empezá por acá.**

## Lo que ya existe (verificado, no lo rehagas)

- **La encuesta al cliente ya está hecha:** `src/app/feedback/[fiestaId]/page.tsx`.
  Dice "Valorá tu experiencia", toma el puntaje y los comentarios, y termina con
  una pantalla de "Gracias por tus comentarios".
- **Esa opinión se queda adentro del sistema y no va nunca a Google.** Ahí está la
  pérdida: es la persona más contenta, en el momento más contento, y no se le
  ofrece nada.
- **El enlace para pedir reseñas ya tiene su lugar en Ajustes**
  (`googleReviewsLink` en `src/types/settings.ts`). Hoy viene vacío.

## Qué hacer

En la pantalla de agradecimiento, después de enviar la encuesta, ofrecerle dejar
la reseña en Google con un toque:

> **¿Nos ayudás con una reseña en Google?**
> Es un minuto y es lo que más nos ayuda a que otras familias nos encuentren.
> **[Dejar mi reseña]**

- El botón abre el enlace guardado en Ajustes. **Si el dueño todavía no lo cargó,
  el bloque no se muestra.** Nada de inventar una dirección de Google: ya pasó una
  vez y hubo que sacarlo.
- Que funcione bien en el celular, que es donde se contesta.

## LO QUE ESTÁ PROHIBIDO, Y NO ES OPINABLE

> **El botón se le muestra a TODOS los que terminan la encuesta, sin importar qué
> puntaje pusieron.**

Mostrárselo sólo a los que puntuaron alto se llama "filtrar reseñas" y **Google lo
castiga borrando TODAS las reseñas del negocio**, no sólo las filtradas. En una
ciudad chica eso es la diferencia entre aparecer y desaparecer.

Tampoco se ofrece ningún premio, descuento ni sorteo a cambio. Ni siquiera
diciendo "una reseña honesta": el incentivo por sí solo alcanza para la sanción.

**Al que puntuó bajo** se le muestra el mismo botón, pero con un texto distinto
arriba: primero que el equipo lo va a contactar para resolverlo. **No se le
esconde el botón.**

### El filtro del envío por WhatsApp ya se sacó (no lo rehagas)

El mismo filtrado prohibido existía por otro camino: el pedido por WhatsApp salía
sólo si el cliente había puntuado 9 o 10, en tres lugares distintos del código.
**Ya está corregido.** Ahora el pedido sale para todos, y lo que cambia según la
nota es el texto: al que quedó disconforme se le pide disculpas y se le avisa que
lo van a llamar, con el enlace igual abajo. Hay pruebas que lo cuidan.

Lo que falta es sólo el botón en la pantalla de gracias, que es lo de arriba.

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
