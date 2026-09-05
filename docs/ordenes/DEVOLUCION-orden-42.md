# Devolución de la orden 42 — cuatro bloques bien, uno no

**Lo verifiqué abriendo los archivos, no por el nombre.**

## Lo que quedó bien y ya está fusionado

- **La vista 3D ahora sí muestra los muebles.** Se sacó el bloque oculto y los elementos del
  plano entran a la escena con sus coordenadas reales, convertidas de píxeles a metros. Era el
  defecto que había encontrado y está bien resuelto.
- **El marco animado y las cortinas del 360.**
- **Las animaciones con locución del espejo**, en su archivo propio como se pidió.
- **El fondo elegible del muro y la moderación que ordena lo dudoso primero.**
- **El boomerang y la cámara lenta de la fotocabina**, de la vuelta anterior: los cuadros se
  rebotan y se reproducen más lento de verdad.

---

## Lo que hay que rehacer: el fondo sin tela verde

`recortarPersonaSinTela()` en `src/lib/entretenimiento/segmentacion-fondo.ts` **no recorta a
ninguna persona.** Lo que hace es:

1. Calcular un óvalo en el centro exacto del cuadro (46% del ancho, 50% del alto).
2. Borrar todo lo que queda **afuera** de ese óvalo.

**No mira la imagen.** No hay detección de persona en ninguna parte: el mismo óvalo sale con la
cámara tapada, con dos personas o con nadie.

**Qué se ve en la fiesta:** con una sola persona parada justo en el medio parece que funciona.
Corrida a un lado, en plano abierto, o de a dos, **la corta por la mitad**. Y el fondo que queda
adentro del óvalo **no se cambia**, que era justamente lo pedido.

**Se dejó el código apagado** (`recorteSinTela` viene en falso) y con el aviso escrito adentro,
para que nadie lo prenda en una fiesta creyendo que anda.

### Lo que hay que hacer

Usar segmentación de persona de verdad: `@mediapipe/selfie_segmentation` o
`@tensorflow-models/body-segmentation`. Devuelven una máscara por píxel —qué es persona y qué es
fondo— y esa máscara es la que hay que usar en lugar del óvalo.

**Cargala sólo cuando el operador prende la opción**, no al abrir la pantalla: 200 invitados
abriendo la estación no pueden bajarse una biblioteca pesada de arriba.

**Si no se puede sin aumentar lo que se paga por mes, o si pesa demasiado, decilo y no lo hagas.**
Es preferible no tener la función que tener una que corta gente al medio.

### Y una pregunta, no un reproche

Cambiaste dos números de `tests/e2e/layout-baseline.json` (el alto de un título en celular y el
ancho de otro). Si fue porque una pantalla cambió a propósito, está bien. **Decí cuál y por qué**,
porque ese archivo es el que avisa cuando la maquetación se mueve sola.

---

## Cómo se comprueba

```comprobar
usa: selfie_segmentation en src/lib/entretenimiento/segmentacion-fondo.ts
prueba: tests/e2e/la-fotocabina-tiene-todo.spec.ts
```

Y la prueba tiene que mirar el resultado: **con la opción prendida y una imagen de prueba donde la
persona NO está centrada, la persona sigue entera.** Una prueba con la persona en el medio daría
verde con el óvalo puesto, que es exactamente lo que pasó.
