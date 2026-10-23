# Orden 212 — Portal del cliente: lo que se ve (Codex 193-194, orden 210)

**Rama:** arrancá de `claude/app-debug-stabilize-m70e6z` actualizada (traé los cambios primero).
**Una sola propuesta** contra esa rama, con los tres bloques. Si un bloque se traba, entregá el resto
igual y decí cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

**Lo de plata de las órdenes 210 y 211 ya lo hizo Claude**: el aviso de pago, el comprobante, las cancelaciones,
los pedidos y el ajuste anual en 0. Eso no se toca.

Todo pasa en `src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx` y en
`src/app/portal/c/[accessKey]/page.tsx`.

## Bloque 1 — "Informar pago" no abre nada (A7)

Los dos botones "Informar pago" (~líneas 1131 y 1530) hacen `setPaymentModalOpen(true)`, pero
`paymentModalOpen` (~853) no se usa en ninguna parte del JSX. **El cliente toca y no pasa nada.**

- Agregá un `Dialog` de `@/components/ui/dialog` con `open={paymentModalOpen}` y
  `onOpenChange={setPaymentModalOpen}`.
- Adentro va:
  - el monto, con `paymentAmount`;
  - el comprobante opcional, con el `input type="file"` que ya llena `paymentFile` y
    `paymentFileBase64`;
  - una nota, con `paymentNote`;
  - el botón que llama a `submitPayment` (~898), que ya existe. No escribas otro.
- `paymentNotice` se muestra adentro del diálogo, y mientras `paymentLoading` el botón dice
  "Enviando..." y queda apagado.
- `submitClientPayment` ahora puede devolver `aviso` (el comprobante no se pudo subir). En `submitPayment`,
  si `result.aviso`, mostralo como notice de advertencia, no como éxito liso. Es una línea.
- Con éxito, el diálogo queda abierto con el cartel verde hasta que el cliente lo cierre.
- **No** se agregan cobros confirmados desde el portal: es un aviso que AK confirma.

## Bloque 2 — La entrega oficial de fotos y video desaparece (A8)

`mapFiestaToPortalDTO` (`page.tsx`, ~87) manda sólo `notasGenerales` de `fotografiaYFilmacion`. Los
`servicios` (tipo `ServicioFotografia`, `src/types/fiesta.ts` ~1794) con `estado` y `linkEntrega` no
llegan, y el cliente no ve el álbum entregado.

- En el DTO, agregá `servicios`, cada uno **sólo** con `id`, `nombre`, `estado`,
  `fechaEntregaEstimada` y `linkEntrega`.
  - Nada de `notas`: son internas.
  - `linkEntrega` sólo si `estado` es `'Entregado parcial'` o `'Entregado completo'`.
- En la pantalla, dentro de la sección de organización, una tarjeta "Tus fotos y videos" con cada
  servicio:
  - el estado, en criollo;
  - la fecha estimada con `formatearFechaEvento`;
  - un botón "Ver entrega" que abre `linkEntrega` en otra pestaña, sólo cuando hay enlace.
- No crees otro álbum. No toques `/portal-cliente/[id]/fotos-video`.

## Bloque 3 — La tarjeta "Pagos" cierra lo que tiene que mostrar (F1)

La tarjeta Pagos (~1204) y `goToPortalSection` (~598) hacen `querySelector('button')?.click()`. El
acordeón de "contable" ya viene abierto (`defaultValue` ~1294), así que el toque **lo cierra**.

- Pasá el `Accordion` de ~1294 a controlado: `value` y `onValueChange` con un estado
  `seccionesAbiertas`, que arranca con el mismo valor que hoy tiene `defaultValue`.
- `goToPortalSection(seccion)` agrega la sección a `seccionesAbiertas` si no está (nunca la saca) y
  después hace el `scrollIntoView`.
- La tarjeta Pagos y el otro lugar que hace `el.querySelector('button')?.click()` (~1239) llaman a
  `goToPortalSection('contable')`. Que no quede ningún `.click()` a ciegas sobre el acordeón.

## Qué tiene que comprobar la prueba

Prueba en `src/__tests__/portal-cliente-lo-que-se-ve.test.tsx` que monte
`PublicPortalClientExperience`, con `submitClientPayment` de mentira. Tiene que comprobar:

- Que tocar "Informar pago" **abre** el diálogo, que con monto 500 y "Enviar" se llama
  `submitClientPayment(fiestaId, 500, …)`, y que con `aviso` en la respuesta sale el texto del aviso.
- Que con un servicio `'Entregado completo'` y `linkEntrega` aparece "Ver entrega" con ese enlace, y
  que con `'En edición'` no aparece el botón.
- Que tocar la tarjeta Pagos **dos veces** deja la sección contable abierta las dos veces.
- **Tiene que dar rojo con el código de hoy.**

## Qué NO tocar

`src/app/actions/fiesta/portal.actions.ts` y `src/app/actions/presupuestos.ts`, que son de Claude. Ni
precios, ni cuentas, ni textos comerciales.

```comprobar
usa: open={paymentModalOpen} en src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx
# Bloque 2
usa: linkEntrega en src/app/portal/c/[accessKey]/page.tsx
usa: seccionesAbiertas en src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx
prueba: src/__tests__/portal-cliente-lo-que-se-ve.test.tsx
```
