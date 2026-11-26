# Orden 360 — Robot, vuelta 5: la confirmación sin enlace no borra al celíaco, la fotocabina no le hereda el aviso al siguiente y "visto" se guarda

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 359 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. El bloque 1 toca la comida:
Claude lo revisa línea por línea.

## Por qué
Quinta vuelta del robot (26/11/2026): áreas invitado y estaciones, aspecto "cada botón hace lo que dice". En los botones
del panel, salvo uno, todos miran el resultado. La invitación no filtra datos de otros invitados y las fechas salen bien.
Claude confirmó cada punto en el código.

## Bloque 1 — Confirmar sin enlace no le borra datos a quien ya estaba (`src/app/actions/fiesta/invitados.actions.ts`)
`submitPublicRsvp` (~575-622): sin enlace personal, busca por nombre (~584-588) y, si lo encuentra, reescribe
`dietaryRestriction` y `isCeliac` (~613 y ~620) con lo que mandó la persona. Si alguien escribe el nombre de un invitado ya
cargado y elige "Ninguna", **se borra la marca de celíaco** y la cocina deja de contarlo.
Arreglo (decisión del dueño que NO cambia: en sus fiestas la identidad es el nombre, y la confirmación devuelve el QR):
- Cuando **no** es su propio registro (`updatingOwnRecord` falso), una restricción ya guardada (celíaco, vegetariano,
  alergias) **no se borra ni se baja a "Ninguna"**: se conserva la guardada si la nueva viene vacía o en "Ninguna", y si
  viene otra distinta se guardan las dos (`alergiasEspecificas` suma el texto). `isCeliac` sólo pasa a `true`, nunca a
  `false`, por esta vía.
- Con su enlace (`updatingOwnRecord`), todo sigue como hoy.

## Bloque 2 — Tope de confirmaciones por dirección
`submitPublicRsvp` (~533-538) permite 12 confirmaciones cada 15 minutos por dirección de internet y fiesta. Invitados de la
misma casa, del mismo wifi del salón o con datos móviles comparten dirección, y el número 13 ve "Demasiados intentos".
Subilo a 60 cada 15 minutos. El tope por invitado que ya existe, si existe, queda.

## Bloque 3 — La fotocabina no le hereda el aviso al invitado siguiente
`src/app/evento/fotocabina/[fiestaId]/page.tsx`: `avisoDelMuro` (~206) se pone sólo en la rama de éxito (~1101) y nadie lo
limpia. `retake()` (~1235) no lo borra y las ramas sin señal (~1062-1068, ~1175-1181) y de error (~1198) no lo tocan. El
invitado siguiente ve "Tu foto quedó guardada y está esperando la aprobación del equipo" sin que su foto esté esperando.
`retake()` y el arranque de cada captura lo ponen en `null`, y las ramas sin señal y de error también. (Es la regla del error
10 de CLAUDE.md: el turno nuevo limpia lo heredado.)
Además, revisá en `src/components/entretenimiento/QrRecuerdo.tsx` ~44 y en `src/app/evento/touchpix/[fiestaId]/page.tsx`
~2020 que "Lo vas a encontrar en la galería" / "Va a aparecer en la galería en unos segundos" no salga cuando la foto quedó
esperando aprobación o la IA falló; si sale, que diga lo que pasó.

## Bloque 4 — "Resumen visto" se guarda de verdad
`src/app/(app)/asistente/asistente-client.tsx` ~222-228: `await marcarResumenVistoAction(resumen.id)` sin mirar el
resultado, y enseguida "Resumen visto" y la tarjeta se oculta. La acción devuelve `{ success: false }` si falla
(`src/app/actions/asistente-proactivo.actions.ts` ~127-135). Si falla, el aviso dice que no se pudo y la tarjeta queda.

## Barrido en toda la app
- Estados de la pantalla de una estación que se ponen en una rama y no se limpian al empezar la captura siguiente
  (error 10 de CLAUDE.md): en `src/app/evento/*/[fiestaId]/page.tsx`, cada `useState` de aviso o cartel, ¿lo limpia
  `retake`/`reset`?
- `await <accion>(...)` seguido de un aviso de éxito sin mirar `success` (pregunta del "dijo que sí"): `npm run "dice-que-si?"`.
- Confirmaciones o formularios públicos que buscan por nombre y reescriben campos sensibles (comida, asistencia):
  `grep -rn "normalizeGuestName" src/app/actions`.
Comida, plata y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cambiar que la confirmación pública devuelva el QR ni que se busque por nombre (decisión del dueño, 22/09).
- No agregar pasos al invitado para confirmar.

## Qué tiene que comprobar la prueba
- `src/__tests__/confirmar-sin-enlace-no-borra-al-celiaco.test.ts`: un invitado celíaco cargado; otra confirmación sin
  enlace con su nombre y "Ninguna" deja `isCeliac: true` y su restricción; con su enlace, sí puede cambiarla.
- `tests/e2e/la-fotocabina-no-hereda-el-aviso.spec.ts`: una foto que queda esperando aprobación muestra el aviso; al tocar
  "otra foto" y sacar una que falla por señal, el aviso de espera no aparece.
- `src/__tests__/el-resumen-visto-se-guarda.test.ts`: con la acción devolviendo `success: false`, no se muestra "Resumen
  visto" y la tarjeta sigue.

```comprobar
usa: isCeliac: existing.isCeliac en src/app/actions/fiesta/invitados.actions.ts
no-usa: limit: 12, en src/app/actions/fiesta/invitados.actions.ts
usa: setAvisoDelMuro(null) en src/app/evento/fotocabina/[fiestaId]/page.tsx
prueba: src/__tests__/confirmar-sin-enlace-no-borra-al-celiaco.test.ts
prueba: tests/e2e/la-fotocabina-no-hereda-el-aviso.spec.ts
prueba: src/__tests__/el-resumen-visto-se-guarda.test.ts
```
