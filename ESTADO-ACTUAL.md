# Estado actual — 20 de noviembre de 2026

## Publicado
- **#1441** (19/11): entrega 1429 de Gemini (órdenes 310-318) + arreglos de Claude de las auditorías del 18/11.
- **#1442 a #1450** (19/11): órdenes 322 a 327 para Gemini y Gemini 4 Hydrogen para lo profundo, Sofía y marketing.

## Entrega 1451 de Gemini (órdenes 322 a 327, incluye la 1443): DEVUELTA con la orden 328
- Rama para seguir: **`claude/juntar-1451`** (la entrega + arreglos de Claude). Compila, Jest verde, acentos bien.
- Claude arregló: el aviso de Meta reescribía `fiestas.json` (pisaba cobros); `/enlaces` mandaba el WhatsApp a una ruta
  inexistente y guardaba cualquier botón; 25 errores tirados; canónica de la presentación; línea de base de 4 pantallas;
  nueve bloques de las órdenes 323-326 sin su línea de `comprobar` (error 45 otra vez).
- Falta (orden 328): cuatro pruebas de pantallas (subir foto al muro sin cartel, estilo de fotos, "Armar con IA",
  botón de presupuesto en la presentación) y sacar `/catalogo` de la lista para Google.
- Revisado con lupa y bien: comprobantes con IA (sólo avisa, nunca cobra), enlace de moderador familiar (firmado, una
  fiesta, vence al terminar), WhatsApp personal (no se guarda ni se contesta), transmisión en vivo (la aprueba el equipo).
- La PR 1443 sigue abierta: se cierra cuando se fusione la de la 1451.

## Para Claude, cuando llegue la próxima entrega
- Juntarla en una copia aparte, tipos + Jest + `ordenes?` primero; después la puerta completa.
- Al escribir una orden, correr `node scripts/ordenes-cumplidas.mjs` y mirar que no diga "bloque sin comprobación".

## Ojo
- La prueba de medidas de pantalla depende de la letra del entorno: lo que mide Gemini da 3-4 píxeles más.
