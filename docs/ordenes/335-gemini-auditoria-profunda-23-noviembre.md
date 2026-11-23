# Orden 335 — Auditoría profunda del 23/11/2026: lo que la reducción de pantallas dejó sin llegar a su función

**Para Gemini. Una sola propuesta, rama nueva `gemini/orden-335` desde la principal recién actualizada.** Si un bloque se
traba, entregá el resto en la misma propuesta y decí cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

**Ya lo hizo Claude, no lo toques:** mirar fiestas ya no escribe códigos (`codigoDeFiesta` en
`src/lib/fiesta/codigo-de-fiesta.ts`, usado por `getFiestas`, `leerFiestaConEstado`, `entrarComoInvitado` y la invitación), y la
reparación de fechas de presupuestos no reescribe nada con una sesión de sólo mirar (`repairVerifiedBudgetDates`). Control:
`src/__tests__/mirar-no-escribe.test.ts`.

**La regla de esta orden:** cada botón y cada enlace llega a **la función que anuncia**. Las pruebas de navegador **tocan el
botón de verdad** y miran la dirección completa **y** el contenido (un título, un botón de imprimir, un número), no sólo que la
página conteste.

## Bloque 1 — El PDF del itinerario abre Personal (hallazgo 3)

`src/components/ui/tab-host-shell.tsx` ~37-44, `selectTab`: cuando la solapa de afuera (`tab`) coincide con una de adentro, pisa
`tab` en vez de escribir `subtab`. En Operación → Itinerario las dos se llaman `itinerario`; al tocar "Imprimir / PDF" queda
`tab=pdf`, `PlanificadorSolapasShell` (`src/components/fiestas/PlanificadorSolapasShell.tsx` ~78) no conoce `pdf` y vuelve a la
primera (Personal).

- `selectTab` escribe **siempre** su propia clave (`queryKey`) y nunca toca `tab` cuando `queryKey !== 'tab'`. Lo de las
  direcciones viejas (`?tab=pdf`) se normaliza **al entrar** (en el `useMemo` de `activeTab`), sin reescribir la clave del otro nivel.
- Revisá **todos** los paneles que usan `TabHostShell`, no sólo Itinerario.
- Prueba `tests/e2e/las-solapas-llegan-a-su-funcion.spec.ts`: desde Operación → Itinerario tocar "Imprimir / PDF" y ver
  `tab=itinerario&subtab=pdf` y el botón "Imprimir / Guardar PDF"; repetir desde la dirección vieja y con Atrás/Adelante.

## Bloque 2 — Cartelería, Menú de Mesa, Números de Mesa y Carta de Tragos se perdieron (hallazgo 4)

**Medido por Claude:** la entrega de las órdenes 318-321 (commit `54764d6bd`) **borró** sus pantallas —
`src/app/(app)/fiestas/nueva/carteleria/page.tsx` (1260 líneas), `menu-mesa` (256), `numeros-mesa` (689) y `carta-tragos` (483)—
y `next.config.js` ~381-384 las manda al planificador. Las tarjetas de `src/app/(app)/fiestas/nueva/page.tsx` ~132-139 siguen
diciendo "Activo / Listo": **la función que vende no existe**.

- Recuperalas desde `git show 54764d6bd^:<ruta>` como **paneles** dentro de "Comida, barra e impresos" (como hiciste en la 331),
  con su solapa propia, y que cada tarjeta lleve a su panel con el evento.
- Las direcciones viejas van **en un salto** al panel (el control `una-redireccion-no-lleva-a-otra-redireccion` lo exige).
- No cambies cómo se ven ni qué imprimen: se recuperan como estaban.
- Prueba `tests/e2e/los-impresos-de-mesa-se-abren.spec.ts`: tocar cada una de las cuatro tarjetas y ver su título y su botón de imprimir, con el `fiestaId` en la dirección.

## Bloque 3 — Dos ingresos para el mismo evento (hallazgo 5, plata: lo revisa Claude)

`src/components/fiestas/panels/gestion-costos-rentabilidad.tsx` ~77-93 y ~228-250: la tarjeta "Ingreso pactado" usa
`gestionCostos.ingresosTotalesEstimados` y dice **siempre** "Sincronizado con presupuesto". En el evento de muestra da $0 con un
plan de pagos de $185.000 y una ganancia de -$13.100.

- El ingreso sale de **la misma fuente** que el plan de pagos (el total del presupuesto vinculado, con el ajuste anual, como
  `getBudgetPaymentSummary(p, { includeAnnualAdjustment: true })`). Si no hay presupuesto, la tarjeta dice "Sin presupuesto
  vinculado" y **no** calcula una ganancia negativa sobre cero.
- "Sincronizado" sólo cuando de verdad coincide, con la fecha.
- Prueba Jest: sin presupuesto, con presupuesto, y con presupuesto cambiado después.

## Bloque 4 — "Al día" no es "anda" (hallazgo 6)

`src/components/settings/panels/tareas-automaticas.tsx` ~123-125 y ~314-337, `src/lib/automatico/tareas-automaticas.ts` ~238-276:
una tarea con "No disponible: falta WhatsApp" se cuenta en "Al día", y el despertador figura "Sin ejecutar".

- Una tarea a la que le falta su conexión va en su propia caja ("No disponible") y **no** suma en "Al día".
- Si el despertador no corrió, el resumen lo dice arriba y en rojo.
- Si el último intento falló después del último éxito, se ve en el resumen.
- Prueba Jest `src/__tests__/al-dia-no-cuenta-lo-no-disponible.test.ts`.

## Bloque 5 — Presencia digital felicita sin datos (hallazgo 7)

`src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx` ~895-900 y `src/lib/presencia-digital/revision-diaria.ts`
~112-113: con cero publicaciones con fecha aparece "Venís publicando parejo". Sin datos o sin conexión → "Sin datos todavía";
felicitar sólo con publicaciones fechadas por red dentro del plazo. Prueba Jest
`src/__tests__/presencia-no-felicita-sin-datos.test.ts`: sin publicaciones con fecha no aparece la felicitación.

## Bloque 6 — La cuenta regresiva termina 21 horas antes (hallazgo 8)

`src/lib/public-experience/event-date.ts` ~5-19, `parseEventDate`, arma la fecha a las 00:00 y el contador de
`src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx` ~201-215 y ~1779 no recibe la hora. Usar fecha **y** hora del
evento (`horaEvento`) en hora de Uruguay (America/Montevideo), igual que "Agendar fecha". Prueba Jest `src/__tests__/la-cuenta-regresiva-usa-la-hora.test.ts` con reloj fijo: a las 20:59 del
día falta 1 minuto; a las 21:00 llega a cero.

## Bloque 7 — Muro social y carga operativa no cargan el evento (hallazgo 9)

`src/components/fiestas/panels/muro-social.tsx` ~319-386 (dice "No se pudo cargar la fiesta") y el panel de carga operativa.
Otras solapas del mismo evento sí cargan.

- Que el error **diga el motivo** (lo que devuelve el servidor, sin datos privados) y quede en el registro con un número para
  buscarlo. Con el motivo a la vista se arregla la causa; si no se puede reproducir, se entrega el motivo y se avisa.
- Prueba con el evento de prueba: las dos solapas cargan su contenido (no sólo el encabezado).

## Barrido en toda la app

- **Pregunta 207 (mirar no escribe):** buscar en `src/app/actions` y `src/lib` funciones `get*`/`leer*` que llamen a
  `writeData`, `updateDataPartial`, `mutate*` o `set*`, y `useEffect` de pantallas que llamen acciones que guardan al abrirse.
  Lo de plata, cobros y permisos **se lista y se le pasa a Claude**, no se arregla.
- **Pregunta 208 (cada acceso llega a su función):** recorrer las tarjetas del planificador, el menú y los botones de solapas;
  por cada uno, ¿hay una prueba que lo toque y mire el contenido? Las que no, se agregan.
- **Pregunta 209 (la cuenta usa la hora):** buscar `parseEventDate(` y cuentas regresivas que no usen `horaEvento`.

```comprobar
usa: subtab en tests/e2e/las-solapas-llegan-a-su-funcion.spec.ts
prueba: tests/e2e/las-solapas-llegan-a-su-funcion.spec.ts
no-usa: source: '/fiestas/nueva/carteleria', destination: '/fiestas/nueva', en next.config.js
no-usa: source: '/fiestas/nueva/menu-mesa', destination: '/fiestas/nueva', en next.config.js
no-usa: source: '/fiestas/nueva/numeros-mesa', destination: '/fiestas/nueva', en next.config.js
no-usa: source: '/fiestas/nueva/carta-tragos', destination: '/fiestas/nueva', en next.config.js
usa: includeAnnualAdjustment en src/components/fiestas/panels/gestion-costos-rentabilidad.tsx
prueba: src/__tests__/al-dia-no-cuenta-lo-no-disponible.test.ts
prueba: src/__tests__/presencia-no-felicita-sin-datos.test.ts
prueba: src/__tests__/la-cuenta-regresiva-usa-la-hora.test.ts
prueba: tests/e2e/los-impresos-de-mesa-se-abren.spec.ts
usa: carteleria en src/app/(app)/fiestas/nueva/page.tsx
usa: America/Montevideo en src/lib/public-experience/event-date.ts
archivo: src/components/fiestas/panels/muro-social.tsx
prueba: src/__tests__/mirar-no-escribe.test.ts
```
