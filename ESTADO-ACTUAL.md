# Estado actual — 20 de noviembre de 2026

## Publicado
- **#1441** (19/11): entrega 1429 de Gemini (órdenes 310-318) + arreglos de Claude de las auditorías del 18/11.
- **#1442 a #1452**: órdenes 322 a 328 y Gemini 4 Hydrogen.
- **SIN PUBLICAR: entrega 1451 + parte de la 328 hecha por Claude** (siguen cuatro pruebas, orden 328), en la rama
  `claude/juntar-1451`: de 382 a unas 185 pantallas, invitación en tres pasos, IA en muro/álbum/comprobantes, CRM con todas
  las redes y el asistente, centro de redes que contesta solo, `/enlaces`.
- Claude arregló al revisar: el aviso de Meta reescribía `fiestas.json`; `/enlaces` llevaba el WhatsApp a una ruta que no
  existe; 25 errores tirados; el muro rechazaba fotos por nitidez sin que nadie lo pidiera.
- Las PR 1443 y 1451 se cierran (quedaron adentro de la publicada).

## Para Gemini
- Nada pendiente. Próxima orden, cuando el dueño pida.

## Para Claude, cuando llegue la próxima entrega
- Juntarla en una copia aparte, tipos + Jest + `ordenes?` primero; después la puerta completa.
- Al escribir una orden, correr `node scripts/ordenes-cumplidas.mjs` y mirar que no diga "bloque sin comprobación".

## Ojo
- La prueba de medidas de pantalla depende de la letra del entorno: lo que mide Gemini da 3-4 píxeles más.
- `/catalogo` desvía a `/presentacion-led` y sigue en la lista para Google; cambiarlo rompe cinco controles (descartado).
