# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 19 de agosto de 2026.
**Estado de la app:** sana. Los controles pasaron: acentos limpios, TypeScript en 0 errores, pruebas unitarias en verde, build de Next.js de producción OK.
**Propuestas abiertas:** PR #1071 (Tótem de la barra y Buzón de saludos) y nueva PR (Fotos con dueño en estaciones, Editor de historia y hospedajes, Referencia 360).
**Orden vigente:** `docs/ordenes/ahora.md` — Bloques 1 a 6 completados al 100%. Referencia de videos 360 (ARELI 360 AK).

## Lo que se cerró hoy

- **El tótem de la barra: que el invitado se lleve su foto:**
  - Pantalla completa de éxito "¡Llevate tu recuerdo!" al tomarse foto/video en el tótem (`/evento/barra/[fiestaId]`).
  - Código QR grande con fondo blanco y alto contraste para escanear en la noche del salón con el celular y descargarlo en alta calidad.
  - Texto sugerido para compartir en historias con hashtag e Instagram oficial.
  - Botón "Listo" para volver al inicio enseguida y temporizador automático de inactividad de 20 segundos. **Cero botones de impresión.**
  - Guardado del trago pedido: si el invitado pidió un trago previamente en la sesión, `drinkId` y `drinkName` se adjuntan en la subida.
  - Interruptor de seguir en redes: si `settings.requireSocialFollowForPhotos` está prendido, muestra un paso simple con link al Instagram y botón para confirmar o seguir sin trabar al invitado.

- **El buzón de saludos: fotos y puerta de entrada:**
  - Modo Foto en el Buzón (`/evento/buzon/[fiestaId]`): permite sacarse una selfie con la cámara frontal (con cuenta regresiva de 3s y vista previa antes de enviar) o subir una foto desde la galería, con dedicatoria y opción de cápsula del tiempo.
  - Duración del video en buzón: se mantiene en 15 segundos (el video de la barra dura 8s; no se mezclaron).
  - Puerta en el Portal del Invitado: agregada la herramienta "Buzón de saludos" con ícono de corazón, respetando si el buzón está activado en la fiesta (`buzonConfig.enabled !== false`, `showBuzon !== false` y módulo `buzon`). Si está apagado, no se muestra el botón.
- **Se sacó el filtro de reseñas**, que estaba en tres lugares y mandaba el pedido
  sólo a los que puntuaban 9 o 10.
- **El enlace de reseñas ya no está escrito a mano**: sale del que el dueño carga
  en Ajustes, y si no lo cargó, el bloque no aparece.

- **Los comentarios de las redes** (entrega de Gemini, propuesta 1062): se traen
  de Facebook, Instagram y YouTube, la inteligencia artificial los separa en
  buenos, neutros y quejas, lo agresivo se oculta solo —y se puede volver a
  mostrar con un toque— y lo bueno pasa a testimonio de la web.
- **Tope de gasto**: traer el historial completo revisa cien comentarios por
  corrida. Antes, un solo toque podía gastar el presupuesto de inteligencia
  artificial de todo el mes.
- **Los cinco controles que pedía la orden** y la entrega no traía.
- **Se cerró la propuesta 1057**, que borraba los testimonios.

## Lo que depende del dueño (no lo puede hacer ninguna IA)

1. **Reclamar la ficha de Google** y elegir bien la categoría. Es el 32% del
   posicionamiento local, casi el doble que la web. Ojo: no tiene local físico,
   va como negocio que atiende a domicilio, con la dirección escondida.
2. **Confirmar que el enlace para pedir reseñas es el suyo.** Está puesto en la
   app pero no se pudo comprobar desde acá.
3. **Pedir una reseña por fiesta**, a todos por igual y sin premio.
4. **Darse de alta** en las diez opciones gratis del plan (TuFiesta.com.uy entre
   ellas).

## Decisiones del dueño

Descartó el precio variable por fecha, alquilar la app a otros salones y el
"ensayo de la fiesta". `TriviaAdminPanel` queda sin enchufar a propósito.
No tiene salón propio: trabaja en el salón que lo contrate.
