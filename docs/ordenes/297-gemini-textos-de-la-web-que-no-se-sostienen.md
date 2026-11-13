# Orden 297 — Textos de la web que no se sostienen (13/11/2026)

**Para Gemini.** Una sola propuesta, sin fusionar, desde una **rama nueva** sobre `origin/main` actualizado. Repasá
`docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 106. Si un bloque se traba, entregá el resto y avisá cuál faltó.

Sale de una revisión de escritura y marketing de la web pública (13/11/2026). Acá va **sólo lo que está roto**: datos
inventados, nombres viejos, notas internas, errores de escritura y una demostración que no muestra lo que dice.

## Lo que NO se toca (decisiones del dueño)

- El 50% del Club Uruguay, "+200", "+7 años" y "Clientes satisfechos" **sin porcentaje** (elegido así).
- La seña, la penalidad del 30%, las cuotas, los medios de pago y la anticipación de reserva: no se cambia ninguna cifra.
- Los textos de los paquetes ("chambelanes", "trono", etc.), las páginas duplicadas `/public/*` y `/bodas`, `/quinceaneras`,
  `/cumpleanos`, y el simulador viejo: **quedan como están** (se le consultan al dueño aparte).
- Las opiniones reales de clientes (`src/data/testimonials.json`): no se corrigen ni se tocan.

## Barrido en toda la app (Claude, 13/11/2026)

- **Testimonios escritos a mano, sin cliente real:** `testimonials` en `src/data/event-catalogs/xv-anos.ts` ~44,
  `bodas.ts` ~42, `cumpleanos.ts` ~40, `aniversarios.ts` ~41, `corporativos.ts` ~69, `fiestas.ts` ~32 ("Familia
  Rodríguez", "Empresa Tech S.A.", "Roberto y Marta"…). Los muestran `src/app/public/[eventType]/page.tsx`,
  `src/app/landing/[slug]/page.tsx` y `src/app/catalogo/[tipo]/page.tsx`.
- **Paquete que ya no existe:** "Premium y Elite" en `src/data/event-catalogs/shared.ts` ~271.
- **Notas internas:** "Nuestro equipo recibe tu consulta en el CRM" (`src/components/landing/EventLandingPage.tsx` ~326),
  "medir esta campaña" (`src/components/landing/LeadCaptureForm.tsx` ~278), "Oficina & Atención"
  (`src/components/public-footer.tsx` ~245; el dueño no tiene oficina).
- **Errores:** "sonido robótico" (`src/app/club-uruguay/page.tsx` ~225); el simulador viejo sin tildes
  (`src/app/simulador/page.tsx`: "Rapido", "Instantaneo", "tecnologia", "proyeccion", "Sofia", "segun", "menus",
  "Conversacion"); tuteo en `src/data/event-catalogs/shared.ts` y `src/components/public/FAQSection.tsx` ("contigo",
  "Aquí respondemos"); "tu xv años perfecta" en `xv-anos.ts`; notas del blog sin tildes ("ano", "planificacion",
  "practica", "Como elegir", "quinceanera", "que pasa").
- **La demostración de la IA:** `src/components/public/InteractiveTechShowcase.tsx` ~472-510 muestra la misma foto con un
  filtro de color como "Después (IA)", bajo "Así transforma … en tiempo real", con la etiqueta "Exclusivo con IA" (~76).

## Bloque 1 — Sin testimonios inventados (P1)

En los seis archivos de `src/data/event-catalogs/`, `testimonials: []`. Las tres páginas que los muestran ocultan la
sección cuando la lista está vacía, o usan en su lugar las opiniones aprobadas de `src/data/testimonials.json`
(`isApproved: true`), como ya hace `EventLandingPage.tsx` ~119. Nada de reseñas de relleno.

## Bloque 2 — La torta sin el paquete viejo (P2)

`shared.ts` ~271: "Incluida en los paquetes Premium y Elite, con diseño personalizado." → **"Con diseño personalizado,
según el paquete que elijas."** (no se nombra ningún paquete hasta que el dueño confirme cuál la incluye).

## Bloque 3 — Sin notas internas (P2)

- "Nuestro equipo recibe tu consulta en el CRM" → **"Recibimos tu consulta y te respondemos por WhatsApp."**
- Consentimiento: "medir esta campaña" → **"saber cómo nos encontraste"** (el resto de la frase y lo que se acepta no
  cambian).
- Pie: "Oficina & Atención" → **"Atención"**, sin dirección de oficina.
- Club Uruguay: "sonido robótico" → **"sonido profesional e iluminación robótica"**; "Fotografía & Video" →
  **"Fotografía y filmación"**.

## Bloque 4 — Errores de escritura y voseo (P3)

Corregí las palabras del barrido (con sus tildes y la ñ), "tu xv años perfecta" → **"tus XV perfectos"**, "contigo" →
**"con vos"**, "Aquí respondemos" → **"Acá respondemos"**, "sus XV años" → **"tus XV"**. En el blog, "Calculá una base
exacta" → **"Calculá una base estimada"**. Guardá todo en UTF-8 (`npm run check:acentos`).

## Bloque 5 — La demostración de la IA no promete lo que no muestra (P2)

En `InteractiveTechShowcase.tsx`: el título pasa a **"Así puede verse una foto con el Tótem Touch IA"**, la etiqueta de la
imagen de la derecha a **"Ilustración"** (no "Después (IA)"), y "Exclusivo con IA" a **"Con IA"**. Debajo, una línea:
**"Las fotos de los invitados se usan sólo para la fiesta. Para pedir que se borre una, escribinos."**

## Pruebas

- `src/__tests__/la-web-no-inventa-testimonios.test.ts`: ningún archivo de `src/data/event-catalogs/` tiene testimonios
  escritos a mano, y ninguno nombra "Elite".
- `src/__tests__/la-web-no-muestra-notas-internas.test.ts`: los componentes públicos del barrido no contienen "en el CRM",
  "esta campaña", "Oficina & Atención", "sonido robótico" ni "contigo".
- En `tests/e2e/`, una prueba que abra la portada y compruebe que la demostración dice "Ilustración" y no "Después (IA)".

```comprobar
no-usa: Familia Rodríguez en src/data/event-catalogs/xv-anos.ts
no-usa: Empresa Tech S.A. en src/data/event-catalogs/corporativos.ts
no-usa: Premium y Elite en src/data/event-catalogs/shared.ts
no-usa: en el CRM en src/components/landing/EventLandingPage.tsx
no-usa: medir esta campaña en src/components/landing/LeadCaptureForm.tsx
no-usa: Oficina & Atención en src/components/public-footer.tsx
no-usa: sonido robótico en src/app/club-uruguay/page.tsx
no-usa: Instantaneo en src/app/simulador/page.tsx
no-usa: Después (IA) en src/components/public/InteractiveTechShowcase.tsx
prueba: src/__tests__/la-web-no-inventa-testimonios.test.ts
prueba: src/__tests__/la-web-no-muestra-notas-internas.test.ts
```
