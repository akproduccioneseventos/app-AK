# Orden 331 — Menos pantallas, mismo resultado: un simulador, el planificador agrupado y una puerta para las estaciones (21/11/2026)

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

## Bloque 1 — Un solo simulador

Hoy hay tres (investigado por Claude):

- `src/app/simulador/page.tsx`: una portada que sólo ofrece dos botones, "Armado Rápido de Propuesta" y "Conversar con Sofía IA".
- `src/app/simulador-de-presupuesto/page.tsx` (~3330 líneas): el simulador de verdad, con el reloj y la promoción.
- `src/app/simulador-ak/page.tsx` (~1450 líneas): Sofía conversando (`chatWithBudgetCopilot`, `src/app/actions/simulador-copilot.ts`).

Los dos últimos guardan con la misma acción (`generateBudgetAndLeadFromSimulator`, `src/app/actions/armado-rapido.ts`).

Qué se hace:

- **Queda uno: `/simulador-de-presupuesto`, EXACTAMENTE como está hoy.** Decisión del dueño (21/11): *"yo quiero la mejora que
  hicimos al simulador"*. Sus pasos no cambian: primero muestra el servicio, después pide los datos, y recién ahí los paquetes,
  con el reloj y la promoción. **No se le saca, agrega ni reordena nada**, salvo el botón de abajo.
- Adentro, arriba, un botón **"Prefiero que me guíe Sofía"** que abre la charla de Sofía en la misma pantalla. Es **optativo**:
  quien no lo toca ve el simulador de siempre. Pasá la charla de `simulador-ak/page.tsx` (estado y `handleSendMessage` ~425-680,
  `handleSaveBudget` ~680-735, autoguardado ~740-756, cambio de paquete ~757-800, `ChatWindow` ~905) a un componente
  `src/components/simulador/SofiaChat.tsx` **sin cambiarle nada de lo que dice ni de cómo calcula** (sigue usando
  `calculateSimulatorPricing`, igual que el simulador), y montalo ahí.
- **Arreglo que va con el traslado (Claude lo confirmó en el código):** hoy, si el guardado de Sofía falla
  (`result.success` falso o error en `handleSaveBudget`, ~724-731), **no se avisa nada** y, como `autoSaveAttemptRef` ya quedó
  con esa combinación, **no se vuelve a intentar**: el prospecto se pierde sin que nadie se entere. En el componente nuevo:
  si falla, un cartel *"No pudimos guardar tu presupuesto. Tocá Reintentar o escribinos por WhatsApp"* con botón
  **Reintentar** (limpia `autoSaveAttemptRef.current` y vuelve a llamar) y el enlace de `buildWhatsAppLink`. Mismo
  `submissionId`, así reintentar no crea dos.
- `/simulador` y `/simulador-ak` pasan a redirecciones **exactas** a `/simulador-de-presupuesto`, conservando lo que traiga la
  dirección (`source`, `campaign`, `refFiesta`, `utm_*`), y `/simulador-ak` con `?modo=sofia` para que abra con Sofía.
- El menú (`src/lib/navegacion/mapa.ts`, la entrada "Simulador") apunta al único. Los enlaces en la web, el muro y los mensajes
  que digan `/simulador-ak` o `/simulador` se cambian al único (buscá las dos rutas en `src/`).
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

- **Navegador:** `/simulador` y `/simulador-ak?source=x` llegan al único simulador con `source=x`; "Prefiero que me guíe Sofía"
  abre la charla y Sofía saluda; el reloj sigue apareciendo al generar; **sin tocar el botón, los pasos del simulador son los
  mismos de hoy** (servicio → datos → paquetes).
- **Jest (Sofía):** con `generateBudgetAndLeadFromSimulator` devolviendo `{ success: false }`, `SofiaChat` muestra el cartel
  "No pudimos guardar" y al tocar Reintentar lo llama **otra vez con el mismo `submissionId`**. Con éxito, no hay cartel.
- **Navegador:** `/fiestas/nueva/catering?fiestaId=<prueba>` termina en `nueva/comida` con la solapa Catering abierta y su contenido;
  lo mismo para `plan-pagos` en `plata-y-papeles`.
- **Navegador:** `/evento/fotocabina` abre `/evento/inicio` con Fotocabina elegida, y `/evento/fotocabina/<prueba>` sigue abriendo la
  estación como hoy.
- **Jest:** ninguna redirección tapa una pantalla (la prueba de siempre) y el tope de pantallas es el nuevo número.

```comprobar
archivo: src/components/simulador/SofiaChat.tsx
usa: SofiaChat en src/app/simulador-de-presupuesto/page.tsx
usa: Reintentar en src/components/simulador/SofiaChat.tsx
usa: autoSaveAttemptRef en src/components/simulador/SofiaChat.tsx
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
