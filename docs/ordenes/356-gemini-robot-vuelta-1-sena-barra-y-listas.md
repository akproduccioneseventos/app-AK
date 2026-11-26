# Orden 356 — Robot, vuelta 1: la seña con un solo importe, la barra que no pierde pedidos y listas que no se borran

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 (rama `gemini/orden-346`).** Si un bloque se traba, entregá
el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Toca plata: nombrá el candado
(`src/__tests__/el-candado-de-la-plata.test.ts`) y no saques ningún permiso.

## Por qué
Primera vuelta del robot (25/11/2026), con las áreas contrato y barra y el aspecto sincronización. Claude confirmó cada
punto en el código. Lo que figura en `YA-RESUELTO.md` (el tótem que reconoce por nombre, decisión del 6/10) no entra.

## Bloque 1 — La seña tiene un solo importe (pregunta 110)
Hoy hay tres cuentas distintas. El cliente puede ver una seña en el portal, firmar otra en el papel y pagar otra por
Mercado Pago. **Decisión del dueño (11/11/2026): la seña es $5.000 y se cambia en Ajustes.**
1. Función única `seniaDelContrato(presupuesto, porDefecto)` en `src/lib/fiesta/sena-del-contrato.ts`: si
   `presupuesto.senia > 0`, esa; si no, `porDefecto` = `bookingDepositAmount` de `getBudgetDisplaySettings()`
   (`src/app/actions/settings.ts`), o `DEFAULT_BOOKING_DEPOSIT_AMOUNT` si no hay ajuste. **Nunca el 20% del total.**
2. La usan:
   - `src/app/actions/fiesta/documentos.actions.ts` ~50-70: sacar `DEFAULT_DEPOSIT_AMOUNT` y el 20%.
   - `resolveDepositAmount` (`sena-del-contrato.ts` ~14-37): sacar el 20%. La cuota "seña" del plan de pagos queda como
     respaldo sólo sin presupuesto.
   - `src/lib/payments/mercadopago-server.ts` ~159-163 (`montoDeSenia`): que llame a la misma función.
   - `src/components/panels/doc--contrato-servicio.tsx` ~39-49: hoy toma la seña del primer pago de la factura y queda en
     blanco sin pagos. Que use la misma función.
3. Un presupuesto que ya tiene `senia` cargada no cambia.

## Bloque 2 — `{{MONTO_SENA}}` sale en blanco en el contrato
El editor de cláusulas ofrece `{{MONTO_SENA}}` (`src/components/settings/panels/contratos--clausulas.tsx` ~40), pero el
generador sólo reemplaza `{{SENIA}}` (`src/lib/contract-template.ts` ~263) y después el comodín (~268) lo convierte en una
raya. Que `{{MONTO_SENA}}` se reemplace igual que `{{SENIA}}`.

## Bloque 3 — Las fechas de la cláusula 3 salen un día antes
`calcularHitosDeContrato` (`src/lib/contratos/hitos.ts` ~20-23) hace `new Date("AAAA-MM-DD")`, que es medianoche en hora de
Greenwich, y lee con getters locales. En Uruguay eso da el día anterior. Afecta `{{FECHA_SALDO_TOTAL}}`, `{{HITO_30}}` y
`{{HITO_50}}`. Usá `parseUruguayDate` de `src/lib/utils.ts`. La prueba de
`src/__tests__/el-plan-y-el-contrato-dicen-lo-mismo.test.ts` (~61, ~69) usa `T12:00` y por eso no lo veía: sumá un caso
con `"2027-03-15"` solo.

## Bloque 4 — La barra (`src/app/actions/fiesta/barra-tecnologica.actions.ts`)
1. **Pedidos que no aparecen** (pregunta 210). Si escribir en la colección falla (~781), el pedido va al respaldo (~771).
   Pero todas las lecturas hacen `getFirestoreOrders(...) ?? stored.orders` (~515, ~819-820, ~944, ~1283, ~1455): si la base
   lee bien, el respaldo no se mira nunca. El pedido no sale en la barra ni en "Mi pedido", y las botellas ya se
   descontaron. Arreglo: unir las dos fuentes por `id`, ganando la de la base, en una función `pedidosDeLaFiesta`.
2. **Pedido manual del barman**: `createBarmanManualOrder` (~866-905) busca el repetido (`findBarOrder`) afuera de la
   transacción. Dos toques simultáneos descuentan dos veces. Que use el mismo turno que el pedido del invitado (~389-392),
   y la pantalla del barman (`barman/page.tsx` ~157-163) no deja tocar de nuevo mientras guarda.
3. **Cierre de barra**: si falla mover el depósito y también falla deshacer la reserva (~1385-1392, con
   `.catch(() => undefined)`), un reintento antes de 5 minutos (~1365-1378) devuelve "cierre guardado" sin mover nada. El
   duplicado devuelve éxito sólo si el depósito quedó movido (marca `depositoMovidoEn`). Si no, se reintenta el movimiento.
4. **Cambiar trago**: `src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx` ~96-97 no manda `clientRequestId` al cambiar. Si se corta, el reintento dice "ya
   está en preparación" estando cancelado. Que lo mande, igual que al pedir.
5. `getBarPedidosListos` (~1444) devuelve `guestId` y `nota` de los pedidos listos de cualquier fiesta. La pantalla de listos
   sólo necesita el nombre y el trago: devolvé sólo eso.

## Bloque 5 — Una lectura que falla no puede borrar la lista (pregunta 210)
1. **Blog** (`src/app/actions/blog.ts`): `getBlogPosts` (~12-19) devuelve `[]` si la lectura falla, y `saveBlogPost` /
   `deleteBlogPost` (~21-56) reescriben la lista entera con eso. Si falla la lectura justo al guardar, se borran todas las
   notas. Además, dos personas guardando a la vez se pisan. Pasalas a `mutateGenericJsonArray` (turno sobre el documento,
   como las citas de la agenda). Si la lectura falla, no se guarda y se avisa.
2. **Plantillas de decoración** (`src/app/actions/deco-canvas-templates.ts` ~14-18 y ~68): mismo caso. Si la lectura falla,
   borrar una plantilla deja la lista vacía. Mismo arreglo. Y borrar un id que no existe no devuelve éxito.
3. **La causa de fondo** (Claude la revisa con lupa): en `src/lib/firebase-sync.ts`, la rama de lista vacía para los
   archivos de `ALLOW_EMPTY_ARRAY_RESET_FILES` (~130, ~321-333, ~381-392) y la rama genérica de `writeData`
   (`src/lib/data-service.ts` ~285-288) no miran `lecturaFallida` (~263). Si la última lectura de ese archivo falló, no se
   escribe una lista vacía: se devuelve el error.

## Barrido en toda la app
- Seña o importe calculado en más de un lugar (pregunta 110): `grep -rnE "\* 0\.2\b|DEFAULT_DEPOSIT_AMOUNT|senia" src --include=*.ts*`.
  Todo lo que calcule una seña pasa por `seniaDelContrato`.
- Lecturas que devuelven `[]` en el `catch` y después se guardan encima (pregunta 210): `npm run formas-que-mienten` y
  `grep -rn "return \[\];" src/app/actions`. Por cada una, mirar si alguien la usa para reescribir la lista.
- Fechas `new Date("AAAA-MM-DD")` leídas con getters locales: `grep -rnE "new Date\((fecha|\w*Fecha\w*)\)" src/lib src/components`.
Plata, cobros y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cambiar el importe de la seña ya cargada en un presupuesto, ni el ajuste de $5.000 de Ajustes.
- No tocar el tótem que reconoce por nombre (decisión del 6/10).
- No sacar permisos ni sumar acciones a la lista de excepciones del candado.

## Qué tiene que comprobar la prueba
- `src/__tests__/la-sena-tiene-un-solo-importe.test.ts`: sin `senia` en el presupuesto y con $5.000 en Ajustes, el portal
  (`documentos.actions`), el recibo (`resolveDepositAmount`), Mercado Pago (`montoDeSenia`) y el contrato dicen 5000, no el
  20% del total. Con `senia: 8000`, dicen 8000.
- `src/__tests__/la-barra-no-pierde-pedidos-del-respaldo.test.ts`: con la base leyendo bien y un pedido sólo en el
  respaldo, el panel de barra y "Mi pedido" lo muestran. Dos pedidos manuales simultáneos con el mismo `clientRequestId`
  descuentan una vez (base de mentira que devuelve **copias**).
- `src/__tests__/una-lectura-fallida-no-borra-el-blog.test.ts`: con la lectura fallando, `saveBlogPost` devuelve error y la lista guardada sigue entera; `writeData` de una lista vacía sobre un archivo de `ALLOW_EMPTY_ARRAY_RESET_FILES` cuya última lectura falló devuelve error;
  la lista guardada sigue entera. Lo mismo para borrar una plantilla de decoración.
- En `el-plan-y-el-contrato-dicen-lo-mismo.test.ts`: `"2027-03-15"` da el saldo total el 13/02/2027, no el 12.

```comprobar
usa: seniaDelContrato en src/lib/fiesta/sena-del-contrato.ts
usa: seniaDelContrato en src/app/actions/fiesta/documentos.actions.ts
usa: seniaDelContrato en src/lib/payments/mercadopago-server.ts
usa: seniaDelContrato en src/components/panels/doc--contrato-servicio.tsx
no-usa: * 0.2) en src/lib/fiesta/sena-del-contrato.ts
usa: MONTO_SENA en src/lib/contract-template.ts
usa: parseUruguayDate en src/lib/contratos/hitos.ts
usa: pedidosDeLaFiesta en src/app/actions/fiesta/barra-tecnologica.actions.ts
usa: depositoMovidoEn en src/app/actions/fiesta/barra-tecnologica.actions.ts
usa: mutateGenericJsonArray en src/app/actions/blog.ts
usa: mutateGenericJsonArray en src/app/actions/deco-canvas-templates.ts
prueba: src/__tests__/la-sena-tiene-un-solo-importe.test.ts
prueba: src/__tests__/la-barra-no-pierde-pedidos-del-respaldo.test.ts
prueba: src/__tests__/una-lectura-fallida-no-borra-el-blog.test.ts
```
