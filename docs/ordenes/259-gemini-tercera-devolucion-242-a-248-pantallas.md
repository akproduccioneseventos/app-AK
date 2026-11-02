# Orden 259 — Tercera devolución de la 242 a 248: las pruebas de pantalla (01/11/2026)

**Para Gemini.** Antes de tocar nada, **traé la rama**: `git pull` sobre `gemini/ordenes-242-a-248`. Claude le subió dos
arreglos chicos:

- sacó los datos de la corrida;
- dejó el motivo en el `.catch` de los testimonios.

**Una sola entrega, no fusiones.**

**Ya está bien:** tipos en cero, Jest en verde (5.732) y acentos bien.

**Lo que falla:** las **7 pruebas de navegador nuevas, en los dos tamaños (14 fallas)**. Abajo va el error exacto de cada
una, tomado de la corrida de Claude. Vos no podés correrlas, así que **leé el error, abrí la pantalla en el código y
arreglá lo que corresponda**:

- si la pantalla está bien y la prueba busca mal, se arregla **la prueba**;
- si falta algo en la pantalla, se arregla **la pantalla**.

**No borres ninguna comprobación.**

## Las 7 fallas

1. **`club-uruguay-visita-y-galeria.spec.ts`** (estructura de 7 bandas): `h3:has-text("Salón Principal")` encuentra
   **dos** títulos, "Salón Principal" y "Salón principal".
   - La prueba tiene que usar `getByRole('heading', { name: 'Salón Principal', exact: true })`.
   - Si son dos bandas que dicen lo mismo, dejá una sola.
2. **`el-simulador-tiene-los-textos-nuevos.spec.ts`**, Paso 1: no aparece el `h1` "Tu fiesta, como la imaginás.
   Nosotros te ayudamos a hacerla realidad." El texto está en `simulador-de-presupuesto/page.tsx`, pero al abrir la
   página no se ve. Fijate:
   - si está dentro de un paso que no es el primero, o detrás de una pantalla de entrada;
   - si está partido en dos elementos, en cuyo caso la prueba no lo encuentra entero.
3. **El mismo archivo**, Paso 6 con Club Uruguay: no aparece `simulator-first-step-cta`. Es la misma causa que el 2: la
   prueba no llega al primer paso.
4. **`la-barra-con-o-sin-alcohol.spec.ts`**: en el tótem no aparece "Fernet con Coca".
   - La fiesta de prueba tiene que traer la carta de los 12 tragos, o la prueba tiene que armarla con el ayudante de
     `tests/e2e/helpers/fiesta-de-prueba.ts`.
   - Mirá con qué nombre exacto queda el trago en `fiesta-defaults.ts`.
5. **`la-portada-vende-con-confianza.spec.ts`**, testimonios antes que tecnología: hay **dos** elementos con
   `id="landing-testimonials"`.
   - Uno lo pone `LandingSpaContainer.tsx` y otro `TestimonialsSection.tsx:131`.
   - **Un id se usa una sola vez por página**: dejá uno solo. Los enlaces `#landing-testimonials` tienen que seguir
     bajando a esa sección.
6. **El mismo archivo**, frases viejas: la portada **todavía dice "gourmet"**.
   - Buscalo en lo que se ve en la portada; por ejemplo, `src/components/landing/WinSechWidgets.tsx`.
   - Sacalo sólo si la orden 245 lo pide. Si la orden no lo pide, sacalo de la prueba y avisá.
7. **`la-seccion-de-la-app-se-entiende.spec.ts`**: en `#tecnologia` no aparece ninguna foto de
   `/images/tragos/`.
   - Tocar "Barra" tiene que mostrar la foto real de un trago, que está en `public/images/tragos/`.

## Al terminar

Pegá las últimas líneas de:

- `npx tsc --noEmit`;
- `npx jest --silent`;
- `npm run check:acentos`.

No subas `data/` ni `src/data/`.

```comprobar
prueba: tests/e2e/club-uruguay-visita-y-galeria.spec.ts
prueba: tests/e2e/la-portada-vende-con-confianza.spec.ts
```
