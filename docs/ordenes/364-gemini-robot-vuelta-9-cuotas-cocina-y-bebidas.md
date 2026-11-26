# Orden 364 — Robot, vuelta 9: una cuota cobrada se ve cobrada en todos lados, el celíaco vegetariano llega a la cocina y las bebidas no se multiplican por los invitados

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 363 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. **Los tres bloques son plata o
comida: Claude los revisa línea por línea.** El candado de la plata (`src/__tests__/el-candado-de-la-plata.test.ts`) tiene que
seguir en verde.

## Por qué
Novena vuelta del robot (26/11/2026), sobre las áreas plata y comida, mirando las cuentas. Esto está bien: la ganancia por
fiesta (comisión y recargo sin contar dos veces), el rango de fechas del reporte, las cuotas vencidas, qué cobro cuenta como
confirmado, las conversiones de unidades y la consolidación de la lista de compras. Claude confirmó cada punto en el código.

## Bloque 1 — Una cuota cobrada cuenta como cobrada en todas las pantallas (pregunta 237)
Hoy la misma plata se anota en **dos libros que no se hablan**:
- marcar una cuota como pagada (`updateCuotaEstado`, `src/app/actions/payment-plans.ts` ~124-170) escribe **sólo** en
  `fiesta.planDePagos.cuotas`;
- el saldo del presupuesto sale **sólo** de `presupuesto.pagosCliente` (`src/lib/budget/financial-guardrails.ts` ~351). Lo leen
  el portal público (`src/app/portal/c/[accessKey]/PublicPortalView.tsx` ~481-488), el asistente (`calcularDeudas`,
  `src/lib/multiagent/contexto-negocio.ts` ~181), el cobrador (`src/lib/agentes/motor-agentes.ts` ~366) y los reportes;
- el portal del cliente (`src/app/portal-cliente/[id]/page.tsx` ~607-611) calcula desde las cuotas, y Finanzas
  (`src/components/contabilidad/panels/finanzas.tsx` ~42-50) usa las cuotas **sólo si no hay ningún cobro**.
Ejemplo: total $30.000, tres cuotas de $10.000 marcadas pagadas. El portal del cliente dice "saldo $0", y el portal público y el
asistente dicen que debe $30.000. Con una seña de $5.000 cobrada, Finanzas muestra $5.000 de ingresos.
Arreglo: **un solo libro, `pagosCliente`**:
1. En `updateCuotaEstado`, cuando la cuota pasa a pagada se anota en el presupuesto (`fiesta.presupuestoId`) un cobro con id
   fijo `cuota_<cuotaId>`, por el monto pagado y con la fecha de pago, **dentro del turno del presupuesto** (`mutarPresupuesto`,
   `src/lib/budget/mutar-presupuesto.ts`). Si ya existe ese id, no se agrega otro (un reintento no cobra dos veces). Si la cuota
   vuelve a "pendiente", se saca ese cobro. Si el presupuesto no se pudo guardar, la cuota tampoco queda pagada y se devuelve
   el error (que no salga el mail al cliente).
2. Si la cuota es la seña y la seña ya está en `pagosCliente` por el recibo del contrato, no se duplica: fijate en cómo arma las
   cuotas el plan (`src/app/actions/payment-plans.ts`) y dejá escrito en la prueba qué pasa con la seña.
3. Una tarea de una sola vez (como `empezar-2027`, `src/lib/automatico/`) que anota en `pagosCliente` las cuotas ya pagadas que
   no tienen su `cuota_<id>`. Sin botones.
4. El portal del cliente y Finanzas pasan a leer el saldo y lo cobrado del presupuesto, con la misma función que usa el panel
   (`normalizePresupuestoFinancials` de `src/lib/budget/financial-guardrails.ts` ~266), no de las cuotas.

## Bloque 2 — El celíaco que además es vegetariano llega a la cocina
`src/lib/catering/hoja-de-cocina.ts` ~95-100 (`restriccionDe`) devuelve **una** restricción: si el invitado es "Vegetariano" y
además tiene `isCeliac`, la cocina lo cuenta sólo como vegetariano y **nadie prepara su plato sin gluten**. Usá
`condicionesDelInvitado` (`src/lib/catering/condiciones-del-invitado.ts` ~10), la misma que ya usan alergias y la orden de evento,
y sumá al invitado (con su `partySize`) en **cada** condición que tenga.
Además, ~57: `c.includes('nin')` toma como infantil cualquier plato que tenga esas letras ("Panini", "Ravioles de espinaca y
comino"…) y le da sólo las porciones de los chicos. Buscá palabras enteras (`niño`, `niños`, `nino`, `ninos`, `infantil`,
`kids`), no pedazos.

## Bloque 3 — Las bebidas no se multiplican por los invitados
`src/app/actions/fiesta/costos.actions.ts` ~120-123 hace `costo * cantidadNecesaria * totalInv`. En la pantalla de bebidas
(`src/components/gastronomia/GestionBebidas.tsx` ~87) y en la lista de compras (`src/components/panels/catering--lista-compras.tsx`
~227), `cantidadNecesaria` es **la cantidad total del evento** (40 botellas, no 40 por invitado). Con 40 botellas a $300 y 100
invitados, la pantalla dice $12.000 y la contabilidad carga $1.200.000. Que el costo sea `costoUnitario * cantidadNecesaria`
(o `costoTotal`), con la merma del 5% de siempre. Las recetas de tragos, que sí escalan por invitados (`GestionBebidas.tsx`
~142), no se tocan.

## Barrido en toda la app
- La misma plata en dos lugares (pregunta 237): `grep -rn "planDePagos" src --include=*.ts* | grep -v __tests__` y, por cada
  lector que muestra lo cobrado o el saldo, ¿lee el mismo libro que el panel?
- Una sola condición por invitado donde puede tener varias: `grep -rn "dietaryRestriction" src/lib src/components` y mirar
  quién hace `return` con la primera.
- Palabras buscadas por pedazos: `grep -rnE "includes\('[a-zñ]{2,4}'\)" src/lib/catering src/lib/compras`.
- Cantidades multiplicadas por los invitados dos veces: `grep -rn "\* totalInv\|\* totalInvitados" src`.
Plata, cobros y comida: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No automatizar cobros: la cuota la sigue marcando una persona; esto sólo hace que se vea igual en todos lados.
- No cambiar que la lista de compras use los invitados del presupuesto (decisión del dueño).
- No tocar el monto de la seña (orden 356) ni lo de niños en compras (orden 357).

## Qué tiene que comprobar la prueba
- `src/__tests__/una-cuota-cobrada-se-ve-en-todos-lados.test.ts` (base de mentira que devuelve **copias**): tres cuotas de
  $10.000 pagadas sobre un total de $30.000 dejan saldo $0 en `normalizePresupuestoFinancials`; marcar la misma cuota dos veces
  deja un solo `cuota_<id>`; volverla a pendiente lo saca; con el presupuesto fallando, la cuota no queda pagada y no sale el mail.
- `src/__tests__/la-cocina-ve-todas-las-condiciones.test.ts`: una invitada vegetariana y celíaca con `partySize` 2 da
  Vegetariano 2 y Celiaco 2; "Panini de jamón" con 100 adultos y 20 chicos da 120 porciones.
- `src/__tests__/las-bebidas-no-se-multiplican-por-invitados.test.ts`: 40 botellas a $300 con 100 invitados cargan $12.600
  (con la merma) en la contabilidad.

```comprobar
usa: mutarPresupuesto en src/app/actions/payment-plans.ts
usa: condicionesDelInvitado en src/lib/catering/hoja-de-cocina.ts
no-usa: c.includes('nin') en src/lib/catering/hoja-de-cocina.ts
no-usa: cost * qtyPerPerson * totalInv en src/app/actions/fiesta/costos.actions.ts
no-usa: getPaymentPlanSummary(cuotas) en src/app/portal-cliente/[id]/page.tsx
prueba: src/__tests__/una-cuota-cobrada-se-ve-en-todos-lados.test.ts
prueba: src/__tests__/la-cocina-ve-todas-las-condiciones.test.ts
prueba: src/__tests__/las-bebidas-no-se-multiplican-por-invitados.test.ts
```
