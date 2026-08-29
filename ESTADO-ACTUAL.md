# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 29 de agosto de 2026, cierre.
**Estado de la app:** sana. La puerta tiene ocho pasos y pasó entera varias veces.
**Propuestas abiertas:** ninguna.

## Lo que se construyó, y es lo que cambia el método

El dueño lo pidió así: *"quiero algo que repare mi app y que todo lo que se agregue no pase
si no funciona realmente"*. Salieron **tres controles nuevos**, los tres probados
**frenando de verdad**, no sólo pasando:

1. **El control de promesas** — frena código que nadie llama, pantallas sin prueba que mire
   el resultado, y pruebas que sólo confirman que la pantalla se ve.
2. **Las promesas al cliente** — cada frase que la pantalla muestra declara qué archivo la
   cumple. No se puede agregar una sin decir si existe.
3. **El trinquete** — la deuda vieja quedó medida y **sólo puede bajar**.

**Y la puerta se volvió proporcionada:** si el cambio no toca la app, no corre los dos
pasos caros —y **lo dice**, no los marca como aprobados.

## El método de reparación, para no volver a explicarlo

No se repara todo de una. Tres reglas: **el que toca algo lo deja limpio**, **lo nuevo no
puede sumar**, y **el número sólo baja**. La reparación pasa sola con el trabajo normal.

## Lo que espera a Gemini

- **Orden 16** — reparar lo que existe y no se comprobó. Incluye el Video de Vida, que está
  copiado en dos lados.
- **Orden 17** — el híbrido de las ocho estaciones. Arranca por **subir un fondo propio y
  personalizar las plantillas**.
- **Orden 18** — lo que le falta a la web: migas de pan visibles, buscador, enlaces rotos.
- **Orden 15** — sigue devuelta.

## Decisiones tomadas (no volver a preguntar)

- **Cartel de cookies: NO.** Molesta. Va explicado dentro de `/privacidad`.
- **Nada de aparato de privacidad.** Sólo si Google lo exige, una página simple.
- **El color de las estaciones YA se puede cambiar y anda.** No mandarlo a rehacer.

## Falsos positivos verificados (no reportarlos)

- La **cámara lenta** y la **salida LED** de la 360 **existen**.
- **El anti-spam existe**, y está en todas las acciones que usan inteligencia artificial.
- Las **514 pruebas "salteadas"** son la herramienta de sacar fotos, apagada a propósito.
- **Correr las pruebas en paralelo YA SE PROBÓ**: ganaba 9% y daba fallas inventadas. El
  porqué está escrito en `scripts/run-playwright-production.mjs`. **No reintentarlo.**

## Lo que costó el día, y es la lección

Se corrió la verificación completa —45 minutos— muchas más veces de las necesarias,
incluso para cambios de texto. **La puerta ya sabe saltearla sola; el que tiene que
aprender es quien la lanza.** Una sola vez, al final de la tanda.
