# Orden 13 — Los entretenimientos de AK, mejores que todos los del mercado

**Para Gemini. Escrita el 27 de agosto de 2026.**

## CÓMO SE ENTREGA (leer esto primero)

**UNA SOLA PROPUESTA DE CAMBIOS con todos los bloques adentro.** No una por bloque:
cada fusión dispara un despliegue y eso se paga.

Si un bloque se traba, **entregá el resto igual, en la misma propuesta**, y avisá cuál
faltó y por qué. No lo dejes para después.

Antes de dar por terminado: compila, pruebas en verde, `npm run check:acentos` limpio, y
lo anotado en `docs/YA-RESUELTO.md` y `docs/QUE-HAY-EN-LA-APP.md` **dentro de la misma
propuesta**. Si tocás o agregás una pantalla, corré `npm run mapa:generar`.

**La fotocabina queda afuera.** La está trabajando otra IA en paralelo y dos cambios sobre
la misma pantalla se pisan. **No la toques.**

---

## De dónde sale esta orden

El dueño va a usar los entretenimientos en fiestas reales. Se probaron **en un navegador**,
abriendo cada estación como operador y como invitado, y se comparó función por función
contra las plataformas que manda el rubro: **Snappic, Touchpix, LumaBooth (ex dslrBooth),
Sparkbooth, Simple Booth HALO, Curator y Foto Master** para las estaciones, y **Walls.io,
Snapbar y Social Walls** para el muro.

El pedido del dueño, textual: **"debe ser mejor que todas"**.

**Ya se arregló, no lo rehagas:** ninguna estación podía abrir su sesión —el operador
tocaba "Iniciar cuenta regresiva" y aparecía un cartel rojo en inglés—. Corregido en
`src/app/actions/fiesta/sesion-entretenimiento.ts`.

---

## LO QUE YA TENEMOS Y NO SE TOCA

Esto ya anda y **está a la altura o por encima del mercado**. No lo "mejores", no lo
reescribas y no lo reportes como problema:

| Lo que tenemos | Cómo estamos |
|---|---|
| Cámara lenta en la Plataforma 360 | Igual que Snappic y Touchpix. No es un botón: graba a 15 cuadros por segundo y los estira. |
| Marco de marca sobre cada cuadro | Igual que todos. |
| Boomerang y cuatro marcos en Bogue | Igual que todos. |
| Estilos de IA que transforman la foto | **Arriba**: Sparkbooth y Simple Booth no lo tienen. |
| Firma con el dedo y stickers en el espejo | Igual que los espejos de Foto Master y LumaBooth. |
| Filtros de imagen | Igual. |
| Entrega por QR sin pedir datos | Igual, y es el estándar de hoy. |
| Aviso de señal mala | Igual que el "SmartShare" de Snappic. |
| Impresión | Igual. |
| Consentimiento y límite de repeticiones | Igual. |
| Cápsula del tiempo con video, audio y foto | **Arriba**: sólo lo tienen los servicios dedicados de libro de firmas. |

---

# PARTE 1 — LO QUE ESTÁ ROTO

## BLOQUE 1 — El tótem se ve desarmado

Se abrió `/evento/totem/[fiestaId]/[totemId]` en el navegador y **la pantalla sale rota**:
el texto "Escaneá el QR y compartí tus fotos en la pantalla" cae **una palabra por
renglón**, el título de la fiesta queda cortado arriba, y el cartel "SUBÍ TU FOTO AL MURO"
se superpone con lo que tiene detrás.

Es la pantalla que los invitados miran toda la noche parada en el salón.

- Que el texto ocupe el ancho que tiene y **no se parta palabra por palabra**.
- Que el título de la fiesta entre entero.
- Que ningún cartel se pise con otro.
- **Probalo parada (vertical, como se usa en el salón) y acostada.** Dejá una foto de
  pantalla de cada una en la propuesta.

---

# PARTE 2 — EMPAREJAR LO QUE ELLOS TIENEN Y NOSOTROS NO

Cada bloque dice qué plataforma lo tiene, para que se entienda por qué vale la pena.

## BLOQUE 2 — Quitar el fondo sin tela verde

**Quién lo tiene:** Snappic, Touchpix, Simple Booth, LumaBooth. Es de lo primero que
muestran.

Hoy para cambiar el fondo hace falta colgar una tela verde. Con IA se recorta a la persona
sin tela y se le pone atrás lo que uno quiera: el salón decorado, el tema de la fiesta, una
foto que trajo el cliente.

- Que el operador elija el fondo desde los ajustes de la estación.
- Que se pueda apagar: si el recorte sale mal, la foto normal tiene que seguir saliendo.
- **Si esto obliga a contratar un servicio que se paga por mes, dejalo preparado y
  preguntá antes de contratar.** Esa regla no se rompe.

## BLOQUE 3 — Marcos que se mueven

**Quién lo tiene:** Touchpix (300 y pico de marcos animados), Snappic, LumaBooth.

Nuestros marcos son quietos. Los de ellos se mueven: brillos que pasan, confeti que cae,
el nombre de la fiesta que aparece.

- Que un marco pueda ser una animación corta y no sólo una imagen fija.
- Que se vea igual en la foto y en el video.
- Alcanza con **tres o cuatro marcos animados que luzcan**, no trescientos. Uno elegante,
  uno de quince años, uno de casamiento, uno de cumpleaños de nene.

## BLOQUE 4 — Accesorios que siguen la cara

**Quién lo tiene:** Simple Booth. Es su función estrella.

Hoy los stickers del espejo se ponen quietos donde uno los suelta. Los de ellos **se pegan
a la cara**: los anteojos quedan en los ojos, el bigote en la boca, y siguen a la persona
cuando se mueve. Si hay varias personas, cada una tiene los suyos.

- Anteojos, bigote, sombrero, corona y orejas, pegados a la cara.
- Que funcione con más de una persona en la foto.
- Los stickers sueltos de ahora **se quedan**: se suman, no se reemplazan.

## BLOQUE 5 — GIF animado en todas las estaciones

**Quién lo tiene:** todos, sin excepción.

Hoy Bogue hace boomerang y la 360 hace video. Falta el GIF corto —tres o cuatro fotos
seguidas que se repiten— que es lo que la gente manda por WhatsApp.

- Que cada estación con cámara pueda entregar también un GIF, además de lo que ya entrega.
- Que el invitado elija qué quiere en la pantalla de revisión, sin repetir la toma.

---

# PARTE 3 — LO QUE NOS PONE ARRIBA DE TODOS

Acá está la diferencia real. **Las plataformas del mercado son programas de fotocabina
sueltos: no saben de quién es la fiesta, ni quién está parado adelante.** La app de AK sí:
tiene la lista de invitados, las mesas, el tema del evento y los datos del cliente. Eso no
lo puede copiar ninguno.

## BLOQUE 6 — La estación sabe de quién es la fiesta y quién está adelante

**Quién lo tiene:** nadie.

Cuando el invitado llega con su enlace personal —el mismo que ya usa para el hub y para su
mesa—, la estación tiene que **saludarlo por su nombre** y dejarle su foto ya guardada en
su recuerdo personal, sin que tenga que hacer nada más.

- La estación abierta con el enlace del invitado lo saluda: *"Hola, Lucía. Ponete cómoda."*
- La captura queda **atada a ese invitado**, así aparece después en su recuerdo y en el
  álbum del cliente.
- **Si no viene el enlace personal, la estación funciona igual, sin nombre.** Nunca se
  bloquea por no saber quién es.
- Los textos que ve el invitado, **en criollo y cortos**: los va a leer parado, con gente
  atrás esperando.

## BLOQUE 7 — El contador de la noche y el informe para el cliente

**Quién lo tiene:** Sparkbooth y Snappic muestran capturas, vistas y descargas. Snappic
además arma una página de resultados con el logo del cliente.

Hoy nadie sabe cuánto se usó cada estación. Termina la fiesta y no se puede decir si la 360
hizo diez videos o ciento veinte.

- En la pantalla del operador de cada estación: **un número grande y claro con cuántas
  capturas lleva esta noche.**
- Que el número sea **de verdad**: sale de lo guardado. Si no se puede leer, **se dice que
  no se pudo**; nunca un cero que parezca un dato real.
- Al cerrar la fiesta, **un resumen automático**: cuántas capturas hizo cada estación, cuál
  fue la más usada y a qué hora estuvo el pico. Si ya hay un lugar natural para eso, va
  ahí; no inventes una pantalla nueva.
- Ese resumen **se le puede mostrar al cliente**. Es material de venta para la próxima.

## BLOQUE 8 — El muro se modera solo primero

**Quién lo tiene:** todos los muros del mercado ya filtran con IA. El nuestro es 100% a
mano y en una fiesta de ochenta invitados eso no lo hace nadie.

Que la IA pase primero y le deje a la persona sólo lo dudoso:

- Lo claramente bien, **entra solo**.
- Lo claramente mal —desnudo, pantalla negra, ilegible, repetido— **queda frenado solo**, y
  se avisa por qué.
- Lo del medio va a la cola de siempre para que decida una persona.
- **El operador siempre puede dar vuelta la decisión de la máquina, en los dos sentidos.**
- **Que no frene de más:** ante la duda, va a la cola humana, no al rechazo. Una foto buena
  frenada molesta más que una regular publicada.

## BLOQUE 9 — La cápsula del tiempo se abre sola

**Quién lo tiene:** los servicios de libro de firmas lo venden como promesa, pero **hay que
acordarse de abrirla**.

Hoy los mensajes de la cápsula quedan guardados y ahí terminan.

- Que se pueda marcar **cuándo se abre**: al año, a los cinco, a los quince.
- Que **el despertador la abra solo** cuando llega la fecha y le avise al cliente que sus
  mensajes están esperando. No que alguien se tenga que acordar.
- **El aviso se prepara y lo manda una persona**, como todo lo que sale para afuera.

---

# PARTE 4 — LO QUE QUEDÓ SIN HACER DE ANTES

## BLOQUE 10 — El Club Uruguay se ofrece SIEMPRE en la Presentación LED

Viene de una orden anterior. Se verificó: **sigue sin hacerse.**

En `src/app/presentacion-led/slides/datos-evento-slide.tsx:281` el Club sólo aparece si el
cliente dice que **no** tiene salón. El que llega con otro salón medio decidido **nunca ve
las fotos**, y es justo al que se le puede dar vuelta la cabeza.

- Una pantalla propia del Club, **disponible en cualquier momento de la presentación**:
  fotos que luzcan, capacidad y el descuento.
- Que se pueda ofrecer **sin borrar lo que el cliente ya eligió**.

Palabras del dueño, y es la parte importante:

> *"El Club Uruguay se ofrece, pero no es obligación contratarlo."*

- **Se muestra como una opción, nunca como un requisito.** El cliente puede traer su propio
  salón y AK le arma la fiesta igual. Eso es parte de lo que vende: flexibilidad.
- **Nada de textos que presionen** ni que den a entender que sin el Club el servicio es
  menor.
- **Si ya eligió otro salón, se le muestra una vez y no se le vuelve a poner adelante.**
- **El presupuesto tiene que quedar bien armado con cualquiera de las dos opciones.**
- El alquiler del Club **se paga aparte, directamente en el Club**. Ese texto ya existe y
  está bien: no lo cambies.

---

## LO QUE NO SE HACE (decidido, no volver a proponerlo)

- **Pedirle el mail o el teléfono al invitado para mandarle la foto.** Lo hacen todas las
  plataformas y **no lo queremos**: frena la fila y junta datos que después hay que cuidar.
  El QR resuelve lo mismo sin pedir nada.
- **Encuestas al invitado en la estación.** Misma razón.
- **La fotocabina.** La trabaja otra IA.
- `apphosting.yaml`: el servidor se duerme a propósito.
- **Nada que aumente lo que se paga por mes sin preguntar antes.**
- **El WhatsApp prepara mensajes y no los manda.**
- **Ningún precio ni promoción se inventa**: salen del catálogo.
- **No se promete un plazo de respuesta ni un precio congelado.** El ajuste anual del 15%
  va siempre.

## Y la regla que manda sobre toda esta orden

**No se cambia lo que ya funciona.** Hacé lo que dice esta orden y nada más. Si mientras
trabajás ves algo que "estaría mejor de otra manera" pero anda, **no lo toques**: anotalo
en una línea al final de tu reporte y que decida el dueño.
