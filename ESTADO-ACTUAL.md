# Acá quedé

**26 de septiembre de 2026.** Codex contrasto main `63dace0` (PR 1230/1231 fusionadas).
Claude registro puerta verde; eso no cubre los dos limites reproducidos abajo.

## Lo último que entró

- **1231, orden 90 (Gemini):** fotocabina, 360, Bogue, espejo mágico, buzón y Video de Vida dicen
  dónde quedó la foto de verdad. Claude arregló al verificar que la 360 podía quedar trabada en
  "procesando".

- **1230, devolución 89 (Codex), los seis hallazgos:** la cabina con IA dice dónde quedó la foto de verdad, guarda la
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

## Pendiente comprobado por Codex

- Orden 91: la original espera al servidor antes del respaldo; con IA activa por mas de
  tres minutos, la cola puede subir original y luego resultado. Gemini corrige, Claude valida.
- Evidencia: `docs/evidencias/1231-contraste-resultados.json` (6 pasan, 2 fallan).
  Sondas aisladas, no navegador. Los cuatro destinos del aviso final SI pasan.
- Rama de informe: `codex/contraste-1230-1231`. Sin cambios de app ni PR documental separada.
  GitHub no tenia PR abiertas al consultar; recontrastar cualquier tanda nueva antes de tocar.

## Limites

- No se repitio build ni E2E completo; no se certifica despliegue ni toda la app.
- Falta ensayo fisico: `docs/ENSAYO-EN-EL-SALON.md`.
- Antes de emitir otra orden, leer el registro y contrastar su SHA; no rehacer lo ya corregido.
