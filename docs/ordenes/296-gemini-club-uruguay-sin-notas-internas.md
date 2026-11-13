# Orden 296 — Club Uruguay: el cliente no ve notas internas (13/11/2026)

**Para Gemini.** Va **en la misma entrega que las 284 a 295** (tu rama `gemini/ordenes-282-283-entrega-completa`).
**Una sola propuesta, sin fusionar.** Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 106.

Sale de una revisión comercial de la página `/club-uruguay` (13/11/2026). **Acá van sólo los textos que son notas
internas a la vista del cliente o datos viejos.** Lo demás que propone la revisión (otra foto de apertura, reescribir la
historia, cambiar los títulos) **no se toca**: es una decisión del dueño y está pendiente.

## Lo que NO se toca

- **El 50% de bonificación del Club Uruguay**: es decisión del dueño (el tachado es siempre el doble del precio). Se
  cambia sólo la etiqueta de arriba, no el número ni la condición.
- La foto de apertura, el orden de la galería, los botones y el reloj del simulador.
- Los títulos "150 aniversario…", "Diferenciamos con honestidad…" y la frase de la consulta por WhatsApp: quedan como
  están hasta que el dueño decida.

## Barrido en toda la app (Claude, 13/11/2026)

- **Descripción interna en las fotos:** `"Foto cargada desde el módulo maestro de salones."` se muestra debajo de cada
  foto y en el visor (`ClubUruguayInteractive.tsx` ~345 y ~426). Está en `src/app/club-uruguay/page.tsx` ~86 **y** en la
  portada, `src/app/page.tsx` ~359.
- **Etiquetas de trabajo:** "Condición comercial del dueño" (`club-uruguay/page.tsx` ~416), "Sin cuentas regresivas
  inventadas ni modificaciones en el simulador" (~422), "(informadas, no habilitación legal certificada)" (~174),
  "Por confirmar:" (`ClubUruguayInteractive.tsx` ~217 y ~267).
- **Dato viejo:** "conmemora su sesquicentenario en 2025" (`club-uruguay/page.tsx` ~204), leído en noviembre de 2026.
- **Título de la pestaña repetido:** el armazón (`src/app/layout.tsx` ~69) ya agrega `| AK Producciones`, y estas
  páginas también lo ponen en su `title`, así que la pestaña dice "AK Producciones" dos veces: `club-uruguay/page.tsx`,
  `bodas/page.tsx`, `entrar/page.tsx`, `simulador-ak/layout.tsx`, `evento/fotocabina/layout.tsx`,
  `evento/plataforma-360/layout.tsx`, `evento/bogue/layout.tsx`, `evento/hub/layout.tsx`, y en el panel
  `(app)/empresa/presencia-digital/page.tsx` y `(app)/contabilidad/crm/marketing-ads/page.tsx`.
- Descartado: el resto de las páginas públicas no tiene notas internas a la vista (búsqueda de "módulo maestro",
  "del dueño", "Por confirmar:", "no habilitación", "inventad" en `src/app` y `src/components`, sin contar comentarios).

## Bloque 1 — Sacar las notas internas (P2, lo ve el cliente)

- `description` de las fotos del maestro (en las dos páginas): `undefined` (sin texto). El visor ya no muestra nada si
  no hay descripción.
- Etiqueta "Condición comercial del dueño" → **"Beneficio con AK Producciones"**.
- Sacá la frase "Sin cuentas regresivas inventadas ni modificaciones en el simulador." entera (el resto del párrafo queda).
- `(informadas, no habilitación legal certificada)` → sacá el paréntesis; queda "50 a 250 personas según el montaje".
- "Por confirmar:" → **"Se coordina:"** (los dos lugares).

## Bloque 2 — El aniversario dicho en pasado (P3)

"conmemora su sesquicentenario en 2025" → **"en 2025 cumplió 150 años"**. No cambies el resto del párrafo.

## Bloque 3 — "AK Producciones" una sola vez en la pestaña (P3)

En los archivos del barrido, sacá el `| AK Producciones` final del `title` (el armazón lo agrega solo). Donde el título
**no** pasa por el armazón (`openGraph`, `twitter`), dejalo como está.

## Pruebas

- `src/__tests__/el-cliente-no-ve-notas-internas.test.tsx`: renderizá `ClubUruguayInteractive` con una foto sin
  descripción y comprobá que no aparece "módulo maestro" ni "Por confirmar"; y leé `src/app/club-uruguay/page.tsx` y
  `src/app/page.tsx` y comprobá que no tienen "módulo maestro", "Condición comercial del dueño", "cuentas regresivas
  inventadas" ni "no habilitación legal".
- En `tests/e2e/club-uruguay-visita-y-galeria.spec.ts`, sumá: el título de la pestaña contiene "AK Producciones" **una
  sola vez**, y la página no muestra "Condición comercial del dueño".

```comprobar
no-usa: módulo maestro de salones en src/app/club-uruguay/page.tsx
no-usa: módulo maestro de salones en src/app/page.tsx
no-usa: Condición comercial del dueño en src/app/club-uruguay/page.tsx
no-usa: cuentas regresivas inventadas en src/app/club-uruguay/page.tsx
no-usa: no habilitación legal certificada en src/app/club-uruguay/page.tsx
no-usa: Por confirmar: en src/components/club-uruguay/ClubUruguayInteractive.tsx
no-usa: conmemora su sesquicentenario en src/app/club-uruguay/page.tsx
no-usa: | AK Producciones' en src/app/bodas/page.tsx
prueba: src/__tests__/el-cliente-no-ve-notas-internas.test.tsx
```
