# Orden 257 — Devolución de la entrega de las órdenes 242 a 248 (01/11/2026)

**Para Gemini.** Seguí sobre la rama `gemini/ordenes-242-a-248`, desde `a9fd6de8a`. **Una sola entrega, no fusiones.** Antes
de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md`; mirá sobre todo la 82: no sacar lo que andaba.

**Revisión de Claude:** acentos bien. **No compila: 12 errores de tipos.** La mitad viene de un archivo que **volviste a una
versión vieja**, y eso borra trabajo que ya estaba publicado. No se revisó más hasta que compile.

## Bloque 1 — devolvé `src/app/api/cron/metricas-de-redes/route.ts` a como está en main

Tu versión importa módulos que ya no existen:

- `other-platforms-history-backfill`
- `@/lib/decoracion-ia/catalogo-servicio`
- `@/lib/decoracion-ia/generador-servicio`
- `mutarDocumento` desde `data-service`

Además saca la puerta de las tareas, que ya estaba puesta. Ninguna orden pedía tocar este archivo.

**Qué hacer:** `git checkout origin/main -- src/app/api/cron/metricas-de-redes/route.ts`.

**Después, repasá cada archivo que tocaste y que ninguna de las seis órdenes nombra.** Compará cada uno con `origin/main`.
Si tu cambio vuelve atrás algo que ya estaba en main, dejá la versión de main. Por ejemplo, `data/blog-posts.json` es un
dato de la corrida y **no va**.

## Bloque 2 — los otros errores de tipos

- `src/app/actions/centro-de-control.ts:613`: usás `armada` y no existe en ese lugar. Leé `esBaseSinIA` del resultado
  real de la llamada que arma la web.
- `src/app/actions/fiesta/armar-web-con-ia.actions.ts:310`: sumá `esBaseSinIA?: boolean` al tipo que devuelve la
  función, no lo metas a la fuerza.
- `src/app/club-uruguay/page.tsx:382`: falta importar `Camera` de `lucide-react`.
- `src/components/landing/LaAppDeTuFiestaSection.tsx:550`: la imagen puede venir vacía. Si no hay imagen, no se
  dibuja.

## Bloque 3 — el centro de control no anuncia notas que no se publicaron

En `getCentroDeControlDatos` sumaste todas las notas del blog a "Lo que hizo sola". **Que no entren:**

- las que escribió una persona;
- los borradores;
- las programadas.

Sólo entran las que publicó la IA, que es justo lo que pedía la orden 244.

**Comprobá:** una nota en borrador no aparece en "Lo que hizo sola".

## Al terminar

Corré y pegá las últimas líneas de cada uno:

- `npx tsc --noEmit`, con **cero** errores;
- `npx jest --silent`;
- `npm run check:acentos`;
- `npm run "publicar?:rapido"`.

No subas `data/` ni `src/data/`.

```comprobar
usa: abrirPuertaDeLaTarea en src/app/api/cron/metricas-de-redes/route.ts
no-usa: decoracion-ia/catalogo-servicio en src/app/api/cron/metricas-de-redes/route.ts
usa: esBaseSinIA en src/app/actions/fiesta/armar-web-con-ia.actions.ts
```
