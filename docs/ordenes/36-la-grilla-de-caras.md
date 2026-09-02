# Orden 36 — La grilla de caras: "tocá tu cara y llevate tus fotos"

**Escrita el 2 de septiembre de 2026.** Reemplaza a la orden 31, que estaba mal planteada.

> **El dueño usa Wfolio y lo corrigió:** *"aparecen todas las caras, apretás en una cara y
> aparecen todas las fotos de esa persona, sin nombre, y podés descargarlas"*. **No pide
> selfie.** La orden 31 estaba armada alrededor de la selfie: eso queda como **atajo opcional**,
> no como la puerta de entrada.

## EL CORAZÓN YA ESTÁ HECHO. No lo programes de nuevo.

**`src/lib/caras/agrupar-caras.ts`** ya existe, lo escribió Claude y tiene once pruebas en verde
(`src/__tests__/encontrar-fotos-por-cara.test.ts`). Trae:

- **`agruparEnPersonas(caras, { minimoDeApariciones })`** → devuelve `Persona[]`, con
  `{ id, representante, fotoIds, apariciones }`. **Esto es la grilla.**
- **`buscarFotosDeUnaCara(vectores, caras)`** → devuelve `{ seguras, dudosas }`. Es el atajo de
  la selfie, y acepta **varios cuadros** de la misma cara.
- **`distancia(a, b)`**, `DISTANCIA_SEGURA` (0,50) y `DISTANCIA_DUDOSA` (0,62).

**Tu trabajo es traerle los números y mostrar el resultado.** Nada de umbrales nuevos ni de
agrupar por tu cuenta: eso ya está resuelto y probado.

---

## BLOQUE 0 — LAS REGLAS DE LA CARA. Se leen primero y no se negocian.

**Son caras de gente en una fiesta de quince. Muchas, menores.**

1. **Nunca se guarda una cara.** Lo que se guarda por foto es el puñado de números que devuelve
   la biblioteca, **que no permite reconstruir la cara**. La foto de la cara **no se guarda
   nunca**.
2. **Nunca un nombre al lado de una cara.** Esto **encuentra fotos, no identifica personas**. La
   grilla muestra caritas sin nombre, como Wfolio. Hay una prueba que se pone en rojo si alguien
   agrega un nombre.
3. **Sólo entre las fotos aprobadas de esa fiesta.** Lo que la moderación ocultó **no entra ni
   para buscar**.
4. **Se apaga por fiesta**, y **viene apagado**. Ver bloque 4: no es un detalle, es lo que hace
   que se pueda usar en unos quince.
5. **Los números se borran cuando se cierra la fiesta.**
6. **Si algo obliga a mandar una foto a un servicio de afuera, PARÁ Y AVISÁ.** No se hace: se
   paga por foto y las caras salen del país.

---

## BLOQUE 1 — Sacar los números de las fotos

- **Biblioteca que corre en el navegador**: `face-api.js` sobre TensorFlow.js, o `FaceDetector`
  de MediaPipe. **Sin servicios que se paguen por uso.** El modelo pesa unos 6 megas y se
  descarga una sola vez; **guardalo en `public/`**, servido por nosotros.
- **Lo dispara una persona**, cuando el equipo cierra la galería de la fiesta. **No pasa solo**:
  recorrer 3.000 fotos lleva minutos y tiene que verse el avance.
- Por cada cara encontrada se guarda `{ fotoId, vector, tamano }` — **exactamente la forma
  `CaraEnFoto`** que ya espera el corazón. `tamano` es cuánto ocupa la cara en la foto, de 0 a 1:
  **se usa para elegir la carita de la grilla**, no lo dejes vacío.
- **Mientras la fiesta no esté preparada, el botón no aparece.** Nunca un botón que no hace nada.

## BLOQUE 2 — La grilla, que es la pantalla principal

En `/evento/galeria/[fiestaId]` y `/evento/album/[fiestaId]`:

- **Una fila de caritas redondas**, la más grande de cada persona, ordenadas por quién aparece
  más. Se desliza para el costado en el celular.
- **Se toca una y se ven sus fotos**, con **"Descargar todas"**.
- **Sin nombres. Sin "esta es Fulana".**
- **Siempre a la vista: "Ver todas las fotos de la fiesta"**, para volver.
- Aplican `celular-primero` y `animaciones-pro`, que están instaladas.

## BLOQUE 3 — El atajo de la selfie, que Wfolio no tiene

Un botón **"Encontrame a mí"** arriba de la grilla:

- Cartel de permiso antes de prender la cámara: *"Vamos a mirar tu cara en este teléfono para
  buscar tus fotos. No se guarda ni se manda a ningún lado."* **Si no acepta, la galería y la
  grilla funcionan igual.**
- **La cámara toma dos o tres cuadros seguidos**, sin que el invitado haga nada, y se le pasan
  los tres a `buscarFotosDeUnaCara`. **Eso es lo que arregla la mala luz y la cara de costado**,
  que es donde más falla el rubro.
- **La selfie no sale del teléfono ni se guarda.** Se usa en el momento y se descarta.
- **Se muestran los dos cajones por separado:** *"Tus fotos"* y, más abajo, **"¿Sos vos en
  éstas?"** con las dudosas, que el invitado confirma. **No las mezcles**: ésa es toda la mejora
  sobre el rubro.

## BLOQUE 4 — El interruptor por fiesta

En los ajustes de la fiesta, **una sola opción con tres valores**, y **viene en la primera**:

| Valor | Qué hace |
|---|---|
| **Apagado** | No aparece nada. **Es el que viene puesto.** |
| **Sólo mis fotos** | Únicamente el botón de la selfie. Cada uno ve las suyas |
| **Grilla de caras** | Como Wfolio: se ven todas las caritas |

**Y esto en pantalla, en criollo, al lado de la opción**, porque es una decisión del cliente y no
una configuración técnica:

> *"Con la grilla, cualquiera que tenga el enlace puede ver y bajar todas las fotos de una
> persona. Va bien en un casamiento. En unos quince, con menores, conviene 'sólo mis fotos'."*

## BLOQUE 5 — Cuando no encuentra nada

Es el caso que más va a pasar y el peor resuelto en las plataformas del rubro.

- **"No encontramos fotos tuyas todavía"**, y por qué puede ser: que todavía se están cargando, o
  que no saliste en ninguna.
- **Nunca una pantalla vacía y nunca un cartel técnico.**
- Que ofrezca **probar de nuevo**.

---

## LO QUE NO SE TOCA

- **`src/lib/caras/agrupar-caras.ts` y su prueba.** Ya están y son de Claude.
- **`src/lib/social-gallery/face-indexer.ts`**: agrupa por **quién subió la foto**, no reconoce
  caras. Sirve para lo suyo. **No lo toques y no lo confundas con esto.**
- **La moderación:** lo oculto sigue oculto.
- **Nada que se pague por mes ni por foto.**

## Y las pruebas que hay que dejar

1. Que **con la fiesta sin preparar, el botón no aparece**.
2. Que **sin aceptar el permiso, la cámara no se prende**.
3. Que **con el interruptor apagado no se ve ni la grilla ni el botón**.
4. **La más importante: que la selfie no sale del teléfono.** Que no se dispare ninguna llamada
   al servidor con la imagen. **Si no la podés escribir, decilo y la escribe Claude: es lo único
   de esta orden que no puede quedar sin comprobar.**

```comprobar
archivo: src/lib/caras/agrupar-caras.ts
usa: agruparEnPersonas en src/app/evento/galeria/[fiestaId]/page.tsx
usa: buscarFotosDeUnaCara en src/app/evento/galeria/[fiestaId]/page.tsx
usa: dudosas en src/app/evento/galeria/[fiestaId]/page.tsx
prueba: src/__tests__/encontrar-fotos-por-cara.test.ts
prueba: tests/e2e/la-grilla-de-caras.spec.ts
```
