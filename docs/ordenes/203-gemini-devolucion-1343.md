# Orden 203 — Devolución de la 1343 (órdenes 196 y 202)

Responsable: **Gemini**. Una sola propuesta contra `claude/app-debug-stabilize-m70e6z` actualizada. Antes de
entregar, leé `docs/ANTES-DE-ENTREGAR.md` (preguntas 2, 7 y 57) y corré vos mismo `npx tsc --noEmit` y
`npx jest`: **la 1343 no compilaba y tenía 7 pruebas en rojo**, y figuraba "lista".

## Bloque 1 — Que compile (5 errores del revisor de tipos)

- `src/lib/asistente/por-whatsapp.ts` ~86: indexás el mapa de meses con un `string`; tipalo como
  `Record<string, number>` o validá la clave.
- `src/lib/asistente/por-whatsapp.ts` ~144: `invitados` puede ser `undefined`; ya lo pediste antes de llamar.
- `src/lib/asistente/por-whatsapp.ts` ~174: `status: 'draft'` no existe en `ScheduledMessageStatus`
  (`src/types/...`): usá el estado pendiente que ya usan los otros borradores (`'pendiente'`).
- `src/lib/mensajes/bandeja-unica.ts` ~214 y ~220: `AjustesRespuestasComentarios` no tiene `comentarios`
  ni `mensajesDirectos`. Si hacen falta los interruptores por canal (orden 192), agregalos al tipo y al
  guardado de Ajustes, no los leas inventados.

## Bloque 2 — Las 7 pruebas que la entrega pone en rojo

Las rutas nuevas (`/evento/ar/[fiestaId]`, `/api/meta/webhook`, `/api/asistente/voz-en-vivo/accion`) no
están registradas donde la app las cuenta:

- `npm run mapa:generar` y la cantidad de pantallas en `docs/MANUAL-DE-LA-APP.md`
  (`mapa-de-la-app-al-dia.test.ts`).
- La pantalla nueva necesita su área en `docs/codex/areas.json` (`ninguna-pantalla-queda-sin-area`,
  `codex-tiene-un-final`) y una puerta que llegue a ella (`ninguna-pantalla-del-evento-sin-puerta`).
- Cada ruta de `src/app/api` tiene que estar clasificada como protegida o pública a propósito
  (`API route authentication boundary`): el webhook de Meta es público con firma; la de voz, protegida.

## Bloque 3 — El presupuesto por WhatsApp no lo llama nadie, y sale en cero

`atenderProspectoAnuncioWhatsApp` (`src/lib/asistente/por-whatsapp.ts` ~110) **sólo la llama la prueba**.
Tiene que llamarla `src/app/api/whatsapp/webhook/route.ts` en el camino del prospecto que viene de un
anuncio: hoy, después de `correspondeContestarSolo(...)` (~205) se llama a `processIncomingMessage`; ahí,
si el mensaje trae los datos de la fiesta, va tu función.

Además arma el presupuesto con `subtotal: 0`, `costoEstimado: 0` y `serviciosIncluidos: []`: eso crea un
presupuesto de **cero pesos** a nombre del prospecto. Tomá el paquete base como lo arma el simulador
(`src/app/simulador-de-presupuesto/page.tsx`, la misma cuenta que usa al generar) o, si no podés armarlo
sin elegir servicios, **no crees presupuesto**: dejá el borrador con el enlace al simulador ya cargado con
fecha, invitados y salón. La prueba comprueba que el webhook llama a la función con un mensaje de anuncio,
y que nunca se guarda un presupuesto con total 0.

## Bloque 4 — Sin notas en lugar de código (otra vez)

Siguen los comentarios de la 1341: `// ak_checkin_pendientes_` en
`src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx`, `// escaneadoEn` en
`src/app/actions/fiesta/invitados.actions.ts`, `// FranjaTranquilidad` en
`src/components/budget/BudgetDocument.tsx`, y el import sin usar de `getMisPermisos` en
`src/app/(app)/empresa/page.tsx`. Sacalos, y hacé lo de la orden 181 de verdad (la cola sin señal del
escáner y la franja del presupuesto), o dejá esos bloques afuera avisando cuál falta.

## Bloque 5 — Un detalle de permisos

`src/app/api/asistente/voz-en-vivo/accion/route.ts` ~99: sacá `usuario.role === 'admin' ||`; el dueño se
reconoce sólo por `puede(usuario, PERMISOS.ADMINISTRACION)` (se sacaron esos atajos en la orden 197).

## Qué NO tocar

Plata, cobros y permisos fuera de lo nombrado. Lo que ya está bien de la 1343 se conserva: el filtro de
Vogue en galería y álbum, `getMisPermisos` en el menú, la firma del webhook de Meta y la ruta de voz con
sus niveles de riesgo.

```comprobar
usa: atenderProspectoAnuncioWhatsApp( en src/app/api/whatsapp/webhook/route.ts
no-usa: // ak_checkin_pendientes_ en src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx
no-usa: // FranjaTranquilidad en src/components/budget/BudgetDocument.tsx
no-usa: usuario.role === 'admin' en src/app/api/asistente/voz-en-vivo/accion/route.ts
usa: filtrarPorEstacion( en src/app/evento/galeria/[fiestaId]/page.tsx
prueba: src/__tests__/whatsapp-presupuesto-anuncio.test.ts
```
