# Orden 244 — El blog dice "corrió" sin haber publicado nada (27/10/2026)

**Para Gemini. Va en la MISMA propuesta que las órdenes 242 y 243.** Antes de decir "terminé", pasá
`docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste.

Lo que vio el dueño: *"el blog tiene 5 publicaciones y lo tengo hace meses en 3 por semana"*. Las 5 son de junio.
No se publicó ninguna más.

## Lo que está medido

- **Quién genera las notas:** `runMarketingAutomation` (`src/lib/marketing-automation.ts` ~188-220). Llama a
  `generateBlogPostAndSocialDraft` (`src/lib/blog-ai-generator.ts`), que publica directo en `blog-posts.json`.
- **Los dos caminos que no publican y callan.** Si falta la clave (`hasUsableAiKey`) o si se llegó al tope de gasto
  (`hayPresupuestoParaIA`), sólo se llena `seoError` y la función **termina bien**.
- **Quién se lo traga:** la tarea "blog" de `ponerAlDiaAlEntrar` (`src/lib/automatico/al-entrar-a-la-app.ts` ~171 y
  ~251). No mira `seoError`:
  - la anota como corrida (`ultimaCorrida`, `marcarCorrida`);
  - no la vuelve a intentar hasta dentro de 56 horas;
  - nadie se entera.

  Lo mismo hace la ruta `src/app/api/cron/generate-blog-post/route.ts` si devuelve 200 con el error adentro (fijate).
- **Lo local:** `data/tareas-automaticas.json` dice que el blog "corrió" el 22/10, y no hay ninguna nota después de
  junio.

## Bloque 1 — una falla no es una corrida

1. En la tarea "blog" de `al-entrar-a-la-app.ts`, si el resultado trae `seoError` o `seoSucceeded === false` estando
   vencida, **se tira error**. Así entra al `catch` y queda en `ultimoFallo`, con el texto de por qué. Hacé lo mismo
   en la ruta del despertador: que conteste distinto de 200 o con `ok: false`.
2. Si la IA escribe una palabra prohibida y `generateBlogPostAndSocialDraft` tira error:
   - se reintenta **una vez** con otro tema;
   - si vuelve a fallar, se anota el fallo;
   - el consumo de IA se registra igual, porque ya se pagó.

## Bloque 2 — que el dueño lo vea sin buscar

- **En la pantalla donde se administra el blog** (buscá dónde se llama `runMarketingAutomationFromAdmin`), una línea
  arriba:
  - "Última nota publicada: {fecha}. Próxima: {fecha}.";
  - si la última vuelta falló, en rojo y en criollo: "No se publicó la nota del {fecha}: {motivo}". Los motivos son
    "falta la clave de la IA", "se llegó al tope de gasto del mes" y "la IA escribió una promesa prohibida".
- **Si pasan más de 4 días sin nota nueva**, va un aviso al dueño con `createNotification`. Es un aviso sin plata,
  así que va al teléfono como cualquier otro.
- **En el Centro de control**, pestaña "Lo que hizo sola", cada nota publicada sale con su enlace.

## Bloque 3 — que corra aunque nadie entre a la app

Hoy la tarea corre cuando alguien entra a la app, o con el despertador de Firebase (`functions/src/index.ts:63`, cada
15 minutos, a `/api/cron-despachador`).

**Comprobá en el código** que `cron-despachador` incluya `generate-blog-post` entre las tareas que despacha. Si no
está, sumala. No crees un servicio pago nuevo: el despertador ya existe.

## Lo que no se toca

- `SEO_INTERVAL_MS` (2 días) y `NOTAS_POR_CORRIDA` (1).
- Las reglas del texto: sin "garantía", sin "24/7" y sin promesas.
- El tope de gasto de IA.

## Pruebas

**Jest**, en `src/__tests__/el-blog-no-dice-que-publico-sin-publicar.test.ts`, con la IA simulada:

- (a) Sin clave: la tarea "blog" queda en `ultimoFallo` con el motivo y **no** en `ultimaCorrida`.
- (b) Con el tope de gasto alcanzado: lo mismo.
- (c) Con clave y presupuesto: se agrega una nota a `blog-posts.json` y queda en `ultimaCorrida`.
- (d) Con 5 días sin nota: se crea el aviso al dueño.
- Rompé (a) a propósito, volviendo a ignorar `seoError`, y fijate que se ponga en rojo.

**Navegador:** la pantalla del blog muestra "Última nota publicada". Con la respuesta simulada de falla, muestra el
motivo en rojo.

```comprobar
usa: seoError en src/lib/automatico/al-entrar-a-la-app.ts
usa: Última nota publicada en src/app/(app)/settings/contenido-publico/page.tsx
usa: generate-blog-post en src/app/api/cron-despachador/route.ts
prueba: src/__tests__/el-blog-no-dice-que-publico-sin-publicar.test.ts
```
