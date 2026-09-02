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

### 1.a Los arreglos

_(la lista medida se agrega abajo, con archivo y línea)_

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

### 2.a Los arreglos

_(la lista medida se agrega abajo, con archivo y línea)_

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
