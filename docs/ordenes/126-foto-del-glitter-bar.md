# Orden 126 — Foto del glitter bar, de internet (para Gemini)

**7 de octubre de 2026.** Una sola propuesta. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

## Por qué

La foto `public/media/catalogo-servicios/glitter-bar-01.jpeg` es un toro mecánico y se retiró
(auditoría 74, PR 1261). No hay foto real del glitter bar. **Decisión del dueño (7/10/2026): cuando
falte una foto, se pone una de internet, sin preguntarle.** Desde el entorno de Claude no se puede
bajar: los bancos de imágenes están bloqueados. Desde la máquina del dueño sí.

## Qué hacer

1. Bajar **una** foto de un glitter bar de verdad (mesa o puesto de brillos y maquillaje de
   fantasía, o alguien poniéndose brillos en la cara), **sólo** de Unsplash o Pexels (su licencia
   deja usarla en una web comercial sin pedir permiso). Nada de Google Imágenes ni de otras
   empresas de eventos. Horizontal o cuadrada, al menos 1000 px de ancho, menos de 400 KB.
2. Guardarla como `public/media/catalogo-servicios/glitter-bar-internet-01.jpg`. **No** reusar el
   nombre `glitter-bar-01.jpeg`: ese queda bloqueado en `FOTOS_RETIRADAS` de `src/app/page.tsx`.
3. Anotar de dónde salió en `public/media/catalogo-servicios/CREDITOS.md` (crear si no existe):
   archivo, enlace a la foto original, autor y licencia.
4. **Galería:** agregar el registro en `src/data/galeria-publica.json`, en el lugar donde estaba el
   viejo (después de `orden: 13`), con `"id": "ak-serv-glitter-bar-internet-01"`,
   `"titulo": "Glitter bar"`, `"categoria": "Entretenimiento"`, `"servicio": "Entretenimiento"`,
   `"orden": 14`, `"destacada": false`, y en `descripcion` que diga que es una foto ilustrativa.
   No reformatear el archivo: agregar sólo esas líneas, con la misma sangría.
5. **Presentación LED:** en `src/app/presentacion-led/slides/categoria-servicios-slide.tsx`,
   `getFallbackServicePhoto` (~línea 27), los dos `return null` de glitter/maquillaje pasan a
   devolver `/media/catalogo-servicios/glitter-bar-internet-01.jpg`.

## Qué NO tocar

- La categoría: `classifyGalleryCategories` ya manda glitter a Eventos. No cambiarlo.
- `FOTOS_RETIRADAS` en `src/app/page.tsx`: queda como está.
- Ninguna otra foto de la galería.

## La prueba

En `src/__tests__/auditoria-74-categorias-y-contacto.test.ts`, el bloque GAL74-MEDIA: sumar que
`galeria-publica.json` tiene `glitter-bar-internet-01.jpg`, que ese archivo existe en `public/` y
pesa más de 20 KB (una imagen de verdad, no un archivo vacío), y que `CREDITOS.md` lo nombra con
su enlace. Las comprobaciones que ya están (que no vuelva `glitter-bar-01.jpeg`) se dejan.

```comprobar
archivo: public/media/catalogo-servicios/glitter-bar-internet-01.jpg
archivo: public/media/catalogo-servicios/CREDITOS.md
usa: glitter-bar-internet-01.jpg en src/data/galeria-publica.json
usa: glitter-bar-internet-01.jpg en src/app/presentacion-led/slides/categoria-servicios-slide.tsx
prueba: src/__tests__/auditoria-74-categorias-y-contacto.test.ts
```
