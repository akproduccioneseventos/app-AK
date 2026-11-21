# Orden 331 — Menos pantallas, mismo resultado: el simulador primero, el planificador agrupado y una puerta para las estaciones (21/11/2026)

**Pedido del dueño:** *"lo que se pueda achicar pero que no pierda la funcionalidad; no puede haber tres del simulador, tiene que
haber una; después está el presupuesto manual, que es otra cosa; la planificación también: a veces menos es más"*.

**Cómo se entrega:** **arrancá de la versión principal recién cuando esté fusionada la 1458** (órdenes 322 a 330; la fusiona
Claude). Una sola propuesta con los cuatro bloques; si uno se traba, entregá el resto y decí cuál faltó. Antes de decir
"terminé": `npm run "publicar?"` completo y `docs/ANTES-DE-ENTREGAR.md`.

**Lo que salió mal la vez pasada (1443) y no se repite:** redirecciones con comodín (`/fiestas/:id`) taparon pantallas
(`/fiestas/nueva`), y se cambiaron pruebas para que pasaran. Acá: **toda redirección nueva es exacta** (sin `:path*` ni `:id`
genérico; si hace falta un parámetro, con expresión que excluya las rutas hermanas, como ya hace `next.config.js` en
`/presupuestos/:id(...)`), la prueba `src/__tests__/una-redireccion-no-tapa-una-pantalla.test.ts` tiene que seguir verde, y
**cada prueba que cambies lleva en el commit por qué** (la pantalla se movió y adónde).

Hoy son **186 pantallas** (contadas por Claude el 21/11). Con esta orden quedan unas **150**.

## Bloque 1 — El simulador de siempre, primero; Sofía aparte

Hoy hay tres (investigado por Claude):

- `src/app/simulador/page.tsx`: una portada que sólo ofrece dos botones, "Armado Rápido de Propuesta" y "Conversar con Sofía IA".
- `src/app/simulador-de-presupuesto/page.tsx` (~3330 líneas): el simulador de verdad, con el reloj y la promoción.
- `src/app/simulador-ak/page.tsx` (~1450 líneas): Sofía conversando (`chatWithBudgetCopilot`, `src/app/actions/simulador-copilot.ts`).

Los dos últimos guardan con la misma acción (`generateBudgetAndLeadFromSimulator`, `src/app/actions/armado-rapido.ts`).

Qué se hace:

- **Queda uno: `/simulador-de-presupuesto`, EXACTAMENTE como está hoy.** Decisión del dueño (21/11): *"yo quiero la mejora que
  hicimos al simulador"*. Sus pasos no cambian: primero muestra el servicio, después pide los datos, y recién ahí los paquetes,
  con el reloj y la promoción. **No se le saca, agrega ni reordena nada**, salvo el botón de abajo.
- **Sofía NO va adentro ni arriba del simulador** (corregido por el dueño el 21/11: *"el simulador tiene que ir primero, el que
  ya estamos usando"*; Sofía fue una prueba). Sofía **queda en su página propia, `/simulador-ak`, sin cambiarle nada de lo que
  dice ni de cómo calcula**, y se llega a ella por un solo lugar: **al pie del simulador**, debajo de todo, una línea chica y
  discreta *"¿Preferís armarlo conversando? Probá con Sofía, nuestra asistente"* que lleva a `/simulador-ak` conservando lo que
  traiga la dirección (`source`, `campaign`, `refFiesta`, `utm_*`). Ningún otro botón de la web, la app ni los mensajes lleva a
  Sofía: todos llevan al simulador.
- **Arreglo en Sofía (Claude lo confirmó en el código):** hoy, si el guardado falla (`result.success` falso o error en
  `handleSaveBudget`, `src/app/simulador-ak/page.tsx` ~724-731), **no se avisa nada** y, como `autoSaveAttemptRef` ya quedó con
  esa combinación, **no se vuelve a intentar**: el prospecto se pierde sin que nadie se entere. En esa misma página: si falla, un
  cartel *"No pudimos guardar tu presupuesto. Tocá Reintentar o escribinos por WhatsApp"* con botón **Reintentar** (limpia
  `autoSaveAttemptRef.current` y vuelve a llamar) y el enlace de `buildWhatsAppLink`. Mismo `submissionId`, así reintentar no
  crea dos.
- **`/simulador`** (la portada de dos botones, `src/app/simulador/page.tsx`) se borra y pasa a redirección **exacta** a
  `/simulador-de-presupuesto`, conservando lo que traiga la dirección. **`/simulador-ak` NO se redirige.**
- El menú (`src/lib/navegacion/mapa.ts`, la entrada "Simulador") apunta al único. Los enlaces en la web, el muro y los mensajes
  que digan `/simulador-ak` o `/simulador` se cambian al simulador (buscá las dos rutas en `src/`); el único enlace a
  `/simulador-ak` que queda es el del pie del simulador.
- **No se toca:** el reloj, la promoción, los regalos, los textos y la seña (decisiones del dueño). **El presupuesto manual del
  equipo (`/presupuestos/nuevo`) no se toca**: es otra cosa.

## Bloque 2 — El planificador: de 28 pantallas a 5

Hoy cada parte de la fiesta es una pantalla suelta en `src/app/(app)/fiestas/nueva/<parte>/page.tsx` (28). Se agrupan en **cinco
pantallas con solapas** (la decisión del 16/10/2026: cinco pestañas por fiesta):

| Pantalla nueva | Solapas (cada una es una de las de hoy) |
|---|---|
| `nueva/datos` | configuracion, invitados, alergias, regalos, servicios-contratados |
| `nueva/comida` | catering |
| `nueva/show` | entretenimiento, musica, fotografia, video-vida, muro-social, modulo-invitado, decoracion |
| `nueva/operacion` | personal, carga-operativa, itinerario, orden-de-evento, tareas, reuniones, proveedores-portal, asistente, buzon |
| `nueva/plata-y-papeles` | plan-pagos, gestion-costos-rentabilidad, gestion-documental, portal-cliente, post-evento |

- Cada pantalla de hoy pasa a un panel en `src/components/fiestas/panels/<parte>.tsx`, **como ya se hizo con `pagina-web.tsx`**,
  y se monta en su solapa (que se carga recién al abrirla, igual que los paneles de Ajustes, `lazyPanel` en
  `src/app/(app)/settings/page.tsx` ~43).
- La dirección vieja (`/fiestas/nueva/catering?fiestaId=X`) redirige **exacta** a la nueva con la solapa
  (`/fiestas/nueva/comida?fiestaId=X&tab=catering`).
- Se quedan como están: `nueva` (la raíz) y `[id]/centro`.
- **No se pierde ni una función** (lo pidió el dueño: *"tiene que tener todo lo que yo hago a mano"*): las 28 partes de hoy
  quedan todas, cada una como solapa, con sus mismos botones y campos. Lo único que cambia es que en vez de 28 entradas sueltas
  hay 5, y adentro se pasa de una parte a otra con un toque en la solapa, sin volver atrás.
- **Plan de pagos y costos (`plan-pagos`, `gestion-costos-rentabilidad`) sólo se mueven**: no cambia cómo guardan, ni quién los ve.
  Claude los revisa línea por línea.

## Bloque 3 — Una sola puerta para las estaciones

Once pantallas hacen lo mismo: `src/app/evento/<estacion>/page.tsx` (fotocabina, touchpix, espejo-magico, totem, plataforma-360,
impresion, barra, buzon, dj, muro-en-vivo, video-vida) son una línea cada una: `<KioskSetup defaultRole="..." />`
(`src/components/kiosk/kiosk-setup.tsx` ~65). Y `/evento/inicio` ya es la pantalla de elegir el entretenimiento con iconos.

- Se borran las once; cada `/evento/<estacion>` (exacto, **sin** lo que viene después) redirige a `/evento/inicio?rol=<estacion>`,
  y `inicio` abre con esa estación ya elegida (pasale el `rol` a `KioskSetup` como `defaultRole`).
- **Las direcciones con fiesta (`/evento/fotocabina/[fiestaId]`, etc.) NO se tocan**: están en QR impresos.

## Bloque 4 — Que el número quede y no vuelva a crecer

- El tope de pantallas (`src/__tests__/la-app-no-pasa-de-180-pantallas.test.ts` y los otros dos que lo repiten) baja al número
  nuevo, `npm run mapa:generar`, y el manual queda al día.

## Qué NO tocar

- El presupuesto manual, los cobros, el reloj y los textos del simulador.
- Las direcciones de las estaciones con fiesta (QR impresos).
- Lo que hace cada panel: se mueve, no se rehace.

## Qué tiene que comprobar la prueba

- **Navegador:** `/simulador?source=x` llega al simulador con `source=x`; los pasos del simulador son **los mismos de hoy**
  (servicio → datos → paquetes) y el reloj sigue apareciendo al generar; al pie está la línea de Sofía y lleva a
  `/simulador-ak` con el `source`; `/simulador-ak` sigue abriendo la charla y Sofía saluda.
- **Jest (Sofía):** con `generateBudgetAndLeadFromSimulator` devolviendo `{ success: false }`, la página de Sofía muestra el
  cartel "No pudimos guardar" y al tocar Reintentar lo llama **otra vez con el mismo `submissionId`**. Con éxito, no hay cartel.
- **Navegador:** `/fiestas/nueva/catering?fiestaId=<prueba>` termina en `nueva/comida` con la solapa Catering abierta y su contenido;
  lo mismo para `plan-pagos` en `plata-y-papeles`.
- **Navegador:** `/evento/fotocabina` abre `/evento/inicio` con Fotocabina elegida, y `/evento/fotocabina/<prueba>` sigue abriendo la
  estación como hoy.
- **Jest:** ninguna redirección tapa una pantalla (la prueba de siempre) y el tope de pantallas es el nuevo número.

```comprobar
usa: simulador-ak en src/app/simulador-de-presupuesto/page.tsx
usa: Reintentar en src/app/simulador-ak/page.tsx
usa: No pudimos guardar tu presupuesto en src/app/simulador-ak/page.tsx
usa: simulador-de-presupuesto en src/lib/navegacion/mapa.ts
archivo: src/app/(app)/fiestas/nueva/datos/page.tsx
archivo: src/app/(app)/fiestas/nueva/comida/page.tsx
archivo: src/app/(app)/fiestas/nueva/show/page.tsx
archivo: src/app/(app)/fiestas/nueva/operacion/page.tsx
archivo: src/app/(app)/fiestas/nueva/plata-y-papeles/page.tsx
archivo: src/components/fiestas/panels/catering.tsx
archivo: src/components/fiestas/panels/plan-pagos.tsx
usa: rol en src/app/evento/inicio/page.tsx
usa: defaultRole en src/components/kiosk/kiosk-setup.tsx
archivo: src/__tests__/una-redireccion-no-tapa-una-pantalla.test.ts
archivo: src/app/(app)/settings/page.tsx
archivo: src/app/actions/armado-rapido.ts
archivo: src/app/actions/simulador-copilot.ts
archivo: src/__tests__/la-app-no-pasa-de-180-pantallas.test.ts
no-usa: '/simulador-ak' en src/lib/navegacion/mapa.ts
```
