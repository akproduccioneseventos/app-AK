# Orden 37 — El celular y la velocidad: los dos huecos que no mira nadie

**Escrita el 2 de septiembre de 2026.** Salió de medir qué cubren los controles y qué no.

> **UNA SOLA PROPUESTA con los dos bloques.** Si uno se traba, entregá el otro igual y decí cuál
> faltó.

## Por qué existe

Hay **315 pruebas de código y 39 de navegador**. La plata, los cobros, la comida y los permisos
están cubiertos. **Pero quedan dos cosas que ningún control mira:**

1. **Nadie abre la app en un celular de verdad.** Hay pruebas que achican la ventana, y eso **no
   es un celular**: no hay dedo, no hay teclado que tape el botón de enviar. Y el celular es
   donde la mira **casi todo el mundo** — el invitado escanea el QR con el teléfono en una mano y
   un vaso en la otra.
2. **La velocidad no tiene un número que frene.** Hoy nadie se entera si una pantalla se pone
   lenta, y el prospecto que llega de Google **se va si tarda**.

**Leé las habilidades `celular-primero` y `que-cargue-rapido`**, que están instaladas en el
proyecto y traen los tamaños, los cinco errores que rompen el celular y dónde se va el tiempo de
verdad. **No inventes criterios: están ahí.**

---

## BLOQUE 1 — QUE ANDE EN EL CELULAR

### 1.a Los arreglos — verificados uno por uno

**De 36 avisos que trajo el barrido, 4 son ciertos.** El resto se comprobó y era falsa alarma;
está listado abajo para que **no los toques**.

**Los campos de texto con letra chica.** Menos de 16 píxeles hace que el teléfono **haga zoom
solo** al tocarlos y descoloque la pantalla. Son tres:

| Archivo | Línea | Qué tiene |
|---|---|---|
| `src/app/invitacion/[fiestaId]/rsvp/page.tsx` | 631 | `text-sm` en el campo de comentario |
| `src/app/portal/mesas/page.tsx` | 350 | `text-xs` en el buscador |
| `src/app/portal/mesas/page.tsx` | 352 | `text-xs` en el selector de grupo |

**El primero es el que importa de verdad:** es donde el invitado confirma si viene, desde el
teléfono, y es el momento en que más caro sale que la pantalla se descoloque.

En `portal/mesas` mirá también los anchos fijos `w-40` y `w-28` de esos dos controles.

### 1.a.bis LO QUE NO HAY QUE TOCAR — falsa alarma comprobada

- **`max-w-[420px]` en el tótem.** Es un **máximo**, no un mínimo: nunca desborda. Y un tótem no
  es un celular.
- **Las grillas `grid-cols-4` y `grid-cols-5`** de las estaciones y de `en-vivo`. Una grilla
  **se achica sola**; no empuja la página. Quedan apretadas, nada más.
- **Las tablas.** Se revisaron todas y **ya están envueltas** para que se deslicen solas.

### 1.b El control que lo impide volver

Una prueba de navegador **a 360 píxeles de ancho**, sobre las pantallas que ve un cliente o un
invitado, que compruebe **una sola cosa y la más importante**:

> **que la página no se corra para el costado.**

Es la señal de que algo se desbordó, y **agarra casi todos los errores de golpe**. Se mide
comparando el ancho del contenido contra el ancho de la ventana.

Y dos más, que son las que hacen perder una consulta:

- **Ningún campo de texto con letra menor a 16 píxeles.** Si la tiene, el teléfono **hace zoom
  solo** al tocarlo y descoloca la pantalla, justo en el formulario de contacto.
- **En el formulario de contacto, escribiendo de verdad, el botón de enviar sigue a la vista.**

**Probá el control rompiéndolo**: metele a propósito una tabla ancha en una pantalla, mirá que se
ponga en rojo, y sacala. **Dejá escrito que lo comprobaste.**

---

## BLOQUE 2 — QUE CARGUE RÁPIDO

### 2.a El arreglo — uno solo, y es el que vale

**LA GALERÍA BAJA LAS FOTOS ENTERAS PARA MOSTRARLAS CHIQUITAS.**

En `src/app/evento/galeria/[fiestaId]/page.tsx:241` cada cuadradito de la grilla muestra
`post.imageUrl`, que es **la foto original**. Se comprobó: **no existe ninguna versión chica**.
El campo `thumbnailUrl` existe en `src/types/galeria.ts:27` pero **sólo lo llena el módulo de
videos de la landing**; para las fotos de los invitados **no lo llena nadie**.

**Por qué importa más que todo lo demás junto:** una foto de fiesta pesa varios megas. Una
galería de 300 fotos son **cerca de mil megas** que se bajan enteros para mostrar cuadraditos, en
el wifi de un salón, con 200 invitados a la vez. **Y Firebase cobra por lo que se baja.**

**Qué hacer:**

1. **Al subir cada foto, guardar además una versión chica** —el lado largo en 400 píxeles— en
   `thumbnailUrl`.
2. **La grilla usa la chica; la foto entera se baja sólo al abrirla.**
3. **Para las fotos que ya están subidas**, que la grilla siga funcionando con la original si no
   hay versión chica. **Nunca un cuadrado vacío.**

**Qué comprueba la prueba:** que al abrir la galería, **lo que se baja pesa mucho menos que la
suma de las fotos originales**. Una prueba que sólo mire que `thumbnailUrl` existe en el código
**no prueba nada**: ya existe y no lo usa nadie.

### 2.a.bis LO QUE NO HAY QUE TOCAR — falsa alarma comprobada

- **Las 25 etiquetas `<img>` sueltas.** Se revisaron: casi todas muestran **la foto que acaba de
  sacar la cámara**, que no se baja de ningún lado. Y las dos públicas —la tira de Instagram y la
  de videos— **tienen escrito al lado por qué son así**: direcciones que caducan y medidas
  variables. **Fueron decisiones tomadas, no descuidos.**
- **Pedir datos de a uno adentro de un bucle: cero casos.** Se buscó y no hay.
- **Bibliotecas pesadas en pantallas públicas: cero casos.**
- **Fotos sin lugar reservado: cero casos.** Todas las que usan el componente lo tienen.

### 2.b El control

Una prueba que **mida y frene**, sobre la portada y las landings:

- **Cuánto tarda en verse lo más grande de la pantalla.** Es lo que mide Google para ordenar los
  resultados. Poné el límite en **2,5 segundos**, que es el número que usa Google.
- **Cuánto pesa la página entera** la primera vez. Si se pasa, que frene.

**Medí primero y anotá el número de hoy en la prueba**, como referencia. Y **medí sobre la
versión compilada**, nunca sobre la de desarrollo: la de desarrollo arma cada pantalla al
visitarla y da un número que no existe.

---

## LO QUE NO SE TOCA

- **Ningún texto de venta, precio, promesa ni promoción.** Se arregla cómo se ve, **no lo que
  dice**.
- **`apphosting.yaml`.** Que el servidor se quede dormido es decisión del dueño y se paga tenerlo
  despierto. **Si aparece como problema de velocidad, es falso positivo.**
- **Nada que aumente lo que se paga por mes.** Si la única forma de acelerar algo es pagando,
  **pará y avisá**.
- **No escondas contenido en el celular para que entre.** Si algo no cabe, se reordena;
  esconderlo es sacarle información justo a quien más la necesita.

## Antes de decir que terminaste

1. `npm run "falta?"` — si sigue nombrando algo de esta orden, falta.
2. `npm run "publicar?"` completo, **una sola vez, al final**.
3. `npm run limpiar:corrida`.
4. Anotado en `docs/YA-RESUELTO.md` **con su línea en el bloque `comprobar`**.

```comprobar
prueba: tests/e2e/anda-en-el-celular.spec.ts
prueba: tests/e2e/carga-rapido.spec.ts
usa: 360 en tests/e2e/anda-en-el-celular.spec.ts
usa: 2500 en tests/e2e/carga-rapido.spec.ts
```
