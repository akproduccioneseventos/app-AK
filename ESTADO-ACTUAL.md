# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 28 de agosto de 2026, cierre.
**Estado:** la puerta pasó a **ocho pasos**. Todo verde sobre la propuesta del día.
**Propuesta abierta:** una sola, con el trabajo del día entero.

## Lo que se construyó hoy, y es lo que importa

El dueño lo pidió así: *"quiero algo que repare mi app y que todas las reparaciones o
agregados futuros no deje que pasen si no funcionan realmente"*. Salieron dos controles
nuevos, además del de la mañana:

1. **El control de promesas.** Frena código que nadie llama, pantallas sin prueba que mire
   el resultado, y pruebas que sólo confirman que la pantalla se ve.
2. **Las promesas al cliente.** Cada cosa que la pantalla dice que la app hace declara qué
   archivo la cumple. **No se puede agregar una función a la lista sin decir si existe.**
3. **El trinquete.** La deuda vieja quedó medida y **sólo puede bajar**. Si crece, frena.

**Los tres están probados frenando de verdad**, no sólo escritos.

## El método de reparación, para no volver a explicarlo

No se repara todo de una: son 299 y sería mentira. Tres reglas:

- El que toca algo, deja limpia **esa** parte.
- Lo nuevo no puede sumar: la puerta frena.
- El número sólo baja, nunca sube.

La reparación pasa sola, como consecuencia del trabajo normal.

## Promesas que la app hace y HOY no cumple (quedan a la vista, no escondidas)

- **Tótem:** encuestas, juegos y mapa del salón. No existe ninguno.
- **Bogue:** música. Sólo suenan los pitidos de la cuenta regresiva.
- **Plataforma 360:** intro y cierre.

**La decisión de qué hacer con esto es del dueño:** construirlo, o corregir el texto. Son
textos comerciales suyos: **no se tocan hasta que él elija.**

## Lo que espera a Gemini

- **Orden 16** — reparar lo que existe y no se comprobó, con la lista que da
  `npm run lo-que-se-dijo:todo`.
- **Orden 17** — el híbrido de las ocho estaciones contra las plataformas pagas. Arranca
  por el bloque 0: **subir un fondo propio y personalizar las plantillas.**
- **Orden 15** — sigue devuelta por tercera vez.

**Ojo, ya costó un viaje:** el **color de las estaciones YA se puede cambiar y anda**
(ocho pantallas lo usan). No mandarlo a rehacer.

## Falsos positivos verificados a mano (no volver a reportarlos)

- La **cámara lenta** y la **salida LED** de la Plataforma 360 **existen**. Un agente dijo
  que no y se equivocó.
- El fondo, el color, el nombre y la fecha de la fotocabina **salen solos de la invitación
  digital**. Está bien así: es la ventaja que ninguna plataforma paga puede copiar.
