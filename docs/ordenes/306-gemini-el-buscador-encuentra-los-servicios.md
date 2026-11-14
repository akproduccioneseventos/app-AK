# Orden 306 — El buscador encuentra los servicios (14/11/2026)

**Para Gemini.** Va **en la misma propuesta que la 297 a 305** (la 1393). Antes de "terminé": `docs/ANTES-DE-ENTREGAR.md`.
Sale de la guía de 19 puntos del auditor (13/11/2026). El resto de esa guía es carga de datos del dueño o ya está en órdenes anteriores.

## Lo que NO se toca

- Los textos de las páginas de venta y el blog.

## Barrido en toda la app (Claude, 14/11/2026)

- `/buscar` (`src/app/buscar/page.tsx`) sugiere "fotocabina" en el texto de ayuda, y `buscarEnElSitio` en
  `src/lib/buscador/buscar-sitio.ts` sólo recorre `blogPosts` (`src/data/blog-posts`) y `catalogList` (`src/data/event-catalogs`).
  Los servicios de tecnología (`/tecnologia`) y las páginas de venta (`/bodas`, `/cumpleanos`, `/quinceaneras`) no están en el índice.
- Otros buscadores: no hay otro buscador público.

## Bloque 1 — Los servicios entran al índice

Sumar a `buscarEnElSitio` los servicios de la vidriera de tecnología y las tres páginas de venta, con su enlace. Todo lo que el
texto de ayuda sugiere ("15 años", "bodas", "fotocabina", "catering") tiene que dar al menos un resultado.

## Pruebas

```comprobar
archivo: src/lib/buscador/buscar-sitio.ts
prueba: src/__tests__/el-buscador-encuentra-lo-que-sugiere.test.ts
```
