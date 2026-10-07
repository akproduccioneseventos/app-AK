# Al día: fusionadas la foto de la Mesa bufet (1265) y la entrega de Instagram (1263)

**7 de octubre de 2026.** Main `09051f8` (PR 1263). Rama de traspaso `claude/app-debug-stabilize-m70e6z`.

## Qué entró hoy

- **1262:** WhatsApp con un solo número oficial (`src/lib/public-contact.ts`); control
  `ningun-numero-inventado` frena cualquier número escrito a mano.
- **1264 y 1265:** la Mesa bufet sin foto ajena en ningún simulador (`fotoDelPlatoParaMostrar`);
  control `la-foto-es-del-plato` recorre toda la app. Error 35 en `CLAUDE.md`.
- **1263 (Gemini, orden 122) con arreglos de Claude:** galería e Instagram guardan sin pisarse
  (`mutarDocumento`). Lo que encontró Codex: lo anotado adentro de una transacción que la base
  repite quedaba del intento descartado (reels contados dos veces; galería, `updateDataItem` y
  `deleteDataItem` decían "hecho" sin guardar). Pregunta 40 del método, 33 de antes de entregar.

## Sigue

- Codex vuelve a mirar Instagram/galería y web/simulador sobre `09051f8`.
- Codex usa el entorno aislado (`npm run entorno:pruebas`, en su máquina) con los tres roles.
- Pendiente del dueño: foto real de la Mesa bufet y del glitter bar; los nombres de las picadas
  en Canva están cruzados.
- Gemini: 112 B.1 (AUD01).

## Cómo se fusiona (error 30)

- Sin `expectedHeadSha` igual al de `.ak-puerta-verde.json`, no se fusiona.
- No cambiar de rama ni `commit -a` mientras corre la puerta.
