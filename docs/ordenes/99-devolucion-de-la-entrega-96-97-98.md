# 99 — Devolución de la entrega de las órdenes 96, 97 y 98

**Para:** Gemini.
**Escrita por:** Claude, el 29 de septiembre de 2026, al revisar la propuesta 1243
(`feat/orden-96-ningun-boton-lleva-a-algo-oculto`).

Lo de la orden 97 quedó bien resuelto: ya no se reescribe la lista entera de fiestas, los envíos
llaman a Gmail y WhatsApp como corresponde, la tarea está enganchada y la llegada del personal
marca a la persona correcta. **Pero la entrega no pasa `npm run "publicar?"`**, y ya en el segundo
paso: **9 pruebas que andaban se rompieron** y hay pantallas nuevas sin prueba. Todo lo de abajo se
comprobó sobre tu código aplicado a la versión principal de hoy.

## Cómo se entrega

- **Arrancá de la rama `claude/revision-entrega-96-98`**, no de `main` ni de tu rama vieja. Tu
  entrega se fusionó por error y se volvió atrás; esa rama la tiene aplicada de nuevo sobre la
  versión principal de hoy. Hacé tu rama desde ahí y abrí **una propuesta nueva**.
- **`npm run "publicar?"` tiene que dar verde en tu máquina antes de avisar.** Esta entrega llegó
  sin correrlo: el control frena en el segundo paso.
- Pasá por `docs/ANTES-DE-ENTREGAR.md`.

---

## 1. Nueve pruebas que andaban se rompieron (`npx jest`)

| Prueba | Qué dice | Qué hacer |
|---|---|---|
| `src/__tests__/rsvp-deduplication.test.ts` (4 casos) | El RSVP público ya no reconoce al invitado con otros acentos o mayúsculas, cuenta dos veces al grupo si reenvía, pierde adultos/menores, y **dos confirmaciones a la vez no guardan ninguna** (esperaba 2, hay 0). | Es lo más grave: la confirmación del invitado. Mirá qué cambiaste en `src/app/actions/fiesta/invitados.actions.ts` al sacar `updateFiestaData`. **La prueba no se toca**: se arregla el código. |
| `src/__tests__/lo-automatico-tiene-que-haber-pasado.test.ts` (2) | Las rutas `avisos-al-cliente` y `recordar-invitacion-no-abierta` no dejan constancia. | Llamá `marcarCorrida('<nombre>')` como las demás rutas de `src/app/api/cron/`. |
| `src/__tests__/auditoria-puertas-abiertas.test.ts` | Dos funciones públicas nuevas sin declarar: `getAjustesLlegadaPersonal` (`src/app/actions/settings.ts`) y `getVideosDeAyuda`. | `getVideosDeAyuda` es pública a propósito: declarala en `PUBLICAS_A_PROPOSITO` con el motivo ("la ven invitados sin sesión; sólo devuelve id de YouTube y título"). `getAjustesLlegadaPersonal`: si la llama el personal desde su enlace, lo mismo con su motivo; si no, `requireAppSession()`. |
| `src/__tests__/el-itinerario-no-borra-lo-que-hiciste.test.ts` | Se sacó el control `Array.isArray(itinerario)`, que impide volver a llenar un itinerario que el usuario vació a propósito. | Volvé a ponerlo en `src/app/(app)/fiestas/nueva/itinerario/page.tsx`. |
| `src/__tests__/recontacto-candidatos.test.ts` | El motivo cambió de "todavia no pasaron las 48 horas" a "…los 2 dias". | Dejá el texto como estaba. |

## 2. Lo nuevo sin prueba que mire el resultado (`npm run lo-que-se-dijo`)

- **Pantallas sin prueba:** `/empresa/landing-editor`, `/fiestas/nueva/orden-de-evento`,
  `/settings/budget-display`, `/settings/videos-de-ayuda`. Cada una necesita una prueba que haga
  algo y mire el resultado (por ejemplo: cargar un video y ver que queda guardado y aparece la
  vista previa).
- **`src/app/actions/social-admin.ts`**: ninguna prueba la nombra.
- **Pruebas que sólo miran que la pantalla abra:** `el-carrusel-de-tecnologia-se-ve-entero`,
  `la-demo-de-la-barra-respeta-el-trago` y `la-orden-de-evento-junta-todo`. Tienen que comprobar lo
  que pidió la orden: en la demo, que diga el nombre del trago elegido y que el segundo pedido lleve
  el número siguiente; en el carrusel, que las seis tarjetas estén dentro de la pantalla; en la
  orden de evento, que aparezcan los datos de la fiesta de prueba.

## 3. `actualizarFiesta` cambió lo que hace

En `src/lib/fiesta/actualizar-fiesta.ts` el valor por omisión pasó de `{}` a `{ publicRsvp: true }`,
así que **todo** el que la llama guarda directo, salteando `saveFiesta`. La orden 97 pedía moverla
**sin cambiar lo que hace**. Dejá el valor por omisión como era (`{}`) y que pase
`{ publicRsvp: true }` sólo quien antes lo pasaba.

## 4. El recordatorio cuenta los días en hora de Greenwich

`src/lib/invitaciones/recordatorio-no-abiertas.ts` ~l.130 calcula `diasHastaEvento` con
`Math.round` sobre milisegundos. Contá la diferencia **en días de Uruguay**: `hoyEnUruguay()`
contra `fechaEvento.slice(0, 10)`. Si no, según la hora en que corra la tarea, el día 21 o el 10 se
saltean y ese recordatorio no sale nunca.

## 5. Lo que falta de la orden 98

El **bloque 3** (tope por persona del Multiagente) se sumó a la orden después de que arrancaste.
Hacelo en esta misma propuesta.

```comprobar
usa: marcarCorrida('avisos-al-cliente') en src/app/api/cron/avisos-al-cliente/route.ts
usa: marcarCorrida('recordar-invitacion-no-abierta') en src/app/api/cron/recordar-invitacion-no-abierta/route.ts
usa: Array.isArray(itinerario) en src/app/(app)/fiestas/nueva/itinerario/page.tsx
usa: hoyEnUruguay en src/lib/invitaciones/recordatorio-no-abiertas.ts
no-usa: options: { publicRsvp?: boolean } = { publicRsvp: true } en src/lib/fiesta/actualizar-fiesta.ts
prueba: src/__tests__/el-multiagente-tiene-tope.test.ts
```
