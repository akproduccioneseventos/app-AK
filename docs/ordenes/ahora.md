# Siete bloques: la barra, el buzón, la invitación y las puertas abiertas

**Para:** Gemini (Antigravity)
**Escrita:** 19 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta de cambios con los SIETE bloques adentro.** Cada fusión dispara
un despliegue y eso se paga. Si un bloque se traba, entregá el resto igual, en la
misma propuesta, avisando cuál faltó y por qué.

**Arrancá desde la versión principal de ahora.** Las últimas entregas llegaron
hechas sobre una base vieja, y una traía adentro la anterior entera: habría borrado
tres correcciones sin que se notara.

Antes de tocar nada, leé `docs/YA-RESUELTO.md` y `docs/QUE-HAY-EN-LA-APP.md`.

## Lo que YA ESTÁ HECHO — no lo rehagas ni lo toques

El tótem de la barra (`src/app/evento/barra/[fiestaId]/page.tsx`) es la pantalla
táctil del salón: se pide el trago, y te sacás una foto o un video con él. **Es
como la fotocabina pero SIN impresión**: lo que se saca va a la pantalla gigante y
queda guardado, nunca se imprime. Es a propósito del dueño.

Ya funciona y no se toca:

- Pedir el trago desde el tótem.
- La carta en carrusel de la pantalla grande.
- La cuenta regresiva de tres para la foto.
- **El video, que dura 8 segundos** (se bajó de 15: es un saludo con el trago en la
  mano, no un video). La constante es `DURACION_VIDEO_SEGUNDOS`, no la cambies.
- Las plantillas de marco y el envío a la pantalla gigante.
- **La carta de tragos del celular del invitado ya es un carrusel**
  (`MiniQuiosco.tsx`): tarjetas grandes con la foto de protagonista, que se pasan de
  costado con el dedo. Ya está hecho, no lo rehagas.

---

# BLOQUE 1 — Que el invitado se lleve su foto (el más importante)

Hoy el invitado sube la foto, sale un cartel que dice "se envió a la pantalla
gigante", y la pantalla vuelve al inicio. **La persona que acaba de posar con su
trago se va con las manos vacías.**

Y el dato ya está: `uploadBarMagicPhoto` **ya devuelve la dirección de la foto y un
texto listo para compartir** con el hashtag y el Instagram de AK. La pantalla lo
recibe y **lo tira**.

## Qué hacer

Después de subir, mostrar una pantalla de "listo" con:

- **La foto o el video que se acaba de sacar**, en grande.
- **Un código QR grande** para escanear con el celular y llevárselo. Que se vea de
  lejos y de noche: fondo blanco, buen tamaño.
- El texto para compartir, corto, con el hashtag.
- Un botón **"Listo"** para volver al inicio enseguida, y que además vuelva sola a
  los 20 segundos por si la persona se fue.

**Nada de imprimir.** No es una fotocabina con impresora: se lleva la foto en el
celular.

**Por qué importa:** el invitado que se lleva su foto la sube a sus redes con el
hashtag de AK. Es publicidad gratis de la fiesta, hecha por el invitado. Hoy esa
foto muere en la pantalla del salón.

---

# BLOQUE 2 — Que la foto guarde con qué trago se sacó

El sistema **ya sabe hacerlo**: la función acepta el trago y arma sola el texto
*"Disfrutando de un Mojito en la barra interactiva"*. Pero el tótem **no le manda
cuál trago era**, así que ese texto nunca sale y queda uno genérico.

**Qué hacer:** cuando la persona pidió un trago y después se saca la foto, mandar
también ese trago (el identificador y el nombre) junto con el archivo. Son dos datos
que ya están en la pantalla.

Si se sacó la foto sin haber pedido nada, va sin trago, como hasta ahora.

---

# BLOQUE 3 — Que funcione el interruptor de "seguime en las redes"

En los ajustes de la barra hay una opción para **exigir que la persona confirme que
sigue las redes de AK antes de subir su foto**. En el tótem no sirve: la pantalla
responde siempre que sí, sin preguntar. El dueño lo prende y no pasa nada.

**Qué hacer:** que el tótem respete el interruptor. Si está prendido, antes de subir
muestra un paso simple —"Seguinos y tocá acá"— con un botón que abre el Instagram de
AK y otro de "ya te sigo" para continuar. Si está apagado, no molesta a nadie.

**Ojo, que no se convierta en una traba.** Un solo toque, texto corto, y que se
pueda seguir igual si la persona insiste. Nadie quiere pelearse con una pantalla en
una fiesta, y un invitado trabado es peor que un seguidor menos.

---

---

# BLOQUE 4 — El buzón de saludos: falta la foto, y falta la puerta

**Esto no tiene nada que ver con los tragos.** Es el buzón donde el invitado le
deja un saludo a los dueños de la fiesta: `src/app/evento/buzon/[fiestaId]/page.tsx`.

## Lo que ya existe y anda

Cinco formas de dejar el saludo: **grabar video** (con efecto de cinta VHS, corta
solo a los **15 segundos**, que está bien así para un saludo), subir un video ya
hecho, **grabar audio**, audio con efecto retro, y subir un audio.

**El video de acá sigue durando 15 segundos y no se toca.** Es distinto del video
del tótem de la barra, que dura 8: uno es un saludo a los anfitriones, el otro es un
brindis con el trago en la mano.

## 4.1 — Falta sacarse una foto

Las tres opciones que tiene que haber son **foto, video y audio**. Hoy están el
video y el audio; **la foto no está**.

**Qué hacer:** agregar el modo foto, con la misma forma que ya tienen los otros:
sacarla con la cámara del celular, verla antes de mandarla, y poder repetirla. Que
se pueda escribir una dedicatoria corta debajo, igual que en los otros modos.

Aprovechá los marcos que ya existen para el video (`video-frame-templates`) si
aplican también a la foto; si no encajan, dejala simple y limpia antes que forzarlo.

## 4.2 — El acceso al buzón YA SE HIZO, no lo rehagas

El buzón ya está en el portal del invitado como **"Dejar un saludo"**, al lado del
muro y la galería, y respeta el interruptor de la fiesta. Sólo falta lo de arriba:
poder dejar el saludo con una foto.

## Cómo se comprueba este bloque

1. Que desde el enlace personal del invitado se llega al buzón en un toque.
2. Que están las tres opciones: foto, video y audio.
3. Que el video sigue cortando a los 15 segundos.
4. Que la foto se puede repetir antes de mandarla.
5. Que con el buzón apagado, la opción no aparece en el portal del invitado.

---

# BLOQUE 5 — Que las fotos de las estaciones tengan dueño

**Este pedido se había perdido.** Estaba anotado en el inventario como "pedido en la
orden vigente", pero la orden se reescribió y quedó afuera. Verificado hoy: sigue
sin hacerse.

## El problema

Cuando un invitado sube una foto al muro **desde su enlace personal**, la foto queda
guardada con su nombre: después él puede volver a verla y bajarse las suyas.

Pero **la fotocabina, el espejo mágico y la plataforma 360 no reciben ese enlace**.
Verificado: en las tres pantallas el identificador del invitado no aparece por
ningún lado. Entonces toda foto sacada en una estación **queda sin dueño**.

En pantalla: el invitado se saca la foto en la fotocabina, después entra a buscar
sus recuerdos y **no está**. Las fotos de las estaciones —que suelen ser las mejores
de la noche— son justamente las que se pierden.

## Qué hacer

Que las tres estaciones reciban el enlace personal del invitado cuando exista, y lo
manden junto con la foto, igual que ya lo hace el muro social.

**Cómo llega el enlace:** que la estación lo acepte como parámetro en su dirección
web, para que el invitado llegue desde su portal con su enlace ya puesto, o
escaneando un código que se lo agregue.

## LO QUE NO SE PUEDE HACER, Y NO ES OPINABLE

> **Un identificador suelto no se guarda nunca.**

Sólo se guarda el dueño **si la persona probó tener el enlace personal de ese
invitado**. Si se guardara cualquier identificador que llegue, cualquiera podría
mandar el de otro y adueñarse de sus fotos. Eso ya está resuelto así en el muro
social: copiá ese mismo criterio, no inventes uno nuevo.

**Y si no hay enlace personal, la foto se sube igual** y queda sin dueño, como
hasta ahora. Nadie se queda sin sacarse la foto por no tener el enlace.

---

# BLOQUE 6 — Que el anfitrión pueda cargar su historia y sus hoteles

**Contexto:** hasta el 19 de agosto de 2026, toda invitación mostraba una historia
de vida inventada y dos hoteles de Buenos Aires con teléfono argentino, que el
anfitrión no podía cambiar. **Ya se sacaron**: hoy esas dos secciones sólo salen si
hay contenido cargado, y como no hay dónde cargarlo, no salen nunca.

**Los campos ya existen:** `hitos` y `hospedajes` en `InvitacionDigitalConfig`
(`src/types/fiesta.ts`), con sus tipos `HitoInvitacion` y `HospedajeInvitacion`.
Sólo falta la pantalla.

## Qué hacer

En el editor de la página web de la fiesta (`src/app/(app)/fiestas/nueva/pagina-web/`),
agregar dos bloques para cargar:

- **La historia**: una lista de hitos, cada uno con año, título y una descripción
  corta. Poder agregar, borrar y reordenar. Para una boda son "cómo se conocieron",
  para unos quince son los años de la chica.
- **Los hospedajes**: una lista con nombre, dirección, y opcionalmente teléfono y
  enlace para reservar. Es para los invitados que vienen de otra ciudad.

## Cuidados

- **Las dos secciones son opcionales.** Si el anfitrión no carga nada, la sección no
  aparece en la invitación. **Eso ya funciona así, no lo cambies.**
- **Nada de ejemplos precargados.** Ni hitos de muestra, ni un hotel de ejemplo. Si
  hace falta guiar, va como texto gris de ayuda dentro del campo vacío, nunca como
  un dato cargado que después queda publicado sin que nadie lo note. **Esto ya pasó
  cuatro veces en este proyecto.**
- **Los hoteles son de Salto**, o de donde sea la fiesta. Nada de direcciones ni
  teléfonos de otros países.
- Que se vea en la vista previa del editor al cargarlo.

---

# BLOQUE 7 — Revisar las 247 puertas que quedan (el más largo, y se puede cortar)

**Esto es trabajo de paciencia, no de ingenio.** Es perfecto para hacerlo de a
tandas y entregarlo aunque esté a medias.

## El problema, explicado

En un archivo que empieza con `'use server'`, **cada función exportada es una
dirección que cualquiera de internet puede llamar**. No hace falta estar logueado ni
tener el enlace: alcanza con saber que existe.

El 19 de agosto se puso un control que las lista, y **se encontraron cinco reales**:
cambiar la fecha de una fiesta sin cuenta, ver el calendario entero con todos los
clientes, borrar el contrato de una fiesta, nueve funciones de multiagente, y el
simulador sin freno contra robots.

Quedan **247 funciones en 98 archivos sin revisar una por una**, congeladas en
`src/__tests__/puertas-pendientes-de-revisar.json`.

## Qué hacer

Tomá los archivos del JSON **en el orden que quieras** y revisá función por función.
Para cada una, decidí:

1. **Si es del equipo** → poner `await requireAppSession();` en la primera línea.
   Si toca sueldos, contabilidad o permisos, usar `requirePermiso(...)` con el
   permiso que corresponda, como ya hacen otras.
2. **Si es pública a propósito** (la contesta un invitado, un cliente sin cuenta, el
   simulador, un webhook) → declararla en `PUBLICAS_A_PROPOSITO` dentro de
   `src/__tests__/auditoria-puertas-abiertas.test.ts`, **con el motivo escrito**.
   Y si guarda algo, ponerle freno con `enforcePublicRateLimit`, como el simulador.
3. **Si ya estaba protegida** de una forma que el control no reconoce → agregá esa
   forma a la lista de comprobaciones válidas del control.

**En los tres casos, sacá la función del JSON de pendientes y bajá el número del
tope** en la última prueba del archivo.

## LO QUE NO SE HACE, Y NO ES OPINABLE

> **Nunca agregues una función al JSON de pendientes.**

Ese archivo **sólo se achica**. Es la foto de cómo estaba el día que se puso el
control: si crece, el control deja de servir.

Y **no aflojes el control** para que pase. Si falla, es porque encontró algo.

## Cuidados, con ejemplos que ya pasaron

- **Mirá si delega antes de decidir.** `deleteAllFiestas` parecía abierta y en
  realidad llama a una que pide sesión de administrador. Si el cuerpo es una sola
  línea que llama a otra función, la protección está allá.
- **Mirá el ORDEN de lo que hace.** `deleteDocumento` parecía protegida porque el
  guardado del final pide permiso, pero **borraba el archivo antes**. Si una función
  hace algo irreversible antes de la comprobación, la comprobación no sirve.
- **Cerrar sesión y cambiar la contraseña son públicas por necesidad.** La primera
  borra tu propia cookie; la segunda se protege pidiendo la contraseña actual.
- **No rompas lo que anda.** Si al poner la comprobación una pantalla deja de
  funcionar, es que esa función se llamaba desde algún lado público: averiguá desde
  dónde antes de cambiarla.

## Cómo se entrega este bloque

**Se puede entregar a medias y está bien.** Decí cuántas revisaste y cuántas quedan.
Es preferible que entregues treinta bien revisadas a que entregues doscientas mal.

**Ojo:** no las cierres todas de golpe sin mirar. Poner `requireAppSession()` a
ciegas en una función que un invitado necesita **rompe la fiesta en vivo**, y eso es
peor que la puerta abierta.

## Cómo se comprueba

1. `npx jest --silent src/__tests__/auditoria-puertas-abiertas.test.ts` en verde.
2. El número del tope bajó, nunca subió.
3. Las pruebas de siempre siguen pasando: si rompiste algo público, se nota ahí.

## Cómo se comprueba

1. Que sin cargar nada, las dos secciones no aparecen en la invitación.
2. Que al cargar un hito, la sección de historia aparece con ese hito y ninguno más.
3. Lo mismo con un hospedaje.
4. Que se pueden borrar todos y la sección vuelve a desaparecer.
5. Que no queda ningún dato de ejemplo cargado por defecto.

## Cómo se comprueba

1. Que una foto sacada en la fotocabina con el enlace personal queda con dueño.
2. Que la misma foto aparece después cuando el invitado busca sus recuerdos.
3. Que sin enlace personal la foto se sube igual, sin dueño y sin error.
4. Que mandando el identificador de OTRO invitado, sin su enlace, **no** se guarda
   como dueño.
5. Lo mismo para el espejo mágico y la plataforma 360.

## Cómo se comprueba

Además de los cuatro controles, probá en pantalla de verdad:

1. Que después de subir aparece el código para llevarse la foto, y que se puede
   volver al inicio sin esperar.
2. Que vuelve sola al inicio si nadie toca nada.
3. Que la foto sacada después de pedir un trago queda guardada con ese trago.
4. Que con el interruptor de las redes prendido el tótem lo pide, y apagado no
   molesta.
5. Que nada de esto rompe el pedido del trago, la cuenta regresiva ni el video de 8
   segundos.

**Que las pruebas llamen al código de verdad.** Ya pasó tres veces que una prueba
armaba una lista adentro y la filtraba ahí mismo: la entrega vino "en verde" sin
haber probado nada.

## Los cuatro controles, antes de entregar

1. `npm run check:acentos` — sin acentos rotos.
2. `npx tsc --noEmit` — cero errores.
3. `npx jest --silent` — todas en verde.
4. `npm run build` — tiene que terminar bien.

**El build es obligatorio, no un extra.** Ya pasó que el revisor de tipos pasaba y
el build fallaba, y la aplicación estuvo seis días sin poder publicarse.

## Cuando termines

Anotá en `docs/YA-RESUELTO.md` qué hiciste y actualizá `docs/QUE-HAY-EN-LA-APP.md`,
donde hoy figura que el invitado no se lleva su foto y que el interruptor de las
redes no se respeta. **Va en la misma propuesta**, no aparte.
