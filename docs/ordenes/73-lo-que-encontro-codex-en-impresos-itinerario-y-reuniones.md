# Orden 73 — Lo que encontró Codex el 20 de septiembre: impresos, itinerario, reuniones y fotografía

**Para Gemini. UNA SOLA PROPUESTA con todos los bloques.** Si un bloque se traba, entregá los
demás igual y decí cuál faltó.

Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste.

**Lo que NO tocás:** plata, cobros, comida, permisos y quién ve qué. Lo de plata y comida de
esta tanda ya lo arreglé yo (el indicador de preparación y la lista de compras): **no los
rehagas**.

**Y la regla que salió hoy, que vale para todas las pruebas de esta orden:** una prueba tiene
que fallar **diciendo lo que pasó**. Antes de buscar un campo, esperá a que la pantalla haya
cargado. Y poné la sesión con `ponerSesionDelEquipo(context, baseURL)` de
`tests/e2e/helpers/fiesta-de-prueba.ts` — nunca armando la cookie a mano.

---

## Bloque 1 — Cartelería: dice "guardado" aunque falle una parte, y la fecha puede salir un día antes

**Dónde:** la pantalla es `src/app/(app)/fiestas/nueva/carteleria/page.tsx`. Guarda con
`updateCartaTragos` (`src/app/actions/fiesta/fiesta.actions.ts:1104`). La fecha la arma
`formatDate(dateString)` en la misma pantalla, **línea ~82**.

**Qué está mal:**

1. **La fecha.** `formatDate` arma la fecha en hora de Greenwich, así que un evento del 30 se
   muestra como 29. **Ya existe la función correcta y hay que usar esa:**
   `formatearFechaEvento` en `src/lib/fechas/formato-fecha-evento.ts`. Es la misma que arregló
   la hoja del DJ. **No escribas otra.** Ojo: la app escribe **"setiembre"**, como se dice acá;
   si comprobás la fecha en una prueba, aceptá las dos formas.
2. **El aviso de guardado.** Si una parte del guardado falla, la pantalla dice igual que se
   guardó. Hay que mirar lo que devuelve cada guardado y **avisar exactamente qué no se
   guardó**, con el nombre de lo que falló.

**Qué NO tocar:** los textos de los carteles y el diseño. Andan y son decisión del dueño.

```comprobar
archivo: src/app/(app)/fiestas/nueva/carteleria/page.tsx
usa: formatearFechaEvento en src/app/(app)/fiestas/nueva/carteleria/page.tsx
prueba: tests/e2e/la-carteleria-dice-la-verdad.spec.ts
```

---

## Bloque 2 — Menú impreso: si falla el guardado, se pierde lo que estabas escribiendo

**Dónde:** el guardado es `saveMenu` (`src/app/actions/menus-catering.ts:327`), que por dentro
llama a `saveMenuInterno` (línea ~200). Cuando la lista de ítems queda vacía o hay un número
inválido (líneas ~213-221), **no guarda y devuelve un error**.

**Qué está mal:** la pantalla, al recibir ese error, **descarta el texto que la persona venía
escribiendo**. Se pierde el trabajo.

**Cómo se arregla:** cuando el guardado falla, **el formulario queda como estaba**, con todo lo
escrito, y arriba se muestra qué fue lo que no se pudo guardar y qué hay que corregir.

**Ojo, esto es comida:** `saveMenu` y `menus-catering.ts` **no se tocan**. El arreglo es en la
pantalla: no perder lo escrito. Si te parece que hay que cambiar el guardado, anotalo y seguí.

```comprobar
archivo: src/app/actions/menus-catering.ts
prueba: src/__tests__/el-menu-impreso-no-pierde-lo-escrito.test.ts
```

---

## Bloque 3 — Números de mesa: cuenta distinto que cartelería y se queda cargando

**Dónde:** `src/app/(app)/fiestas/nueva/numeros-mesa/page.tsx`. La cuenta de mesas es
`tableCount` (línea ~233) y la carga usa `isLoading` (línea ~232). Guarda con
`updateNumerosMesa` (`src/app/actions/fiesta/fiesta.actions.ts:1097`).

**Qué está mal:**

1. **Da un número de mesas distinto al de cartelería.** Las dos pantallas tienen que contar lo
   mismo: **una sola función**, en `src/lib/`, que las dos usen. Dos cuentas distintas del mismo
   dato siempre terminan en una equivocada.
2. **Si falla la consulta, la pantalla se queda cargando para siempre.** Mismo defecto que ya
   arreglé en la lista de regalos: mirá
   `src/app/(app)/fiestas/nueva/regalos/page.tsx` como modelo. Se apaga la rueda **y** se dice
   en pantalla qué pasó.

```comprobar
archivo: src/app/(app)/fiestas/nueva/numeros-mesa/page.tsx
prueba: src/__tests__/las-mesas-se-cuentan-una-sola-vez.test.ts
```

---

## Bloque 4 — Fotografía y entregas

**Dónde:** la pantalla es `src/app/(app)/fiestas/nueva/fotografia/page.tsx` (los campos
`estado` ~248, `fechaEntregaEstimada` ~254, `linkEntrega` ~269). Guarda con
`updateFotografiaYFilmacionFiestaActual` (`src/app/actions/fiesta-actual.ts:125`). El tipo es
`ServicioFotografia`, en `src/types/fiesta.ts` (~1624).

**Qué está mal, según la revisión:**

1. **Renombrar un servicio pierde el seguimiento de la entrega**, porque el rastro se sigue por
   el **nombre** en vez de por el identificador. Hay que seguirlo por `id`.
2. **Una respuesta atrasada pisa cambios nuevos:** si el operador ya cambió algo, la respuesta
   vieja lo sobrescribe. Hay que descartar la respuesta que llegó tarde (la que salió antes del
   último cambio en pantalla).
3. **Una carga que falló queda mostrando "sincronizando" para siempre.** Se apaga y se dice qué
   pasó.

```comprobar
archivo: src/app/(app)/fiestas/nueva/fotografia/page.tsx
usa: updateFotografiaYFilmacionFiestaActual en src/app/(app)/fiestas/nueva/fotografia/page.tsx
prueba: tests/e2e/las-entregas-de-fotografia-no-se-pisan.spec.ts
```

---

## Bloque 5 — Itinerario

**Dónde:** lo genera `generateItinerarioSugerido`
(`src/app/actions/fiesta/fiesta.actions.ts:559`) y se guarda con
`updateProgramaFiestaActual` (`src/app/actions/fiesta-actual.ts:99`), campo `programa`.

**Qué está mal:**

1. **La inteligencia artificial borra lo que hiciste mientras esperabas.** Lo generado tiene que
   **juntarse** con lo que la persona cambió durante la espera, no reemplazar la lista entera.
   Si hay choque, se le pregunta; nunca se pisa en silencio.
2. **Acepta horarios imposibles** (un momento que termina antes de empezar, o dos en el mismo
   horario). Hay que rechazarlos con un mensaje que diga cuál y por qué.
3. **Repuebla una lista que la persona vació a propósito.** Vacío quiere decir vacío: es lo
   mismo que ya se arregló en la lista de regalos.

```comprobar
archivo: src/app/actions/fiesta/fiesta.actions.ts
usa: updateProgramaFiestaActual en src/app/(app)/fiestas/nueva/itinerario/page.tsx
prueba: src/__tests__/el-itinerario-no-borra-lo-que-hiciste.test.ts
```

---

## Bloque 6 — Reuniones

**Dónde:** el micrófono lo suelta `stopSpeechRecognition`
(`src/components/reuniones/MeetingIntelligenceRecorder.tsx:74`). Las preguntas frecuentes las
arma `buildLearningFaqs` (`src/app/actions/meeting-intelligence.ts:320`), campo
`preguntasCliente` (~línea 25).

**Qué está mal:**

1. **El micrófono no siempre se libera.** Si falla al soltarlo, queda tomado y la próxima
   grabación no arranca. Tiene que soltarse **siempre**, aunque haya error, y la pantalla tiene
   que quedar como recién prendida para el que entra después.
2. **Se borran como duplicadas tareas de responsables distintos.** Dos tareas con el mismo texto
   pero distinto responsable **no son la misma**: el responsable entra en la comparación.
   *(La revisión marcó esto y el buscador no encontró la función que las borra: si no existe,
   decilo en la propuesta en vez de inventar el arreglo.)*
3. **Se activan preguntas frecuentes que estaban escondidas.** Lo que el equipo escondió queda
   escondido, aunque se regeneren.

```comprobar
archivo: src/app/actions/meeting-intelligence.ts
usa: buildLearningFaqs en src/app/actions/meeting-intelligence.ts
prueba: src/__tests__/las-reuniones-no-pisan-lo-del-equipo.test.ts
```

---

## Lo que tiene que comprobar cada prueba

Ninguna puede dar verde con la función apagada. Y las que miran algo que sólo se ve en pantalla
—una fecha, un cartel, la rueda que se apaga— van con prueba de navegador que **mire el
resultado**, no con un nombre buscado en el código.
