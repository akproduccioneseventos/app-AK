# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 21 de septiembre de 2026. La tanda de septiembre **ya se fusionó**
(propuesta 1211, con la puerta completa en verde sobre ese mismo commit). Rama actual:
`fix/traspaso-21-septiembre`, sólo con esta hoja.

## Lo que entró

- **No poder entrar a la app.** Una lectura colgada de la base tumbaba la pantalla entera:
  el visitante veía el error del servidor, no una pantalla. Ahora corta a los ocho segundos
  y usa el respaldo. **El plazo es uno para toda la lectura**, no uno por intento.
- **Sólo para leer, nunca para guardar**, y es a propósito: un guardado cortado por tiempo
  puede haber quedado hecho, y con un cobro sería cobrarle dos veces al cliente.
- **La pantalla de ingreso se contradecía**: con el acceso pausado por intentos fallidos,
  el cartel decía "tu clave está mal, recuperala". Ahora avisa la pausa y ofrece Google.
- **Una clave le cambiaba la clave a los demás administradores.** Sacado.
- **Plata:** preparación al 100% debiendo, y "Total cobrado" del personal sumando pendientes.
- **Comida:** gramos sumados como kilos.
- **De Gemini:** salón en 3D del cliente, armado automático y asistente manos libres.

## Lo único que espera decisión del dueño

- **Subir la memoria del servidor de 512 a 1024.** Es el último arreglo de la caída en
  producción que queda sin aplicar, y **aumenta la factura mensual de Firebase**. Por eso
  no se tocó: está en la propuesta 1207, que además ya choca con el resto.
- Si dice que sí: alcanza con cambiar `memoryMiB` en `apphosting.yaml`. Lo demás de esa
  propuesta ya está hecho o rehecho mejor.

## Lo que está esperando a Gemini

Órdenes **74** (prueba del secretario), **75** y **77** (el 3D en el portal con clave), más
las devoluciones que ya están escritas en `docs/ordenes/`.

## Trampas que no se repiten

- **La sesión del equipo son dos mitades**: cookie + marca en el navegador (`ponerSesionDelEquipo`).
- **No se sube lo que escribe la corrida**: `npm run limpiar:corrida` (ya conoce marketing y activos fijos).
- **No se toca código mientras corre la puerta**: la tira abajo y no deja subir.
