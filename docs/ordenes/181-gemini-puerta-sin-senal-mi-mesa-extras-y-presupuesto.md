# PARA GEMINI - Orden 181: puerta sin señal, de "mi mesa" a la app, más extras en el portal y franja del presupuesto

**Aprobado por el dueño el 16/10/2026.** Va en la MISMA propuesta que las órdenes 178, 179 y 180 (rama
`claude/app-debug-stabilize-m70e6z`). Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md`.

## Bloque 1 - La puerta deja pasar aunque se corte el wifi

Pantallas: `src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx` (`processCheckIn`, ~63) y
`src/app/evento/actual/checkin/page.tsx` (~63-74). Hoy, si la red falla, sale "El ingreso no quedó
guardado: volvé a escanear" y la fila se frena.

- La pantalla ya tiene la lista (`allGuests`). Si `checkInGuestFiestaActual` falla **por red** (la misma
  detección `esDeRed` que ya existe, ~105), y el invitado está en `allGuests` y no tenía `checkedIn`:
  1. Mostrá en verde **"¡Adelante, {nombre}! — Mesa {tableNumber}"** y marcalo en pantalla como
     ingresado (con una marca chica "pendiente de subir").
  2. Guardalo en una cola en `localStorage`, clave `ak_checkin_pendientes_${fiestaId}`:
     `{ guestId, token, escaneadoEn }`. Sin repetidos por `guestId`.
  3. Reintentá la cola cada 10 segundos y al evento `online`. Cada uno que el servidor acepta (o contesta
     que ya estaba adentro) sale de la cola. Arriba de la pantalla, un contador: "N ingresos esperando señal".
- Si el error **no** es de red (QR vencido, invitado de otra fiesta), se muestra como hoy y **no** entra a la cola.
- El servidor ya es seguro ante repetidos: `checkInGuest` (`src/app/actions/fiesta/invitados.actions.ts`
  ~347) no vuelve a marcar a quien ya entró. **No lo cambies**, salvo para aceptar un
  `escaneadoEn` opcional: si viene, es ISO válido, no es futuro y tiene menos de 12 horas, se usa como
  `checkInTimestamp`; si no, la hora del servidor, como hoy.
- No toques los permisos de la acción.

## Bloque 2 - De "mi mesa" a la app de la fiesta

`src/app/evento/mi-mesa/[fiestaId]/page.tsx` (~113-140): cuando aparece la mesa del invitado, arriba de
"Buscar otro nombre" (~135) van dos botones grandes:
- **"Entrar a la app de la fiesta"** → `/evento/hub/${fiestaId}` (la pantalla existe).
- **"Ver el menú y la carta de tragos"** → el mismo destino que ya usa la app del invitado para la carta
  (buscalo en `src/app/evento/hub/[fiestaId]/page.tsx` y usá ese enlace; si la fiesta no tiene barra,
  el botón no aparece).

## Bloque 3 - El cliente puede sumar Vogue, Espejo mágico y Tótem Touch IA desde su portal

`src/app/portal/page.tsx`, `PORTAL_EXTRA_DEFINITIONS` (~81-110): hoy hay cuatro. Sumá tres con el mismo
formato:
- `vogue_boomerang`: "Cabina Vogue (boomerangs y GIFs)", `aliases: ['vogue', 'bogue']`, icono `💎`.
- `espejo_magico`: "Espejo mágico", `aliases: ['espejo magico', 'espejo mágico']`, icono `🪞`.
- `totem_touch_ia`: "Tótem Touch IA", `aliases: ['totem touch', 'tótem touch', 'face swap']`, icono `🤖`.
Los precios salen del catálogo, como los otros cuatro (`getServiciosEmpresaPublicos`): **no escribas
precios**. Si un servicio no está en el catálogo, ese extra no se muestra. El pedido sigue siendo un
pedido que revisa el equipo (`submitClientServiceAddRequest`): no cobra ni suma nada solo.

## Bloque 4 - Presupuesto que ve el cliente: "Tranquilidad incluida" arriba del total

`src/components/budget/BudgetDocument.tsx`: componente nuevo `FranjaTranquilidad` arriba de la primera
tabla de ítems (~274). Muestra, sólo con datos que ya existen:
- los regalos incluidos (`itemsRegalo`, ~125), con la palabra "Incluido";
- "Hasta 12 cuotas con tarjeta" usando `presentacionMercadoPago` (~163), tal como ya lo dice la línea ~613;
- "Reservás tu fecha con una seña" y "Plan de pagos mensuales a tu medida".
**No cambies ningún importe, total, descuento ni el reloj de la promoción.** Nada de "congelar",
"garantía" ni plazos prometidos. En la impresión puede quedar (no la escondas).

## Pruebas

- `src/__tests__/la-puerta-anda-sin-senal.test.tsx`: con la acción fallando por red, el invitado aparece
  "¡Adelante!", queda en la cola; al volver la red se sube una vez; un QR vencido no entra a la cola. Y en
  el servidor, `escaneadoEn` futuro o de hace 2 días se ignora. Nombrá la ruta `/fiestas/nueva/invitados/checkin-scanner`.
- `src/__tests__/mi-mesa-lleva-a-la-app.test.tsx`: con la mesa encontrada aparece el enlace a
  `/evento/hub/`. Nombrá la ruta `/evento/mi-mesa/[fiestaId]`.
- `src/__tests__/el-portal-ofrece-las-estaciones.test.ts`: con "Vogue" y "Tótem Touch IA" en el catálogo,
  aparecen como extras con el precio del catálogo; sin ellos, no aparecen.
- `src/__tests__/la-franja-del-presupuesto-no-cambia-numeros.test.tsx`: el total que muestra el documento es
  el mismo con y sin la franja, y la franja lista los regalos.

```comprobar
usa: ak_checkin_pendientes_ en src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx
usa: escaneadoEn en src/app/actions/fiesta/invitados.actions.ts
usa: /evento/hub/ en src/app/evento/mi-mesa/[fiestaId]/page.tsx
usa: totem_touch_ia en src/app/portal/page.tsx
usa: FranjaTranquilidad en src/components/budget/BudgetDocument.tsx
prueba: PENDIENTE src/__tests__/la-puerta-anda-sin-senal.test.tsx
prueba: PENDIENTE src/__tests__/mi-mesa-lleva-a-la-app.test.tsx
prueba: PENDIENTE src/__tests__/el-portal-ofrece-las-estaciones.test.ts
prueba: PENDIENTE src/__tests__/la-franja-del-presupuesto-no-cambia-numeros.test.tsx
```
