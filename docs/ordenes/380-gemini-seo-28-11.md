# Orden 380 — Auditoría SEO completa del 28/11 (Google no encuentra la web)

**Para Gemini. Va en la MISMA propuesta que la 379 (misma rama).** Informe con mediciones: `docs/informes/seo-28-11.pdf`
(leé las secciones que cita cada bloque). Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

## Bloque 1 — robots.txt bloquea todo lo que no está en la lista (informe sección 7 y 8)
`src/app/robots.ts` ~23-28 tiene una lista `allow` y después `disallow: '/'`: toda página nueva queda bloqueada para Google
y los bots de IA. Dar vuelta: permitido por defecto, y `disallow` sólo lo interno (`/api`, el panel del equipo, `/login`,
portales con sesión, `/evento/`). Declarar explícitamente permitidos Googlebot, Bingbot, OAI-SearchBot, PerplexityBot,
ClaudeBot. `sitemap` apuntando a `/sitemap.xml`.

## Bloque 2 — Una dirección que no existe tiene que dar 404 (sección 3.3)
Hoy una URL inexistente responde 200 y redirige a `/login`. Que devuelva 404 real con `src/app/not-found.tsx` (con un botón "Simular mi presupuesto" y enlaces a
portada, bodas, 15, simulador y WhatsApp). `/login` con `noindex`. Las variantes del simulador con parámetros, con canonical
a la dirección sin parámetros. Revisar el middleware: sólo manda a `/login` lo que es del equipo.

## Bloque 3 — /bodas y /quinceaneras no están indexadas (sección 3)
Enlaces internos fuertes desde la portada y el pie a `/bodas`, `/quinceaneras`, `/cumpleanos`, `/club-uruguay`, `/blog`;
menos páginas duplicadas (las `/public/...` con 301 a la dirección pública, como ya pide la 378). La presentación LED
(`/presentacion-led`, también en `/catalogo`) tiene 8 palabras visibles: `noindex` en `/presentacion-led`, y `/catalogo`
con texto propio (300 palabras reales de los servicios, sin precios inventados).

## Bloque 4 — Velocidad en el celular (sección 5)
Portada con LCP 13,3 s y 2,5 MB. Sin gastar plata por mes:
- Imágenes de portada en WebP/AVIF al tamaño real (`next/image` con `sizes` y `priority` sólo en la primera).
- Las páginas públicas sin `cache-control: no-store`: estáticas o con revalidación (las que lo necesiten por datos,
  revalidar cada hora), sin tocar lo del equipo.
- Menos JavaScript de terceros en lo público (cargar diferido lo que no se ve al abrir).
Medir con Lighthouse móvil antes y después en portada y /bodas y anotar los números en `docs/YA-RESUELTO.md`.

## Bloque 5 — Una página por servicio, sólo para Salto (decisión del dueño, 28/11)
Páginas nuevas, todas "en Salto" (ninguna de otras ciudades): `/fotocabina-salto`, `/plataforma-360-salto`,
`/dj-e-iluminacion-salto`, `/barra-de-tragos-salto`, `/catering-salto`, `/decoracion-salto` y `/salon-de-fiestas-salto`
(esta última enlaza a `/club-uruguay`). Cada una con H1 claro, 300 a 500 palabras propias, fotos reales de AK (regla del 7/10:
si no hay una propia, una de ejemplo del tema), FAQPage y Service en JSON-LD, botón al simulador y a WhatsApp, enlaces a
`/bodas`, `/quinceaneras` y `/cumpleanos`. Sumarlas al sitemap y al menú/pie. Sólo datos ya publicados: sin precios, plazos ni
capacidades inventadas; nada de "garantía", "24/7" ni "congelar".

## Lo que NO hay que hacer
- No crear páginas de otras ciudades.
- No cambiar textos comerciales, precios ni el reloj del simulador.

## Qué tiene que comprobar la prueba
- `tests/e2e/las-paginas-de-servicio-en-salto.spec.ts`: las siete páginas abren a 390 px, tienen H1 con "Salto", un
  JSON-LD FAQPage y figuran en el sitemap.
- `src/__tests__/robots-permite-por-defecto.test.ts`: `robots()` no tiene `disallow: '/'`; `/bodas` y una ruta nueva
  cualquiera quedan permitidas; `/api` y el panel, no.
- `tests/e2e/una-direccion-inexistente-da-404.spec.ts`: `/no-existe-xyz` responde 404 y muestra los enlaces; `/login`
  tiene `noindex`.

```comprobar
no-usa: disallow: '/', en src/app/robots.ts
prueba: src/__tests__/robots-permite-por-defecto.test.ts
archivo: src/app/fotocabina-salto/page.tsx
prueba: tests/e2e/las-paginas-de-servicio-en-salto.spec.ts
prueba: tests/e2e/una-direccion-inexistente-da-404.spec.ts
usa: Simular mi presupuesto en src/app/not-found.tsx
```

## Barrido en toda la app
- `no-store` en lo público: `grep -rn "no-store\|force-dynamic" src/app --include=page.tsx` y dejar sólo lo que lo necesita.
- Redirecciones a `/login` desde rutas públicas: `grep -n "login" src/middleware.ts`.
