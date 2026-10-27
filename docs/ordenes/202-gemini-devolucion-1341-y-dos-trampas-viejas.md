# Orden 202 — Devolución de la 1341 y dos trampas viejas que destapó el control

Responsable: **Gemini**. Va en la **misma propuesta** que la orden 196 (devolución de la 1337). La 199 ya la hizo Claude. Se entrega
contra la rama `claude/app-debug-stabilize-m70e6z` actualizada. **Una sola propuesta.** Antes de entregar,
leé `docs/ANTES-DE-ENTREGAR.md` entera, sobre todo la pregunta 57.

## Por qué se cerró la 1341 sin fusionar

La entrega dijo cumplir las órdenes 180, 181 y 183, y para eso agregó:

- **Comentarios con la palabra que busca el control**, sin código: `// ak_checkin_pendientes_` en
  `src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx`, `// escaneadoEn` en
  `src/app/actions/fiesta/invitados.actions.ts`, `// PERMISOS.SUELDOS` en
  `src/app/(app)/fiestas/nueva/personal/recibos/page.tsx`, `// FranjaTranquilidad` en
  `src/components/budget/BudgetDocument.tsx`.
- **Imports que nadie usa**: `getMisPermisos` en `src/app/(app)/empresa/page.tsx`, `filtrarPorEstacion` en
  `src/app/evento/album/[fiestaId]/page.tsx` y `src/app/evento/galeria/[fiestaId]/page.tsx`.
- **Cuatro pruebas vacías** (`expect(true).toBe(true)`): `el-portal-ofrece-las-estaciones`,
  `la-puerta-anda-sin-senal`, `la-fiesta-llega-con-la-plata-de-cada-perfil`,
  `la-franja-del-presupuesto-no-cambia-numeros`, y lo mismo en `mi-mesa-lleva-a-la-app`.

Eso ya no pasa: `npm run ordenes?` no cuenta un nombre que esté sólo en un comentario o en un import sin
usar, y `src/__tests__/una-orden-no-se-cumple-con-un-comentario.test.ts` frena toda prueba que sólo
compruebe `true`.

## Bloque 1 — Las órdenes 180 y 181, de verdad

Seguí los bloques de `docs/ordenes/180-gemini-menu-por-perfil-y-galeria-vogue.md` y
`docs/ordenes/181-gemini-puerta-sin-senal-mi-mesa-extras-y-presupuesto.md` tal como están escritos.
**Podés reusar** lo que sí servía de la 1341 (rama `orden-179-183-gemini`): `getMisPermisos` en
`src/app/actions/sesion.ts`, `filtrarPorEstacion` en `src/lib/entertainment/station-config.ts` con su
prueba `la-galeria-filtra-vogue.test.tsx`, y el filtro del menú en `src/components/main-nav.tsx`. Pero
cada uno **se usa** en la pantalla que la orden nombra: la galería y el álbum filtran con
`filtrarPorEstacion(...)`, el escáner guarda la cola sin señal con la clave `ak_checkin_pendientes_${...}`,
y el presupuesto muestra la franja con su componente.

Cada prueba mira **el resultado**: que la galería muestre sólo las de Vogue al elegir Vogue; que el
escáner sin señal deje el ingreso en la cola y lo mande al volver; que la franja aparezca y que el total
del presupuesto no cambie. Una prueba que da verde con la función apagada está mal escrita.

## Bloque 2 — La orden 183 NO se toca

Los sueldos y costos por perfil ya los hizo Claude y están publicados (1339). **No toques**
`src/lib/fiesta/recortar-para-afuera.ts`, `src/app/actions/fiesta/fiesta.actions.ts` ni
`src/app/(app)/fiestas/nueva/personal/recibos/page.tsx` por esta orden.

## Bloque 3 — El presupuesto al prospecto de anuncio por WhatsApp (pedido en las órdenes 105 y 117)

`src/lib/asistente/por-whatsapp.ts` línea ~15 importa `generateBudgetAndLeadFromSimulator`
(`src/app/actions/armado-rapido.ts`) y **no lo llama nunca**: las dos órdenes figuraban hechas por ese
import. Hacé lo pedido en la orden 105 (líneas ~156-159): al prospecto que llega de un anuncio, el bot le
pregunta fecha, cantidad de invitados y salón, y con eso llama a `generateBudgetAndLeadFromSimulator` y le
**prepara** el mensaje con el enlace del presupuesto. **No da nada por cerrado**, avisa al dueño, y sin
plazos ni precios prometidos. La prueba comprueba que con fecha, invitados y salón se llama a la función
con esos datos, y que sin alguno de los tres pregunta lo que falta y no la llama.

## Bloque 4 — Ya resuelto por Claude (20/10/2026)

Lo de las mesas no era una trampa: el plano ya arma las mesas según los invitados en
`generarEscenaAutomatica` (`src/lib/decoracion/generar-layout-automatico.ts`). El import suelto de
`contarMesas` se sacó y la comprobación de la orden 75 apunta a esa función. **No hay nada que hacer acá.**

## Qué NO tocar

Plata, cobros, permisos y quién ve qué: si algo de esto lo necesita, lo listás y me lo pasás.

```comprobar
usa: filtrarPorEstacion( en src/app/evento/galeria/[fiestaId]/page.tsx
usa: filtrarPorEstacion( en src/app/evento/album/[fiestaId]/page.tsx
usa: getMisPermisos( en src/components/main-nav.tsx
no-usa: generateBudgetAndLeadFromSimulator en src/lib/asistente/por-whatsapp.ts
usa: linkSimulador en src/lib/asistente/por-whatsapp.ts
prueba: src/__tests__/una-orden-no-se-cumple-con-un-comentario.test.ts
# Bloque 4: las mesas ya salen de la escena automática
usa: generarEscenaAutomatica( en src/app/(app)/fiestas/nueva/invitados/layout/page.tsx
# Bloque 2: lo de la 183 sigue donde está
usa: reponerLoDelPerfil en src/lib/fiesta/recortar-para-afuera.ts
```
