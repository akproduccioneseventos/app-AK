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

De 247 funciones sin revisar una por una: **179 sólo leen**, **66 escriben pero
pasan por una función que sí pide permiso**, y **dos escribían directo** (ya
revisadas). **Del lado de hacer daño no queda nada abierto**; lo pendiente es del
lado de mirar, y está en el bloque 7.

## Lo que quedó pedido a Gemini

**Bloque 7:** revisar las 179 funciones de leer. **Bloque 8:** el formato del
impreso. Los bloques 1 a 6 ya se entregaron y fusionaron.

## Datos del dueño que NO hay que volver a preguntar

- **La ficha de Google está verificada** y el **enlace de reseñas es el correcto**
  (`https://g.page/r/CUagrfscj_5yEAE/review`). Ya no se le pide que los confirme.
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
