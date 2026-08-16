# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 16 de agosto de 2026, cierre.
**Rama:** `claude/repo-work-guidelines-l4u1tf`.
**Estado:** compila, 1668 pruebas en verde, sin acentos rotos.
**Propuestas abiertas:** ninguna. **Orden vigente:** `docs/ordenes/ahora.md`.

## Lo que hay que saber para seguir

**La orden vigente tiene catorce bloques en TRES entregas.** No van en una sola
propuesta: la 1 se termina y se entrega antes de empezar la 2.

- **Entrega 1** — trivia y misiones, el secretario que habla, quién llegó, y las
  dos pantallas de la noche que quedaron claras. Casi todo es enchufar cosas ya
  escritas.
- **Entrega 2** — la reunión que se agenda sola desde el simulador (el bloque más
  importante), el aviso de margen, la pregunta de los quince, y que no se pierda
  nada sin internet.
- **Entrega 3** — configurador, videos, termómetro de la fiesta, libro de la
  fiesta, cada uno ve lo suyo, transmisión en vivo.

## Lo que apareció al verificar y evitó trabajo al pedo

- **El secretario que habla está casi hecho.** El multiagente interno ya lee datos
  reales y tiene doce herramientas, y el reconocimiento de voz en castellano
  uruguayo ya está escrito en el grabador de reuniones. Falta el micrófono y que
  hable.
- **La trivia y las misiones secretas están construidas y sin enchufar**, en
  `src/lib/games/` y `src/components/games/`.
- **Las pantallas de la noche YA están casi todas oscuras** a propósito. Sólo
  logística y accesos quedaron claras. Se corrigió la orden: era mucho más chico
  de lo que parecía.
- **La agenda ya crea citas y las sincroniza sola con Google Calendar.** Falta
  sólo definir horarios de atención y la pantalla pública para elegir turno.
- Para el termómetro: los corazones y los emoji **no guardan cuándo** se dieron.
  Sirven fotos, pedidos de barra y canciones, que sí tienen hora.

## Decisiones del dueño en esta tanda

Descartó el **precio variable según la fecha** y **alquilarle la app a otros
salones**. También descartó el "ensayo de la fiesta": el cronograma se llena
después de cerrar, así que no innova nada. Tenía razón.

## Lo próximo

Esperar la entrega 1 de Gemini, verificarla y fusionarla.
