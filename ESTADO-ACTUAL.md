# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 20 de agosto de 2026.
**Estado de la app:** sana. Acentos limpios, tipos en cero, 1888 pruebas, compila.
**Propuestas abiertas:** ninguna.
**Orden vigente:** `docs/ordenes/ahora.md` — quedan los bloques 7 y 8.

## Lo más importante: la app se audita sola

Los hallazgos reales **no salieron de leer código: salieron de contar**. Los
ayudantes opinando dieron 70% de falsas alarmas; las cuentas mecánicas, 100% de
aciertos. Quedaron como cuatro pruebas que corren solas:

1. **Un valor de ejemplo no puede tapar el dato real.** Los impresos de mesa salían
   con "La Agasajada" y "01/01/2025", y la carta de tragos de una boda decía
   "Mis XV": el ejemplo ocupaba el lugar y el código que ponía el dato real
   preguntaba "¿está vacío?". Cuatro casos.
2. **Ninguna pantalla del evento sin puerta.** Aparecieron cinco terminadas y sin
   forma de llegar.
3. **Ninguna función de servidor abierta a internet.** Encontró que cambiar la fecha
   de una fiesta no pedía cuenta.
4. **Nada inventado en pantallas públicas.** Encontró seis fotos traídas al azar de
   internet.

**Si una de esas cuatro falla, la solución NO es aflojar el control.**

## Cómo está la seguridad, con números

**De las 247 funciones abiertas quedan 84.** El 20 de agosto se cerraron las demás.
Al hacerlo aparecieron fugas de verdad, todas tapadas:

- El **permiso para publicar en el Facebook y el Instagram de AK** viajaba dentro de
  la lista de redes que piden la invitación, el muro en vivo y la página del evento.
  Quedaba a la vista en el celular de cada invitado de cada fiesta.
- La **lista completa de fiestas** se podía pedir sin cuenta, con el cliente, su
  teléfono, lo que pagó y sus invitados.
- La **página de Video de Vida** listaba las próximas fiestas a cualquiera. Se cerró
  sólo el índice: la subida de fotos del cliente no se tocó.
- En el simulador y la presentación salían **la receta de cada plato, el margen de
  ganancia, el costo y el proveedor de cada servicio, el contacto del gerente de cada
  salón, el sueldo de cada puesto y la cédula de cada empleado**.
- El **asistente** se podía llamar de costado y gastar la inteligencia artificial.

**Lo que hay que recordar de esto:** cerrar muchas puertas de golpe rompe por rebote
las funciones públicas que llamaban a otras del mismo archivo. Se agarró comparando
la portada compilada contra la versión principal: había pasado de armarse una vez a
armarse en cada visita. **Si una pantalla pública cambia de "armada una vez" a
"armada en cada visita", casi seguro le metieron un control de sesión sin querer.**

## Lo que quedó pedido a Gemini

**Bloque 7:** quedan 84 funciones por revisar (eran 247). **Bloque 8:** el formato
del impreso. Los bloques 1 a 6 ya se entregaron y fusionaron.

## Datos del dueño que NO hay que volver a preguntar

- **La ficha de Google está verificada**, el **enlace de reseñas es el correcto**
  (`https://g.page/r/CUagrfscj_5yEAE/review`) y el **enlace de la ficha también**
  (`https://share.google/isy4SniannZd1Fdv5`). Ya no se le pide que los confirme.
  Que el panel muestre el puntaje necesita además acceso a los datos de Google
  Business Profile; hasta entonces queda sin dato y el aviso apagado.
- **El impreso es 10x15.** La **fotocabina imprime TRES fotos**; el **espejo mágico
  y el 360 con IA, UNA sola**. La **barra NO imprime**.
- **El video de vida no lo toca la app.** El cliente sube las fotos antes de la
  fiesta y el dueño edita el video por fuera. **No se modifica esa subida.**
- Cada estación tiene su configuración propia en Fiestas → Entretenimiento.
- El simulador pide el contacto **antes** del precio, a propósito.
- Los testimonios de las páginas de venta **son reales**.
- No tiene local físico: trabaja en el salón que lo contrate.

## Lo que le queda al dueño

Pedir una reseña por fiesta, a todos por igual y sin premio, y darse de alta en los
directorios gratis. Nada más.

## Lo que espera una credencial

Google Workspace, la búsqueda de canciones de Spotify, y el puntaje de Google.

## Dos métodos que valen para la próxima

1. **Buscá la FUNCIÓN, no el archivo.** Tres veces se declaró que faltaba algo que
   existía con otro nombre.
2. **Contá.** Desde cuántos lugares se enlaza cada pantalla, o qué valor por defecto
   tapa a cuál. Encuentra lo que leer código no ve.
