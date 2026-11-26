# Orden 359 — Robot, vuelta 4: el Video de Vida no da por terminado lo que empezó, los invitados no se pisan y la fiesta de hoy no es "pasada"

**Para Gemini. Va en la MISMA propuesta que la 350, 355 a 358 (rama `gemini/orden-346`).** Si un bloque se traba, entregá
el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. El bloque 2.3 es de "quién ve qué":
Claude lo revisa línea por línea.

## Por qué
Cuarta vuelta del robot (26/11/2026): áreas fiesta y portal, aspecto celular y textos. En los textos públicos no hubo
promesas prohibidas ni textos en inglés. Claude confirmó cada punto en el código.

## Bloque 1 — Video de Vida en el portal del cliente
1. **Con la primera foto el cliente cree que terminó.** `saveLifeStoryVideoPhoto`
   (`src/app/actions/fiesta/video-vida.actions.ts` ~192-198) marca `photosUploaded: true` con la primera foto, y el portal
   (`src/app/portal-cliente/[id]/page.tsx` ~1240-1262) muestra "Fotos enviadas ✓" y "¡Fotos recibidas!" y **saca el enlace
   para subir las demás**. El aviso automático (`src/lib/automatizaciones-engine.ts` ~257) también deja de recordarle.
   Arreglo: el portal muestra "N de M fotos" (M = `videoVida.photoCount`) con el enlace para seguir subiendo **siempre que
   N < M y la carga no esté cerrada**. "¡Fotos recibidas!" sólo cuando N ≥ M o el equipo cerró la carga. El aviso
   automático mira lo mismo. El conteo N sale de la misma lectura que usa el panel del equipo
   (`src/components/fiestas/panels/video-vida.tsx` ~424, `src/lib/video-vida/lectura-fotos.ts`).
2. **"Fotos cargadas: 50" sin ninguna foto.** `src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx` ~1421 muestra
   `photoCount` (los recuadros), no las fotos recibidas. Que muestre "N de M", con N real. `src/lib/client-portal/public-fiesta.ts`
   ~163-166 pasa hoy sólo un sí/no: sumale la cantidad.
3. **Borrar todas las fotos no vuelve atrás la marca.** `deleteAllVideoVidaPhotos` (`video-vida.actions.ts` ~271-317) y el
   panel (`video-vida.tsx` ~286-301): al borrar todo, `photosUploaded` vuelve a `false`.
4. `src/app/portal/c/[accessKey]/PublicPortalView.tsx` no lo importa nadie (2917 líneas). Fijate con
   `grep -rn "PublicPortalView" src` y, si de verdad no lo usa nadie, borralo.

## Bloque 2 — Invitados (`src/app/actions/fiesta/invitados.actions.ts`)
1. **Editar un invitado pisa lo que otro cambió.** `updateInvitado` (~136-145) reemplaza el invitado entero con la copia
   que abrió la pantalla (`src/components/fiestas/panels/invitados.tsx` ~384). Si en el medio confirmó por la invitación o
   le marcaron la llegada en la entrada, eso se pierde. Que guarde **sólo los campos que la pantalla cambió**, encima del
   invitado actual de la base, dentro de la misma operación. La confirmación y la llegada no las pisa una edición.
2. **Editar un invitado que otro borró dice "Invitado actualizado".** Si el id no está, devolver
   `{ success: false, error: 'Ese invitado ya no está: lo borró otra persona.' }`.
3. **Quién ve qué:** `addInvitado` (~110-134) devuelve `{ ...result }` y `deleteInvitado` (~147-152) devuelve
   `updateFiestaData` tal cual: **la fiesta entera** (datos internos y de todos los invitados) le llega al navegador, y las
   dos las llama el portal del cliente (`src/app/portal/mesas/mesas-del-cliente.tsx` ~132 y ~158). Que devuelvan lo mismo
   que `updateInvitado`: `soloLoDelInvitado` (~37-50), y la pantalla del portal recarga su lista con lo que ya lee.
4. Al borrar un invitado, sacarlo también de `videosParaInvitados[].invitadoIds` (`src/types/fiesta.ts` ~1663).

## Bloque 3 — El tilde del cronograma en vivo no se pierde
`src/components/fiestas/panels/itinerario.tsx` ~175-179 autoguarda la lista entera `programa` copiada al abrir, con
`updatePrograma` (`src/app/actions/fiesta/itinerario.actions.ts` ~8), que la reemplaza toda. Si el encargado tildó un hito en
vivo (`marcarHitoPrograma`, ~26), el autoguardado lo destilda. Arreglo: `updatePrograma` conserva, para cada hito, el
"hecho" y su hora que ya están en la base (lo marca `marcarHitoPrograma`, no la edición del itinerario).

## Bloque 4 — La fiesta de hoy no es "pasada"
`src/app/(app)/eventos/page.tsx` ~188, ~204 y ~216 hacen `new Date(fechaEvento)` con "AAAA-MM-DD" (medianoche de Greenwich =
21:00 del día anterior en Uruguay) y la fiesta del día aparece en "Pasadas" y fuera de las activas. La misma pantalla ya usa
`parseEventDate` en ~752. Usá `parseUruguayDate`/`parseEventDate` en las tres. (La orden 355, bloque 7, pide
`esFiestaProxima`: que esa función también lea la fecha así.)

## Bloque 5 — Botones de la mesa en el portal, tocables
`src/app/portal-cliente/[id]/page.tsx` ~1419-1429: el campo de número de mesa y los botones ✓ y ✕ miden 28 px (`h-7`). En
celular, 40 px de alto como mínimo (habilidad `celular-primero`).

## Barrido en toda la app
- Marcas de "terminado" que se prenden con el primer elemento (pregunta 233): `grep -rnE "(Uploaded|Enviad[oa]s?|Completad[oa])\s*:\s*true" src/app/actions src/lib`.
  Por cada una: ¿significa "empezó" o "terminó"? ¿Quién la apaga si se borra todo?
- Funciones de invitados que devuelven `updateFiestaData` o `{ ...result }` sin recortar: `grep -n "return updateFiestaData\|\.\.\.result" src/app/actions/fiesta/*.ts`.
- `new Date(…fechaEvento)` comparado contra "hoy": `grep -rn "new Date(.*fechaEvento)" src/app src/lib`.
Plata, cobros y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cambiar la decisión del dueño: el cliente no elige fotos del álbum (esto es el Video de Vida, que sí sube).
- No tocar la credencial del invitado que se devuelve a propósito (decisión del 22/09).

## Qué tiene que comprobar la prueba
- `src/__tests__/el-video-de-vida-no-da-por-terminado-lo-empezado.test.ts`: con 1 de 50 fotos, el portal sigue ofreciendo
  subir y dice "1 de 50"; con todo borrado, `photosUploaded` vuelve a falso.
- `src/__tests__/editar-un-invitado-no-pisa-lo-de-otro.test.ts` (base de mentira que devuelve **copias**): editar el teléfono
  con una copia vieja no borra la confirmación ni la llegada guardadas en el medio; editar uno borrado da error; `addInvitado`
  y `deleteInvitado` no devuelven la lista de invitados ni datos internos.
- `src/__tests__/el-tilde-en-vivo-no-se-pierde.test.ts`: tildar un hito y después autoguardar el itinerario con la copia vieja
  deja el hito tildado.
- `tests/e2e/la-cuarta-auditoria-del-25-11.spec.ts` (de la orden 355): sumá que una fiesta con fecha de hoy aparezca en
  activas, no en pasadas.

```comprobar
usa: photosUploaded: false en src/app/actions/fiesta/video-vida.actions.ts
no-usa: return { ...result, invitado: nuevoInvitado } en src/app/actions/fiesta/invitados.actions.ts
usa: lo borró otra persona en src/app/actions/fiesta/invitados.actions.ts
usa: actual.completado en src/app/actions/fiesta/itinerario.actions.ts
no-usa: ? new Date(fiesta.configuracion.fechaEvento) : en src/app/(app)/eventos/page.tsx
no-usa: h-7 w-20 en src/app/portal-cliente/[id]/page.tsx
prueba: src/__tests__/el-video-de-vida-no-da-por-terminado-lo-empezado.test.ts
prueba: src/__tests__/editar-un-invitado-no-pisa-lo-de-otro.test.ts
prueba: src/__tests__/el-tilde-en-vivo-no-se-pierde.test.ts
```
