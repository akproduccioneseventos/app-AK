# Orden 62 — Sacar las copias viejas que no usa nadie

**Para Gemini. UNA SOLA PROPUESTA.** Es trabajo mecánico y de bajo riesgo, pero **hay que
hacerlo con cuidado**: la lista de abajo ya está verificada, la de "no tocar" también.

## Por qué

El barrido completo de la app marcó 24 pedazos de código que **no llama nadie**. Los revisé
uno por uno. **Ninguno es una función que falte**: la mesa de regalos anda por otro camino, el
recordatorio de confirmación anda, y el podio de la trivia se dibuja de verdad en la pantalla
del salón (`game.tableLeaderboard`, en `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx`,
línea ~2104). Lo que sobra son **copias viejas de pantallas que ya existen**.

**El riesgo no es que anden mal: es que se despeguen.** Ya pasó con la carga de fotos del
Video de Vida, que estaba copiada en dos lugares y alguien editó la equivocada.

## Los 19 archivos que SE SACAN

Comprobé para cada uno que **ningún otro archivo del proyecto lo nombra** (busqué por el
nombre del archivo en todo `src`, `scripts`, `tests` y `docs`):

- `src/app/presentacion-led/slides/menu-slide.tsx`
- `src/app/presentacion-led/slides/recursos-slide.tsx`
- `src/components/decoracion/VistaDecorativaEditor.tsx`
- `src/components/games/LeaderboardDisplay.tsx`
- `src/components/games/TriviaAdminPanel.tsx`
- `src/components/gastronomia/InsumosStockList.tsx`
- `src/components/invitacion/GiftRegistryConfig.tsx`
- `src/components/invitacion/GiftRegistryModal.tsx`
- `src/components/landing/CommercialJourneySection.tsx`
- `src/components/landing/ProcessSection.tsx`
- `src/components/repaso-diario/AlertasErroresHumanosSection.tsx`
- `src/components/rsvp/RsvpReminderPanel.tsx`
- `src/components/ui/action-button.tsx`
- `src/components/ui/menubar.tsx`
- `src/lib/assistant/catering-parser.ts`
- `src/lib/automatico/repaso-matutino-ia.ts`
- `src/lib/google-wallet-pass.ts`
- `src/lib/product-launch/event-command-center.ts`
- `src/lib/simulador-v2-constants.ts`

## Lo que NO se toca, aunque el control los nombre

Estos aparecen en la lista del control porque **algunos de sus nombres exportados** no se usan,
pero **el archivo sí lo usa alguien**. Sacarlos rompe la app:

- `src/app/actions/blog-ai.ts` (5 archivos lo nombran)
- `src/app/actions/experience-total.ts` (2)
- `src/app/portal/c/[accessKey]/PublicPortalProView.tsx` (1)
- `src/components/presupuestos/paso-4-resumen.tsx` (2)

Y **`src/data/seeds/vana-rodriguez-fixture.ts` tampoco se toca**: son datos de ejemplo, no
código, y que "no lo llame nadie" es lo esperado.

## Antes de subir, comprobá estas cuatro cosas

1. **El revisor de tipos en cero.** Es el que agarra si algo importaba alguno de esos archivos.
2. **Todas las pruebas en verde.**
3. **`npm run lo-que-se-dijo:todo`**: la cantidad de "nadie lo llama" tiene que **bajar de 24 a
   5**. Si baja menos, sacaste de menos; si baja más, sacaste algo que no estaba en la lista.
4. **La trivia y el podio se siguen viendo en la pantalla del salón**, y la invitación sigue
   mostrando la sección de regalos. Son las dos que más se parecen a lo que se saca.

## Si algo no cierra

Si el revisor de tipos marca que un archivo de la lista sí se usaba, **dejalo, no lo fuerces**,
y avisá cuál en la propuesta. Es preferible sacar 18 y que ande, que sacar 19 y romper una
pantalla.

```comprobar
archivo: docs/ordenes/62-sacar-las-copias-viejas-que-no-usa-nadie.md
```
