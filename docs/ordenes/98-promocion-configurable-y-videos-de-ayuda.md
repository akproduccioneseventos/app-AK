# 98 — La promoción de la portada se configura, y videos de ayuda en cada pantalla

**Para:** Gemini.
**Escrita por:** Claude, el 29 de septiembre de 2026, por pedido del dueño: *"en las promociones
esta propuesta puede cambiar, debo poder configurar; y quiero poder poner videos de explicaciones
de cómo usar el panel del invitado, el cliente, el video de vida, cada cosa que se necesite que
los demás sepan usar, incluyendo el simulador"*.

## Cómo se entrega

- **En la MISMA propuesta que la orden 96.** Una sola propuesta con las dos órdenes. Si un bloque
  se traba, entregá el resto igual y avisá cuál faltó.
- Arrancá desde la versión principal de ahora.
- Antes de decir "terminé", pasá por `docs/ANTES-DE-ENTREGAR.md`.
- Tipos en cero, `npx jest` en verde, `npm run check:acentos` y `npm run "publicar?"` en verde.
- Anotá lo hecho en `docs/YA-RESUELTO.md` y la línea nueva en `docs/QUE-HAY-EN-LA-APP.md`.

---

## Bloque 1 — El regalo de la portada sale de la promoción que carga el dueño

**Qué pasa hoy.** Abajo de la portada, `src/components/landing/CTASection.tsx` ~l.110-124 tiene el
recuadro "🎁 Regalo de Reserva Inmediata" con el texto **escrito a mano**: *"Confirmando tu
propuesta durante esta semana, te obsequiamos la Plataforma de Video 360°"*. Sale igual todas las
semanas y no se puede cambiar.

**Lo que ya existe y hay que usar (no hacer otro módulo):** las promociones ya se cargan en
`/settings/promos` (`src/app/(app)/settings/promos/page.tsx`), con `PromoActiva` en
`src/types/promo.ts`: `titulo`, `descripcion`, `regalo`, `fechaInicio`, `fechaFin`, `activa`,
`mostrarEnLanding`. La portada ya la lee: `getPromoActiva()` en `src/app/page.tsx` ~l.644.

**Qué hacer:**

1. `CTASection` recibe una prop nueva `promo?: PromoActiva | null`, y `src/app/page.tsx` ~l.766 le
   pasa la misma `promo` que ya tiene.
2. El recuadro **sólo aparece si hay promo** y dice, armado con sus datos:
   - título: `promo.titulo`;
   - texto: `promo.descripcion` si tiene; si no, "Confirmando antes del {fechaFin en formato
     'd de mes'} te regalamos {promo.regalo}.".
   **Sin promo activa, el recuadro no se muestra.** Nada de texto de respaldo escrito a mano.
3. **`getPromoActiva` tiene que mirar las fechas** (`src/app/actions/promos.ts` ~l.19): hoy
   devuelve la promo activa aunque `fechaFin` ya haya pasado, así que la portada promete un regalo
   vencido. Devolvé sólo la que cumpla `fechaInicio <= hoy <= fechaFin`, comparando con
   `hoyEnUruguay()` (`src/lib/utils.ts` ~l.35), **no** con la hora de Greenwich.

**No toques:** el reloj del simulador ni `PromoWidget`; la pantalla de promociones más allá de lo
que haga falta; "Reserva flexible" (~l.126), que no es promoción.

**La prueba** (`src/__tests__/la-promocion-de-la-portada-sale-de-lo-cargado.test.ts`):

- con una promo activa y vigente, `getPromoActiva` la devuelve; con `fechaFin` de ayer (en hora de
  Uruguay), devuelve `null`; con `fechaInicio` de mañana, `null`;
- renderizando `CTASection` con esa promo aparece su `regalo`; sin promo **no aparece** "Regalo de
  Reserva" ni "durante esta semana";
- tiene que ponerse en rojo si se vuelve a escribir el texto fijo.

## Bloque 2 — Videos de ayuda que el dueño carga, uno por pantalla

**Qué quiere el dueño:** poner un video que explique cómo se usa cada pantalla que usan otros
(invitado, cliente, video de vida, simulador…). **No existe nada parecido hoy** (se buscó
"tutorial", "video de ayuda", "cómo usar": cero resultados).

**Los videos se cargan como enlace de YouTube** (puede ser "no listado"). **No se suben archivos
de video a la app**: servirlos desde el almacenamiento de Firebase cobra por cada vez que alguien
los mira, y el dueño decidió que nada suba lo que se paga por mes. Si pega un enlace que no es de
YouTube, el formulario lo dice y no guarda.

**Los lugares** (constante `LUGARES_CON_VIDEO` en `src/lib/videos-de-ayuda.ts`, cada uno con su
clave, su nombre para el dueño y la pantalla donde aparece):

| Clave | Nombre en Ajustes | Pantalla |
|---|---|---|
| `portal-invitado` | Panel del invitado | `src/app/portal-invitado/[fiestaId]/[guestId]/page.tsx` |
| `hub-de-la-fiesta` | La puerta de la fiesta (hub) | `src/app/evento/hub/[fiestaId]/page.tsx` |
| `portal-cliente` | Portal del cliente | `src/app/portal-cliente/[id]/page.tsx` |
| `video-de-vida` | Video de Vida (subir fotos) | `src/app/video-vida/[fiestaId]/page.tsx` |
| `simulador` | Simulador de presupuesto | `src/app/simulador-de-presupuesto/page.tsx` |
| `muro-subir-foto` | Subir fotos al muro | `src/app/evento/social/[fiestaId]/page.tsx` |

**Dónde se guardan:** `videos-de-ayuda.json` es un documento entero (no está en
`FILE_TO_COLLECTION` de `src/lib/firebase-sync.ts`), así que se guarda con
`mutateGenericJsonArray` (`src/lib/generic-json-store.ts` ~l.58), como lista de
`{ lugar, youtubeUrl, titulo, actualizadoEn }`. **No** con `writeData` de la lista entera.

**Qué hacer:**

1. `src/lib/videos-de-ayuda.ts`: `LUGARES_CON_VIDEO`, y la función pura
   `idDeYoutube(url): string | null`, que acepta `youtube.com/watch?v=`, `youtu.be/` y
   `youtube.com/shorts/`, y devuelve `null` para cualquier otra cosa.
2. `src/app/actions/videos-de-ayuda.ts`:
   - `getVideosDeAyuda()` — pública (la usan invitados sin sesión): devuelve sólo
     `{ lugar, videoId, titulo }`;
   - `guardarVideoDeAyuda(lugar, url, titulo)` y `quitarVideoDeAyuda(lugar)` — **con
     `requireAppSession()`**, validando que `lugar` esté en `LUGARES_CON_VIDEO` y que
     `idDeYoutube` no dé `null`. Si el guardado falla, devuelven el error y la pantalla lo muestra.
3. Pantalla nueva `src/app/(app)/settings/videos-de-ayuda/page.tsx`: una tarjeta por lugar, con el
   enlace, el título, una vista previa del video y "Quitar". Sumala al listado de
   `src/app/(app)/settings/page.tsx` y corré `npm run mapa:generar`.
4. Componente `src/components/ayuda/VideoDeAyuda.tsx` (`lugar` como prop): un botón chico
   "▶ ¿Cómo se usa?" que abre el video en una ventana, con
   `https://www.youtube-nocookie.com/embed/{videoId}`. **Si ese lugar no tiene video, no muestra
   nada.** Ponelo en las seis pantallas de la tabla, arriba y visible en el celular (ver la
   habilidad `celular-primero`).

**La prueba** (`src/__tests__/los-videos-de-ayuda-se-ven-donde-se-cargaron.test.ts`):

- `idDeYoutube` con los tres formatos da el mismo id, y con un enlace de Drive o texto da `null`;
- `guardarVideoDeAyuda` sin sesión falla y no guarda; con un `lugar` inventado, no guarda;
- `VideoDeAyuda lugar="portal-cliente"` con video cargado muestra el botón y, al tocarlo, un
  `iframe` con ese id; sin video, no renderiza nada;
- dos guardados a la vez de lugares distintos quedan los dos (la base de mentira devuelve una
  copia en cada lectura).

```comprobar
usa: promo en src/components/landing/CTASection.tsx
no-usa: durante esta semana en src/components/landing/CTASection.tsx
usa: hoyEnUruguay en src/app/actions/promos.ts
prueba: src/__tests__/la-promocion-de-la-portada-sale-de-lo-cargado.test.ts
archivo: src/lib/videos-de-ayuda.ts
archivo: src/app/(app)/settings/videos-de-ayuda/page.tsx
usa: VideoDeAyuda en src/app/portal-invitado/[fiestaId]/[guestId]/page.tsx
usa: VideoDeAyuda en src/app/evento/hub/[fiestaId]/page.tsx
usa: VideoDeAyuda en src/app/portal-cliente/[id]/page.tsx
usa: VideoDeAyuda en src/app/video-vida/[fiestaId]/page.tsx
usa: VideoDeAyuda en src/app/simulador-de-presupuesto/page.tsx
usa: VideoDeAyuda en src/app/evento/social/[fiestaId]/page.tsx
usa: mutateGenericJsonArray en src/app/actions/videos-de-ayuda.ts
prueba: src/__tests__/los-videos-de-ayuda-se-ven-donde-se-cargaron.test.ts
```
