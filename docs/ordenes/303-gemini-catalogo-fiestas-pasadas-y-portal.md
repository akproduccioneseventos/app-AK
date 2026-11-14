# Orden 303 — Catálogo, fiestas pasadas y portal sin sesión (13/11/2026)

**Para Gemini.** Va **en la misma propuesta que la 297 a 302** (la 1393). Antes de "terminé": `docs/ANTES-DE-ENTREGAR.md`.
Sale del complemento de la auditoría (catálogo, fiestas pasadas, salón 3D, acceso sin sesión y pantalla LED, 13/11/2026).

## Lo que NO se toca (decisiones del dueño)

- "Clientes satisfechos" **sin porcentaje** ni número, "+7 años" y "+200 eventos" (decisión del 28/09).
- La seña de $5.000 y el **30% como penalidad por cancelar** (11/11). Si una diapositiva dice otra cosa, se corrige a esa regla.
- El salón se cobra aparte del presupuesto de AK; el 50% del Club Uruguay con el tachado al doble.
- Los logos de clientes reales.

## Barrido en toda la app (Claude, 13/11/2026)

- **Portal sin sesión:** `src/app/portal/[fiestaId]/decoracion/page.tsx` lee la fiesta con `getFiestaById` sin comprobar la sesión del
  portal; `src/app/portal/[fiestaId]/moodboard/page.tsx` igual. `src/app/portal/[fiestaId]/[module]/page.tsx` sí redirige a
  `/portal/c/...` o `/portal?fiestaId=`: ese es el criterio a copiar. Las escrituras (`updateDecoracion`, `enviarOpinionDecoracion` en
  `src/app/actions/fiesta/decoracion.actions.ts`) ya piden equipo o clave del portal (`allowPortal: true`): no tocarlas.
- **Recuerdos pidiendo ingreso:** `src/app/post-fiesta/layout.tsx` envuelve todo en `AuthGuard`, así que el cliente rebota a `/login`.
- **Testimonios inventados:** `src/app/catalogo/[tipo]/page.tsx` ~693 arma `authorName: \`Cliente ${idx + 1}\``.
- **Penalidad:** `src/app/catalogo/[tipo]/page.tsx` ~505 dice 30%; la otra diapositiva que lo contradice hay que alinearla a esa.

## Bloque 1 — El portal de decoración y el moodboard piden la sesión del cliente (P1, quién ve qué)

En `decoracion/page.tsx`, `moodboard/page.tsx` y `src/app/portal/mesas/page.tsx` (ampliación 14/11, pregunta 139), hacer lo mismo que `[module]/page.tsx`: sin sesión del portal (`verifyPortalSession`)
ni del equipo, redirigir a `/portal?fiestaId=<id>`. Prueba de navegador: sin sesión, `/portal/<id>/decoracion` no muestra la propuesta.

## Bloque 2 — Los recuerdos los abre el cliente (P1)

`/post-fiesta/[fiestaId]` tiene que abrir con la sesión del portal del cliente (o el enlace del álbum), no sólo con la del equipo.
Sacar `AuthGuard` de esa ruta y comprobar en la página la sesión del portal o del equipo. Sin ninguna de las dos, mandar a
`/portal?fiestaId=`. El texto interno ("Descargá el material… Google Drive / Wfolio") **no** lo ve el cliente.

## Bloque 3 — Fiesta pasada (P2)

- Invitación con la fecha vencida: en lugar de la cuenta regresiva, "Esta fiesta ya se realizó" y el enlace al álbum si hay.
- Álbum sin recuerdos: un cartel que diga que se están preparando, no la pantalla vacía.

## Bloque 4 — El catálogo (P2, lo ve el prospecto)

- Testimonios: mostrar sólo los que tengan nombre cargado; si no hay ninguno, ocultar la diapositiva. Nunca "Cliente 1".
- Penalidad: las dos diapositivas dicen lo mismo (30%).
- "La experiencia más exclusiva, sin límites" (Premium): sacar "sin límites" (promesa absoluta, orden 300 bloque 6).
- "Foto del salón · Falta cargar…": si no hay foto, va una de ejemplo (decisión del 07/10), nunca el aviso interno.
- "11 profesionales en tu evento": sale del cálculo de personal por invitados (`src/lib/fiesta/personal-por-invitados.ts`), no fijo.
- El botón Siguiente en "Experiencia 7 de 8" no avanza: que llegue al cierre.

## Pruebas

Navegador para los bloques 1, 2 y 4 (sin sesión el portal no muestra la decoración; con sesión del portal el cliente abre los
recuerdos; el catálogo no dice "Cliente 1" y llega a la última diapositiva).

```comprobar
# Bloque 1
usa: verifyPortalSession en src/app/portal/[fiestaId]/decoracion/page.tsx
usa: verifyPortalSession en src/app/portal/[fiestaId]/moodboard/page.tsx
usa: verifyPortalSession en src/app/portal/mesas/page.tsx
# Bloque 4
no-usa: Cliente ${idx + 1} en src/app/catalogo/[tipo]/page.tsx
usa: personalRecomendado en src/app/presentacion-led/slides/equipo-slide.tsx
prueba: tests/e2e/el-portal-y-los-recuerdos-piden-al-cliente.spec.ts
```
