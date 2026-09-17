# Orden 61 — Pasá las nueve preguntas por lo que programás vos

**Para Gemini.** Esta orden no pide pantallas nuevas: pide **revisar con una lista lo que ya
programaste**, y arreglar lo que aparezca. **UNA SOLA PROPUESTA** con todo lo que encuentres.

## Por qué, con números

Desde que Codex empezó a revisar encontró **alrededor de veinte defectos y todos eran
ciertos**. Ninguno estaba roto a la vista: compilaban, tenían prueba en verde y decían
funcionar. De ahí salieron **nueve preguntas** y **más de cincuenta controles automáticos**.

**La idea es simple: que la próxima vez que Codex mire, lo que encuentre sea algo nuevo y no
lo mismo de siempre.** Para eso hay que pasar esas nueve preguntas por las áreas que
programás vos, **antes** de que las pase él.

**La lista está en `docs/ANTES-DE-ENTREGAR.md`. Leela entera antes de empezar.**

## Qué áreas te tocan

Todo lo que es tuyo, en este orden (de lo que más se ve a lo que menos):

1. **Entretenimiento**: fotocabina, espejo IA, plataforma 360, buzón de recuerdos, pantalla
   gigante, cápsula del tiempo.
2. **Pantallas del invitado**: invitación digital, confirmación de asistencia, muro, álbum,
   mesas.
3. **Portal del cliente**.
4. **Impresos y descargas**: tira de fotos, PDF de la invitación, álbum.
5. **Herramientas internas de operación**: estaciones, control de entrada, tablero de la
   noche.

## Dónde mirar primero, que es donde aparecieron los defectos hasta ahora

- **La pregunta 9** (termina a medias y dice que terminó): todo lo que recorre una lista
  —publicar varias fotos, mandar varios avisos, imprimir una tanda, subir lo que quedó sin
  señal—. Si uno falla y el resto sigue, **el resultado no puede ser "listo"**.
- **La pregunta 7** (qué pasa cuando falla y qué pasa si son dos a la vez): dos invitados
  usando la misma estación, dos operadores tocando el mismo botón, una respuesta que vuelve
  tarde. Es la familia del defecto que ya te devolví en la orden 48.
- **La pregunta 3** (necesita algo que no está): una estación sin cámara, sin permiso, sin
  impresora o sin señal. ¿Avisa claro, o hace como si nada?

## Cómo se entrega

- **Una sola propuesta** con todos los arreglos.
- **Cada arreglo lleva su prueba**, y la prueba mira el resultado, no la forma del código.
- Si algo que encontrás **no es tuyo** —toca plata, cobros, comida o permisos—, **no lo
  arregles**: anotalo en la propuesta con archivo y línea y lo tomo yo.
- Si un área te da limpia, **decilo en una línea**: "entretenimiento, nueve preguntas, sin
  hallazgos". Eso vale tanto como un arreglo, y evita que se revise de nuevo al pedo.

## Qué NO hacer

- **No auditar por auditar fuera de tus áreas.** No es una revisión general de la app.
- **No reportar cosas que funcionan y se ven bien.** Si no está roto y el dueño no lo pidió,
  no existe.
- **No tocar textos que ve el cliente, precios, descuentos ni el reloj del simulador**: son
  decisiones comerciales del dueño.

```comprobar
archivo: docs/ANTES-DE-ENTREGAR.md
```
