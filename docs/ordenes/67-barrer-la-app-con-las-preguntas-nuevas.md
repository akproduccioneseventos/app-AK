# Orden 67 — Barrer la app entera con las preguntas nuevas

**Para Gemini.** **UNA SOLA propuesta con todos los bloques.** Si un bloque se traba, entregá el
resto y avisá cuál faltó.

## Por qué existe esta orden

**Orden del dueño, 18 de septiembre de 2026.** Cuando Codex encuentra un defecto, yo agrego la
pregunta al método y arreglo **ese** caso. Pero **la misma forma está repetida en otros lugares**
que nadie miró con esa pregunta puesta, y quedan esperando a que Codex los encuentre de a uno.
Cada vuelta cuesta una sesión entera.

Esta orden cierra eso: **las seis preguntas nuevas se pasan por toda la app, de una vez.** Están
en `docs/ANTES-DE-ENTREGAR.md`, numeradas 10 a 16. Acá va la búsqueda mecánica de cada una.

## LA LISTA YA ESTÁ HECHA: no la busques a mano

**Desde el 18 de septiembre de 2026 hay un comando que la imprime sola:**

```
npm run formas-que-mienten
```

Te dice, con archivo y línea, los **84 lugares** donde está cada una de las cuatro formas que ya
nos costaron caro, y cómo se arregla cada una. **Empezá por ahí**: los bloques de abajo explican
el porqué de cada forma y qué cuenta como hallazgo, pero la búsqueda no la hagas vos.

**Si en algún caso está bien ignorar la falla** —que no suene la música de fondo no rompe nada—,
se escribe el motivo en un comentario que empiece con `no pasa nada si falla:` y el control lo
deja pasar. **Sin motivo escrito, no vale**: eso es lo que separa una decisión de un descuido.

**Ojo:** ese mismo control **frena la verificación** por lo que toques de ahora en adelante. Así
que si arreglás diez y dejás uno a medias con un `catch` vacío sin motivo, no vas a poder subir.

## Cómo se entrega cada hallazgo

- **Lo que es tuyo** —pantallas, entretenimiento, invitado, impresos, herramientas internas—:
  **arreglalo y dejá la prueba.**
- **Lo que toca plata, cobros, comida, permisos o quién ve qué**: **NO lo toques.** Anotalo en
  `docs/auditoria/BARRIDO-PREGUNTAS-NUEVAS.md` con archivo y línea y una frase de qué pasaría.
  Eso lo arreglo yo.
- Si algo ya figura en `docs/YA-RESUELTO.md`, es falso positivo: no lo reportes.

## Bloque 1 — Pregunta 12: ¿qué pasa si toca dos veces?

**Buscar:** en `src/app/(app)/` y `src/app/evento/`, todo archivo con `setIsSubmitting(true)`,
`setIsSaving(true)`, `setEnviando(true)` o similar.

**Es hallazgo si:** el apagado de ese cartel **no está dentro de un `finally`**, o el manejador no
corta al entrar cuando ya está trabajando (`if (isSubmitting) return;`).

**No es hallazgo:** un botón que abre un diálogo o navega, sin llamar al servidor.

## Bloque 2 — Pregunta 13: ¿el cálculo usa la hora de Uruguay?

**Buscar:** `getMonth()`, `getDate()`, `getFullYear()`, `setHours(0`, `toISOString().slice(0, 10)`
en `src/lib/` y `src/app/actions/`.

**Es hallazgo si:** ese cálculo **decide a qué día pertenece algo** —un corte por día, un
vencimiento, un "lo de hoy", un agrupado por mes—. El servidor trabaja en hora de Greenwich y
Uruguay está tres horas atrás: a la noche, para el servidor ya es mañana.

**Modelo a copiar, no reinventar:** `src/lib/reportes/rango-de-dias.ts`.

**No es hallazgo:** formatear una fecha para mostrarla en pantalla.

## Bloque 3 — Pregunta 14: ¿qué ve el que adivina el enlace?

**Buscar:** las pantallas de `src/app/evento/`, `src/app/invitacion/`, `src/app/feedback/` y lo
que devuelven sus acciones.

**Es hallazgo si:** al invitado le llega pegado algo interno —presupuesto, precios internos,
teléfono del cliente, lista del personal, itinerario interno—, aunque la pantalla no lo muestre:
**viaja igual y se puede ver.**

**Modelo:** `src/__tests__/el-cliente-no-ve-lo-interno-del-itinerario.test.ts`.

## Bloque 4 — Pregunta 16: ¿el campo que compara este control existe en el dato?

**Es la más productiva y la más invisible.** Buscar en `src/app/actions/` los controles que
impiden algo: `No se puede eliminar`, `ya existe`, `está asignado`, `en uso`.

**Es hallazgo si:** el campo que compara **no existe en el tipo del dato que le llega**. Ejemplo
real que ya arreglé: se comparaba `item.activoId` cuando la lista guarda `origenId`, así que el
control nunca frenaba nada y **se veía idéntico a uno que funciona**.

**Ojo con `(item as any).campo`**: eso apaga al revisor de tipos, que es justo quien avisaría. Cada
uno de esos merece una mirada.

## Bloque 5 — Pregunta 10: ¿cuál es la forma silenciosa de fallar?

**Buscar:** llamadas a `readData(` en `src/app/actions/` cuyo resultado se use para **decidir
algo** —contar, comparar, borrar, avisar—.

**Es hallazgo si:** cuando la base no contesta y devuelve la lista vacía, **la app concluye algo
falso**: "no hay nada asignado", "no hay nada pendiente", "no hay conflicto". Ese es el caso que
no hace ruido.

**Si toca plata o comida, no lo arregles: anotalo.**

## Bloque 6 — Anuncios que no miran si la cosa salió

**Salió de la hoja del DJ, el 18 de septiembre de 2026:** el botón de compartir mostraba "Enlace
Copiado" sin esperar ni mirar si el portapapeles había funcionado.

**Buscar:** en `src/app/` y `src/components/`, `navigator.clipboard`, `navigator.share`,
`document.execCommand('copy')` y descargas armadas a mano, donde **el cartel de éxito sale sin
`await` y sin `catch`**.

**Buscar también:** `.catch(() => {})`, `.catch(() => null)` y cualquier `catch` vacío dentro de un
`Promise.all` que borre, mande o suba cosas. Ahí cada fallo se tira a la basura y después se
devuelve éxito: es el mismo defecto con otra cara, y ya apareció en el borrado de fotos del video
de vida.

**Y una tercera forma, la del tope que no coincide:** un límite escrito en la pantalla y otro
distinto en el servidor. La pantalla deja configurar 200 y el servidor rechaza desde la 51. Buscá
números sueltos —`max=`, `> 50`, `length > `— que aparezcan en los dos lados con valores distintos.

**Es hallazgo si:** se anuncia que salió bien algo que puede fallar en silencio. Y el arreglo no es
sólo avisar el error: **hay que dejarle al que lo usa una forma de seguir** —el enlace a la vista
para copiar a mano, por ejemplo—.

## Bloque 7 — Datos de ejemplo tratados como datos reales

**Salió de la lista de regalos, el 19 de septiembre de 2026:** si el cliente la dejaba vacía a
propósito, la pantalla la rellenaba sola con ejemplos y el guardado siguiente los escribía como si
los hubiera elegido él.

**Buscar:** `length === 0` seguido de un relleno con algo que se llame `default...`, `ejemplo`,
`sugerid`, `demo` o `placeholder`, en `src/app/(app)/` y `src/app/evento/`.

**Es hallazgo si:** la pantalla **no distingue "todavía no cargó nada" de "lo dejó vacío a
propósito"**, y lo rellenado se puede terminar guardando.

**Cómo se arregla, siempre igual:** la lista queda vacía, y el relleno pasa a ser **un botón que
la persona toca**.

## Bloque 8 — Dos guardados seguidos, y el segundo que falla borra la verdad del primero

**Salió de las guías de armado, el 19 de septiembre de 2026:** se guardaban las tareas y después
se anotaba en el historial. Si lo segundo fallaba, la función devolvía "no se hizo nada" **con las
tareas ya creadas**, y el reintento las duplicaba.

**Buscar:** en `src/app/actions/`, funciones con **dos `await` de guardado seguidos** —dos
`saveFiesta`, `writeData`, `set`, `update`— donde el `catch` o el segundo `if (!ok)` devuelve
`success: false` **con los contadores en cero**.

**Es hallazgo si:** después de ese error, **algo quedó guardado igual** y el que llama no tiene
cómo enterarse. La pregunta es siempre: *¿qué pasa si el operador aprieta de nuevo?*

**Cómo se arregla:** decir la verdad de lo que sí se hizo, cerrar la puerta al reintento ciego, y
—cuando se pueda— preguntar antes de repetir una operación que ya figura hecha.

## Lo que NO se toca en toda la orden

- Los textos que ve el cliente, las promociones, los descuentos y el reloj del simulador.
- Lo que ya está arreglado y figura en `docs/YA-RESUELTO.md`.
- Las órdenes 65 y 66, que son de la misma tanda y van aparte.

## Qué tiene que comprobar la prueba

Cada arreglo tuyo deja **una prueba que mire el resultado**, y **ninguna puede dar verde con la
función apagada**. Romper cada una a propósito una vez y dejarlo escrito arriba del archivo.

```comprobar
archivo: docs/auditoria/BARRIDO-PREGUNTAS-NUEVAS.md
archivo: docs/ANTES-DE-ENTREGAR.md
# Bloque 3 (lo hizo Claude el 25/9)
prueba: src/__tests__/la-fiesta-no-viaja-entera-a-quien-no-es-del-equipo.test.ts
# Bloque 2 (va en la orden 88)
prueba: src/__tests__/hoy-es-uruguay-en-todos-lados.test.ts
```
