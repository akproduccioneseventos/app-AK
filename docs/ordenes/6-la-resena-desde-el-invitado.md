# La reseña, también desde el invitado

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 21 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

> **UNA SOLA PROPUESTA.** Es corta a propósito.

## Qué pidió el dueño, con sus palabras

> *"La quiero automático en la app y en los invitados, sin complicar pero opcional
> tipo un botón."*

## Qué hay hecho ya, y no se rehace

- **Al cliente ya se le pide.** Cuando contesta la encuesta en `/feedback/[fiestaId]`
  se le ofrece dejar la reseña. **Eso anda y no se toca.**
- **El enlace ya está y ya es público.** Es
  `getEnlaceDeResenaPublico()` en `src/app/actions/feedback.ts`. Devuelve el enlace
  cargado en Ajustes, o texto vacío si no hay ninguno. **No armes otra forma de
  conseguirlo.**

**Lo único que falta es el botón para el INVITADO.**

## Lo que hay que hacer

Un botón que le ofrezca al invitado dejar la reseña, en **dos lugares**:

1. **`src/app/evento/hub/[fiestaId]/page.tsx`** — el hub que usa el invitado durante
   la fiesta. Va abajo, entre las herramientas, sin robarle lugar a lo del evento.
2. **`src/app/evento/album/[fiestaId]/page.tsx`** — el álbum de fotos. **Es el mejor
   momento**: el invitado está mirando sus fotos y con la fiesta fresca.

### Las tres reglas que no se negocian

1. **Si no hay enlace cargado, el botón NO aparece.** Nada de un botón que lleve a una
   búsqueda de Google ni a ningún lado. Sin enlace, no hay botón.
2. **Es opcional para el invitado y no molesta.** Un botón, no una ventana que se
   abre sola, no un cartel que tapa la pantalla, no algo que haya que cerrar. Si el
   invitado no lo toca, no pasa nada.
3. **No se le pide nada a cambio.** Ni datos, ni registro, ni premio. El dueño ya
   decidió que la reseña se pide a todos por igual y sin incentivo.

### Cómo tiene que verse y decir

En criollo, sin jerga, y con el tono de la fiesta, no de un formulario:

- Algo como **"¿La estás pasando bien? Contalo en Google"**, y en el álbum
  **"¿Te gustaron las fotos? Contanos cómo la pasaste"**.
- Abre en una pestaña nueva (`target="_blank"` con `rel="noopener noreferrer"`).
- **No digas "dejanos 5 estrellas" ni nada que pida una nota concreta.** Google
  penaliza eso y el dueño no quiere condicionar la opinión.

### Que no vuelva a perderse

Dejá una prueba que verifique las tres reglas: que sin enlace no se dibuja el botón,
que con enlace sí, y que el texto no pide una cantidad de estrellas. Mirá cómo están
escritas las pruebas de `src/__tests__/` y seguí ese estilo, con el porqué explicado.

## Lo que NO se toca

- **La encuesta del cliente.** Ya anda.
- **`getEnlaceDeResenaPublico()`.** Ya está y es la única fuente del enlace.
- **Plata, cobros, comida y permisos: eso lo escribe Claude.**
- **No agregues pantallas de configuración.** "Sin complicar" es parte del pedido: si
  el enlace está cargado, el botón está; si no, no está. No hace falta un interruptor.

## Los controles antes de entregar

1. `npx tsc --noEmit`
2. `npx jest --silent`
3. `npm run check:acentos`
4. `npm run build`
5. `npm run auditoria` — que no aparezca ninguna pantalla nueva sin puerta.

Y además: **abrí el hub y el álbum en el navegador** y comprobá que el botón se ve
bien en un celular, que es donde lo va a usar el invitado.

## Cuando termines

Anotá en `docs/YA-RESUELTO.md`, actualizá `docs/QUE-HAY-EN-LA-APP.md`, avisá el
número de la propuesta y mové este archivo a `hechas/` en la misma propuesta.
