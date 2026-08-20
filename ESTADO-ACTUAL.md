# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 19 de agosto de 2026.
**Estado de la app:** sana. Los controles pasaron: acentos limpios, TypeScript en 0 errores, pruebas unitarias en verde, build de Next.js de producción OK.
**Propuestas abiertas:** PR #1071 y nueva PR para Bloques 5 y 6.
**Orden vigente:** `docs/ordenes/ahora.md` — Bloques 5 (fotos con dueño en estaciones) y 6 (editor de historia y hospedajes) completados. Referencia de videos 360 (ARELI 360 AK).

## CORRECCIÓN IMPORTANTE: los testimonios de las páginas de venta SON REALES

La hoja anterior decía que eran inventados y que no se volvían a poner. **Estaba
mal.** Salieron de comentarios de Facebook que el dueño tenía en su catálogo
impreso. Ya se repusieron los 22, en los seis catálogos.

**No se borran.** Hay una prueba que falla si alguien deja las listas vacías, y el
motivo está anotado en el propio código y en `docs/YA-RESUELTO.md`. Lo único que
les falta es la captura del comentario; la pantalla para subirla ya existe.

## Lo que se cerró hoy

- **La reseña de Google y el panel que trabaja solo** (entrega de Gemini): botón
  de reseña al terminar la encuesta —a todos, sin filtrar—, seguimiento de a
  quién falta pedirle, aviso si el puntaje baja de cuatro estrellas, tablero de
  dieciséis altas en directorios y autogenerador semanal del calendario.
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
