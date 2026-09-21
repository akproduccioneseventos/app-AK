# Devolución — Las cuatro pruebas de navegador de la tanda de septiembre

**Para Gemini.** Las cuatro pruebas nuevas que entregaste **no corrían**. Una de ellas se
llevaba puesta la tanda entera: ocho archivos terminaban "sin registrar ninguna prueba", y por
eso la verificación no pasaba de ahí. Está medido archivo por archivo, no supuesto.

Lo que arreglé yo ya está en la rama `fix/despertador-de-afuera` —**no lo rehagas**—. Lo que
sigue abierto es tuyo.

## Lo que ya quedó arreglado (mirá cómo, no lo toques)

1. **La cookie de sesión estaba mal puesta en los cuatro archivos.** Estaba como
   `{ domain: 'localhost', path: '/' }` y el servidor de pruebas responde en `127.0.0.1`, así
   que la cookie no viajaba: todas las pantallas rebotaban al ingreso. Ahora va
   `{ url: baseURL! }`, con `baseURL` agregado a los parámetros de cada prueba. **Así se pone
   la cookie de ahora en más.**

2. **`la-lista-de-regalos-queda-como-la-dejaron.spec.ts` importaba una acción del servidor**
   (`claimGift`, de `src/app/actions/fiesta/regalos.actions.ts`) para llamarla directo. Toda
   acción del servidor arrastra `server-only`, que revienta fuera de Next: **el archivo no
   cargaba y se llevaba puesta la tanda de ocho.** Esa comprobación la mudé a
   `src/__tests__/un-regalo-no-se-reserva-dos-veces.test.ts`.

   **Regla que queda, y hay un control que la hace cumplir**
   (`src/__tests__/las-pruebas-viven-donde-corresponde.test.ts`): una prueba de navegador
   entra **por la pantalla**. Lo que haya que probar llamando a una acción del servidor va a
   una prueba de Jest en `src/__tests__/`.

3. **`la-hoja-del-dj-dice-la-verdad.spec.ts` buscaba "30 de septiembre de 2026".** La app
   escribe **"setiembre"**, como se dice en Uruguay. La fecha estaba bien —mostraba el 30, no
   el 29—: la prueba estaba mal escrita. Ahora acepta las dos formas.

4. **Dos defectos de la app que aparecieron probando esto** ya están arreglados: el portero
   perdía el `?fiestaId=...` al mandar al ingreso, y la lista de regalos se quedaba cargando
   para siempre cuando le faltaba la fiesta.

## Lo que falta y es tuyo

**Medido el 20 de septiembre de 2026**, corriendo las cuatro juntas sobre
`fix/despertador-de-afuera`. La causa de fondo era mía de encontrar y **ya está arreglada**:

> **La sesión del equipo son DOS mitades**: la cookie firmada, que mira el portero del
> servidor, y una marca en el navegador (`localStorage`/`sessionStorage`), que mira el guardia
> de la pantalla. Tus cuatro pruebas ponían sólo la cookie, así que el guardia mandaba al
> ingreso y en ese rebote se perdía el `?fiestaId=...`. La pantalla volvía sin fiesta y se
> quedaba en "elegí una fiesta" o cargando: **parecía un defecto de la pantalla y no lo era.**
>
> Queda un único ayudante, **`ponerSesionDelEquipo(context, baseURL)`** en
> `tests/e2e/helpers/fiesta-de-prueba.ts`. **Usalo siempre; no armes la cookie a mano.**

Con eso, **`la-hoja-del-dj-dice-la-verdad.spec.ts` pasa en verde.** Quedan tres, y son tuyas:

### 1. `la-carga-operativa-avisa-cuando-no-alcanza.spec.ts` — no aparece "Falta Stock"

El cartel existe en la pantalla: `src/app/(app)/fiestas/nueva/carga-operativa/page.tsx:135`,
y se muestra cuando `item.hasConflict` es verdadero. **`hasConflict` no lo pone la pantalla**:
lo calcula `checkAssetConflicts` comparando contra el **catálogo de activos** de la empresa.

Tu fiesta de prueba no deja ningún activo en el catálogo, así que **nunca puede haber
conflicto** y el cartel nunca aparece. Hay que sembrar el catálogo en el `beforeAll` (el equipo
con su cantidad disponible) para que pedir 12 teniendo 10 dé conflicto de verdad.

### 2. `la-carga-operativa-se-sincroniza.spec.ts` — no encuentra `input[placeholder="Cant."]`

Misma pantalla y probablemente la misma raíz: la lista no llega a dibujarse. Antes de mirar el
selector, **comprobá que la pantalla cargó la lista**: si `checkAssetConflicts` falla, la
pantalla queda en "No se pudo cargar la lista de carga operativa" y ningún selector existe.
La prueba tiene que fallar diciendo **eso**, no "no encuentro el campo".

### 3. `la-lista-de-regalos-queda-como-la-dejaron.spec.ts` — la pantalla no termina de cargar

Con la sesión completa la pantalla ya no rebota, pero la prueba sigue agotando el tiempo. Mirá
qué muestra el cuerpo de la página antes de buscar el texto: si dice que el módulo no está
contratado, falta `modulosContratados.regalos` en la fiesta de prueba.

### La regla que sale de esto, y vale para toda prueba nueva

**Una prueba tiene que fallar diciendo lo que pasó, no lo que no encontró.** Antes de buscar un
campo, comprobá que la pantalla cargó: una línea que espere el título o el listado. Si no,
cualquier problema de datos se disfraza de "selector equivocado" y se van horas buscando del
lado equivocado. Eso fue exactamente lo que pasó hoy.

**Cómo se comprueba que quedó bien:** las cuatro tienen que pasar **corriendo juntas**, no una
por una:

```
npm run test:e2e:production -- tests/e2e/la-hoja-del-dj-dice-la-verdad.spec.ts tests/e2e/la-lista-de-regalos-queda-como-la-dejaron.spec.ts tests/e2e/la-carga-operativa-avisa-cuando-no-alcanza.spec.ts tests/e2e/la-carga-operativa-se-sincroniza.spec.ts
```

```comprobar
archivo: tests/e2e/la-hoja-del-dj-dice-la-verdad.spec.ts
usa: baseURL en tests/e2e/la-lista-de-regalos-queda-como-la-dejaron.spec.ts
prueba: tests/e2e/la-carga-operativa-se-sincroniza.spec.ts
```

## Y de paso, la costumbre que evita esto

Una prueba que **no corre** no es una prueba entregada. Antes de decir "terminé", corré los
archivos nuevos **juntos** con el comando de arriba. Si alguno no carga, la corrida ahora te
dice cuál y por qué: la agregué el 20 de septiembre y está en
`scripts/run-playwright-production.mjs`.

Y lo de siempre: **una sola propuesta** con esto y con la orden 72, que es el trabajo grande.
