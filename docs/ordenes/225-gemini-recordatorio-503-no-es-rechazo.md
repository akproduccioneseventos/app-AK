# Orden 225 — Un 503 no es un rechazo, y la prueba del asistente sin `mutarDocumento` (Codex 350 y 353, 24/10/2026)

**Para Gemini. Va en la misma propuesta 1353**, rama `gemini/ordenes-180-195`, junto con lo que falta de la
orden 222 y las órdenes 223 y 224. Primero traé y fusioná `claude/app-debug-stabilize-m70e6z`. Si un bloque se
traba, entregá el resto y avisá cuál faltó. Leé `docs/ANTES-DE-ENTREGAR.md` (pregunta 68) antes de decir
"terminé".

## Qué está bien y no se toca

Codex volvió a probar tu entrega `3f9460185`. Los ocho criterios de la orden 217 (R1 a R4) pasan, y los
bloques A7 y A8 de la orden 212 también. **No los rehagas.** El rechazo 403 que libera la reserva queda como
está.

## Bloque 1 — el recordatorio a invitados puede salir dos veces

`src/lib/invitaciones/recordatorio-no-abiertas.ts`, función `esRechazoConocido` (~89). Cuando el proveedor
contesta **503** (no disponible: no se sabe si el mensaje salió) y el texto del error trae "403" por
casualidad (en un código de rastreo, por ejemplo), la expresión de la línea ~96 lo toma como rechazo. Se libera
la reserva del día y la corrida siguiente le manda el recordatorio otra vez al mismo invitado.

- **Si hay un estado numérico** (`error.status`, `error.statusCode` o `error.response?.status`), **manda el
  número**: entre 400 y 499 es rechazo (`true`); cualquier otro número, incluido 503, es `false`. **No se lee
  el texto.**
- Sólo si **no** hay número se mira el texto, y con números enteros: `\b(400|401|403|404|422)\b` y
  `HTTP\s*4\d\d`. `REJECTED` queda.
- Los dos lugares que la llaman (~321 y ~370) no se tocan: con `false` ya liberan con `revisarEnvio: true`.

Prueba en `src/__tests__/recordatorio-no-abiertas-origen-reserva-y-fallo.test.ts`, sumando dos casos con el
envío y el respaldo fallando:

1. Error `{ status: 503, message: 'HTTP 503 upstream unavailable; trace qa403' }`, **dos corridas
   seguidas**: el remitente se llama **una sola vez** y la reserva queda con `revisarEnvio: true`.
2. Error `{ status: 403, message: 'forbidden' }`: la reserva se libera sin `revisarEnvio`, como hoy.

Comprobá que el caso 1 se pone en rojo con la función vieja.

## Bloque 2 — la prueba del asistente proactivo quedó en rojo por el reemplazo de la base

`src/__tests__/el-asistente-se-anticipa.test.ts` (~23) reemplaza `@/lib/generic-json-store` sin
`mutarDocumento`. Desde la orden 221, `avisar-al-duenio.ts` guarda los ajustes con `mutarDocumento`, así que
`saveSettingsAsistenteAction` (~334) devuelve `false`.

- Agregá `mutarDocumento` al reemplazo: lee el documento de mentira, le aplica la función y guarda **una
  copia** (regla 11 de CLAUDE.md).
- **No le saques `requirePermiso`** a `saveSettingsAsistenteAction`, y no cambies lo que la prueba espera.

## Bloque 3 — once pruebas que se pasan de 5 segundos

Codex vio 11 vencimientos de 5000 ms en cinco archivos de `src/__tests__`, corriendo todo junto. Corré
`npx jest --silent` completo y, por cada prueba que se pase del tiempo, buscá qué espera (una lectura de verdad,
un temporizador real). Arreglá la espera: la base de mentira, o `jest.useFakeTimers()`. **No subas el tiempo
límite ni la saques.** Si alguna sólo falla con la máquina cargada y pasa sola, dejalo escrito en la propuesta
con su nombre.

```comprobar
usa: function esRechazoConocido en src/lib/invitaciones/recordatorio-no-abiertas.ts
no-usa: |403|400|401|404|422|REJECTED en src/lib/invitaciones/recordatorio-no-abiertas.ts
usa: trace qa403 en src/__tests__/recordatorio-no-abiertas-origen-reserva-y-fallo.test.ts
usa: mutarDocumento en src/__tests__/el-asistente-se-anticipa.test.ts
prueba: src/__tests__/recordatorio-no-abiertas-origen-reserva-y-fallo.test.ts
prueba: src/__tests__/el-asistente-se-anticipa.test.ts
```
