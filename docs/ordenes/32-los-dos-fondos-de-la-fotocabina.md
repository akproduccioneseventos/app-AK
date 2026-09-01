# Orden 32 — El fondo de la PANTALLA (el "telón") y el fondo de la FOTO

**Para Gemini. Escrita el 1 de septiembre de 2026. Reescrita el mismo día: la primera versión
había entendido mal el pedido.**

## Lo que pidió el dueño, con sus palabras

> *"En esa pantalla hay un fondo que tiene forma de telón rojo, es una de las funcionalidades.
> Cuando las personas ven la pantalla, ven un rectángulo horizontal o vertical donde se ven
> ellos, que es la imagen de la cámara."*

> *"Lo del croma no sé si se podrá: **un metro y medio para atrás es imposible**. Siempre hay
> poco espacio y la fotocabina se pone donde la gente vea la pantalla."*

**Cuidado con la palabra "telón": NO es una tela colgada.** Es el **diseño de la pantalla**: el
fondo decorado —una cortina roja, por ejemplo— que rodea al rectángulo de la cámara. Es lo que
ve la gente mientras espera su turno. **Sparkbooth lo llama tema y lo trae hecho.**

## Las tres cosas, y en este orden

| | Qué es | Cómo está | Cuánto importa |
|---|---|---|---|
| **1** | **El fondo de la pantalla (el "telón")** | **No existe**: la fotocabina se ve igual en toda fiesta | **Lo que pidió** |
| **2** | **El fondo de la foto SIN tela** | No existe | Lo que sirve en su salón |
| **3** | El fondo de la foto CON tela verde (croma) | A medio conectar, deja mancha negra | **Casi no le sirve**: no tiene espacio |

---

## BLOQUE 1 — EL FONDO DE LA PANTALLA, QUE ES LO QUE SE PIDIÓ

Hoy la fotocabina se ve **igual en toda fiesta**: fondo oscuro, la cámara y un botón. Sin
personalidad, y sin nada del cliente.

**Qué tiene que pasar:**

- **La pantalla tiene un fondo decorado**, y el rectángulo de la cámara va **adentro**, como un
  cuadro colgado. Ese fondo es lo que le da carácter a la estación.
- **Seis u ocho diseños listos**, con nombre en criollo: *Cortina roja*, *Dorado de gala*,
  *Neón de fiesta*, *Campo*, *Blanco minimalista*, *Quince años*. Son fondos y marcos dibujados,
  **no fotos**: tienen que verse bien en cualquier pantalla y no pesar.
- **Y el cliente puede subir el suyo** para su fiesta, con el mismo campo de fondos que ya
  existe.
- **Se elige al armar la fiesta**, y se ve cómo queda antes de guardar.

**Tres reglas para que no arruine la estación:**

1. **El rectángulo de la cámara y el botón van siempre por encima y legibles.** Si el fondo es
   claro, el texto se sigue leyendo. **Nunca un fondo que tape lo que hay que tocar.**
2. **El rectángulo respeta si la cámara está vertical u horizontal** (eso ya existe): el fondo
   se acomoda alrededor, no al revés.
3. **Si no se eligió ninguno, queda el de hoy.** No se rompe nada.

**Va también en Bogue, Touchpix y el Espejo. En la 360 no** (la cámara gira y la pantalla es
otra cosa).

**La prueba:** con un fondo elegido, la pantalla lo muestra y **el botón de sacar la foto sigue
visible y se puede tocar**.

---

## BLOQUE 2 — EL FONDO DE LA FOTO SIN TELA, que es lo que sirve en su salón

**Esto es lo que cambia lo que se lleva la persona**, no cómo se ve la pantalla. El salón no se
toca: se recorta a la persona y se le pone otro fondo **en la imagen**.

**Y sin tela, porque con tela no se puede:** el dueño no tiene metro y medio libre detrás, y la
estación va donde la gente vea la pantalla.

- **MediaPipe Selfie Segmentation** o el equivalente de TensorFlow.js, **corriendo en la
  máquina**. **Si la única forma cuesta plata por mes, PARÁ Y AVISÁ.**
- **El invitado elige el fondo antes de la foto** y ve el cambio en vivo, en una tira abajo de
  la cámara. Primero va **"Sin cambiar"**, elegido de entrada.
- **Si la máquina no da** (baja de 15 cuadros por segundo), se apaga solo y la estación sigue
  andando. **Nunca colgada por esto.**

**La prueba:** con un fondo elegido y **sin tela verde**, la imagen final es **distinta** de la
de sin fondo.

---

## BLOQUE 3 — El croma: arreglar lo que está roto y dejarlo como opción

**El dueño dijo que casi no le sirve** —no tiene espacio— pero quiere **poder probarlo**. Así que
no se saca: se arregla y se deja apagado por defecto.

**El defecto, verificado:** la fotocabina llama a `aplicarChromaKey`
(`fotocabina/[fiestaId]/page.tsx:356`), que **borra el verde y lo deja transparente**
(`segmentacion-fondo.ts:58`). **Nadie dibuja el fondo nuevo detrás**, y como la foto se guarda en
JPEG —que no admite transparencia— **el hueco sale NEGRO**.

Y la función que sí lo hace bien, `procesarFondoCanvas`, **está escrita y no la llama nadie**.

**Qué hacer:**

1. Que la fotocabina use **`procesarFondoCanvas`**, que dibuja el fondo y después la persona.
2. **Si el croma está prendido y no hay fondo cargado, que no se aplique.** Mejor la foto con la
   tela verde detrás que con una mancha negra.
3. **Que el ajuste avise lo que hace falta**: *"Necesita una tela verde lisa, bien iluminada, y
   la gente a metro y medio. Si no tenés ese espacio, usá el cambio de fondo sin tela."*

**Y arreglá el desenfoque**, que hoy **desenfoca toda la imagen, incluida la cara**
(`segmentacion-fondo.ts`, ~línea 92). Si no se puede desenfocar sólo el fondo sin lo del bloque
2, **que la opción no aparezca** hasta que esté.

---

## BLOQUE 4 — Que se entienda cuál es cuál

Al armar la fiesta hoy dice "fondo" y no se sabe de cuál habla. **Que diga:**

- **"Fondo de la pantalla"** — *"Lo que se ve alrededor de la cámara, mientras esperan su turno."*
- **"Fondo de la foto"** — *"Lo que aparece detrás de la persona en la foto que se lleva. El salón
  no cambia."*

**Esa segunda explicación es literal y se deja tal cual:** la duda de si había que cambiar algo
físico en el salón le pasó al dueño y le va a pasar a cualquiera.

---

## LO QUE NO SE TOCA

- **Los marcos de la fotocabina** andan y están probados.
- **La cámara vertical u horizontal** ya está hecha: el fondo se acomoda a ella.
- **Nada que se pague por mes.**
- **Plata, cobros, comida y permisos: los hace Claude.**

## Cómo se comprueba que esta orden está hecha

```comprobar
usa: fondoDePantalla en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: procesarFondoCanvas en src/app/evento/fotocabina/[fiestaId]/page.tsx
prueba: tests/e2e/los-fondos-de-la-fotocabina.spec.ts
```
