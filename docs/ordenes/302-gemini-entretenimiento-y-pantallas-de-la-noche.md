# Orden 302 — Entretenimiento y pantallas de la noche dicen lo que es (13/11/2026)

**Para Gemini.** Va **en la misma propuesta que la 297 a 301** (la 1393). Antes de "terminé": `docs/ANTES-DE-ENTREGAR.md`.
Sale de la auditoría de entretenimientos, pantalla, red social, web del evento, invitados, portero y salón 3D (13/11/2026).

## Lo que NO se toca

- Que la confirmación pública devuelva el QR del invitado (decisión del dueño, 22/09).
- El reloj del simulador, descuentos y textos de venta.
- Las direcciones `/evento/...` (hay QR impresos).

## Barrido en toda la app (Claude, 13/11/2026)

- **Permisos de las pantallas del equipo abiertas por enlace** (`/evento/control-pantalla`, `/evento/moderacion`, `/evento/dj`):
  las pantallas son públicas; lo que protege son las acciones. `markSongPlayed` pide `requireEventPermission(…, PERMISOS.NOCHE)`
  (`src/app/actions/social-interactive.ts` ~357). Falta comprobar lo mismo en `src/app/actions/fiesta/screen-mode.actions.ts`,
  `src/app/actions/games.actions.ts` y las de moderar en `src/app/actions/social-gallery.ts`.
- **Contadores que mezclan demostración:** la fiesta "DEMO AK - XV Martina" entra en los feeds activos (igual que en la 301, bloque 6).
- **Títulos blancos sobre fondo claro:** Tablero de la noche y Social Fiesta Pro.

## Bloque 1 — Las acciones de control, moderación y DJ piden permiso (P1, permisos)

Toda acción que **cambia** algo desde esas tres pantallas (pasar pantalla, juegos, aprobar/ocultar fotos, marcar canción) tiene que
llamar a `requireEventPermission(fiestaId, PERMISOS.NOCHE)` como `markSongPlayed`. **No cambiar** las de lectura que usan los invitados.
Si alguna ya lo tiene, no tocarla. Prueba: sin sesión, cada acción responde rechazo y no guarda.

## Bloque 2 — La red social sabe quién publica (P1)

`/evento/social/[fiestaId]` acepta cualquier nombre. Que la publicación use la credencial del invitado si existe (la misma de
`mi-mesa`) y, sin credencial, marque la publicación como "visitante" en vez de mostrar el nombre escrito como si fuera verificado.
No pedir registro nuevo al invitado.

## Bloque 3 — El tablero de estaciones dice el estado real (P2)

"ESTACIONES ACTIVAS 7/7 · Listas para los invitados" en `/fiestas/[id]/entretenimiento/control` tiene que salir de la misma fuente
que la configuración: "lista" sólo si la estación está prendida y configurada.

## Bloque 4 — Números que dicen de dónde salen (P2)

- Invitados: si no hay confirmados, mostrar la cantidad del presupuesto como **"estimados"**, no "0 de 0".
- "SALDO POR…" en el Centro de Operaciones (`/fiestas/[id]/en-vivo`): debajo, de dónde sale (presupuesto ajustado menos cobrado).
- Conteo por tipo de evento en el tablero de salones: normalizar el tipo ("XV años", "15 años", "quince" → uno) y sin caracteres rotos.
- Feeds: excluir y etiquetar los de demostración.

## Bloque 5 — Web del evento (P2)

- El enlace personalizado arranca con nombre del agasajado + fecha, no con el número interno.
- Al abrir el constructor no genera solo: muestra "sin armar" y un botón.

## Bloque 6 — Tótem sin número (P2)

`/evento/totem/[fiestaId]` da la 404: que muestre la lista de tótems de la fiesta, o abra el único si hay uno.

## Bloque 7 — Textos y vista (P3)

- Buzón de recuerdos: el nombre de la fiesta sale dos veces; errores visibles antes de que pasen; voseo y tildes.
- "Experiencia visual de salones": reescribir como descripción para el usuario ("Cargá video, recorrido 360 o modelo 3D del salón").
- Títulos blancos sobre fondo claro en Tablero de la noche y Social Fiesta Pro: usar las variables del tema.
- El botón del asistente no tapa tarjetas: abajo a la derecha y plegado.

## Pruebas

Jest de permisos del bloque 1 (sin sesión y con personal sin permiso de noche); navegador para los bloques 3, 6 y el texto "estimados".

```comprobar
usa: requireEventPermission en src/app/actions/fiesta/screen-mode.actions.ts
usa: requireEventPermission en src/app/actions/games.actions.ts
archivo: src/app/evento/totem/[fiestaId]/page.tsx
prueba: src/__tests__/las-pantallas-de-la-noche-piden-permiso.test.ts
```
