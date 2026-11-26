# Orden 368 — Robot, vuelta 13 (seis especialistas): lo que la app da por hecho y no pasó, la ficha del empleado, los documentos de la fiesta y las cuentas de comida

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 367 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. **Los bloques 3, 4 y 5 son
permisos, plata o comida: Claude los revisa línea por línea.**

## Por qué
Segunda vuelta con los seis especialistas (26/11/2026). Cada punto lo confirmó Claude abriendo el archivo. Sin hallazgos: recibos del
personal, firma digital, contrato en papel, plan de pagos del contrato y cancelaciones, sesión del portal, cierre de barra, merma de
bebidas, respuestas públicas en redes (sin precios ni promesas) y los botones de las estaciones.

## Bloque 1 — "Oculto" sólo si Meta lo ocultó (pregunta 243)
`src/lib/social-media/comments-backfill.ts` ~1127-1146: marca `inc.isAutoHidden = true` **antes** de llamar a `hideCommentOnMeta`, no
mira lo que devuelve (~567-571 devuelve `false` si Meta falla) y, sin token, ni siquiera lo llama. Lo mismo `hideCommentInternal`
(~1433-1460). El dueño ve "Oculto" y la queja sigue pública; como queda marcada, la próxima corrida no lo reintenta.
Arreglo: `isAutoHidden: true` sólo si `hideCommentOnMeta` devolvió `true`. Si no, `ocultarPendiente: true` con el motivo; la corrida
siguiente lo reintenta y, si sigue fallando, se le avisa al dueño (decisión del 12/11: las quejas se ocultan solas **y se avisa**).

## Bloque 2 — Carteles que festejan lo que no pasó
1. **Cabina con IA** (`src/app/evento/touchpix/[fiestaId]/page.tsx` ~1962-1967): dice "¡Foto enviada! Ya está en el muro de la fiesta"
   aunque el muro pide aprobación (`requireApproval: true` por defecto, `src/lib/fiesta-defaults.ts` ~530) y la foto quedó en `pending`.
   `src/app/actions/touchpix-ai.ts` ~744-800 devuelve el `post`: si `post.moderationStatus === 'pending'`, que diga "Tu foto quedó
   esperando la aprobación del equipo", como ya hace el espejo (`src/app/evento/espejo-magico/[fiestaId]/page.tsx` ~995-998).
2. **Espejo**: `handleImprimir` (~915-931) imprime con `textoDeMarca: 'AK Producciones'` fijo. El interruptor "Quitar marca"
   (~1317, `watermarkEnabled`) no cambia la copia impresa, y se ignora `fiesta.station.brandText`. Hacé como la fotocabina
   (`src/app/evento/fotocabina/[fiestaId]/page.tsx` ~799): sin marca si está apagada y, si no, `brandText` o "AK Producciones".

## Bloque 3 — Editar un empleado no borra lo que el formulario no tiene
`src/app/actions/empleados.ts` ~78-80 copia `googleWorkspaceEmail`, `googleCalendarId` y `portalNotas` con `formData.get(...)`, que da
`null` si el formulario no los manda, y el de edición (`src/app/(app)/empleados/[id]/editar/page.tsx` ~140-155) no los manda. El guardado
(~173, `{ ...actual, ...cambiosDelFormulario }`) los pisa con `null`. Con el mail de Workspace borrado, la app deja de reconocer a esa
persona como del equipo de la fiesta (`src/lib/auth/equipo-de-la-fiesta.ts` ~33, `src/lib/auth/event-access.ts` ~34-38) y las
invitaciones de calendario van a otro mail. Un campo que no vino (`empleadoData.has(...)` falso) no se toca. Mirá los demás campos del mismo
bloque con la misma regla.

## Bloque 4 — Los documentos de la fiesta no se pisan, y tres acciones de invitados sin dueño
1. `src/app/actions/fiesta/documentos.actions.ts`: subir (~126-150) lee la fiesta, sube el archivo (segundos) y guarda
   `othersDocumentos: [...(fiesta.othersDocumentos || []), newDoc]` con la copia vieja; borrar (~175-192) igual con un `filter`. Una adenda
   que el cliente agregó en el medio con el cambio de fecha (`portal.actions.ts`) desaparece, o un documento ya borrado vuelve. Que el
   agregado y el borrado se hagan **sobre la lista actual** dentro de `actualizarFiesta`, después de subir el archivo (pregunta 210).
2. `updateGuestRsvp` (~162), `updateGuestDetails` (~332) y `updateGuestExperience` (~312) de `src/app/actions/fiesta/invitados.actions.ts`
   son acciones del servidor **sin ningún control**: con el número de la fiesta y el de un invitado (los que confirman solos tienen un
   número armado con la hora, `inv_rsvp_${Date.now()}`, ~287) se le cambian la asistencia, los acompañantes, la restricción de comida
   (incluido celíaco) y las fotos. No las llama ninguna pantalla. **Borralas**, y sacalas de la lista de
   `src/__tests__/la-pantalla-publica-no-devuelve-la-lista-de-invitados.test.ts` (~32-34).

## Bloque 5 — Cuentas de comida y bebida
1. `src/app/actions/fiesta/fiesta.actions.ts` ~1413-1415 (`syncFiestaFromBudget`): `itemMatchesKeywords` (~873-876) busca **pedazos** de
   palabra: "barra" mete "BARRA DJ" en bebidas, y "ron" mete "CANASTAS PANERAS MARRONES". Después `costos.actions.ts` lo suma como bebida y
   la lista de compras lo pide a "Proveedor Bebidas". Buscá **palabras enteras** (`\b`) y descartá lo que tenga categoría de equipo,
   iluminación, sonido o mobiliario (pregunta 241).
2. `src/app/actions/fiesta/costos.actions.ts` ~141: repostería `(item.costoEstimado || 0) * (item.cantidad || 1)`: con cantidad 0 suma
   igual, y la lista de compras (`src/components/panels/catering--lista-compras.tsx` ~289) ya la descarta. Cantidad 0 es $0.
3. `src/lib/catering/unidades.ts` ~40 (`comoAntes`): cuando las unidades no se pueden convertir (receta "Unidad", catálogo "Docena"),
   multiplica como si fueran la misma: 2 huevos × $180 la docena × 50 = $18.000 en vez de $1.500. Sumá "Docena" = 12 unidades a la
   conversión, y lo que siga sin convertir que **no sume al costo** y quede en el aviso que ya existe
   (`unidadesQueNoSePuedenConvertir`). (La orden 357 lo pidió para la lista; esto es el costo del menú.)
4. `src/lib/compras/consolidar-compras.ts` ~95: `convertir(...) ?? 0` toma el stock como **cero** si no convierte (4 botellas de ron
   contra una receta en ml). Que el stock que no convierte no se descarte en silencio: se muestra en el aviso y no se compra de más
   sin decirlo.

## Bloque 6 — Fechas y un botón del portal (pregunta 70)
1. `src/lib/planPagos.ts` ~63 y ~84: `new Date(fechaEvento)` con "AAAA-MM-DD" y la cuota final 30 días antes, guardada con
   `toISOString()` (~130-173). El portal del cliente (`src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx` ~539) la muestra
   **un día antes** todo el día (evento 31/03/2027 → "vence el 28 feb"). Armá la fecha con `parseUruguayDate` y guardá el día
   ("AAAA-MM-DD"), no el instante.
2. `src/app/portal/mesas/mesas-del-cliente.tsx` ~442: el botón de borrar invitado mide 32 px (`h-8 w-8`): `h-10 w-10`.

## Barrido en toda la app
- Una marca de "hecho" que se pone antes de saber si lo de afuera salió (pregunta 243): `grep -rnE "(isAutoHidden|publicad[oa]|enviad[oa]|ocult[oa]\w*)\s*=\s*true" src/lib src/app/actions`
  y mirar si la llamada a Meta, Google o WhatsApp de abajo devuelve algo que nadie mira.
- Palabras por pedazos en listas (pregunta 241): `grep -rn "haystack.includes\|keywords.some" src` — ¿una palabra corta de la lista entra
  en otra?
- Formularios de edición que mandan menos campos de los que guarda la acción: `grep -rn "formData.get(" src/app/actions` y comparar con
  el formulario.
- Acciones exportadas sin control y sin nadie que las llame: `grep -rn "^export async function" src/app/actions/fiesta` y, por cada una,
  ¿la llama alguien? ¿pide algo?
Plata, comida y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cambiar que las quejas se oculten solas.
- No sacar el PIN de operaciones del portal ni cambiar cómo se cancela.
- No pedirle al invitado más pasos para confirmar.

## Qué tiene que comprobar la prueba
- `src/__tests__/oculto-solo-si-meta-lo-oculto.test.ts`: con Meta respondiendo error, el comentario queda `ocultarPendiente` y no
  `isAutoHidden`; con Meta respondiendo bien, `isAutoHidden`.
- `src/__tests__/editar-un-empleado-no-borra-su-workspace.test.ts`: guardar la ficha sin `googleWorkspaceEmail` en el formulario deja el
  que estaba.
- `src/__tests__/los-documentos-de-la-fiesta-no-se-pisan.test.ts` (base que devuelve **copias**): una adenda agregada durante la subida
  sigue estando después.
- `src/__tests__/las-bebidas-no-se-confunden-con-equipos.test.ts`: "BARRA DJ" y "CANASTAS PANERAS MARRONES" no entran a bebidas; repostería
  con cantidad 0 cuesta $0; 2 huevos con catálogo por docena a $180 para 50 cuestan $1.500.
- `src/__tests__/la-cuota-final-vence-el-dia-que-dice.test.ts`: evento 31/03/2027 → cuota final 01/03/2027 y el portal muestra "1 mar".
- `tests/e2e/la-cabina-ia-dice-si-espera-aprobacion.spec.ts`: con aprobación pedida, la cabina no dice "Ya está en el muro".

```comprobar
usa: ocultarPendiente en src/lib/social-media/comments-backfill.ts
usa: moderationStatus en src/app/evento/touchpix/[fiestaId]/page.tsx
no-usa: textoDeMarca: 'AK Producciones', en src/app/evento/espejo-magico/[fiestaId]/page.tsx
usa: empleadoData.has en src/app/actions/empleados.ts
no-usa: othersDocumentos: [...(fiesta.othersDocumentos || []), newDoc] en src/app/actions/fiesta/documentos.actions.ts
no-usa: export async function updateGuestDetails en src/app/actions/fiesta/invitados.actions.ts
no-usa: export async function updateGuestExperience en src/app/actions/fiesta/invitados.actions.ts
no-usa: haystack.includes(k.toLowerCase()) en src/app/actions/fiesta/fiesta.actions.ts
no-usa: (item.costoEstimado || 0) * (item.cantidad || 1) en src/app/actions/fiesta/costos.actions.ts
usa: Docena en src/lib/catering/unidades.ts
no-usa: convertir(stockCrudo, unidadStock, base) ?? 0 en src/lib/compras/consolidar-compras.ts
usa: parseUruguayDate en src/lib/planPagos.ts
no-usa: h-8 w-8 text-destructive en src/app/portal/mesas/mesas-del-cliente.tsx
prueba: src/__tests__/oculto-solo-si-meta-lo-oculto.test.ts
prueba: src/__tests__/editar-un-empleado-no-borra-su-workspace.test.ts
prueba: src/__tests__/los-documentos-de-la-fiesta-no-se-pisan.test.ts
prueba: src/__tests__/las-bebidas-no-se-confunden-con-equipos.test.ts
prueba: src/__tests__/la-cuota-final-vence-el-dia-que-dice.test.ts
prueba: tests/e2e/la-cabina-ia-dice-si-espera-aprobacion.spec.ts
```
