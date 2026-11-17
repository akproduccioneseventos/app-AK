# Orden 316 — Auditoría de aceptación (auditor, 17/11/2026, 09:47-10:03)

Informe del auditor externo. Corrió el plan de 10 casos (C1 a C10). **Ya no se reproducen**: el selector y la respuesta del
RSVP, el botón Publicar foto y la carga infinita de la presentación LED (siguen pedidos en la orden 315 para que queden
probados). Va en la **misma propuesta** que 313, 310, 311, 312, 314 y 315.

## Bloque 1 — Precio y cuotas con la misma base (C2) — YA ARREGLADO POR CLAUDE

Para enero de 2027 el resumen decía precio $92.675 y el plan de pagos sumaba $106.576: las cuotas se calculaban con el
ajuste anual que, por decisión del dueño (orden 267), el prospecto **no ve**. Claude lo dejó: las cuotas salen del mismo
precio que se muestra (`calculateSimulatorPaymentPlan` en `src/app/simulador-de-presupuesto/page.tsx`, línea ~862).
**Lo que queda para vos:** en `tests/e2e/el-simulador-no-muestra-el-ajuste.spec.ts`, sumá que, para una fecha del año que
viene, seña + cuotas = precio vigente que se ve en pantalla. Y revisá que el PDF del simulador
(`src/lib/budget/simulator-budget-pdf.ts`) diga los mismos números que la pantalla.

## Bloque 2 — Buzón: guardado en el teléfono no es "recibido" (C8)

Ampliá el bloque 2 de la orden 315: el buzón guarda en una cola del teléfono (`ak_offline_media_storage`, almacén
`media_queue`) y vuelve al inicio sin decir nada. El invitado tiene que ver uno de tres estados, en criollo:
**"Recibido"** (el servidor lo confirmó), **"Guardado en tu teléfono, se manda cuando haya señal"** (quedó en la cola) o
**"No se pudo: [motivo]"** (rechazado, incluido el de auditor). Un archivo en la cola **nunca** se muestra como enviado.

## Bloque 3 — RSVP: que se vea qué está elegido (C7)

Las restricciones alimentarias ya se eligen, pero el borde de la opción no deja claro cuál está marcada. Marcado = fondo de
color y tilde.

## Lo que no es de la app (no se toca)

C5, C6 y C10 los dejó pendientes porque la DEMO no deja guardar y no hubo teléfonos de verdad. No es un defecto.

## Barrido en toda la app

Hecho por Claude el 17/11: **cuotas o planes de pago que no salen del mismo total que se muestra**. Buscado
`calculateSimulatorPaymentPlan`, `projectedTotal` y `annualProjection` en lo que ve el prospecto: sólo el simulador público
lo usaba así (arreglado). El presupuesto manual y el portal usan el total del presupuesto (el portal muestra el ajuste a
propósito, con contrato firmado). **Cola local contada como envío:** sólo el buzón (bloque 2).

```comprobar
usa: annualAdjustmentApplies: false en src/app/simulador-de-presupuesto/page.tsx
```
