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

**Las cuatro pruebas siguen fallando cuando corren juntas.** Sueltas andan; en tanda, no.
Medido el 20 de septiembre de 2026 sobre la rama `fix/despertador-de-afuera`, con
`npm run test:e2e:production -- <archivo>`:

- `la-carga-operativa-avisa-cuando-no-alcanza.spec.ts` — no encuentra
  `input[placeholder="Cant."]`.
- `la-carga-operativa-se-sincroniza.spec.ts` — misma pantalla, mismo síntoma.
- `la-hoja-del-dj-dice-la-verdad.spec.ts` — la pantalla queda en "Elegí una fiesta".
- `la-lista-de-regalos-queda-como-la-dejaron.spec.ts` — la pantalla no termina de cargar.

**Todas fallan igual: la pantalla abre sin la fiesta.** Sola, cada una anda; con cuatro
archivos a la vez, no. Eso apunta a la fiesta de prueba, no a las pantallas.

**Lo que hay que revisar, y en este orden:**

1. **Cada prueba crea su fiesta en `beforeAll` y la borra en `afterAll`.** Con varias corriendo
   a la vez, un `afterAll` de una **borra el archivo mientras la otra lo está usando** si los
   identificadores chocan. Los identificadores se arman con `Date.now()`, que **se repite** entre
   procesos que arrancan juntos. Ponéles algo que no se repita (por ejemplo el número de proceso
   además de la hora).
2. **Comprobá que la fiesta exista JUSTO ANTES de mirar la pantalla**, con `leerFiesta` del
   ayudante `tests/e2e/helpers/fiesta-de-prueba.ts`. Si no está, la prueba tiene que fallar
   diciendo *"la fiesta de prueba no está"*, no *"no encuentro el campo"*: eso es lo que me hizo
   perder una hora buscando del lado equivocado.
3. **Recién después** mirá los selectores.

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
