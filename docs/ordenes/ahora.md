# Lo que queda: el impreso y las puertas de entrada

**Para:** Gemini (Antigravity)
**Escrita:** 19 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta de cambios con los DOS bloques que quedan adentro** (el 7 y el 8). Cada fusión dispara
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

# YA ENTREGADO Y FUSIONADO — no lo rehagas

Gemini entregó los bloques 1 a 4 el 19 de agosto y están publicados:

- **El invitado se lleva su foto del tótem** con un código en pantalla para
  escanear con el celular.
- **La foto guarda con qué trago se sacó.**
- **El interruptor de "seguime en las redes" funciona**: si está prendido, el tótem
  pregunta antes de subir.
- **El buzón de saludos acepta fotos**, además del video de 15 segundos y el audio, y
  se llega desde el portal del invitado.

Al fusionar hubo que sacar un botón duplicado del buzón en el portal del invitado
—quedaban dos— y limpiar dos archivos con caracteres invisibles de un editor de
Windows. Nada más.

---

## Y los bloques 5 y 6 también, el 20 de agosto

- **Las fotos de las estaciones ya tienen dueño.** La fotocabina, el espejo mágico,
  la plataforma 360 y el 360 con inteligencia artificial reciben el enlace personal
  del invitado. Respetó la regla: **el dueño se guarda sólo si el comprobante es
  válido**; sin comprobante la foto se sube igual, sin dueño.
- **El anfitrión ya puede cargar su historia y sus hospedajes** en la invitación, con
  los ejemplos como texto gris dentro del campo vacío y las filas nuevas vacías.

---

# BLOQUE 7 — Revisar las 84 puertas que quedan (el más largo, y se puede cortar)

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

Quedan **84 funciones en 44 archivos sin revisar una por una**, congeladas en
`src/__tests__/puertas-pendientes-de-revisar.json`.

**Empezaron siendo 247 en 98 archivos.** El 20 de agosto se cerraron 163 de una vez.
**Mirá el JSON, no este número**, que es el que se queda viejo.

Cómo se cerraron las primeras 150, por si sirve para las que faltan: se calculó,
siguiendo los imports desde cada ruta declarada pública en `public-paths.ts`, cuáles
**ninguna pantalla abierta alcanza**. Esas se cerraron todas juntas sin riesgo. **Las
84 que quedan no se pueden cerrar así**: todas las alcanza alguna pantalla que se abre
sin cuenta, y hay que mirarlas de a una.

**Y ojo con el rebote que eso tuvo, porque va a volver a pasar:** cerrar muchas de
golpe rompió cuatro pantallas públicas que llamaban a otra función **del mismo
archivo** que había quedado cerrada. Después de cada tanda, revisá que ninguna función
pública del archivo que tocaste llame a una que acabás de cerrar.

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

---

# BLOQUE 8 — Que lo impreso salga como sale de verdad

**El dueño mandó una foto del impreso real el 19 de agosto de 2026.** Lo que arma la
aplicación no es igual a lo que él entrega.

## Cómo es el impreso de verdad

Papel de **10 x 15 cm**, vertical, con **tres fotos**:

- **Una grande arriba**, a lo ancho, que ocupa como un tercio de la hoja.
- **Dos chicas abajo**, una al lado de la otra, del mismo alto entre sí.
- Debajo, un espacio grande con **el nombre del homenajeado en letra manuscrita
  grande** (por ejemplo "Areli") y abajo, más chico, **el motivo** ("mis 15 años").
- **El logo de AK abajo a la izquierda.**
- **Todo sobre un fondo decorado** que combina con la fiesta (en el ejemplo, lila con
  mariposas), no sobre blanco.

## Lo que hay hoy

**El tamaño ya está bien:** `src/lib/entretenimiento/tira-fotocabina.ts` arma
1200x1800, que es exactamente 10x15. **Eso no se toca.**

Lo que no coincide es el reparto: hoy apila **tres fotos iguales**, una arriba de
otra, a todo el ancho, sobre fondo blanco, y abajo una franja de color con el nombre
del evento y la fecha en letra común.

## Qué hacer

### 8.1 — La fotocabina, con el reparto de verdad

Cambiar el armado para que quede como el impreso real: una foto grande arriba y dos
abajo lado a lado, el nombre en letra manuscrita grande, el motivo debajo, el logo
abajo a la izquierda, y fondo decorado.

- **El fondo tiene que poder cambiarse por fiesta.** Que salga del color o de la
  imagen que ya tiene cargada la fiesta, no escrito en el código. Si no hay nada
  cargado, un fondo liso suave, **nunca una imagen traída de internet**.
- **El nombre y el motivo salen de la fiesta**, no escritos a mano. Si falta el
  nombre, se deja el espacio vacío: no poner "La Agasajada" ni nada por el estilo.
  (Ya pasó cuatro veces y hay una prueba que lo frena.)
- El logo de AK, del archivo que ya usa la aplicación.

### 8.2 — El espejo mágico y el 360 con IA: UNA sola foto, pero personalizada

**Ojo con esto, que se corrigió el 19 de agosto:** el espejo mágico y el 360 con
inteligencia artificial **imprimen UNA SOLA foto**, no tres. Las tres son sólo de la
fotocabina.

**Lo que ya está bien:** el espejo saca una foto y la manda a imprimir. Esa parte no
se toca.

**Lo que falta:** esa foto sale **pelada**, tal como se sacó. Tiene que salir en el
**mismo papel de 10 x 15 y con la misma personalización** que la de la fotocabina:

- La foto grande, ocupando la parte de arriba.
- Abajo, **el nombre del homenajeado en letra manuscrita grande** y el motivo más
  chico.
- **El logo de AK abajo a la izquierda**, sobre el mismo fondo decorado de la fiesta.

**Cómo hacerlo sin duplicar trabajo:** que la función que arma la hoja
(`src/lib/entretenimiento/tira-fotocabina.ts`) acepte **una o tres fotos**. Con tres,
arma el reparto de la fotocabina; con una, la pone grande arriba. El nombre, el
motivo, el logo y el fondo son los mismos en los dos casos.

Así, el día que cambie el diseño, cambia en un solo lugar para las tres estaciones.

## Cómo se comprueba

1. Que la hoja siga midiendo 1200x1800.
2. Que la foto grande vaya arriba y las dos chicas abajo, lado a lado.
3. Que el nombre y el motivo sean los de la fiesta de verdad.
4. Que sin nombre cargado no aparezca ningún texto de relleno.
5. Que el espejo mágico y el 360 con IA impriman **una sola foto**, en la misma hoja
   de 10x15 y con la misma personalización (nombre, motivo, logo y fondo).
6. Que el fondo salga de lo que tiene cargado la fiesta.

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
