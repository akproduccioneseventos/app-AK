# Orden 245 — La portada: frases creíbles, entrevista a la vista y sin cuotas "fijas" (27/10/2026)

**Para Gemini. Va en la MISMA propuesta que las órdenes 242 a 244.** Antes de decir "terminé", pasá
`docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste.

El dueño leyó una auditoría de ChatGPT y dijo: *"cambiá sólo lo que a ti te parezca que suma"*. Esto es lo elegido.
**Los textos van tal cual.**

## Lo que NO se toca

- **El orden general de la portada**, del plan Argon del 16/10 (`src/app/page.tsx` ~791-857). Sólo se mueve lo del
  bloque 3.
- **El título principal del hero.**
- **Las cifras:** "+200", "+7 años" y "Clientes satisfechos", sin porcentaje.
- **"exclusivo" del Club Uruguay.**
- **Los dos testimonios de la misma clienta:** son dos reseñas distintas, ya anotado como falso positivo.
- **Si `landingSettings` trae un texto cargado desde el editor de la portada, manda ese.** Cambiá sólo el texto por
  defecto del código.

## Bloque 1 — frases más creíbles (texto exacto)

| Archivo:línea (origin/main) | Hoy | Queda |
|---|---|---|
| `src/components/landing/AkDifferenceSection.tsx:50` | "No vendemos luces ni sonido: diseñamos tu tranquilidad" | "Vos disfrutás la fiesta. Nosotros coordinamos los detalles." |
| `AkDifferenceSection.tsx:14` | "Cero sorpresas ni intermediarios" | "Servicios claros y una organización coordinada de principio a fin." |
| `AkDifferenceSection.tsx:15`, `HeroSection.tsx:28` y `public-footer.tsx:182` | "gourmet" | En el 15 va "Comida para disfrutar y compartir con tus invitados". En el hero, "Comida y barra". En el pie, "Gastronomía y catering". |
| `src/components/public/InteractiveTechShowcase.tsx:306` | "Experiencias que hacen tu fiesta inolvidable" | "Más diversión, más momentos para recordar." |
| `src/components/landing/AkTeamStorySection.tsx:35` | "Nuestra Historia y Compromiso" | "Más de 7 años acompañando celebraciones en Salto." |
| `src/components/landing/CTASection.tsx:157` | "Reserva flexible: Señá tu fecha y armamos un plan de cuotas a tu medida." | "Consultá tu fecha y conocé las opciones de contratación y pago." |

Las pruebas `tests/e2e/el-carrusel-de-tecnologia-se-ve-entero.spec.ts:15` y `la-vidriera-de-la-tecnologia.spec.ts:48`
se pasan al texto nuevo.

## Bloque 2 — promesas que no se cumplen (hay ajuste anual)

- **`src/components/landing/TestimonialsSection.tsx:72`.** Dice "Abonás en cuotas fijas hasta la fecha del evento sin
  estrés ni sorpresas financieras". Va: "Pagás en cuotas hasta la fecha del evento, con las condiciones claras desde
  el principio."
- **`src/lib/marketing/creador-anuncios-ia.ts:281`.** Dice "Congelá hoy y pagá en cuotas fijas 🎁". Va: "Reservá tu
  fecha con una seña y pagá en cuotas 🎁". Fijate también que el prompt del generador de anuncios prohíba "congel" y
  "cuotas fijas".
- Si `la-portada-nueva.spec.ts:59-61` busca el texto viejo del paso 2, actualizalo.

## Bloque 3 — testimonios antes y entrevista a la vista

1. **Testimonios:** en `src/app/page.tsx`, `AsyncTestimonialsSection` pasa a ir **justo después de `services`**,
   antes de `technology`. El resto del orden queda igual.
2. **"Coordinar una entrevista gratuita":**
   - **En el hero** (`HeroSection.tsx`, junto al botón "Simular mi presupuesto", ~318-324), como botón secundario.
   - **En `CTASection.tsx`**, como botón principal, arriba del de WhatsApp.
   - **Qué hace el botón:** abre un panel con nombre y teléfono, y después `SimulatorMeetingScheduler`
     (`src/components/simulator/SimulatorMeetingScheduler.tsx`; pide `clienteNombre` y `clienteContacto`, y `leadId`
     y `presupuestoId` son opcionales). Es la misma agenda del simulador. No crees otra.
   - Si para usarlo sin presupuesto hace falta tocar `src/app/actions/simulator-agenda.ts`, la acción sigue siendo
     pública con el tope de pedidos que ya tiene. No le saques controles.

## Pruebas

**Navegador**, en `tests/e2e/la-portada-vende-con-confianza.spec.ts`:

- La portada no contiene "gourmet", "cuotas fijas", "Cero sorpresas" ni "diseñamos tu tranquilidad".
- Contiene "Vos disfrutás la fiesta. Nosotros coordinamos los detalles."
- La sección de testimonios (`#landing-testimonials`) está **antes** que la de tecnología en la página: compará
  las posiciones.
- Tocar "Coordinar una entrevista gratuita" abre el panel con la agenda.

**Jest:** el texto del generador de anuncios no contiene "congel" ni "cuotas fijas".

Corré `npx tsc --noEmit`, `npx jest --silent` y `npm run "publicar?:rapido"`, y pegá las últimas líneas de cada uno.

```comprobar
no-usa: cuotas fijas en src/components/landing/TestimonialsSection.tsx
no-usa: Congelá en src/lib/marketing/creador-anuncios-ia.ts
no-usa: diseñamos tu tranquilidad en src/components/landing/AkDifferenceSection.tsx
usa: Coordinar una entrevista gratuita en src/components/landing/HeroSection.tsx
usa: SimulatorMeetingScheduler en src/components/landing/CTASection.tsx
prueba: tests/e2e/la-portada-vende-con-confianza.spec.ts
```

## Bloque 4 — lo que se confirmó de una segunda auditoría (27/10/2026)

1. **Testimonios que nadie puede probar.** `src/components/landing/EventLandingPage.tsx:77-94` (constante
   `TESTIMONIALS`, "Experiencias Verificadas", ~265) tiene tres textos fijos: "Familia Rodríguez", "Mariana S." y
   "Martín G.". No están en `src/data/testimonials.json` ni en los catálogos. La regla de `YA-RESUELTO.md` es "no se
   ponen testimonios que no se puedan probar".
   - Reemplazalos por los reales de `getTestimonials()` (`src/app/actions/feedback.ts:133`, aprobados), con
     `src/data/testimonials.json` como respaldo.
   - El título pasa a "Lo que dicen nuestros clientes".
   - Se muestran en bodas, quinceañeras y cumpleaños.
2. **"Presupuesto cerrado" choca con el ajuste anual.** Va "Presupuesto detallado y sin compromiso" en:
   - `src/app/bodas/page.tsx:10`, `src/app/cumpleanos/page.tsx:9` y `src/app/quinceaneras/page.tsx:10`;
   - `src/lib/marketing/auditor-anuncios-ia.ts:72,117` y `creador-anuncios-ia.ts:47`.

   En `src/lib/marketing/promo-pages.ts:93`, "Precio fijo, sin sorpresas" pasa a "Precio claro, sin sorpresas".
3. **Cumpleaños, sin dar por incluido lo que se cotiza** (`src/app/cumpleanos/page.tsx`):
   - :24 → "Tu fiesta con ambientación, barra de tragos y la mejor música".
   - :25 → "Elegí entre comida, discoteca, barra de tragos, fotografía y servicios adicionales para organizar tu
     cumpleaños a medida".
   - :31 → "Barra de Tragos".
   - En `src/data/event-catalogs/corporativos.ts:42`, "barra libre" → "barra de tragos".
4. **El blog no dice "congelar".** En `data/blog-posts.json`, la nota "Checklist definitivo de 12 meses…" (~146,
   `takeaway`) dice "te permite congelar precios de proveedores clave". Va "te permite asegurar la fecha con tus
   proveedores clave". Fijate que el generador del blog (`src/lib/blog-ai-generator.ts`) prohíba "congel" igual
   que prohíbe "garantía".
5. **Google ve las seis presentaciones.** En `src/lib/seo/paginas-publicas.ts:21-37` sumá `/public/cumpleanos`,
   `/public/corporativos` y `/public/aniversarios`. Hoy `robots.ts` las bloquea y no están en el sitemap.

6. **La nota del blog "Cómo calcular la bebida…" (`data/blog-posts.json`, ~34)** usa rendimientos de botella que no
   son los de AK: "Fernet rinde de 8 a 10 vasos, Gin unos 12, Vodka 10 tragos". El dueño decidió corregirla. Ese
   párrafo pasa a: "En AK los tragos se sirven en vaso de 300 ml con alcohol reducido: 15 ml de bebida por trago, y
   cada trago tiene también su versión sin alcohol. Así una botella de 750 ml rinde unos 50 tragos y la fiesta se
   disfruta de otra manera." La mención de "8 horas" queda igual.

Prueba extra en `tests/e2e/la-portada-vende-con-confianza.spec.ts`:

- `/bodas` no contiene "Mariana S." ni "Experiencias Verificadas";
- `/cumpleanos` no contiene "barra libre".

Jest: el sitemap incluye `/public/corporativos`.

```comprobar
# Bloque 4
no-usa: Mariana S. en src/components/landing/EventLandingPage.tsx
no-usa: Presupuesto cerrado en src/app/bodas/page.tsx
no-usa: Presupuesto cerrado en src/app/cumpleanos/page.tsx
no-usa: Presupuesto cerrado en src/app/quinceaneras/page.tsx
no-usa: Barra Libre en src/app/cumpleanos/page.tsx
no-usa: congelar precios en data/blog-posts.json
no-usa: Gin unos 12 en data/blog-posts.json
usa: /public/corporativos en src/lib/seo/paginas-publicas.ts
```
