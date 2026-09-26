# Acá quedé

**26 de septiembre de 2026.** Main b046863 incluye 1229. Claude registro puerta verde para
entregas anteriores; Codex encontro residuales en 89. No se declara listo para publicar.

## Lo último que entró
- **1228, orden 89 recortada:**
  - la IA de la fotocabina ya no frena la fila;
  - la barra muestra "Agotado";
  - Claude agregó que la foto con IA que no se pudo subir vaya a la cola del equipo.
- **1227, orden 88:**
  - "hoy" en hora de Uruguay;
  - tres acciones del secretario;
  - importar invitados desde el celular.
- **1226:** la fiesta no viaja entera a quien no es del equipo; el Video de Vida avisa lo que
  falta; `npm run ordenes?` ve los bloques sin comprobar.

## Espera a Gemini
- Devolucion de Codex: `docs/ordenes/DEVOLUCION-89-no-anunciar-fotos-que-no-estan.md`.
- Tres fallos medidos: falso exito de subida, original sin respaldo previo e identidad
  compartida entre capturas IA. Corregir con Claude (datos/permisos) y fortalecer E2E.
- Rama documental `codex/devolucion-89-cierre-verificado`; no fusionar docs solos.
- No reabrir los doce bloques: se respeta orden 89 recortada por el dueno.

## Pendiente, y es mío
- El arreglo de la prueba de ingreso ya entro con PR 1229; no sigue pendiente.
- Claude compila la correccion conjunta; propietario fusiona. Codex no programo app.

## Lo que ningún control cubre
Falta **un ensayo real**: `docs/ENSAYO-EN-EL-SALON.md`.
Codex ejecuto sonda de callbacks con I/O simulado, no E2E. App Hosting estaba en curso
al consultar; confirmar despliegue separado de pruebas. No exigir tarjeta por esta revision.

## Trampas

- **Con la máquina cargada fallan pruebas al azar** (ingreso, estaciones, barra) y pasan solas
  con `npm run otravez`. Antes de tocar código por una falla del navegador, repetirla sola.
- La puerta se espera en primer plano; el contenedor se reinicia si la sesión queda quieta.
- Apagar servidores con `pgrep -x next-server | xargs -r kill` (error 20).
- Antes de escribir una orden por un hallazgo, buscar la ruta en `docs/ordenes/` (error 23).
