# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 19 de agosto de 2026.
**Estado de la app:** sana. Acentos limpios, tipos en cero, 1882 pruebas, compila.
**Propuestas abiertas:** sólo ésta, de documentación.
**Orden vigente:** `docs/ordenes/ahora.md` — cuatro bloques (5, 6, 7 y 8).

## Lo más importante: la app ahora se audita sola

Los hallazgos reales del día **no salieron de leer código: salieron de contar**. Los
ayudantes opinando dieron 70% de falsas alarmas; las cuentas mecánicas, 100% de
aciertos. Quedaron convertidas en tres pruebas que corren solas:

1. **Un valor de ejemplo no puede tapar el dato real.** Los impresos de mesa salían
   con "La Agasajada" y "01/01/2025" porque el ejemplo ocupaba el lugar y el código
   que ponía el dato real preguntaba "¿está vacío?". Cuatro casos.
2. **Ninguna pantalla del evento sin puerta.** Aparecieron cinco terminadas y sin
   forma de llegar.
3. **Ninguna función de servidor abierta a internet.** Encontró que cambiar la fecha
   de una fiesta no pedía cuenta.

**Si una de esas tres falla, la solución NO es aflojar el control.**

## Cómo está la seguridad, con números

De 247 funciones sin revisar una por una: **179 sólo leen**, **66 escriben pero
pasan por una función que sí pide permiso**, y **dos escribían directo**. Las dos se
revisaron: una es el "cerrar sesión" (borra tu propia cookie) y la otra es la subida
de fotos del video de vida, que **el dueño pidió dejar como estaba**.

**Del lado de hacer daño no queda nada abierto.** Lo pendiente es del lado de mirar.

## Lo que quedó pedido a Gemini

Cuatro bloques: el formato del impreso, el dueño de las fotos de las estaciones, la
pantalla para cargar historia y hoteles, y revisar las funciones de leer.

## Datos del dueño que no hay que volver a preguntar

- **El impreso es 10x15.** La **fotocabina imprime TRES fotos** (una grande arriba y
  dos chicas abajo); el **espejo mágico y el 360 con IA, UNA sola**, mismo tamaño y
  misma personalización. La **barra NO imprime**.
- **El video de vida no lo toca la app.** El cliente sube las fotos antes de la
  fiesta y el dueño edita el video por fuera. **No se modifica esa subida.**
- Cada estación tiene su configuración propia en Fiestas → Entretenimiento.
- El simulador pide el contacto **antes** del precio, a propósito.
- Los testimonios de las páginas de venta **son reales**.
- La boda de ejemplo del editor se queda: es el punto de partida y ya no puede
  llegar publicada.

## Lo que depende del dueño

Reclamar la ficha de Google (no tiene local: va como negocio que atiende a
domicilio), confirmar que el enlace de reseñas es el suyo, pedir una reseña por
fiesta, y darse de alta en los directorios gratis.

## Lo que espera una credencial

Google Workspace, la búsqueda de canciones de Spotify, y el aviso de puntaje de
Google menor a 4 estrellas.
