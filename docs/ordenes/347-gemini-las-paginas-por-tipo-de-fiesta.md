# Orden 347 — Las páginas por tipo de fiesta: un solo contacto, toda tu fiesta

**Para Gemini. Va en la MISMA propuesta que la 346 (rama nueva `gemini/orden-346` desde la principal recién
actualizada).** Si un bloque se traba, entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé
`docs/ANTES-DE-ENTREGAR.md`. Usá las habilidades `que-te-encuentren`, `celular-primero`, `vende` y `animaciones-pro`.

## Por qué (pedido del dueño, 25/11/2026)
El dueño mandó el documento "Landing pages por tipo de fiesta": una página por tipo de fiesta para que quien busca
"casamiento en Salto" llegue a una página hecha para él y termine en WhatsApp o en el simulador. Casi todo el trabajo de
AK hoy es de 15 años; **bodas es la prioridad**. El mensaje de todas las páginas: **todos los servicios en un solo
lugar** (un solo contacto, una sola reunión, una sola seña, una persona responsable). Contratar por separado son varias
reuniones, una seña por servicio y la familia coordinando todo la noche de la fiesta.

**Decisión del dueño (25/11/2026), no se discute:** *"lo que veo es una web sola… sería cumpleaños, bodas, 15, fiestas
empresariales y fiestas infantiles"*. **Cinco páginas: bodas, 15, cumpleaños, empresas e infantiles. Egresados NO va.**
Las de bodas, 15 y cumpleaños ya existen pero **no las enlaza nadie**: ni el menú ni el pie de la portada. Por eso el
dueño no las ve, y Google tampoco las encuentra bien. El bloque 5 lo arregla.

**Y lo que pidió después, el mismo día:** *"tienen que ser muy estéticas, muy lindas, porque son páginas llamativas;
botón del simulador para que tengan precio, botón de WhatsApp, todo lo que tiene la página principal; esos links los voy
a usar para publicidad; optimizadas para Google, y que las inteligencias artificiales nos encuentren"*. Bloques 6 a 8.

## Lo que YA existe (no lo rehagas, mejoralo)
- `/bodas` → `src/app/bodas/page.tsx`. `/quinceaneras` → `src/app/quinceaneras/page.tsx`. `/cumpleanos` →
  `src/app/cumpleanos/page.tsx`. Las tres usan **la misma plantilla** `src/components/landing/EventLandingPage.tsx`
  (381 líneas): portada, servicios, detalle, reseñas, formulario `LeadCaptureForm` (guarda en el CRM) y botón de WhatsApp
  fijo abajo en el celular.
- Metadatos: `createEventLandingMetadata` en `src/lib/seo/event-landing.ts` (tipo `slug` ~6, canónica, Open Graph).
- Datos para Google: `LocalBusinessJsonLd` y `ServiceJsonLd` en `src/components/seo/`.
- Mapa del sitio: la lista `PAGINAS_PARA_GOOGLE` en `src/lib/seo/paginas-publicas.ts` (~25) con su prioridad (~69).
- Rutas públicas: `src/lib/auth/public-paths.ts` (~54) y `src/lib/medicion-segura.ts` (~17).
- Redirecciones viejas: `next.config.js` ~190 (`/landing/xv-anos` → `/quinceaneras`).
- Origen de la visita: `commercialAttributionFromSearchParams` en `src/lib/commercial/acquisition.ts` ~96 (lee
  `source`/`utm_source`).
- El fuente del formulario: tipo `LandingLeadData['fuente']` en `src/app/actions/crm.ts` ~1196 (`landing-bodas`, etc.).
- Número de WhatsApp: `AK_WHATSAPP_NUMBER` en `src/lib/public-contact.ts`. **No escribas el número a mano.**

## Bloque 1 — La plantilla suma los bloques que faltan (en `EventLandingPage.tsx`, para todas las páginas)
1. **"El problema y la solución"**, después de la portada: dos columnas, "Por separado" (varias reuniones, una seña por
   servicio, coordinar todo la noche de la fiesta) contra "Con AK" (un contacto, una reunión, una seña, una persona
   responsable). Con imagen.
2. **"Cómo trabajamos"** en 4 pasos: consulta, propuesta a medida, coordinación, la noche de la fiesta.
3. **Preguntas frecuentes** (prop `faqs: { pregunta: string; respuesta: string }[]`) con su `FAQPage` en JSON-LD. Las
   preguntas de cada página van en el bloque 3.
4. **Galería del tipo de fiesta** (prop `galeria`), con carga diferida.
5. **Reseñas: sólo del mismo tipo de fiesta.** Hoy salen las tres primeras de cualquier fiesta (`fallbackTestimonials`
   ~119 y `getTestimonials` ~131): en bodas aparecen reseñas de 15 años. Filtrá por el tipo (el campo de la reseña que dice
   de qué fiesta es; si no hay ninguno confiable, usá `fiestaNombre`). **Si no queda ninguna, el bloque no se muestra.**
   Abajo, el enlace para dejar reseña (`https://g.page/r/CUagrfscj_5yEAE/review`).
6. **Pie con enlaces a las otras páginas por tipo** y a `/fiestas`.
7. Un solo llamado principal por pantalla: **WhatsApp**, con el mensaje ya escrito con el tipo de fiesta. El segundo
   botón, "Armar mi presupuesto", va al simulador con el tipo (`simulatorHref`).
8. Todo se ve bien a **360 px** de ancho.

## Bloque 2 — Nada inventado
- **Bodas:** AK no tiene fotos reales de bodas. La foto de portada (`/media/catalogo-servicios/boda_persuasiva.png`) tiene
  hoy el texto alternativo **"Boda producida por AK Producciones"** (`src/app/bodas/page.tsx` ~11 y ~29): eso afirma un
  trabajo que no es de AK. Cambialo a "Imagen ilustrativa de una boda", y sumá una leyenda chica "Imagen ilustrativa"
  sobre cada foto de bodas que no sea un trabajo real. **Nunca uses fotos de 15 años en la página de bodas.** Cuando el
  dueño suba fotos reales, se cambian ahí.
- Sin precios ni montos en estas páginas (los precios van en el simulador). Sin "garantía", "24/7", plazos de respuesta
  ni porcentajes de satisfacción. Cifras sólo "+7 años" y "+200 fiestas". No se nombra a nadie del personal. **No se
  menciona la guardería móvil** (ya no se ofrece).
- El texto "Respuesta rápida por WhatsApp o llamada" (`EventLandingPage.tsx` ~330) promete un plazo: cambialo a "Te
  contestamos por WhatsApp".

## Bloque 3 — El contenido de cada página
Los textos salen del documento del dueño. Servicios reales de AK: salón de fiesta, organización, comida (con vajilla y
mobiliario, un solo ítem), decoración, discoteca con iluminación robótica, fotografía, filmación, barra de tragos,
fotocabina, **Vogue** (servicio aparte de la fotocabina) y plataforma 360. Plan básico con 4 regalos, completo con 8.
- **`/bodas` (prioridad).** Título "Organización de bodas en Salto | AK Producciones". Descripción "Salón, comida,
  decoración, discoteca, fotografía y más en un solo lugar. Un solo contacto para toda tu boda en Salto." Titular "Un solo
  contacto, toda tu boda." Subtítulo "Del salón a la última tanda, nos ocupamos de cada detalle. Vos solo disfrutás tu
  noche." Usá "salón", "casamiento" y "Salto" en títulos y textos, y explicá que AK coordina salón (Club Uruguay u otro, o
  chacra) y servicios. Preguntas: ¿pueden en otro salón o chacra?, ¿cómo es la primera reunión?, ¿cuántas personas pueden
  ser?, ¿cómo se paga la seña? (una sola, no una por servicio).
- **`/quinceaneras`** (queda en esa dirección; sumá **`/15-anos` como redirección** a `/quinceaneras` en `next.config.js`,
  no una copia). Título "Fiesta de 15 años en Salto | AK Producciones". Titular "Tu fiesta de 15, sin correr de un
  proveedor a otro." Le habla a la quinceañera y a la familia. **Fotos reales de 15:** las del catálogo. El simulador bien
  destacado. Preguntas: ¿se personaliza con el tema de la quinceañera?, ¿qué incluye el plan básico y el completo? (4 y 8
  regalos), ¿con cuánta anticipación reservar?, ¿hacen el video y las fotos?
- **`/fiestas-empresariales` (página nueva, misma plantilla).** Título "Eventos y fiestas de empresa en Salto | AK
  Producciones". Titular "Tu evento de empresa, resuelto por un solo equipo." **Sólo describe los servicios**: no
  afirmes eventos de empresa hechos ni pongas fotos como si lo fueran. Preguntas: ¿hacen cenas de fin de año?, ¿se adaptan
  a la marca de la empresa?, ¿cuánto antes hay que avisar?, ¿presupuestan para un grupo grande? Fuente del formulario
  nueva `landing-empresas` en el tipo de `crm.ts` ~1196 y en su lista de ~1240.
- **`/cumpleanos`:** ya existe; sumale los bloques de la plantilla. Titular "Vos invitás, nosotros hacemos el resto."
- **`/fiestas-infantiles` (página nueva, misma plantilla).** Título "Fiestas infantiles en Salto | AK Producciones".
  Titular "Su cumple soñado, y vos también lo disfrutás." Le habla a la mamá y al papá. Servicios: salón, organización,
  comida, decoración, discoteca, fotocabina, fotografía. **Nada de guardería móvil.** Si hay fotos reales de cumpleaños
  infantiles en `public/media/`, usalas; si no, imágenes marcadas "Imagen ilustrativa". Preguntas: ¿qué edades?, ¿se puede
  hacer en mi casa o en otro salón?, ¿qué comida hay para los chicos?, ¿cómo se reserva? Fuente `landing-infantiles`.
- **`/fiestas` (página nueva):** una tarjeta por tipo (bodas, 15, cumpleaños, empresas, infantiles) con foto y el mismo botón de
  WhatsApp. Es la que va en la ficha de Google.
- Cada página nueva entra en `PAGINAS_PARA_GOOGLE`, en las rutas públicas y en `slug` de `event-landing.ts`, con su
  título, descripción e imagen para compartir propios. `npm run mapa:generar` al final.

## Bloque 4 — Saber de qué canal llegó
`commercialAttributionFromSearchParams` (`src/lib/commercial/acquisition.ts` ~96) también lee **`?o=`** (`o=tufiesta`,
`o=google`, `o=pinterest`, `o=ig`) como origen, y ese origen llega al contacto del CRM. No cambies cómo se leen los
parámetros que ya existen.

## Bloque 5 — Que se vean desde la portada
1. En el menú de la portada (`src/components/landing/LandingNav.tsx`, lista de enlaces ~61-69) sumá **"Tipos de fiesta"**
   → `/fiestas`. En el celular también.
2. En el pie (`src/components/public-footer.tsx`, columna de servicios ~174-195) sumá los cinco enlaces: Bodas, 15 años,
   Cumpleaños, Fiestas empresariales, Fiestas infantiles.
3. No saques ni reordenes los enlaces que ya están.

## Bloque 6 — Tan lindas y completas como la portada
Hoy `EventLandingPage` es mucho más pobre que la portada (`src/app/page.tsx`). Cada página por tipo **usa las mismas
secciones de la portada**, con el contenido del tipo de fiesta, sin copiarlas (se importan de `src/components/landing/`):
`StatsSection` ("+7 años", "+200 fiestas"), `AkDifferenceSection`, `TechnologyExperienceSection` (fotocabina, Vogue,
plataforma 360), `SalonDestacadoSection` (Club Uruguay), `GaleriaUnificadaSection` o `GallerySection` con las fotos del
tipo, `VideoSection` si hay video de ese tipo, `FAQSection` con las preguntas del bloque 3, y `PublicFooter`. Si una
sección no acepta el contenido por tipo, sumale props opcionales sin cambiar cómo se ve en la portada.
- **Arriba de todo, dos botones grandes y siempre visibles:** "Armar mi presupuesto" (simulador con el tipo ya elegido,
  `simulatorHref`) y "Hablar por WhatsApp" (mensaje con el tipo). En el celular quedan fijos abajo, los dos.
- Portada con la foto grande a pantalla completa, movimiento suave al bajar (habilidad `animaciones-pro`) y un color de
  acento por tipo (bodas dorado suave, 15 el rojo de la marca, infantiles colores alegres, empresas sobrio). Que se
  note que es AK: mismo logo, misma letra, mismo menú que la portada.
- Las secciones de la portada **no cambian** cómo se ven en `/`: la prueba de maquetación de la portada sigue igual.

## Bloque 7 — Los enlaces para publicidad
Cada página tiene una dirección fija y corta (`/bodas`, `/quinceaneras`, `/cumpleanos`, `/fiestas-empresariales`,
`/fiestas-infantiles`, `/fiestas`). El dueño las va a poner en anuncios agregando `?o=meta`, `?o=google`, `?o=ig`,
etc. (bloque 4).
- Sumá en Empresa → Presencia digital (`src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`, en la solapa "Tu página web") una
  tarjeta **"Enlaces para tus anuncios"**: una línea por página y por canal (Instagram/Facebook, Google, WhatsApp) con el
  enlace ya armado y un botón "Copiar". Sólo lectura, sin guardar nada.
- La vista previa al compartir (Open Graph) de cada página tiene su propia foto y texto.

## Bloque 8 — Que Google y las inteligencias artificiales las encuentren
- Cada página: un solo `h1` con el tipo de fiesta y "Salto"; título y descripción propios; canónica; `FAQPage`,
  `LocalBusiness`/`EventPlanner` y `Service` en JSON-LD; texto alternativo en todas las imágenes; imágenes livianas con
  carga diferida (habilidad `que-cargue-rapido`). Que la página tenga texto real (no sólo títulos): 300 palabras o más.
- **`public/llms.txt`** (lo que leen ChatGPT, Gemini, Perplexity y las demás): sumá las cinco páginas y `/fiestas`, y
  corregí lo que no es cierto según el dueño. AK se fundó el **9 de marzo de 2019**, equipo de **30 personas**, trabaja en
  Salto y alrededores, la mayoría de las fiestas en el Club Uruguay. Servicios reales: salón, organización, comida (con
  vajilla y mobiliario), decoración, discoteca con iluminación robótica, fotografía, filmación, barra de tragos,
  fotocabina, Vogue y plataforma 360. **Sacá lo que no está en esa lista** ("conferencias", "espejo mágico con IA",
  "barra sin alcohol", "sonido acústico") salvo que lo encuentres en el catálogo real de servicios. Sin precios.
- `robots.ts` ya deja entrar a todos los buscadores a las páginas públicas: no lo cambies; sólo que las páginas nuevas
  estén en `PAGINAS_PARA_GOOGLE`.

## Lo que NO hay que hacer
- No toques el simulador, el asistente, el CRM ni la portada.
- No cambies las direcciones que ya existen (`/bodas`, `/quinceaneras`, `/cumpleanos`): están en Google y en anuncios.
- No dupliques la plantilla: una sola `EventLandingPage` para todas.
- No inventes reseñas, fotos de bodas ni eventos de empresa.

## Qué tiene que comprobar la prueba
- `tests/e2e/las-paginas-por-tipo-de-fiesta.spec.ts` (escritorio y celular a 360 px): en `/bodas`, `/quinceaneras`,
  `/fiestas-empresariales`, `/fiestas-infantiles`, `/cumpleanos` y `/fiestas` hay **un solo `h1`**, se ve el botón de WhatsApp con el tipo de
  fiesta en el mensaje, y la página no se desborda a lo ancho. En `/bodas` **no** aparece "Boda producida por AK" ni una
  reseña de 15 años, y sí "Imagen ilustrativa". Desde la portada `/`, el menú lleva a `/fiestas` y el pie tiene
  los cinco enlaces, y cada uno abre su página. En cada página por tipo se ven los dos botones (simulador con el
  tipo en la dirección y WhatsApp) sin bajar, también a 360 px. `/15-anos` termina en `/quinceaneras`. Llenar el formulario de
  `/fiestas-empresariales?o=google` manda al servidor la fuente `landing-empresas` y el origen `google` (cortando el
  pedido, sin guardar de verdad).
- `src/__tests__/las-paginas-por-tipo-de-fiesta.test.ts`: las seis páginas tienen su `FAQPage` en JSON-LD con al menos 4
  preguntas (cumpleaños, 2) y están en `PAGINAS_PARA_GOOGLE`; ninguna dice "garantía", "24/7", "guardería" ni un precio
  con `$`.

```comprobar
# Bloque 6
usa: StatsSection en src/components/landing/EventLandingPage.tsx
usa: TechnologyExperienceSection en src/components/landing/EventLandingPage.tsx
usa: fiestas-infantiles en public/llms.txt
usa: fiestas-empresariales en public/llms.txt
usa: 2019 en public/llms.txt
no-usa: espejo mágico con IA en public/llms.txt
usa: Enlaces para tus anuncios en src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx
archivo: src/app/fiestas-empresariales/page.tsx
archivo: src/app/fiestas/page.tsx
archivo: src/app/fiestas-infantiles/page.tsx
usa: /fiestas en src/components/landing/LandingNav.tsx
usa: /fiestas-infantiles en src/components/public-footer.tsx
usa: /fiestas-empresariales en src/components/public-footer.tsx
usa: FAQPage en src/components/landing/EventLandingPage.tsx
usa: landing-empresas en src/app/actions/crm.ts
usa: /fiestas-empresariales en src/lib/seo/paginas-publicas.ts
usa: Imagen ilustrativa en src/app/bodas/page.tsx
no-usa: Boda producida por AK Producciones en src/app/bodas/page.tsx
no-usa: Respuesta rápida por WhatsApp o llamada en src/components/landing/EventLandingPage.tsx
usa: get('o') en src/lib/commercial/acquisition.ts
usa: /15-anos en next.config.js
prueba: tests/e2e/las-paginas-por-tipo-de-fiesta.spec.ts
prueba: src/__tests__/las-paginas-por-tipo-de-fiesta.test.ts
```
