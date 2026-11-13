# Orden 294 — Ronda de interfaz en vivo del auditor: el asistente frena el gasto antes de gastar (13/11/2026)

**Para Gemini.** Va **en la misma entrega que las 284 a 293** (tu rama `gemini/ordenes-282-283-entrega-completa`).
**Una sola propuesta, sin fusionar.** Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 102.

**Lo que ya hizo Claude y no se toca:** `/entrar` con sesión iba a `/dashboard` (no existe) y ahora va a `/admin`; el cliente
que entraba a su portal con teléfono y clave iba a `/portal/<id>` (no existe) y ahora va a `/portal-cliente/<id>`
(`src/app/entrar/page.tsx` y `src/app/entrar/EntrarClient.tsx`). El control
`src/__tests__/ningun-enlace-lleva-a-una-pagina-que-no-existe.test.ts` revisa todos los destinos escritos en el código.

## Barrido en toda la app (Claude, 13/11/2026)

- **Destinos que no existen:** el control nuevo recorrió todos los `redirect`, `router.push/replace` y `href` con dirección
  fija o armada de `src/`: sólo estaban rotos los tres de `/entrar` (arreglados).
- **Gasto de IA anotado después y sin freno antes:** de los archivos que llaman `registrarConsumoIA`, sólo
  `src/app/api/multiagent/message/route.ts` (el asistente del equipo) y `src/ai/flows/extract-receipt-data.ts` (leer un
  recibo) no miran el tope antes de pedirle a la IA. Los chats de clientes, prospectos e invitados ya lo miran
  (`asistente-virtual.ts` ~53, ~218, ~374; `simulador-copilot.ts` ~315).

## Bloque 1 — El asistente del equipo y la lectura de recibos miran el tope antes de gastar (P2, plata)

En `src/app/api/multiagent/message/route.ts` y `src/ai/flows/extract-receipt-data.ts`: antes de llamar a la IA,
`if (!(await hayPresupuestoParaIA()))` contesta "Se llegó al tope de gasto de inteligencia artificial de este mes" sin
llamar, igual que `asistente-virtual.ts` ~53. **No cambies el tope** (`topeMensualUYU`): lo decide el dueño.

## Pruebas

- `src/__tests__/el-asistente-frena-antes-de-gastar.test.ts`: con `hayPresupuestoParaIA` en `false`, el asistente del
  equipo y la lectura de recibos devuelven el aviso y la IA simulada **no se llama nunca**.

```comprobar
usa: hayPresupuestoParaIA en src/app/api/multiagent/message/route.ts
usa: hayPresupuestoParaIA en src/ai/flows/extract-receipt-data.ts
prueba: src/__tests__/el-asistente-frena-antes-de-gastar.test.ts
```
