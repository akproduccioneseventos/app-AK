# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión, así que si crece más de 40 líneas deja de servir. Lo histórico va a
`ESTADO-AUDITORIA.md`, que no se lee salvo que haga falta.

Quien cierre una sesión reescribe este archivo. No se acumulan tandas: se pisa.

---

**Última actualización:** 6 de agosto de 2026
**Rama:** todo fusionado en `main`. No hay ramas a medias.

## Cómo se trabaja ahora (acordado con el dueño)

Claude audita y deja la orden escrita en `docs/ordenes/`. Gemini programa y sube
la propuesta. Claude verifica y fusiona. Si viene rota, vuelve a Gemini: no se le
arregla el trabajo. Plata, cobros y permisos los escribe Claude.

## Qué quedó terminado

- **Entorno**: traspaso automático al arrancar, tres ayudantes económicos,
  `/sano`, `/aca-quede`, habilidad `revisar-pr`, detector de acentos rotos.
- **Entretenimiento, arreglos fusionados**: las cuatro estaciones de captura ya no
  dicen "escaneá tu recuerdo" cuando la subida falló; la pantalla gigante y el
  muro avisan si se cortó la conexión; galería y red social distinguen "no hay
  nada" de "no cargó"; la zona digital ya no tiene tarjetas muertas; el tótem no
  muestra un QR que no sirve; el operador se entera si la IA no está disponible.
- **Orden de trabajo** para Gemini en `docs/ordenes/entretenimiento-01.md`.

## Qué quedó a medias

- **Trivia por mesa (tarea 2.2): a medio hacer.** Gemini armó el ranking por mesa,
  pero nada le dice en qué mesa está sentado cada invitado, así que en una fiesta
  real sale siempre vacío. Falta conectarlo con la mesa asignada del invitado.
- **Tareas 2.1 (saludar por nombre en el muro) y 2.3 (álbum en el portal del
  cliente): sin empezar.**
- Dos auditorías quedaron cortadas por límite de sesión: el lado del operador y
  la verificación de que cada estación funcione sola, sin las otras contratadas.

## Lo próximo, si nadie dice otra cosa

Terminar la trivia por mesa, y retomar las dos auditorías que quedaron cortadas.
