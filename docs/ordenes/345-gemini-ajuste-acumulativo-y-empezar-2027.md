# Orden 345 — El 15% "acumulativo" sin montos futuros, el 15% simple para contratos viejos, cargar contratos con IA y empezar 2027 de cero

**Para Gemini. Toca plata: Claude la revisa línea por línea.** Va en la MISMA propuesta que la 343 y la 344 (rama
`gemini/orden-343`). Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Toda acción nueva pasa el
candado de la plata (`src/__tests__/el-candado-de-la-plata.test.ts`): nada de plata con sólo sesión.

## Por qué (decisiones del dueño, 24/11/2026)
- *"El 15% queda definitivo acumulativo"*. La palabra que ve el cliente es **"acumulativo"** (no "compuesto": *"no se
  entiende"*).
- *"Cuando hagan el presupuesto en el simulador o en el presupuesto no aparezca cuánto le va a salir por ejemplo en el
  2030; sólo que aparezca que es 15% acumulativo"*.
- *"Tengo contratos viejos que antes no era acumulativo"*: al cargar un contrato viejo se puede elegir **15% simple**.
- *"No hay ningún pago porque nunca usé la app, lo único que hice fue cargar. Quiero que la app me cargue todos los
  presupuestos a partir de 2027; lo demás se borra para empezar el año que viene desde cero."*

## Lo que ya existe (no lo rehagas)
- La cuenta del ajuste **ya es acumulativa**: `buildAnnualAdjustmentProjection` en `src/lib/budget/formal-budget.ts` ~74
  (cada año multiplica lo ya ajustado, ~94). La usan `src/lib/budget/financial-guardrails.ts`,
  `src/lib/budget/saldo-con-ajuste.ts`, `src/lib/simulator/pricing.ts`, `src/components/presupuestos/paso-3-resumen.tsx`,
  `src/app/simulador-de-presupuesto/page.tsx`, `src/app/simulador-ak/page.tsx`,
  `src/app/(app)/presupuestos/[id]/ver/page.tsx`, `src/app/(app)/presupuestos/[id]/estado-de-cuenta/page.tsx` y
  `src/app/actions/fiesta/portal.actions.ts`.
- El presupuesto tiene `ajusteAnualActivo`, `ajusteAnualPorcentaje` y `fechaFirmaContrato` (`src/types/presupuesto.ts`
  ~123). El ajuste corre desde la firma del contrato (decisión del 13/11).
- La IA ya lee contratos: `extractContractDataAction` (`src/app/actions/historicos.ts` ~261, permiso contabilidad o
  administración, con tope de IA) con el esquema de `src/ai/flows/extract-contract-data.ts` ~14 (cliente, fecha del
  evento, monto total, tipo de evento…). Hoy la usa la carga de históricos (`src/components/panels/carga-historicos.tsx`).
- El presupuesto manual: `src/app/(app)/presupuestos/nuevo/crear/page.tsx`.
- Si la orden 342 (cerebro) ya está en la principal, la llamada a la IA pasa por `src/ai/cerebro.ts`.

## Bloque 1 — Tipo de ajuste: acumulativo (siempre) o simple (sólo contratos viejos)
1. Campo nuevo en `Presupuesto`: `tipoAjusteAnual?: 'acumulativo' | 'simple'`. **Sin el campo, es acumulativo.**
2. `buildAnnualAdjustmentProjection` recibe `tipo` y, con `'simple'`, suma cada año el 15% **del precio original**
   (no del ajustado): `base × (1 + 0,15 × años)`. Con `'acumulativo'`, la cuenta de hoy, sin tocarla.
3. **Todos** los que llaman a la función (la lista de arriba) le pasan el `tipoAjusteAnual` del presupuesto. Que no quede
   ninguno con la cuenta por su lado: buscalos con `rg -n "buildAnnualAdjustmentProjection|ajusteAnualPorcentaje" src`.
4. El tipo se elige **sólo** al cargar un contrato (bloque 3) o en la ficha del presupuesto, por alguien con permiso de
   contabilidad, y **no se puede cambiar con el contrato firmado** (mismo control que la estructura del presupuesto:
   `estadoDelContrato` en `src/app/actions/presupuestos.ts` ~544). El simulador y el presupuesto nuevo **siempre** son
   acumulativos.

## Bloque 2 — Lo que ve el cliente: "15% acumulativo", sin montos de años futuros
En el simulador, el presupuesto (vista, PDF y mensaje), el portal del cliente y la presentación LED:
- **Sale** toda línea que muestre el total o la cuota proyectada a un año futuro ("con ajuste 2030: $…", la tabla de años,
  "aniosDiferencia"). Ejemplo a sacar: el texto del Club Uruguay en el simulador ~708 (`con ajuste ${eventYear}: …`).
- **Queda** una sola línea: **"Los precios tienen un ajuste anual del 15% acumulativo desde la firma del contrato."** (en
  contratos simples: "…del 15% simple…").
- **Adentro de la app, el equipo** (estado de cuenta, cobros, contabilidad) **sigue viendo los montos ajustados**: las
  cuotas se cobran con la cuenta de siempre. Esta orden cambia qué ve el cliente, no cuánto se cobra.
- El total del presupuesto que firma el cliente es el precio de hoy, como ya está decidido.

## Bloque 3 — "Cargar contrato": la IA arma el presupuesto
En la lista de presupuestos (`/presupuestos`), un botón **"Cargar contrato"** (permiso contabilidad o administración):
1. Se sube el contrato (PDF o foto). Se llama `extractContractDataAction`.
2. Sumá al esquema de `extract-contract-data.ts`: teléfono, cantidad de invitados (adultos y niños), fecha de firma,
   servicios contratados (lista de texto), seña y cuotas (monto y fecha), y **tipo de ajuste** (si el contrato dice
   "acumulativo" o no dice nada de acumular → la IA propone; ver punto 4).
3. Con lo que devuelve, se abre el presupuesto manual (`/presupuestos/nuevo/crear`) **ya completo** (los servicios que
   coinciden con el catálogo, por nombre; los que no coinciden, en una lista "revisar a mano"), con un aviso arriba:
   **"Lo armó la IA leyendo el contrato. Revisá cada dato antes de guardar."** El contrato queda adjunto al presupuesto.
4. Un selector **"Ajuste anual: Acumulativo / Simple (contratos viejos)"**, que la IA preselecciona y la persona confirma.
5. **Nada se guarda solo**: guarda la persona con el botón de siempre (es plata). El presupuesto queda `Aceptado` con su
   `fechaFirmaContrato` si el contrato está firmado.

## Bloque 4 — Empezar 2027 de cero: una tarea de una sola vez, sin botones
**Precisión del dueño (24/11/2026):** *"no quiero que crees botones para borrar cosas que después no voy a necesitar;
dejá sólo los presupuestos de 2027 en adelante ya cargados, como si yo los hubiese cargado, con el contrato y el contrato
del salón que tengas"*. Claude no tiene acceso a la base real, así que esto es **una tarea automática que corre una sola
vez** en la app publicada, **sin botón ni pantalla nueva**:

1. Vive en `src/lib/automatico/empezar-2027.ts` y la dispara `src/lib/automatico/al-entrar-a-la-app.ts` (~326 es donde ya
   se siembra la fiesta de muestra) **la primera vez que entra el perfil dueño** después de publicar. Se reserva con una
   transacción sobre un documento de marca (`migraciones/empezar-2027`): si ya corrió o está corriendo, no hace nada.
   Así dos servidores no la corren dos veces.
2. **Primero, un respaldo completo** con lo que ya existe en `src/app/actions/backup.ts`. Si el respaldo no se completa,
   **no se borra nada**, la marca queda en "falló" y se avisa al dueño.
3. **Se borran** los presupuestos con fecha de evento **anterior al 1/1/2027** o sin fecha, **y sus fiestas vinculadas**
   (`fiesta.presupuestoId`). **No se tocan nunca:** las fiestas históricas (`src/data/fiestas-historicas.json` y su
   colección), la fiesta de muestra del auditor, y **cualquier presupuesto o fiesta con un cobro, una factura o un
   contrato firmado** (el dueño dice que no hay ninguno; si aparece, se deja y se avisa).
4. **Los de 2027 en adelante quedan "cargados como si los hubiera cargado el dueño":** estado `Aceptado`, con su fiesta
   creada si no la tienen (la misma función que usa hoy aceptar un presupuesto), y en la fiesta **el contrato de servicios
   y el contrato del salón generados** con las plantillas de siempre (`contratoServicioTexto`, `contratoSalonTexto` y
   `contratoGenerado`, como guarda `updateContratoFiestaActual` en `src/app/actions/fiesta-actual.ts` ~159; el texto se
   arma con lo mismo que usan `src/components/panels/doc--contrato-salon.tsx` y el panel del contrato de servicios: si esa
   lógica vive en el componente, pasala a `src/lib/contratos/` y que el panel y la tarea usen la misma). El contrato del
   salón sólo si la fiesta es en el Club Uruguay. **No se marcan como firmados** ni se anota seña: eso lo hace una
   persona con el papel.
5. Con `tipoAjusteAnual` vacío (acumulativo); si el dueño después carga un contrato viejo, lo cambia a simple en la ficha.
6. Al terminar, **un aviso en Asistente AK ("Hoy")** con: cuántos presupuestos y fiestas se borraron, cuáles quedaron,
   a cuáles se les generó contrato y cuáles no se pudieron (con el motivo). Nunca "listo" si algo quedó a medias.

## Lo que NO hay que hacer
- No cambiar la cuenta acumulativa de hoy ni el 15%.
- No crear botones ni pantallas para borrar. No borrar nada sin respaldo; no borrar cobros, facturas ni contratos firmados.
- No guardar un presupuesto armado por la IA sin que una persona lo confirme.
- No mostrar montos de años futuros al cliente en ningún lado.

## Qué tiene que comprobar la prueba
- `src/__tests__/el-ajuste-simple-y-el-acumulativo.test.ts`: $100.000 con evento a 3 años: acumulativo da $152.088,
  simple da $145.000; sin `tipoAjusteAnual` da lo acumulativo; un contrato firmado no deja cambiar el tipo; el personal
  sin contabilidad no puede cambiarlo.
- `tests/e2e/el-cliente-ve-15-acumulativo-sin-montos-futuros.spec.ts`: en el simulador y la vista pública de un
  presupuesto con evento en 2030 aparece "15% acumulativo" y **no** aparece "2030" junto a un monto.
- `tests/firebase/empezar-2027-de-cero.test.ts` (contra el emulador): con presupuestos de 2026 y 2027, uno de 2026 con
  un cobro y una fiesta histórica: se borran sólo los de 2026 sin plata y sus fiestas; el del cobro, la histórica y los
  de 2027 quedan; los de 2027 quedan `Aceptado` con fiesta y contratos generados (el del salón sólo si es Club Uruguay);
  sin respaldo no se borra nada; correrla dos veces no hace nada la segunda; con un usuario que no es dueño no corre.
- `src/__tests__/cargar-contrato-no-guarda-solo.test.ts`: con una respuesta falsa de la IA, se arma el formulario y no
  se llama a guardar hasta que la persona confirma.

## Barrido en toda la app
Forma: un monto proyectado a un año futuro que ve el cliente. Buscá `rg -n "ajuste.*\\$\\{.*Year|con ajuste|aniosDiferencia|adjustedTotal" src`
en todo lo que ve un cliente o prospecto (simulador, presupuesto público, portal, LED, mensajes) y listá en la propuesta
cada lugar y qué se hizo.

```comprobar
usa: tipoAjusteAnual en src/types/presupuesto.ts
usa: tipoAjusteAnual en src/lib/budget/formal-budget.ts
usa: tipoAjusteAnual en src/lib/budget/financial-guardrails.ts
usa: tipoAjusteAnual en src/lib/budget/saldo-con-ajuste.ts
usa: tipoAjusteAnual en src/lib/simulator/pricing.ts
usa: acumulativo en src/app/simulador-de-presupuesto/page.tsx
no-usa: con ajuste ${eventYear} en src/app/simulador-de-presupuesto/page.tsx
usa: Cargar contrato en src/app/(app)/presupuestos/page.tsx
archivo: src/lib/automatico/empezar-2027.ts
usa: empezar-2027 en src/lib/automatico/al-entrar-a-la-app.ts
prueba: src/__tests__/el-ajuste-simple-y-el-acumulativo.test.ts
prueba: tests/e2e/el-cliente-ve-15-acumulativo-sin-montos-futuros.spec.ts
prueba: tests/firebase/empezar-2027-de-cero.test.ts
prueba: src/__tests__/cargar-contrato-no-guarda-solo.test.ts
```
