# Devolución — la grilla de caras NO se entrega así

**Verificada el 3 de septiembre de 2026 leyendo el código, línea por línea.**

## Lo que quedó bien

- **El preparador está enganchado de verdad**: `PrepararGrillaDeCara.tsx` lo usa la pantalla del
  equipo (`fiestas/nueva/muro-social`), llama a `guardarCarasDeFiesta`, muestra el avance y lo
  dispara una persona. **La plomería está perfecta.**
- **La pantalla del invitado usa bien el corazón**, con los dos cajones separados.

---

## EL PROBLEMA: eso no reconoce caras. Mide luz.

En `extraerVector` (líneas 16-60), lo que se guarda como "la cara de una persona" es esto:

> Se achica la foto a 160x160, se parte en **128 franjas** y de cada una se calcula **el brillo
> promedio**.

**Eso no describe una cara. Describe cómo está iluminada la foto.**

### Qué pasa en una fiesta de verdad

1. **Dos personas distintas, fotografiadas en el mismo lugar y con la misma luz, dan números casi
   iguales.** El sistema las va a tomar por la misma persona. **A un invitado le van a aparecer
   —y va a poder descargar— las fotos de otro.**
2. **La misma persona con luz distinta da números completamente distintos.** No se va a encontrar
   a sí misma.
3. **Y cuando el navegador no tiene el detector** —que es el caso en iPhone y en Firefox, o sea
   la mitad de los invitados— **ni siquiera recorta la cara**: toma el brillo de la foto entera.
   Ahí lo que se agrupa son **fotos con luz parecida**, nada más.

**Es peor que no tener la función**, porque muestra resultados equivocados **con la cara de la
gente**, y con seguridad. En una fiesta de quince eso no se puede.

### Y el detector elegido tampoco sirve para esto

`FaceDetector` del navegador **sólo dice dónde hay una cara** —un rectángulo—. **No dice de quién
es.** No entrega los números que identifican a una persona. Además es de un solo navegador y
quedó abandonado.

---

## Cómo se hace bien

Hace falta una biblioteca que devuelva **los números que identifican a una persona** (lo que en
el rubro se llama el "descriptor" de la cara), no un rectángulo:

- **`face-api.js`** sobre TensorFlow.js, con el modelo `faceRecognitionNet`, que devuelve los 128
  números de verdad. **El modelo pesa unos 6 megas, se guarda en `public/` y se descarga una sola
  vez.** Es lo que ya pedía el bloque 1 de la orden 36.
- O **MediaPipe Face Embedder**, equivalente.

**Corre en el teléfono y no se paga por foto**, que es la condición del dueño y sigue en pie.

**El corazón que ya está —`src/lib/caras/agrupar-caras.ts`— no se toca**: la cuenta está bien y
los umbrales (0,50 y 0,62) son los del rubro **para descriptores de verdad**. Lo único que hay
que cambiar es **de dónde salen los números**.

---

## Mientras tanto: la función NO se muestra

**Hasta que los números sean de verdad, la grilla y la selfie no se le muestran a ningún
invitado.** Dejala apagada por defecto. Es preferible no tenerla a que un invitado se lleve las
fotos de otro.

## Qué comprueba la prueba, y es la que decide si esto se puede entregar

Con **dos fotos de la misma persona** y **una de otra**, todas con luz distinta:

- las dos de la misma persona tienen que dar una distancia **menor a 0,50**;
- la de la otra persona, **mayor a 0,62**.

**Con el método de hoy esa prueba no pasa**, y es exactamente por eso que hay que cambiarlo.

```comprobar
usa: faceRecognitionNet en src/components/social-gallery/PrepararGrillaDeCara.tsx
prueba: src/__tests__/las-caras-distinguen-personas.test.ts
```
