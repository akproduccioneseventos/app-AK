# Leer los comentarios de las redes, desde el principio y todos los días

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 18 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

> **Después de ésta hay otra en la fila:**
> `docs/ordenes/2-despues-de-los-comentarios.md` (la reseña de Google y el panel
> que trabaja solo). **No la mezcles con ésta:** son dos propuestas separadas, una
> atrás de la otra.

## Cómo se entrega

**UNA SOLA PROPUESTA con los cuatro bloques.** No una por bloque. Si uno se
traba, entregá los otros tres en la misma propuesta y avisá cuál faltó y por qué.

Antes de subir, los cuatro controles **sobre el conjunto entero**:
`npx tsc --noEmit`, `npx jest --silent`, `npm run check:acentos`, `npm run build`.
**Si el revisor de tipos da un solo error, no subas.** Guardá en UTF-8.

Anotá lo hecho en `docs/YA-RESUELTO.md` y actualizá `docs/QUE-HAY-EN-LA-APP.md`
en esta misma propuesta, y mové este archivo a `hechas/` al terminar.

---

## Para qué es esto

El dueño quiere que la aplicación **lea los comentarios de sus redes, los buenos
los tenga listos para mostrar como testimonio, y los malos se los avise**.

Hoy las páginas de venta muestran testimonios sin la captura del comentario, y
por eso no se distinguen de un texto de relleno. Esto los reemplaza por
comentarios de verdad, con su enlace al original.

## Lo que SÍ se puede y lo que NO

**Verificado antes de escribir esta orden. No prometas lo que no se puede.**

| Red | ¿Se pueden leer los comentarios? | ¿Se pueden ocultar o borrar? |
|---|---|---|
| Facebook | **Sí**, con el permiso de la página | **Sí**, ocultar y borrar |
| Instagram | **Sí**, cuenta de empresa | **Sí**, ocultar y borrar |
| YouTube | **Sí**, con la clave de la API | Sí, moderar |
| TikTok | **No** | No |
| X | **No** sin plan pago | No |
| Threads | **No** | No |

Las tres primeras son donde el dueño tiene el movimiento. **En la pantalla tiene
que decir con todas las letras cuáles se leen y cuáles no, y por qué** —para que
no espere comentarios de TikTok que nunca van a llegar—.

## Reglas que valen para los cuatro bloques

**1. Se OCULTA solo lo agresivo. No se BORRA nada solo. No se PUBLICA nada solo.**

El dueño pidió que actúe sola, y con razón: *"a veces comentan y no te enterás"*.
Un insulto colgado tres días en su página le hace daño real. Pero un programa que
decide se va a equivocar, así que la acción automática tiene que ser **la que se
puede deshacer**:

- **Insultos, agresiones, spam o datos personales de terceros → se ocultan solas,
  en el momento, y se le avisa.** Ocultar en Facebook e Instagram deja el
  comentario visible sólo para quien lo escribió: corta el daño al instante y **se
  puede volver atrás con un toque** si la máquina se equivocó.
- **Una queja legítima de un cliente NO se oculta sola.** Se le avisa y decide él.
  Tapar un reclamo real es lo que termina en una captura de pantalla dando vueltas
  por Salto; tapar un insulto es simplemente moderar.
- **Borrar nunca es automático.** No tiene vuelta atrás, así que lo aprieta él.
- **Publicar un testimonio en la web nunca es automático.** Ahí va el nombre de
  una persona en material de venta.

Si la máquina duda entre insulto y queja, **trata como queja**: avisa y no oculta.

**3. Todo lo que gaste en inteligencia artificial pasa por el contador.**
`hayPresupuestoParaIA()` antes —si devuelve `false` no se llama al servicio—, y
`registrarConsumoIA()` después. Sumá la función nueva a `FuncionConCosto` y a
`COSTO_ESTIMADO_UYU` en `src/lib/ai/consumo.ts`.

**4. No se inventan números ni comentarios.** Si una red no está conectada, la
pantalla lo dice; no muestra un cero disfrazado de dato ni ejemplos de relleno.

**5. Plata, cobros, comida y permisos los escribe Claude.** Si te cruzás con eso,
avisá y seguí.

---

# BLOQUE 1 — Traer todos los comentarios, desde el principio

**Una sola vez, hacia atrás.** El dueño quiere el historial completo, desde que
abrió sus redes hasta hoy.

- Recorré **todas las publicaciones** de la página de Facebook, de la cuenta de
  Instagram y del canal de YouTube, y de cada una traé **sus comentarios**.
- Paginá hasta agotar lo que la red entregue. **Si la red corta antes de llegar
  al principio, decilo en la pantalla**: "Facebook entregó hasta marzo de 2021".
  Nunca lo marques como historial completo si no lo es.
- Guardá de cada comentario: quién lo escribió, el texto, la fecha, la red, el
  enlace al comentario original y a qué publicación pertenece.
- **Que se pueda cortar y retomar.** Son miles: si se corta a la mitad, la
  próxima corrida sigue donde quedó, no arranca de nuevo.
- **Sin duplicar.** Un comentario que ya está no se guarda dos veces.
- Reusá lo que ya existe para hablar con Meta: mirá
  `src/lib/social-media/meta-history-backfill.ts`, que ya trae el historial de
  publicaciones y resuelve la paginación y las credenciales.

# BLOQUE 2 — Todos los días, lo nuevo

- Una tarea diaria que traiga **sólo lo que entró desde la última vez**.
- Colgala de la tarea que ya corre (`src/app/api/cron/metricas-de-redes/route.ts`)
  o hacé una al lado, con la misma clave de seguridad.
- **Si una red falla, las otras siguen.** Y si una no está configurada, se saltea
  sin romper nada.

# BLOQUE 3 — Separar los buenos de los malos

- Que la inteligencia artificial lea cada comentario nuevo y lo marque como
  **bueno, neutro o malo**, con una razón corta en criollo.
- **Cuidado con la ironía y el modismo uruguayo.** "Está de más" es bueno; "y
  bueno..." no lo es. Cuando dude, que lo marque **neutro**, no bueno: un
  testimonio irónico publicado en la web es peor que uno de menos.
- **Nunca marca bueno un comentario con insultos, datos personales de terceros,
  o el nombre de un menor.**
- Si no hay presupuesto de inteligencia artificial, que quede sin clasificar y la
  pantalla lo diga. **No inventes una clasificación por palabras sueltas**: "no
  puedo creer lo que fue esa fiesta" tiene un "no" y es un elogio.

# BLOQUE 4 — Qué hace el dueño con eso, en un toque

Una pantalla en el centro de presencia digital, con dos listas:

**Los buenos → listos para mostrar**
- Cada uno con su texto, quién lo escribió, la fecha y **el enlace al comentario
  original**, para que el dueño pueda comprobarlo.
- Botón **"Mostrar en la web"**: lo publica como testimonio en las páginas de
  venta, usando el sistema que ya existe (`src/lib/testimonios/para-mostrar.ts`,
  que ya filtra por aprobado).
- **Si el comentario tiene imagen o se puede guardar la captura, guardala**: el
  carrusel ya sabe mostrarla (`screenshotUrl` en `src/types/public-landing.ts`) y
  es lo que hace creíble a un testimonio. Hoy los que hay no la tienen.

**Lo que se ocultó solo → queda avisado y se puede revertir**

Palabras del dueño: *"en el portal de la app queda la notificación y si no estoy
de acuerdo revierto"*. Entonces:

- Cada comentario ocultado automáticamente **deja un aviso que se queda en el
  panel** hasta que el dueño lo mire. No un cartel que pasa y se va: tiene que
  seguir ahí al otro día si no entró.
- El aviso muestra **el texto completo del comentario, quién lo escribió, la
  fecha, la red y el enlace al original**, para que pueda juzgar sin salir de la
  aplicación.
- Botón **"Volver a mostrarlo"**, de un toque, que lo devuelve a la vista en la
  red. Sin confirmaciones ni vueltas: si la máquina se equivocó, corregirlo tiene
  que ser más fácil que el error.
- Que se vea **por qué lo ocultó** ("insulto", "spam", "datos de otra persona"),
  para que el dueño aprenda a confiar o a desconfiar de la máquina.

**Los malos que NO se ocultan (quejas legítimas) → avisar, no tocar**
- Que aparezcan juntos, con el enlace al original y la fecha.
- **Un aviso al dueño cuando entra uno nuevo**, con el mismo sistema de avisos que
  ya usa la aplicación. Que se entere el día que pasa, no un mes después.
- Botones: **"Ocultar en la red"** (reversible, es el principal) y **"Borrar"**
  (con confirmación que aclare que no tiene vuelta atrás).
- **Ninguno de los dos se ejecuta solo, nunca.**

# BLOQUE 5 — Que el dueño pueda subir las capturas que ya tiene

**Chico y desbloquea todo lo demás.**

El dueño tiene capturas de comentarios de sus redes en su catálogo impreso. La
aplicación **no tiene dónde subirlas**: se buscó en todo el proyecto y no hay
ninguna pantalla que lo permita, ni una sola imagen de ese tipo guardada. Por eso
los testimonios de las páginas de venta quedaron como texto suelto, sin la
captura que el propio diseño espera (`screenshotUrl`).

**Qué hacer:** en la pantalla de testimonios (Ajustes → Opiniones), poder
**adjuntar la imagen del comentario** a un testimonio, con la misma subida de
archivos que ya usa el resto de la aplicación. Y que el carrusel la muestre,
cosa que ya sabe hacer.

Con eso, los testimonios que el dueño ya tiene en papel pasan a la web **con la
prueba a la vista**, que es lo que los hace creíbles.

---

## Cómo se comprueba

Además de los cuatro controles, pruebas que llamen al código de verdad:

1. **Que nada se publique ni se borre sin aprobación**: con un comentario malo
   nuevo, la tarea diaria **no** lo borra; sólo lo deja avisado.
2. **Que el historial no se marque completo si la red cortó antes.**
3. **Que no se guarde dos veces** el mismo comentario al correr dos veces.
4. **Que si falla la inteligencia artificial**, los comentarios quedan sin
   clasificar y la pantalla lo dice, en vez de clasificar mal.
5. **Que una red no configurada no rompa** la traída de las otras.

**Que las pruebas llamen al código real.** Ya pasó tres veces que una prueba
armaba una lista adentro y la filtraba ahí mismo, o que ni siquiera arrancaba:
en los tres casos la entrega vino "en verde" sin probar nada.

## Las tres cosas que trabaron entregas anteriores

1. **Antes de usar una función o un campo, abrí el archivo y confirmá que
   existe.** En la última entrega había cinco campos inventados y no compilaba.
2. **La lógica no va adentro del archivo de una tarea de internet.** Ponela en
   `src/lib/...` y dejá la tarea como una cáscara: si no, las pruebas no pueden
   cargarla y no prueban nada. Ya pasó.
3. **Nada que escriba o borre se exporta desde un archivo `'use server'` sin
   pedir permiso.** Todo lo exportado ahí queda abierto a internet.

## Cuando termines

Avisá el número de la propuesta y decí, por cada red, si quedó andando o no y por
qué.
