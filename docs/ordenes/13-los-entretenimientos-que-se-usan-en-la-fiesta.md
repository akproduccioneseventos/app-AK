# Orden 13 — Los entretenimientos que se usan en la fiesta, y el Club Uruguay que se ofrece siempre

**Para Gemini. Escrita el 27 de agosto de 2026.**

## CÓMO SE ENTREGA (leer esto primero)

**UNA SOLA PROPUESTA DE CAMBIOS con los cuatro bloques adentro.** No una por bloque:
cada fusión dispara un despliegue y eso se paga.

Si un bloque se traba, **entregá el resto igual, en la misma propuesta**, y avisá cuál
faltó y por qué. No lo dejes para después.

Antes de dar por terminado: compila, pruebas en verde, `npm run check:acentos` limpio, y
lo anotado en `docs/YA-RESUELTO.md` y `docs/QUE-HAY-EN-LA-APP.md` **dentro de la misma
propuesta**. Si tocás o agregás una pantalla, corré `npm run mapa:generar`.

---

## De dónde sale esta orden

El dueño va a usar los entretenimientos en fiestas reales y pidió que se probaran de
verdad, como operador y como invitado. Se probaron **en un navegador**, no leyendo
código: se abrió cada estación, se le tocó el botón principal y se miró qué pasaba.

De ahí salieron dos cosas rotas y dos que faltan. **La fotocabina quedó afuera a
propósito**: la está trabajando otra IA en paralelo y dos cambios sobre la misma pantalla
se pisan. **No la toques.**

**Ya se arregló, no lo rehagas:** ninguna estación podía abrir su sesión —el operador
tocaba "Iniciar cuenta regresiva" y le aparecía un cartel rojo en inglés hablando de un
campo de la base—. La causa era una sola y está corregida en
`src/app/actions/fiesta/sesion-entretenimiento.ts`.

---

## LO QUE NO SE TOCA (probado y funcionando)

Esto ya anda. **No lo "mejores", no lo reescribas y no lo reportes como problema:**

- **Plataforma 360: la cámara lenta y el marco de marca.** La cámara lenta no es un
  botón: es cómo graba siempre, capturando a 15 cuadros por segundo y estirándolos
  después. El marco se dibuja encima de cada cuadro.
- **Bogue: el boomerang y los cuatro marcos** (Sin Marco, Neón Fiesta, Luxury Oro,
  Cyberpunk).
- **Espejo mágico: los stickers, la firma con el dedo, los estilos de IA y los filtros.**
- **La entrega por QR** en todas las estaciones, y los botones de compartir del álbum y
  la galería.
- **El aviso de señal mala.**
- **La guía en pantalla del invitado** en la 360 ("Preparate. La plataforma empezará a
  girar y grabará en cámara lenta. ¡Hacé tu mejor pose!").

---

## BLOQUE 1 — El Club Uruguay se ofrece SIEMPRE en la Presentación LED

Este bloque viene de una orden anterior que quedó sin hacer. Se verificó: **sigue sin
hacerse.**

### Qué pasa hoy

En `src/app/presentacion-led/slides/datos-evento-slide.tsx:281` el Salón Club Uruguay
sólo aparece si el cliente dice que **no** tiene salón (`tieneSalon === false`). El que
llega con otro salón medio decidido **nunca ve las fotos**, y es justo al que se le puede
dar vuelta la cabeza.

### Qué hay que hacer

- Una pantalla propia del Club, **disponible en cualquier momento de la presentación**:
  fotos que luzcan, capacidad y el descuento.
- Que se pueda ofrecer **sin borrar lo que el cliente ya eligió**.

### Palabras del dueño, y son la parte importante

> *"El Club Uruguay se ofrece, pero no es obligación contratarlo."*

- **Se muestra como una opción, nunca como un requisito.** El cliente puede traer su
  propio salón y AK le arma la fiesta igual. Eso es parte de lo que vende: flexibilidad.
- **Nada de textos que presionen** ni que den a entender que sin el Club el servicio es
  menor. Nada de "recomendado" con letra que culpe al que dice que no.
- **Si el cliente ya eligió otro salón, se le muestra igual pero sin insistir**: una vez,
  con las fotos, y si dice que no, no se le vuelve a poner adelante.
- **El presupuesto tiene que quedar bien armado con cualquiera de las dos opciones**, sin
  huecos ni renglones raros si no se contrata el Club.
- Y que quede claro, como ya está hoy: **el alquiler del Club se paga aparte, directamente
  en el Club.** No es plata que cobra AK. Ese texto ya existe y está bien: no lo cambies.

---

## BLOQUE 2 — El tótem se ve roto

### Qué pasa hoy

Se abrió `/evento/totem/[fiestaId]/[totemId]` en el navegador y **la pantalla sale
desarmada**: el texto "Escaneá el QR y compartí tus fotos en la pantalla" cae **una
palabra por renglón**, el título de la fiesta queda cortado arriba, y el cartel "SUBÍ TU
FOTO AL MURO" se superpone con lo que tiene detrás.

Es la pantalla que los invitados miran toda la noche parada en el salón. Así como está,
da mala impresión.

### Qué hay que hacer

- Que el texto ocupe el ancho que tiene y **no se parta palabra por palabra**.
- Que el título de la fiesta entre entero.
- Que ningún cartel se pise con otro.
- **Probalo en las dos formas de pantalla**: parada (vertical, que es como se usa en el
  salón) y acostada. Se vio roto en una pantalla de escritorio; confirmá cómo se ve en
  vertical antes de dar por terminado.
- Sacá una foto de pantalla de cada una y dejala en la propuesta.

---

## BLOQUE 3 — El contador de la noche, por estación

### Por qué

Hoy el equipo de AK no sabe **cuánto se usó cada estación**. Terminó la fiesta y nadie
puede decir si la 360 hizo diez videos o ciento veinte. Los programas del rubro
(Sparkbooth, Snappic) muestran ese número porque sirve para dos cosas: para darse cuenta
**en el momento** de que una estación está apagada o nadie la está usando, y para
contárselo al cliente después.

Se verificó: **ninguna estación lo tiene** (la fotocabina sí, y no se toca).

### Qué hay que hacer

- En la pantalla del operador de cada estación (360, Bogue, Espejo mágico en sus tres
  modos, Touchpix y buzón), **un número grande y claro: cuántas capturas lleva esta
  estación esta noche.**
- Que el número sea **de verdad**: sale de lo que se guardó, no de una cuenta inventada.
  Si no se puede leer, **se dice que no se pudo**, no se muestra un cero como si fuera un
  dato real.
- Un resumen al cerrar la fiesta: cuántas capturas hizo cada estación. Donde ya exista un
  lugar natural para eso, va ahí; no inventes una pantalla nueva si hay una que sirve.

---

## BLOQUE 4 — El muro se modera solo primero, y la persona sólo decide las dudosas

### Qué pasa hoy

`/evento/moderacion/[fiestaId]` está **100% a mano**: alguien del equipo mira foto por
foto y aprueba o rechaza. En una fiesta de ochenta invitados eso no lo hace nadie, y el
muro termina sin moderar o con la gente esperando.

### Qué hay que hacer

Que la inteligencia artificial **pase primero** y deje al humano sólo lo dudoso:

- Lo que está claramente bien, **entra solo**.
- Lo que está claramente mal —una foto desnuda, una pantalla en negro, algo ilegible o
  repetido— **queda frenado solo**, y se avisa por qué.
- Lo del medio queda en la cola de siempre, para que una persona decida.
- **El operador siempre puede dar vuelta la decisión de la máquina**, en los dos sentidos.
- **Que no frene de más**: ante la duda, pasa a la cola humana, no al rechazo. Una foto
  buena frenada molesta más que una regular publicada.

Esto es exactamente la regla de la app: **automático para mirar, detectar y avisar; mano
humana para decidir.**

---

## LO QUE NO SE TOCA (además de lo de arriba)

- **La fotocabina.** La trabaja otra IA en paralelo.
- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes sin avisar. Si moderar con IA obliga a contratar
  un servicio nuevo, **dejalo preparado y preguntá antes de contratar**.
- **El WhatsApp prepara mensajes y no los manda.**
- **Ningún precio ni promoción se inventa**: salen del catálogo.
- **Los textos que ve el cliente y las decisiones de marketing** (descuentos, promesas,
  carteles) **no se tocan sin permiso.** En particular: **no se promete un plazo de
  respuesta ni un precio congelado**. El ajuste anual del 15% va siempre.

## Y la regla que manda sobre toda esta orden

**No se cambia lo que ya funciona.** Hacé lo que dice esta orden y nada más. Si mientras
trabajás ves algo que "estaría mejor de otra manera" pero anda, **no lo toques**:
anotalo en una línea al final de tu reporte y que decida el dueño.
