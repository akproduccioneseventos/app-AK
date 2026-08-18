# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 18 de agosto de 2026.
**Estado de la app:** sana. Compila (`next build`), types en cero (`tsc --noEmit`), pruebas unitarias en verde, sin acentos rotos.
**Propuestas abiertas:**
- `feat/comentarios-de-las-redes` (PR lista para revisión del dueño).
- `feat/resenas-y-panel-automatico` (PR lista para revisión del dueño).
**Orden completada:** `docs/ordenes/ahora.md` — la reseña de Google y el panel que trabaja solo.

## CORRECCIÓN IMPORTANTE: los testimonios de las páginas de venta SON REALES

Salieron de comentarios de Facebook que el dueño tenía en su catálogo impreso. Se conservan los 22 en los seis catálogos. La pantalla para adjuntar captura de pantalla real a testimonios ya existe en Ajustes -> Feedback.

## Lo que se cerró en esta tanda

- **La reseña de Google al final de la encuesta:** Botón directo a Google Reviews para todos los clientes que terminan la encuesta en `/feedback/[fiestaId]`. Anti-gatekeeping estricto: los clientes con calificación baja ven primero un mensaje empático de soporte pero el botón público sigue visible.
- **Filtro de WhatsApp eliminado:** Se eliminó el filtro `< 9` de `enviarPedidoDeResena`, `saveFeedback` y `requestGoogleReviewManual` en `src/app/actions/feedback.ts` para no incurrir en gatekeeping sancionable por Google.
- **Seguimiento de reseñas de los últimos 30 días:** Lista de eventos en la solapa Ficha de Google con estado (pedida, pendiente, completada) y botón de WhatsApp con mensaje personalizado en criollo.
- **Alerta de puntaje de Google menor a 4.0:** Banner superior en Presencia Digital que avisa si la nota baja de 4 estrellas y lleva directo al seguimiento de reseñas del mes.
- **Tablero de 16 altas en directorios:** Solapa con los 16 directorios oficiales de Salto y Uruguay (10 gratis y 6 de cuota/pago), barra de progreso y checkboxes persistidos.
- **Autogenerador semanal de calendario:** Botón para armar borradores de la semana con fotos de fiestas recientes o preguntas frecuentes educativas en semanas tranquilas, respetando presupuesto de IA.

## Lo que depende del dueño (no lo puede hacer ninguna IA)

1. **Reclamar la ficha de Google** y elegir bien la categoría. Va como negocio que atiende a domicilio, con dirección protegida.
2. **Confirmar que el enlace para pedir reseñas es el suyo.** Está configurado `https://g.page/r/CUagrfscj_5yEAE/review`.
3. **Pedir una reseña por fiesta**, a todos por igual y sin sorteos.
4. **Darse de alta** en las opciones de directorios del tablero.

## Decisiones del dueño

Descartó el precio variable por fecha, alquilar la app a otros salones y el "ensayo de la fiesta". `TriviaAdminPanel` queda sin enchufar a propósito. No tiene salón propio: trabaja en el salón que lo contrate.
