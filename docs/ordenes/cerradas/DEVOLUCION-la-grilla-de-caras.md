# Devolución — la grilla de caras está completa por arriba y vacía por abajo

**Verificado el 3 de septiembre de 2026 abriendo los archivos.**

## Lo que quedó BIEN. No lo toques.

**La pantalla está muy bien hecha**, y usa el corazón como correspondía:

- `agruparEnPersonas` arma la grilla (`galeria/[fiestaId]/page.tsx:157`).
- `buscarFotosDeUnaCara` resuelve el atajo de la selfie (líneas 328 y 352).
- **Respeta los dos cajones**: `seguras` y `dudosas` van separados (líneas 85 y 176). Ésa era la
  mejora principal sobre el rubro y está.
- El interruptor por fiesta (`modoCaras`) y el estado "preparada" (`carasPreparadas`).
- **Y las órdenes 37 y 38 están hechas**: el panel del cliente pasó de **cero movimiento a
  nueve**, la pantalla del invitado a siete, el resumen post-fiesta a diez, y las dos pruebas
  nuevas —celular y velocidad— están escritas.

---

## LO QUE FALTA: nada le da de comer a la grilla

**El bloque 1 de la orden 36 no se hizo.** Verificado:

1. **No hay ninguna biblioteca que saque los números de las caras.** Se buscó `face-api`,
   `FaceDetector` y `faceLandmark` en todo el proyecto: **cero resultados.**
2. **`guardarCarasDeFiesta` existe** (`src/app/actions/social-gallery.ts:996`) **y no la llama
   nadie.** Cero.
3. **No hay ninguna pantalla del equipo** para preparar la fiesta: `carasPreparadas` no aparece
   en ninguna pantalla interna.

**Qué pasa en la fiesta:** el invitado abre la galería y **no ve ninguna carita**, porque nadie
procesó las fotos. La pantalla está impecable y siempre vacía.

### Qué hay que hacer, y es lo que decía el bloque 1

- **La biblioteca corre en el navegador**: `face-api.js` sobre TensorFlow.js, o el
  `FaceDetector` de MediaPipe. **Sin servicios que se paguen por uso.** El modelo pesa unos 6
  megas: **guardalo en `public/`**, servido por nosotros.
- **Una pantalla para el equipo**, donde se toca un botón y se preparan las fotos de la fiesta.
  **Lo dispara una persona**, no pasa solo: recorrer 3.000 fotos lleva minutos y **tiene que
  verse el avance**.
- Por cada cara: `{ fotoId, vector, tamano }` — la forma `CaraEnFoto` que ya espera el corazón.
  **`tamano` es cuánto ocupa la cara en la foto, de 0 a 1: se usa para elegir la carita de la
  grilla. No lo dejes vacío**, porque si no la grilla muestra caras borrosas del fondo.
- Al terminar, llamar a **`guardarCarasDeFiesta`** y marcar la fiesta como preparada.

**Qué comprueba la prueba, y acá está el riesgo:** que **después de preparar una fiesta con
fotos, la grilla muestre al menos una carita**. Que las funciones existan **no prueba nada**: hoy
existen todas y la grilla está vacía. Una prueba que arme las caras a mano y después compruebe
que la grilla las muestra **tampoco prueba nada**: tiene que preparar desde las fotos.

---

## Antes de decir que terminaste

**Abrí la galería de una fiesta con fotos y mirá si aparecen caritas.** Si no aparecen, no está.
```comprobar
usa: guardarCarasDeFiesta en src/app/actions/social-gallery.ts
prueba: tests/e2e/la-grilla-de-caras.spec.ts
```
