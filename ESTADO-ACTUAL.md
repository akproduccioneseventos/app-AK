# Acá quedé

**26 de septiembre de 2026.** Propuestas 1224 a 1228 fusionadas, con la puerta completa en verde.

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

Nada.

## Pendiente, y es mío

- En la rama `claude/ponte-al-dia-qtrho3` hay un arreglo sólo de pruebas, sin fusionar: la prueba
  del ingreso fallaba con la máquina cargada. Va con la próxima tanda.

## Lo que ningún control cubre

Falta **un ensayo real**: `docs/ENSAYO-EN-EL-SALON.md`.

## Trampas

- **Con la máquina cargada fallan pruebas al azar** (ingreso, estaciones, barra) y pasan solas
  con `npm run otravez`. Antes de tocar código por una falla del navegador, repetirla sola.
- La puerta se espera en primer plano; el contenedor se reinicia si la sesión queda quieta.
- Apagar servidores con `pgrep -x next-server | xargs -r kill` (error 20).
- Antes de escribir una orden por un hallazgo, buscar la ruta en `docs/ordenes/` (error 23).
