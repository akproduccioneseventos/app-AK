# 52 - Que el 3D muestre lo que se acordó, no otra cosa

**Para Gemini.** 9 de septiembre de 2026. Hallazgo de Codex, **verificado por Claude uno por uno**
sobre la rama de esta tanda. Las rutas de abajo son las buenas: las de la orden original
apuntaban a `src/components/decoracion/`, y los archivos viven en `src/components/salon-3d/`.

## Por qué importa

En la reunión, el cliente tiene que **reconocer su salón** y entender dónde van la entrada, las
mesas, la pista y la decoración. Y el equipo tiene que poder montar eso mismo el día de la
fiesta. Una imagen linda que cambia los muebles o las medidas **no sirve como plano**: hace
prometer algo que después no se arma igual.

## Los tres defectos, con el archivo y la línea

### 1. Un arco de globos se dibuja como una mesa

`src/components/salon-3d/SalonScene.tsx:118` — la condición es
`if (cat.includes('mesa') || element.type === 'element')` y devuelve `Mesa3D`. Como la pantalla
de decoración le pone `type: 'element'` a **todo** lo que se agrega al lienzo, cualquier cosa que
no sea barra, pista o escenario **se convierte en mesa**: un arco de globos, un panel de neón, un
pedestal con telas, un centro floral.

Qué hacer: un mapeo explícito por tipo de elemento. Si de algo no hay modelo fiel, **mostrar una
forma reconocible y avisar que es una aproximación** —una columna para un pedestal, un arco para
un arco—, nunca una mesa. Conservar forma, medidas, material y cantidad.

**Lo que NO alcanza:** poner una etiqueta de texto encima del dibujo. Eso no es el objeto.

### 2. Lo que se gira en el plano no se gira en el 3D

En ese mismo archivo, ni la barra, ni la pista, ni el escenario reciben la rotación, y `Mesa3D`
tampoco usa `element.rotation`. Una barra rectangular puesta a lo largo aparece cruzada.

Qué hacer: pasar la rotación a los tres y aplicarla en `Mesa3D`. Comprobar una barra rectangular
a 0 y a 90 grados **en las dos vistas**, y que se vean iguales.

### 3. Cargar un diseño guardado duplica las medidas

`src/app/(app)/fiestas/nueva/invitados/layout/page.tsx:744` — el botón "Cargar diseño" copia
`salonElements`, `salonWidth` y `salonHeight`, **pero no `pixelsPerMeter`**. Ese número es la
escala: cuántos píxeles del dibujo son un metro. Si el diseño se hizo con 80 y el evento tiene
40, **una mesa de 2 metros pasa a 4**. El plano queda inservible para montar.

Qué hacer: copiar también la escala, o convertir las medidas a la escala del evento al cargar.
**No cambiar las medidas de las fiestas que ya están guardadas** sin avisar al dueño.

## Lo que NO hay que tocar

- La orden 51 ya cubre los costos de decoración vacíos, el moodboard que decía que sí sin
  guardar y el pisón entre módulos. **No lo rehagas.**
- No reinstalar parches internos de React ni revivir la rama descartada de React 18.
- El cliente **no elige** nada: es decisión tomada del dueño.

## Qué tiene que comprobar la prueba

No alcanza con que la pantalla abra. Hay que medir el **resultado**:

- Un elemento que no es mesa **no se dibuja como mesa**: se comprueba sobre la función que elige
  el objeto, con un elemento de tipo arco, y se exige que no devuelva `Mesa3D`.
- Una barra a 0 y a 90 grados **da dimensiones distintas** en el 3D.
- Cargar un diseño hecho con otra escala **no cambia el tamaño en metros** de una mesa.

```comprobar
usa: element.rotation en src/components/salon-3d/SalonScene.tsx
usa: pixelsPerMeter en src/app/(app)/fiestas/nueva/invitados/layout/page.tsx
prueba: src/__tests__/el-3d-dibuja-lo-que-dice-el-plano.test.ts
```
