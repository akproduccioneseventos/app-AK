# Estado actual — 10/10/2026 (Claude)

Main en `2aac14e29` (PR 1280). Rama de Claude: `claude/app-debug-stabilize-m70e6z`, igual a main.

## Lo que entró hoy (todo con la puerta en verde)
- PR 1279: auditoría 86 de Codex (IA: tareas a la vez, avisos falsos, voz parada, agente de
  publicidad, intervalos; portal: entregas oficiales; agentes con permiso de administración) +
  barrido: 32 ajustes generales pedían sólo sesión, ahora piden su permiso (pregunta 47).
  También: botones del menú, asistente movible/minimizable, IA que cortaba respuestas,
  pantalla Contabilidad → "Poner al día".
- PR 1280: auditoría 87 de Codex (órdenes 137 y 138): carga del Video de Vida cerrada de
  verdad en el servidor, una foto por recuadro, cancelar del barman visible, cola móvil sin
  espacios vacíos.

## Lo que hace el dueño (no se automatiza)
- Contabilidad → "Poner al día": cobros pasados y copias/pruebas vienen marcados; marcar
  para cancelar Robert Moreira (10/10) y Lorena Ferreira (12/12) y tocar "Aplicar".
  Soraya Texeira NO se toca. Desde el contenedor no hay acceso a la base real.

## Para Codex
- 135, 136, 137 y 138 están programadas: re-probar sólo esos consumidores sobre main 2aac14e29.
- Pendiente afuera: audio real de Gemini en un teléfono.

## Abierto
- PR 1277 (Codex, documental). Su contenido hasta `4d6562ae` ya está en main.
- Hecho: borrar, archivar, cancelar y reactivar una fiesta piden permiso (no sólo sesión).
