# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 27 de agosto de 2026, cierre.
**Estado de la app:** **`npm run "publicar?"` en verde, los seis controles**, incluido el de
navegador completo (2559 segundos). Se puede publicar.
**Propuestas abiertas:** ninguna.

## Lo que se cerró hoy

**Las dos entregas de Gemini (órdenes 14 y 15) estaban devueltas y se corrigieron acá.**
El dueño pidió no esperarlo: *"corregí todo vos con tus agentes"*.

- **Lo escrito que no llamaba nadie, ahora está enganchado:** el **GIF animado** en Bogue
  (sale de los mismos cuadros del boomerang, así que el invitado no posa de nuevo), el
  **marco que se arma solo** con el nombre del agasajado y la fecha —**como opción, no como
  el que viene puesto**— y el **resumen de la noche** en el tablero.
- **El tablero de la noche:** no tenía puerta y **mostraba un cero escrito a mano** para
  todas las estaciones. Ahora se entra desde donde el equipo arma el entretenimiento y
  **cuenta las capturas de verdad**, leyéndolas del muro. Si no puede leerlas, **lo dice**.
- **Se sacaron dos cosas, con el motivo escrito en `YA-RESUELTO.md`:** la moderación
  automática duplicada —**el muro ya se modera solo** en la subida, la orden pedía algo que
  ya existía y ese error fue de quien escribió la orden— y el selector de formato, que hacía
  pensar al invitado antes de la foto con gente esperando atrás.

## Los tres controles que mentían, y ya no

1. **El corredor de navegador** decía "todas pasaron" **con cero pruebas corridas**.
2. **El control de acentos** daba verde **con cero archivos revisados** si fallaba al leer
   la lista. Es uno de los seis pasos de la puerta: si miente, la puerta se abre sola.
3. **El recorrido de las 348 pantallas** medía el HTML crudo en vez de la pantalla dibujada
   y reportaba veintipico de pantallas sanas como vacías. Ahora **abre la pantalla de
   verdad** cuando el HTML viene flaco.

**La lección, y pasó tres veces en un día: cuando un control deja de mirar, lo que entra no
se ve.**

## Lo que queda pendiente, y es de Gemini

1. **El bloque de la música** (bloque 14 de la orden 14): sigue **sin entregar**. Que entre
   lo que sea —Spotify, YouTube o texto pegado— y salga una sola lista conectada para el DJ.
2. **Comprobar si Spotify y YouTube están conectadas de verdad.** El panel lo **supone** por
   lo que hay guardado; nunca lo prueba contra el servicio. Sólo él puede hacerlo: corre en
   la máquina del dueño y tiene los accesos.
3. **Abrir `/club-uruguay` con los accesos de producción** y decir qué se ve. Desde el
   contenedor de prueba no se puede distinguir si está vacía de verdad o si es que no hay base.
4. **Siete pantallas de imprimir y de reportes, abiertas sin fiesta elegida, muestran entre
   23 y 166 caracteres**: casi nada. Deberían decir "elegí una fiesta para imprimir". Está
   anotado en `tests/e2e/internal-route-inventory.spec.ts`.

## Decisiones ya tomadas (no volver a preguntar)

- **No se le pide el mail ni el teléfono al invitado** para darle su foto: frena la fila.
- **Cloudflare: no.** **Google Flow: no se conecta.**
- **El agente de publicidad no prende ni crea campañas.** Eso lo activa el dueño.
- **Nada de promesas en la web** ni precios congelados: trabaja con ajuste anual.
- **El reloj del simulador va**, y es para la promoción, no para congelar la tarifa.
