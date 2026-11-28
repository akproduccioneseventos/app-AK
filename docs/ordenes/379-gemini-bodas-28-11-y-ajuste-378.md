# Orden 379 — Ajuste de la 378 y auditoría de /bodas del 28/11

**Para Gemini. Rama: arrancá de `origin/gemini/orden-346` (tu entrega de la 378) traída de `main`. Una sola propuesta.**
Informe con capturas a 390 px: `docs/informes/web-bodas-28-11.pdf`. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

## Bloque 1 — La 378 cambió (decisión del dueño, 27/11): sin notas de Blogger ni WordPress
Tu entrega muestra notas leídas de los feeds. El dueño decidió que **el blog de la app es aparte**: la web sólo pone un
**enlace** a Blogger y a WordPress; no lee sus feeds ni muestra sus notas. Sacá la lectura de feeds y dejá el resto del
bloque 8 de la orden 378 como está escrito ahora (suscripción con bienvenida y mail mensual automáticos, suscriptor al CRM
como prospecto, y "Mandar publicidad por mail" en la configuración del CRM con botón).

## Bloque 2 — /bodas (lo que el informe marca como mal o faltante)
1. "Wedding planner" y "organizador de bodas" en title, H1 y meta (si tu 378 ya lo hizo, verificalo en el HTML publicado).
2. El logo vacío sobre la portada: que se vea el logo de AK.
3. El formulario aparece **antes** de los botones principales: poné primero "Armar mi presupuesto" y "Hablar por WhatsApp",
   y el formulario después.
4. Sacá las etiquetas visibles "Imagen ilustrativa" de las fotos.
5. **El teléfono del pie es distinto** del resto de la página: que todo diga el mismo (098 355 530), tomado de un solo lugar.
6. Hay un solo testimonio: mostrá los testimonios reales que ya existen en la app (no inventar ninguno).
7. Sumá enlaces al blog de la app desde /bodas.

## Bloque 3 — Sitemap
- Hay 3 notas casi duplicadas en el sitemap: dejá una sola URL por nota (sin variantes).
- Las páginas estáticas tienen `lastmod` fijo 2026-08-26: usá la fecha real del último cambio de cada página.

## Lo que NO hay que hacer
- No inventar testimonios, precios, plazos ni capacidades. Nada de "garantía", "24/7" ni "congelar".
- No crear páginas nuevas por ciudad o por servicio (eso lo decide el dueño aparte).

## Qué tiene que comprobar la prueba
- `tests/e2e/bodas-28-11.spec.ts` a 390 px: en /bodas el botón "Armar mi presupuesto" está antes que el formulario; no
  aparece "Imagen ilustrativa"; el teléfono es el mismo en todos los lugares de la página; el logo es una imagen con ancho
  mayor a 0; hay un enlace a `/blog` y a los dos blogs externos.
- `src/__tests__/el-blog-no-lee-feeds-externos.test.ts`: ninguna página pública pide los feeds de Blogger o WordPress.

```comprobar
prueba: tests/e2e/bodas-28-11.spec.ts
prueba: src/__tests__/el-blog-no-lee-feeds-externos.test.ts
```

## Barrido en toda la app
- Teléfonos distintos en lo público: `grep -rn "098\|+598" src/components src/app --include=*.tsx | grep -v test`.
- "Imagen ilustrativa" en lo público: `grep -rn "Imagen ilustrativa" src`.
