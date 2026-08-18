# Que la gente me encuentre: la web, Google y dos redes más

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 18 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**.

> **Se entrega UNA SOLA propuesta con los cuatro bloques adentro.** Cada fusión
> dispara un despliegue y eso se paga. Si un bloque se traba, **entregá los otros
> tres igual, en la misma propuesta**, y decí cuál faltó y por qué.

## Lo que YA existe (verificado, NO lo rehagas)

Esto se comprobó archivo por archivo antes de escribir la orden:

- **Google Analytics 4 ya está instalado y enchufado** en la web pública:
  `src/components/google-analytics.tsx`, montado en `src/app/layout.tsx:128`, con
  la variable `NEXT_PUBLIC_GA_MEASUREMENT_ID`. **No lo instales de nuevo.**
- **La verificación de Google Search Console ya está**:
  `src/lib/google-search-console.ts`.
- **`sitemap.xml` y `robots.txt` ya se generan solos**: `src/app/sitemap.ts` y
  `src/app/robots.ts`, desde la lista `PAGINAS_PARA_GOOGLE`.
- **Las páginas públicas ya tienen título y descripción propios** (bodas,
  quinceañeras, cumpleaños, blog, catálogo, landings de campaña).
- **Ya hay datos estructurados de negocio local** (`LocalBusinessSchema`).
- **El centro de presencia digital ya tiene cinco solapas** y ya guarda los
  números todos los días con una tarea que corre sola.

Lo que falta es otra cosa: **mostrar lo que Google Analytics ya está midiendo**, y
sumar las redes y las fichas que no están.

---

# BLOQUE 1 — La web, adentro del panel

Hoy Analytics mide todo y **el dueño tiene que entrar al panel de Google para
verlo**. La idea del centro de presencia digital es que no tenga que ir a ningún
lado.

**Qué hacer:** una solapa nueva, **"Tu página web"**, en
`src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx`, al lado de
las cinco que ya están.

Qué muestra, leyendo la API de datos de Google Analytics 4:

- **Cuánta gente entró** en los últimos 7, 30 y 90 días, y si sube o baja contra
  el período anterior.
- **De dónde llegaron**: buscando en Google, desde Instagram, desde Facebook,
  escribiendo la dirección, desde un enlace de campaña.
- **Qué páginas miraron más**, con el nombre en criollo ("Quinceañeras",
  "Simulador de presupuesto"), no la dirección técnica.
- **Cuántos llegaron al simulador y cuántos lo terminaron.** Ése es el número que
  vale plata: es dónde se cae la gente.

## Lo que no se negocia en este bloque

- **Los accesos NO van en un archivo del repositorio.** Van por variables de
  entorno. Ya se coló dos veces y no puede volver a pasar.
- **Si no hay accesos configurados, la solapa dice "sin dato" y explica en una
  línea qué falta.** Nunca un número inventado: ya pasó en este mismo panel y hubo
  que arreglarlo.
- **Guardá el número de cada día**, igual que se hace con las redes, enganchado a
  la tarea que ya existe (`src/app/api/cron/metricas-de-redes/route.ts`).
  Analytics guarda hacia atrás, pero tener el histórico propio junto al de las
  redes es lo que permite comparar.

# BLOQUE 2 — Pinterest, X y Threads en el panel

Hoy el panel conoce seis redes (`PlatformName` en
`src/types/presencia-digital.ts`) y el planificador conoce siete
(`SocialPlatform` en `src/types/social-media.ts`, que ya incluye Threads y X).
**Pinterest no está en ninguno de los dos.**

**Qué hacer:**

- Sumar **Pinterest** a las dos listas, y emparejar `PlatformName` con las que ya
  están en `SocialPlatform` (**Threads** y **X**).
- Que las tres aparezcan en todas las solapas del panel y en la pantalla de Redes
  Sociales, con su ícono y su color.
- **Publicar en ellas: modo "Listo para copiar"**, igual que TikTok hoy. La app
  arma el texto y la imagen, y la persona los sube. Publicar automático en X se
  paga y en Pinterest hace falta que aprueben la aplicación: **no lo intentes**.
- **Pinterest es la que más rinde de las tres para este negocio** —las madres de
  quinceañeras buscan ideas de decoración ahí y las fotos siguen apareciendo años
  después—, así que cuando el panel sugiera contenido, que la tenga en cuenta con
  fotos de decoración, mesas y ambientación, no con videos de la pista.

**Ojo con esto, que ya rompió una fusión:** cuando agregues una red, agregala
**también en los dos mapas de íconos** de las tablas. `platformIcons` está tipado
como `Record<SocialPlatform, ...>` justamente para que falte uno rompa la
compilación y no la pantalla.

# BLOQUE 3 — La ficha de Google, que existe y no la abre nadie

`src/components/google-business-profile.tsx` **está escrito y no lo importa
ningún archivo**. Es una pantalla que nadie puede ver.

Es la cuarta vez que aparece algo así, y **la ficha de Google es lo que más pesa
para que lo encuentren**: la gente busca "salón de fiestas Salto" y decide ahí,
antes de entrar a la web.

**Qué hacer:**

- Enchufarlo como una sección adentro del centro de presencia digital, con las
  reseñas, el puntaje y cuánta gente lo encontró por Google.
- **Si no hay accesos, muestra vacío y dice qué falta.** No inventes reseñas.
- **Decí en la entrega desde qué botón se llega.** Una pantalla a la que no lleva
  ningún enlace es trabajo tirado.

# BLOQUE 4 — Que Google entienda mejor lo que vende

Ya hay datos de negocio local. Faltan los que hacen que Google muestre el
resultado **más grande y con estrellas**, que es lo que hace que le hagan clic.

**Qué hacer:**

- **Preguntas frecuentes** (`FAQPage`) en las páginas de bodas, quinceañeras y
  cumpleaños. Las preguntas salen de las que el equipo ya contesta todos los
  días: cuánta gente entra, qué incluye, cómo se reserva, si se puede pagar en
  cuotas. **Si la respuesta no está escrita en ningún lado de la app, no la
  inventes:** dejá la pregunta afuera y decilo en la entrega.
- **Reseñas** (`Review` / `AggregateRating`) **sólo si hay reseñas reales
  guardadas.** Si no las hay, este punto no se hace: inventar estrellas es
  motivo de sanción de Google y te saca del mapa.
- **Migas de pan** (`BreadcrumbList`) en las páginas públicas.
- **Revisá que el `sitemap.xml` incluya todo lo público de hoy**: las notas del
  blog, el catálogo de servicios y las landings de campaña. Si alguna no está,
  Google no la conoce.

---

## Lo que NO se toca

- **Plata, cobros, comida y permisos: eso lo escribe Claude.**
- **No toques `public/firebase-messaging-sw.js`.** Lo genera el compilador y en la
  versión principal queda el que no hace nada. **Es la tercera vez que se cuela
  con la configuración escrita adentro.**
- **No rehagas** el centro de presencia digital, la tarea que guarda los números,
  el sitemap ni Analytics: están y funcionan.
- **No pongas ningún acceso ni clave dentro de un archivo del repositorio.**

## Los controles antes de entregar

1. `npx tsc --noEmit`
2. `npx jest --silent`
3. `npm run check:acentos`
4. `npm run build`

Sobre el conjunto entero. **Si el revisor de tipos da un solo error, no subas.**
Las tres cosas que trabaron entregas anteriores:

1. **Antes de usar una función o un campo, abrí el archivo y confirmá que existe.**
   La última entrega usó cuatro nombres de campo que no existían.
2. **Decí desde qué pantalla se ve cada cosa nueva.**
3. **Que las pruebas nuevas prueben lo que la pantalla usa de verdad.** Las
   últimas reemplazaban funciones que la pantalla no llama, así que pasaban en
   verde midiendo otra cosa.

## Cuando termines

Anotá en `docs/YA-RESUELTO.md` sólo lo que hiciste de verdad, actualizá
`docs/QUE-HAY-EN-LA-APP.md`, avisá el número de la propuesta y mové este archivo
a `hechas/` **en la misma propuesta**.
