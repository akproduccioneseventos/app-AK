# La auditoría que corre sola

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 20 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

> **Cuarta en la fila.** Se hace después de `ahora.md`, de
> `2-despues-de-los-comentarios.md` y de `3-lo-automatico-que-se-ve.md`.
> **Los cinco bloques van en UNA sola propuesta.**

## Por qué existe esta orden

La app estuvo declarada terminada y en un solo día aparecieron **unas veinte
fallas reales**. Ninguna era un error de programación: **todas pasaban los cinco
controles de salud sin despeinarse.** Código correcto que no produce nada, o
pantallas que prometen algo que no pasa.

Auditar a mano no sirve: es caro, se olvida y depende de que a alguien se le
ocurra la pregunta correcta. **Hay que convertir las cuatro preguntas del método
en un comando que corra solo y devuelva números.**

**Leé `docs/COMO-AUDITAR.md` antes de empezar. Esta orden lo hace ejecutable.**

## La regla que ordena todo

> **Cada control cuenta. Ninguno opina.**
>
> Un control que necesita criterio para decidir si algo está bien, no se hace. Los
> ayudantes opinando dieron 70% de falsas alarmas; las cuentas mecánicas, 100% de
> aciertos.

---

# BLOQUE 1 — El comando

`npm run auditoria`, que corre las cuatro pasadas y escribe un solo informe en
`auditoria-out/informe.md`, con la fecha arriba.

- **Cada hallazgo lleva archivo y línea.** Sin eso no se reporta.
- **Termina con un resumen de cuatro números**, uno por pasada.
- **No falla la compilación ni frena nada.** Es un informe, no un portero.
- **No usa inteligencia artificial.** Son cuentas sobre archivos: tiene que ser
  gratis y correr en segundos.

# BLOQUE 2 — Pasada 1: ¿dejó rastro?

Recorrer `src/app/api/cron/` y la lista de
`src/lib/automatico/tareas-automaticas.ts`, y reportar:

- Tareas declaradas que **no dejan constancia** al terminar.
- Tareas en la carpeta que **no están declaradas**.
- Para cada tarea, **cuándo corrió por última vez** según el dato guardado.

**Ya existe `estadoDeLasTareas()`: usalo, no lo rehagas.**

# BLOQUE 3 — Pasada 2: ¿alguien lo llama?

Contar, para cada componente de `src/components` (sin `ui/`), cada función
exportada de `src/app/actions`, y cada `page.tsx` de `src/app`, **cuántos archivos
lo usan**. Reportar los que den cero.

**Ojo, esto ya dio falsos positivos con `grep` suelto y hay que evitarlo:**

- Las pantallas se enlazan de muchas formas: `href`, `router.push`, `redirect`, y
  también armadas por pedazos (`/fiestas/${id}/centro`). **Buscá también el tramo
  fijo de la dirección**, no la dirección entera.
- Las acciones de servidor se llaman desde el navegador: contá los imports, no las
  invocaciones.
- **Marcá aparte lo que sólo aparece en pruebas**, que no es lo mismo que huérfano.
- Si una comprobación no la podés hacer sin adivinar, **no la incluyas**. Un
  informe con falsos positivos no lo lee nadie dos veces.

# BLOQUE 4 — Pasada 3: ¿muestra datos inventados?

La más importante de las cuatro, porque es la que engaña al dueño.

Buscar valores armados a mano que puedan llegar a una pantalla: nombres con `mock`,
`fallback`, `demo`, `ejemplo`, `placeholder`, `dummy`, y los `catch` o
`if (!clave)` que devuelven un valor en vez de un aviso.

Reportar sólo los que **llegan a una pantalla que ve una persona** y **no avisan
que son de ejemplo**. Primero los que tocan plata o números para decidir.

**Los que sí avisan no son hallazgos.** Un "sin dato" es la respuesta correcta.

# BLOQUE 5 — Pasada 4: ¿se cumple lo que promete la pantalla?

Buscar en los textos que ve el usuario las frases que prometen algo automático
—"se envía solo", "automáticamente", "todos los días", "en tiempo real", "al
instante", "te avisamos", "se sincroniza"— y para cada una reportar **qué función
lo cumple y quién la llama**.

**Una promesa sin nadie que la cumpla es una mentira al cliente.** Así se
encontraron dos hoy: la cola sin señal y la lista de música que nunca le llegaba
al DJ.

---

## Lo que NO se toca

- **Plata, cobros, comida y permisos: eso lo escribe Claude.**
- **No arregles nada de lo que encuentre el informe.** Esta orden construye el
  instrumento, no repara. Cada hallazgo se decide después, uno por uno.
- **No metas inteligencia artificial en la auditoría.**
- **No hagas que falle el build.** Si el informe frena la compilación, alguien lo
  va a apagar el primer día que apure una entrega.

## Los controles antes de entregar

1. `npx tsc --noEmit`
2. `npx jest --silent`
3. `npm run check:acentos`
4. `npm run build`

Y además: **corré `npm run auditoria` y pegá el resumen de los cuatro números en
la entrega.** Si una pasada devuelve cero hallazgos, decilo: también es un
resultado.

## Cuando termines

Anotá en `docs/YA-RESUELTO.md`, actualizá `docs/QUE-HAY-EN-LA-APP.md`, avisá el
número de la propuesta y mové este archivo a `hechas/` en la misma propuesta.
