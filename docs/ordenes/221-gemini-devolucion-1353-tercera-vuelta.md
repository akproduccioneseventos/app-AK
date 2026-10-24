# Orden 221 — Devolución de la propuesta 1353 (tercera vuelta, 23/10/2026)

**Para Gemini. Una sola propuesta: seguí en la misma 1353**, rama `gemini/ordenes-180-195`. Primero traé
y fusioná `claude/app-debug-stabilize-m70e6z`. Si un bloque se traba, entregá el resto en la misma
propuesta y avisá cuál faltó. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

## Qué está bien y no se toca

- Bloques 1, 2 y 3 de la orden 220: la función de costos ya no es pública, la prueba de la 183 llama a la
  app de verdad y el revisor de tipos da cero.
- El contador de minutos de voz del cliente y el tope de avisos proactivos, ya pasados a transacción.

## Bloque 1 — cuatro guardados quedaron con un import sin usar (orden 220, bloque 5)

En estos cuatro archivos sólo agregaste el `import` y el `writeData(...)` sigue igual. Pasalos a
transacción, leyendo **adentro** del turno, y sacá los imports que no se usen:

- `src/app/api/cron/asistente-proactivo/route.ts` ~233. Es el contador `avisos-diarios.json`, el mismo que
  ya arreglaste en `src/lib/asistente/avisos-proactivos.ts`. Usá **la misma forma**: reservá el aviso con
  `mutarDocumentoConTransaccion` antes de mandar la notificación, y si el tope ya se alcanzó, no la mandes.
- `src/app/api/cron/metricas-de-redes/route.ts` ~90 (`presencia-digital-revision.json`).
- `src/lib/agentes/motor-agentes.ts` ~45, ~52, ~187, ~256 y ~324. Los de `scheduled-messages.json` y
  `social-posts.json` **agregan** a una lista: usá `mutateGenericJsonArray` y sumá lo nuevo sobre la lista
  leída adentro. Si no, se pierden los mensajes que otra tarea agregó al mismo tiempo. Sacá también el
  import sin usar de `AgenteId` (línea 20).
- `src/lib/asistente/avisar-al-duenio.ts` ~85 (ajustes) y ~147 (contador de WhatsApp del día: con dos
  envíos a la vez cuenta uno).

## Bloque 2 — la voz del cliente no puede fingir una llamada

`src/app/api/asistente/voz-en-vivo/cliente/route.ts`, al final (~137): si Gemini no da la ficha, devuelve
un token inventado (`token_cliente_...`, `modoSimulado: true`). Ninguna pantalla lee `modoSimulado`, así
que el portal intenta conectar con un token falso y el cliente ve una llamada que no anda. Encima ya se le
descontó un minuto y se anotó el gasto de IA.

- Si no hay ficha, devolvé `{ error: 'La llamada no está disponible ahora. Podés escribirnos en el chat.' }`
  con estado 503, **sin token**.
- `registrarConsumoIA('voz-cliente')` va **después** de recibir la ficha, no antes.
- El minuto reservado se devuelve si no hubo ficha: otra `mutarDocumentoConTransaccion` que resta 1, sin
  bajar de 0.
- Prueba: con `fetch` de la ficha fallando, la respuesta es 503 sin `token`, no se llama a
  `registrarConsumoIA` y el contador de minutos queda igual que antes.

## Bloque 3 — la prueba vieja de la voz quedó en rojo

`src/__tests__/la-voz-en-vivo-lib.test.ts` línea 68 todavía pide `/No ejecuto acciones por voz/`. Esa frase
se cambió a propósito (orden 220, bloque 4). Cambiá la prueba para que pida
`/Fuera de las herramientas no cambies, cobres, mandes ni borres nada/`. Lo demás de esa prueba no se toca.

## Bloque 4 — permisos: el personal sigue viendo seña y saldo (orden 183, bloque 2)

Lo pedía la orden 183 y no está hecho; la prueba se ajustó a lo que había en vez de al pedido.

- `sinCobros` en `src/app/actions/presupuestos.ts` (~90) saca sólo `pagosCliente`. Que saque también
  **`senia` y `saldo`**. El total queda.
- `src/app/actions/dashboard.ts` (~185-196): el aviso "Saldo pendiente" se arma para todos. Que vaya sólo
  si `veLaPlata` (está definido en ~100).
- En `src/__tests__/la-fiesta-llega-con-la-plata-de-cada-perfil.test.ts`, caso 7: `senia` y `saldo` en
  `undefined` para el operador, en la lista y en `getPresupuestoById`. Sumá un caso: el panel del operador
  no trae avisos `budget_balance_`. Comprobalo rompiéndolo: sacando `senia`/`saldo` de `sinCobros`, el
  caso 7 tiene que ponerse en rojo.

## Bloque 5 — lo que sigue en FALTA de devoluciones anteriores

`npm run "ordenes?"` todavía marca:

- **196:** `mind-ar` no está en `package.json`, y falta `tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts`.
  Ver la orden 196, bloques 2 y 6.
- **202:** `src/lib/asistente/por-whatsapp.ts` no llama a `generateBudgetAndLeadFromSimulator(`. Ver la
  orden 202.

## Cómo se entrega

Todo `npx jest` en verde, `npx tsc --noEmit` en cero, y en `npm run "ordenes?"` la 196, la 202, la 220 y
la 221 como HECHA.

```comprobar
no-usa: writeData('asistente/avisos-diarios.json' en src/app/api/cron/asistente-proactivo/route.ts
no-usa: writeData('presencia-digital-revision.json' en src/app/api/cron/metricas-de-redes/route.ts
no-usa: writeData('scheduled-messages.json' en src/lib/agentes/motor-agentes.ts
no-usa: writeData('social-posts.json' en src/lib/agentes/motor-agentes.ts
no-usa: writeData(ENVIOS_DIARIOS_FILE en src/lib/asistente/avisar-al-duenio.ts
no-usa: modoSimulado en src/app/api/asistente/voz-en-vivo/cliente/route.ts
no-usa: token_cliente_ en src/app/api/asistente/voz-en-vivo/cliente/route.ts
no-usa: No ejecuto acciones por voz en src/__tests__/la-voz-en-vivo-lib.test.ts
usa: budget_balance_ en src/__tests__/la-fiesta-llega-con-la-plata-de-cada-perfil.test.ts
prueba: src/__tests__/la-fiesta-llega-con-la-plata-de-cada-perfil.test.ts
prueba: src/__tests__/la-voz-en-vivo-lib.test.ts
# Bloque 5
usa: generateBudgetAndLeadFromSimulator( en src/lib/asistente/por-whatsapp.ts
```
