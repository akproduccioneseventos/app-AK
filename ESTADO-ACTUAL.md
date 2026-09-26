# Acá quedé

**26 de septiembre de 2026.** Propuestas 1224 a 1229 fusionadas, con la puerta completa en verde.

## Lo último que entró

- **Devolución 89 (Codex):** la cabina con IA dice dónde quedó la foto de verdad, guarda la
  original al capturar y cada captura tiene su propio tope de intentos. La respuesta tardía de la
  IA ya no cierra la captura del siguiente, y el operador queda libre al guardar la foto.

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

- **Orden 90:** que las demás estaciones digan dónde quedó la foto de verdad (pregunta 27).

## Pendiente, y es mío

- Nada.


## Lo que ningún control cubre

Falta **un ensayo real**: `docs/ENSAYO-EN-EL-SALON.md`.

## Trampas

- **Con la máquina cargada fallan pruebas al azar** (ingreso, estaciones, barra) y pasan solas
  con `npm run otravez`. Antes de tocar código por una falla del navegador, repetirla sola.
- La puerta se espera en primer plano; el contenedor se reinicia si la sesión queda quieta.
- Apagar servidores con `pgrep -x next-server | xargs -r kill` (error 20).
- Antes de escribir una orden por un hallazgo, buscar la ruta en `docs/ordenes/` (error 23).
