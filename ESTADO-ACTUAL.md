# Estado actual — 27 de noviembre de 2026

## Publicado
- #1474 (336–342 + robot sembrado) y #1476 (343–345, auditoría profunda 24/11, Club Uruguay $19.990 y Orden 350 en `main`).
- `origin/main` trajo órdenes 367 a 376 (vueltas 12–21 de seis especialistas), incorporadas en `gemini/orden-346`.
- Incorporado `origin/claude/app-debug-stabilize-m70e6z` (`82af1ae96`, Orden 377 + Orden 378 e informe `docs/informes/web-ak-27-11.pdf`).

## Rama actual (`gemini/orden-346`) — PR #1475 abierta (sin fusionar)
- **Orden 377 + Blog automático**: guardados robot insumos/activos, Touchpix, `/blog` + `/sitemap.xml` en `force-dynamic`, aislamiento de cron/al-entrar/acciones (`48h`).
- **Orden 378 + Mejoras de ventas y diseño**:
  * Blog unificado en `/blog` y `/blog/[slug]` con 301 desde `/public/blog`, sitemap dinámico y `robots.ts` con crawlers IA.
  * Encabezado único (`LandingNav` + `PublicNavbar` unificados), logo sin globo blanco y menú desktop en una línea (`whitespace-nowrap`).
  * Posicionamiento `"Wedding planner y organizador de bodas"` en `/bodas`, portada y `llms.txt`; `ServiceJsonLd` + `FAQJsonLd` en servidor para todas las landings y `/club-uruguay` (con mapa); fotos reales de AK sin stock ni cartel `"Valeria"`.
  * Bloque "Últimas notas" de Blogger/WordPress con caché 1 h + formulario de suscripción propio con consentimiento, baja y envío manual por el dueño desde el panel.
  * Impronta comercial y visual en portada, servicios, diferencial, CTA, `/fiestas`, `/blog` y `EventLandingPage` ("Tres formas de vivir tu fiesta sin estrés", vocabulario AK real, `<Image />` LCP y móvil `390px`).
- **Estado PR #1475 (`gemini/orden-346`):** lista para que **Claude** revise y fusione (Gemini nunca mergea).
