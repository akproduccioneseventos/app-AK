# Estado actual - 13/10/2026 (Claude)

Rama `claude/app-debug-stabilize-m70e6z`, igual a main (655de9fe6, PR 1291 fusionada).
Puerta `publicar?` completa en verde (todas las pruebas de navegador) sobre bc71c72d5.

## Qué entró en la 1291
- PR 1288 de Codex (React 19, Next 15.5) y las órdenes 151 a 159.
- Barrido de permisos (personal y operador fuera de plata), barrido de plata (doble toque,
  dos personas a la vez, saldos con ajuste), barrido de errores viejos (hora de Uruguay,
  guardados de la fiesta con turno, enlaces que perdían la fiesta, "copiado" sin esperar).
- Preguntas 49-57 de COMO-AUDITAR y 41-45 de ANTES-DE-ENTREGAR.
- Alertas: los textos del aviso al cliente viven en `textos-avisos-al-cliente.ts` (el otro
  archivo arrastra código de servidor y rompía la compilación).
- La prueba de navegador del mantenimiento ahora mira lo que manda la pantalla (error 37).

## Esperando decisión del dueño
- Misiones de fotos y trivia: están a medias y prometen puntos. ¿Terminarlas o sacar la promesa?
- Votos: tope de 30 por minuto por red y encuesta; en el wifi del salón puede frenar invitados.

## Límites aceptados
- El candado de crear fiesta desde presupuesto cuida un solo servidor.
- Regalos: uno agregado a la vez desde otra pantalla puede perderse.
