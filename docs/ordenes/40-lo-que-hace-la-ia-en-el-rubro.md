# Orden 40 — Lo que la inteligencia artificial hace en el rubro y nosotros no

**Escrita el 3 de septiembre de 2026**, después de investigar cómo usan la IA los organizadores
de fiestas y los fotógrafos en el mundo. **Medido contra la app, no supuesto.**

> **UNA SOLA PROPUESTA con todos los bloques.** Si uno se traba, entregá el resto y decí cuál.
> **Los proveedores quedan afuera a pedido del dueño.**

## Antes de arrancar

`npm run "falta?"`. Y las dos que ya costaron caro: **que un control dé verde no alcanza**, y
**antes de programar algo fijate que no exista** — la mitad de esta orden es enchufar cosas que
ya están.

---

## BLOQUE 1 — ELEGIR LAS FOTOS BUENAS SOLO. Es el que más devuelve.

**Es lo que más usan los fotógrafos del mundo hoy** —Aftershoot, Imagen, FilterPixel—: la
máquina mira las 3.000 o 5.000 fotos de un casamiento y **descarta las movidas, las
desenfocadas, las repetidas y las de ojos cerrados**. De 4 a 8 horas de trabajo a menos de una.
El fotógrafo promedio ahorra **473 horas por año**.

**Y acá está la mitad hecha:** `@vladmandic/face-api` **ya está instalado** y los modelos ya se
sirven desde `public/models/caras`. El mismo modelo que reconoce personas trae **los 68 puntos de
la cara**, que es con lo que se sabe si tiene los ojos cerrados.

### Qué hacer

**Un archivo nuevo, `src/lib/album/elegir-las-mejores.ts`**, que le ponga a cada foto una nota de
0 a 100 con estas cuatro cosas, **todas en el navegador y sin pagar nada**:

1. **¿Está movida o desenfocada?** Se mide el contraste entre píxeles vecinos: una foto nítida
   tiene bordes marcados, una movida los tiene lavados.
2. **¿Tiene los ojos cerrados?** Con los 68 puntos de la cara que ya devuelve `face-api`: se mide
   la altura del ojo contra su ancho. Cerrado da un número mucho más chico.
3. **¿Está repetida?** Dos fotos seguidas casi iguales: **se queda la de mejor nota.** Ya existe
   `contentHash` en el proyecto para lo parecido; miralo antes de escribir.
4. **¿La cara es grande y está de frente?** Ya lo devuelve el detector.

**Dónde se usa:** en `src/lib/album/armar-album.ts`, para que **el álbum se arme solo con las
mejores** —que es lo que figura como faltante contra el rubro— y en el preparador del muro para
que el equipo vea la selección y pueda sacar alguna.

**El cliente NO elige fotos.** Decisión del dueño: se arma solo y se entrega terminado; si hay
que retocar, retoca el equipo de AK.

**Qué comprueba la prueba:** con una foto nítida y una movida a propósito, **la nítida saca más
nota**. Que la función exista no prueba nada.

## BLOQUE 2 — EL INFORME DE LA FIESTA, AUTOMÁTICO

**Medido: no existe nada.** Hoy, cuando la fiesta termina, no se arma ningún resumen.

Al día siguiente la app tiene que armarlo sola, **sin que nadie apriete nada**, con lo que ya
está guardado: cuánta gente vino contra cuánta confirmó, cuántas fotos y videos salieron, **qué
estación se usó más**, qué platos salieron, cómo cerró la plata, y las mejores cinco fotos.

**Sirve para dos cosas y las dos dan plata:**

- **Para el cliente**, que lo recibe y lo muestra. Es lo último que ve de AK.
- **Para el dueño**, que con eso sabe qué vender el año que viene.

**Que quede preparado y lo mande una persona**, como todo lo que sale para afuera.

**Qué comprueba la prueba:** que **exista un informe armado sin que nadie lo haya pedido** —dejá
rastro con fecha— y que los números salgan de la fiesta, no inventados.

## BLOQUE 3 — USAR LOS CINCO AÑOS DE FIESTAS QUE YA ESTÁN CARGADAS

**Hoy no se usan para decidir nada.** Con lo que está guardado se puede contestar, en una
pantalla del dueño:

- **Qué meses y qué días se llenan primero**, para saber cuándo conviene empujar.
- **Qué combo se vende más** y cuál casi no.
- **A qué precio se cierra y a cuál te dicen que no.**
- **Cuántos de los confirmados no aparecen**, en promedio. **Ojo: la comida NO se toca** —se
  cocina lo contratado, es decisión del dueño— pero el número sirve **para armar las mesas**.

**Números, no adivinanzas.** Cada cosa que se muestre tiene que salir de las fiestas cargadas, y
si no hay datos suficientes **se dice que no alcanzan**, no se inventa una tendencia.

## BLOQUE 4 — EL ASISTENTE CONTESTA A LOS INVITADOS EL DÍA DE LA FIESTA

El asistente ya existe (`src/ai/flows/assistant-flow.ts`). Falta que atienda **las preguntas del
invitado**: a qué hora empieza, cómo llego, dónde estaciono, qué me pongo, dónde está mi mesa,
hasta qué hora hay música.

**Todas se contestan con lo que ya está cargado en la fiesta.** Si no sabe la respuesta, **lo
dice y ofrece el WhatsApp del organizador** — nunca inventa.

**Va en la pantalla del invitado**, con un botón discreto. **No pide el mail ni el teléfono.**

## BLOQUE 5 — EL 3D EN LA PANTALLA DE DECORACIÓN

**Corrección de una medición anterior: el 3D del salón SÍ existe y SÍ se usa**, en el
configurador de reuniones, en el croquis del salón y en la distribución de invitados
(`src/components/salon-3d/SalonScene.tsx`).

**Lo único que falta es verlo en la pantalla de decoración**
(`src/app/(app)/fiestas/nueva/decoracion/page.tsx`), que hoy dibuja sólo el plano de arriba. Es
un botón para pasar de plano a 3D. **`DecoItem3D.tsx` no lo usa nadie**: probablemente es la
pieza que falta para dibujar cada elemento de la decoración en 3D.

**Sirve para vender:** es lo que hace Prismm, y se usa para recorrer el salón con el cliente
antes de que firme.

---

## LO QUE NO SE HACE

- **Nada de proveedores.** Lo sacó el dueño de esta orden.
- **Nada que se pague por mes ni por foto.** Todo corre en la máquina. Si la única forma es
  pagando, **pará y avisá**.
- **Nada que salga para afuera solo.** Ni un mensaje, ni un cobro, ni un presupuesto cerrado. La
  app prepara; manda una persona. **Es la regla del dueño y coincide con el estándar del rubro.**
- **El menú y los ingredientes no se tocan**, ni el ajuste anual, ni los descuentos, ni ningún
  texto que vea el cliente.

## Antes de decir que terminaste

1. `npm run "falta?"`.
2. **Abrí la pantalla y miralo.** Que la función exista no es que ande.
3. `npm run "publicar?"` completo, una sola vez, al final. **Si frena, leé TODAS las fallas que
   lista y arreglalas juntas**; después `npm run otravez`, que son minutos.
4. `npm run limpiar:corrida` y anotado en `docs/YA-RESUELTO.md` con su línea.

```comprobar
archivo: src/lib/album/elegir-las-mejores.ts
usa: elegir-las-mejores en src/lib/album/armar-album.ts
usa: faceLandmark68 en src/lib/album/elegir-las-mejores.ts
usa: SalonScene en src/app/(app)/fiestas/nueva/decoracion/page.tsx
prueba: src/__tests__/la-foto-nitida-gana.test.ts
prueba: tests/e2e/el-informe-de-la-fiesta-se-arma-solo.spec.ts
prueba: tests/e2e/el-asistente-le-contesta-al-invitado.spec.ts
```
