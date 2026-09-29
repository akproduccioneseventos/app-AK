# Auditoría — mejor horario y reciclado de publicaciones, PR #1240

Fecha: 2026-09-28
HEAD candidato: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Base GitHub: `main` en `b52b1f013d21bd2831b918fb04649636ce24033a`
Destino: PR abierta #1240; no considerar desplegado.
Clasificación: requisitos de la orden 95 no conectados a una pantalla/acción de usuario en este HEAD. Inspección estática; Codex no corrió las pruebas.

## Hallazgo P2: helpers y pruebas están, pero el dueño no puede usar la función en la app

La orden 95 exige mostrar “Tu mejor horario” y botón que complete la programación en Empresa → Redes sociales; también lista “Las que mejor anduvieron” con botón “Volver a publicar”.

En el HEAD:
- Se agregan `mejorHorario`, `obtenerSugerenciasReciclado` y `reciclarPublicacion` en `src/lib/presencia-digital/mejor-horario.ts` y `src/lib/presencia-digital/publicador.ts`.
- La PR cambia sólo esas bibliotecas, sus tests y el tipo `SocialPost` en este bloque. No cambia pantalla de presencia/redes ni Server Action.
- Verifiqué la pantalla `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx` y `src/app/actions/presencia-digital.ts` en el mismo HEAD: ninguna referencia/importa esos tres símbolos.
- Los tests nuevos llaman las funciones de biblioteca directamente; prueban cálculo/copia, no que aparezca un control, se guarde mediante un flujo accesible ni que el usuario pueda programarlo.

Conclusión: hay código de cálculo y helper, pero no se demuestra la funcionalidad de extremo a extremo pedida por la orden. No decir “implementado” sólo por las pruebas unitarias.

## Pruebas y límites

Las pruebas nuevas verifican el umbral de 8 publicaciones y un resultado jueves/noche, más tres casos de reciclado (post elegible, copia con campos, no sugerir otra vez). Codex no ejecutó dichas pruebas. No se verificó la ejecución del cron externo ni publicación real en redes.

## Instrucción para Gemini, tras cerrar la auditoría

Conectar ambos resultados al flujo real Empresa → Redes sociales: selector/acción del mejor horario, estado vacío cuando faltan datos, sección y botón de reciclado, Server Action con permiso de administrador, y confirmación de programación. Añadir E2E o integración que navegue el control, programe una copia y verifique el registro guardado; conservar el cron/controles actuales. Claude compila e informa SHA, salida y entorno. No publicar contenido real ni fusionar automáticamente.
