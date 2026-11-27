# Orden 378 — La web y el blog (informe del 27/11/2026, pedido del dueño)

**Para Gemini. Va en la MISMA propuesta que la 377 (rama `claude/app-debug-stabilize-m70e6z`).** Informe completo con capturas:
`docs/informes/web-ak-27-11.pdf`. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Probá todo a 390 px.

## Bloque 1 — Una sola dirección del blog: `/blog`
Hoy `next.config.js` ~162-178 manda `/blog` y `/blog/:slug` a `/public/blog` con 301, y `src/app/public/blog/page.tsx` ~19
tiene `canonical: '/public/blog'`. El equipo de contenido enlaza a `/blog`. Dar vuelta: la dirección pública es `/blog` y
`/blog/[slug]`; `/public/blog` y `/public/blog/:slug` hacen 301 a `/blog`. Canonical `/blog` (y `/blog/<slug>` en cada nota).
El menú de toda la web apunta a `/blog`. `src/app/robots.ts`: permitir `/blog` (y dejar permitidos Googlebot, Bingbot,
OAI-SearchBot, PerplexityBot, ClaudeBot).

## Bloque 2 — El blog y sus notas en el sitemap
`src/app/sitemap.ts`: sumar `/blog` y cada nota publicada (`/blog/<slug>`) con su fecha real de publicación o
actualización como `lastModified` (no una fecha fija).

## Bloque 3 — El logo del encabezado se ve vacío
En `/bodas`, `/quinceaneras`, `/cumpleanos` y `/club-uruguay` el logo es un círculo blanco sin imagen; en `/blog` se ve bien
y con otro menú. Un solo encabezado y el mismo archivo de logo en todas las páginas públicas, con `alt="AK Producciones"`.
El menú no parte "Galería HD" ni "Preguntas frecuentes" en dos líneas en escritorio (achicar o ajustar ancho, sin cambiar
a dónde llevan).

## Bloque 4 — "Wedding planner y organizador de bodas" (lo pidió el dueño)
- `/bodas` (`src/app/bodas/page.tsx` y `src/lib/marketing/promo-pages.ts`): title "Wedding planner y organizador de bodas en
  Salto | AK Producciones", H1 "Wedding planner y organizador de bodas en Salto", meta description y la sección "Qué hace un
  wedding planner (organizador de bodas)" con el texto del informe (punto 4.1 y 4.3), con enlaces a `/blog` y `/club-uruguay`.
- Portada: title y description del punto 4.2.
- `public/llms.txt`: sumar las tres líneas del punto 4.5, sin sacar lo que ya dice.

## Bloque 5 — Datos para Google en cada página de fiesta
JSON-LD `Service` + `FAQPage` en `/bodas`, `/quinceaneras`, `/cumpleanos` y `/club-uruguay` (modelo en el punto 4.4 y en el
ejemplo de la sección 5), con 5 a 8 preguntas por página. **Sólo datos ya publicados**: nada de precios, plazos ni
capacidades inventadas; Club Uruguay "50 a 250 personas según el montaje, Uruguay 754". Nombre, teléfono (098 355 530) y
ciudad idénticos en todas. Nada de "garantía", "24/7" ni "congelar".

## Bloque 6 — Títulos
`/quinceaneras` repite la marca ("| AK Producciones | AK Producciones"): una sola. `/catalogo` se titula "Presentación de
Tecnología": pasarlo a un título de catálogo de servicios con "Salto".

## Bloque 7 — Portadas con fotos de AK
`/bodas` y `/cumpleanos` usan fotos de stock y `/quinceaneras` muestra el cartel ajeno "MIS 15 AÑOS VALERIA". Usar fotos
propias de AK (las de la galería real; regla del dueño del 7/10: si no hay una propia que sirva, una de ejemplo del tema
correcto, sin preguntarle). En 15 años, una foto sin nombre visible.

## Bloque 8 — "Últimas notas" de Blogger y WordPress, y suscripción por mail
- En la portada y en `/blog`: las 3 últimas notas (título, imagen, fecha) leyendo en el servidor los feeds
  `https://akproduccionessalto.blogspot.com/feeds/posts/default` y `https://akproduccionessalto.wordpress.com/feed/`, caché
  de 1 hora; si el feed falla, el bloque no se muestra (sin error en pantalla). Enlaces a cada nota y a los dos blogs.
- Formulario de suscripción en `/blog` y en el pie: email + casilla de consentimiento obligatoria + texto de privacidad en
  español; guarda en la base propia (no en terceros); baja con un enlace. **El mail de cada nota nueva queda preparado y lo
  manda el dueño con un botón** (regla: los mensajes a personas no salen solos). Con tope de envíos por persona y sin
  servicio pago.

## Lo que NO hay que hacer
- No cambiar las direcciones `/bodas`, `/quinceaneras`, `/cumpleanos`, `/club-uruguay`.
- No tocar el reloj del simulador, los precios ni las promociones.

## Qué tiene que comprobar la prueba
- `tests/e2e/la-web-y-el-blog-del-27-11.spec.ts`: `/public/blog` termina en `/blog`; `/blog` tiene canonical `/blog`; el
  sitemap incluye `/blog`; el logo de `/bodas` es una imagen con alt "AK Producciones" y ancho mayor a 0; `/bodas` tiene H1
  "Wedding planner y organizador de bodas en Salto" y un JSON-LD `FAQPage`; el title de `/quinceaneras` tiene la marca una
  vez; a 390 px nada se desborda.
- `src/__tests__/las-ultimas-notas-no-rompen.test.ts`: con el feed caído el bloque devuelve vacío; la suscripción sin la
  casilla no guarda.

```comprobar
no-usa: canonical: '/public/blog', en src/app/public/blog/page.tsx
no-usa: ruta.startsWith('/public/blog/') en src/app/sitemap.ts
usa: Wedding planner y organizador de bodas en Salto en src/app/bodas/page.tsx
usa: akproduccionessalto.wordpress.com/feed en src/lib/blog/ultimas-notas.ts
prueba: tests/e2e/la-web-y-el-blog-del-27-11.spec.ts
prueba: src/__tests__/las-ultimas-notas-no-rompen.test.ts
```

## Barrido en toda la app
- Títulos con la marca repetida: `grep -rn "AK Producciones | AK Producciones\|title:.*AK Producciones" src/app src/lib/marketing`.
- Direcciones viejas del blog: `grep -rn "/public/blog" src` (todas pasan a `/blog`).
- Logos sin imagen o sin `alt`: los encabezados de `src/components` de las páginas públicas.
