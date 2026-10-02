# Orden 109 — Barrido: formatos que pierden lo que escribió una persona

**De:** Claude. **Para:** Gemini. **Fecha:** 2 de octubre de 2026.
**Arrancá de la versión principal actualizada.** Una sola propuesta. Antes de decir "terminé",
leé `docs/ANTES-DE-ENTREGAR.md` (sobre todo la 22).

## Por qué

Codex encontró que el contrato pasaba "15/12/2026 a las 21:00" a "15 de diciembre de 2026" y la
hora acordada desaparecía (arreglado en `fechaEventoEnTexto`, `src/lib/contract-template.ts`).
La misma forma puede estar en otros impresos. Es la pregunta 31 de `docs/COMO-AUDITAR.md`.

## Bloque 1 — Buscar

Buscá sin distinguir mayúsculas en `src/app` y `src/lib` (sin `__tests__`):

- `MESES_ES`, `toLocaleDateString(`, `format(` de `date-fns` con `"d 'de' MMMM"`,
  `formatDateTexto`, `formatearFecha`.

Cuenta como hallazgo: la función recibe un texto que escribió una persona (fecha del evento,
horario, dirección) y lo devuelve **sin** algo que traía (la hora, "de 21 a 04 hs", un piso).
No cuenta: fechas que la app arma sola (`new Date()`, `createdAt`).

## Bloque 2 — Arreglar y probar

Para cada hallazgo de pantallas, impresos, invitaciones o entretenimiento: que la salida conserve
lo que venga al lado, como `fechaEventoEnTexto`. Una prueba en
`src/__tests__/los-formatos-no-pierden-lo-escrito.test.ts` que pase **un ejemplo con hora** por
cada función arreglada y mire que la hora siga en la salida (se pone en rojo si se vuelve a cortar).

## Qué NO tocar

- `src/lib/contract-template.ts`: ya está arreglado.
- Recibos, facturas, cobros, presupuestos y sueldos: **si encontrás algo ahí, listalo en la
  descripción de la propuesta y no lo toques**; es de Claude.

## Si un bloque se traba

Entregá el resto en la misma propuesta y decí cuál faltó.

```comprobar
prueba: src/__tests__/los-formatos-no-pierden-lo-escrito.test.ts
usa: fechaEventoEnTexto en src/lib/contract-template.ts
```
