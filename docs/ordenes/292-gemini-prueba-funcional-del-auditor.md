# Orden 292 — Prueba funcional del auditor: lo que dice "listo" y no quedó así (12/11/2026)

**Para Gemini.** Va **en la misma entrega que las 284 a 291** (tu rama `gemini/ordenes-282-283-entrega-completa`).
**Una sola propuesta, sin fusionar.** Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 99. En cada bloque, la prueba
**vuelve a leer la base** después de la acción: `success: true` no alcanza.

**Lo que ya hizo Claude y no se toca:** revertir un ajuste de precios vuelve al precio de antes (`porcentajeInverso` en
`src/lib/precios/porcentaje-inverso.ts`), y ningún ajuste acepta bajar 100% o más (`porcentajeDeAjusteValido`, usado en
`adjustAllServicePrices` y `adjustAllServiceCosts`).

## Barrido en toda la app (Claude, 12/11/2026)

- **Borrar el último de una lista no borra en la base:** `writeToFirestore` (`src/lib/firebase-sync.ts` ~325) ignora una
  escritura de lista vacía salvo para los archivos de `ALLOW_EMPTY_ARRAY_RESET_FILES` (~114). Las plantillas de tareas,
  de canvas y de marketing no están: la acción dice "borrada" y al recargar vuelve. Raíz en el bloque 1.
- **Un campo que se saca con `undefined` no se saca en la base:** `sanitizeForFirestore` (~129) omite `undefined` y las
  escrituras son `merge: true` (~312, ~376): el campo viejo queda. Caso real: `updateMenuAsignado(fiesta, undefined)`
  (`src/app/actions/fiesta/catering.actions.ts` ~20). Raíz en el bloque 2.
- **Dos campos que dicen lo mismo:** `isCeliac` y `dietaryRestriction` en invitados
  (`src/app/actions/fiesta/invitados.actions.ts` ~183 y ~336: `|| inv.isCeliac` no deja volver a "Ninguna").
- Descartado: las descargas de contratos, recibos y ZIP pasaron con los bytes exactos y los permisos correctos.

## Bloque 1 — Borrar el último de una lista queda borrado (P1)

- Sumá `'task-templates.json'`, `'deco-canvas-templates.json'` y `'marketing-templates.json'` a
  `ALLOW_EMPTY_ARRAY_RESET_FILES`.
- **De raíz:** cuando `writeToFirestore` **ignora** una lista vacía (la rama del `logger.warn` ~338 y la de la transacción
  ~282), que **tire un error** con "No se guardó: la lista quedaría vacía y este archivo no permite vaciarse", en vez de
  volver como si hubiera guardado. Así ninguna pantalla dice "borrado" sin borrar.
- Recorré las acciones que borran de un archivo de `FILE_TO_COLLECTION` que **no** está en la lista (buscá `filter(` seguido
  de `writeData(` en `src/app/actions/`) y sumá a la lista los que el equipo puede vaciar de verdad. **Presupuestos,
  clientes, facturas y fiestas no se agregan**: esos no se vacían nunca.

## Bloque 2 — Sacar un dato lo saca también de la base (P1)

En `sanitizeForFirestore` / las escrituras con `merge: true` de `src/lib/firebase-sync.ts`: un campo que viene en
`undefined` **dentro de una actualización parcial** (`updateFiestaPartial`, `mutateDataItem`) se manda como
`FieldValue.delete()`. Las escrituras de documentos enteros siguen igual. Caso a probar: `updateMenuAsignado(id,
undefined)` y después leer la fiesta desde la base: no tiene `menuAsignadoId`, y el menú se puede borrar.

## Bloque 3 — El tablero del CRM cuenta igual que los indicadores (P2, plata a la vista)

`getCrmBoardData` (`src/app/actions/crm.ts`) calcula activos, embudo y conversión sin las etapas finales personalizadas;
`getCrmKpiData` (~896) usa `idsDeEtapaGanadora` / `idsDeEtapaPerdida` (`src/lib/crm/etapas-finales.ts`). Que el tablero
use las mismas dos funciones. Prueba: un activo de 100, un ganado de 200 y un perdido de 300 con etapas de nombre propio:
las dos funciones dan 1 activo, embudo 100 y conversión 50%.

## Bloque 4 — Reiniciar presupuestos no deja al prospecto apuntando a la nada (P2)

`resetAllPresupuestos` (`src/app/actions/presupuestos.ts`) limpia la fiesta pero no el prospecto: en `crm-leads.json`,
sacá `presupuestoId` (y los ids de presupuesto que guarde) de cada prospecto que apuntaba a uno borrado, sin tocar el resto
de la ficha, dentro del mismo turno del CRM.

## Bloque 5 — Volver a "Ninguna" saca la celiaquía (comida, P1)

`src/app/actions/fiesta/invitados.actions.ts` ~183, ~267 y ~336: `isCeliac` se calcula **sólo** de la restricción nueva
(`=== 'Celiaco'`), sin `|| inv.isCeliac`. Si la respuesta no trae restricción, se conserva la anterior completa (los dos
campos juntos). Prueba: Celíaco → Ninguna deja `isCeliac: false`; Celíaco → (sin campo) deja los dos como estaban; y la
lista de cocina cuenta 0 celíacos.

## Bloque 6 — El buzón sólo acepta imágenes que son imágenes (P2)

`uploadBuzonMessage` (`src/app/actions/buzon.ts`): además del tipo declarado, mirar los primeros bytes (JPEG `FF D8 FF`,
PNG `89 50 4E 47`, WebP `RIFF....WEBP`, HEIC `ftyp`) y rechazar con "El archivo no es una foto" si no coinciden. Lo mismo
para video si el buzón acepta video (MP4 `ftyp`, WebM `1A 45 DF A3`).

## Bloque 7 — El kiosco encuentra la fiesta de hoy sin sesión (P2)

`getFiestaActivaDeHoy` (`src/app/actions/fiesta-actual.ts` ~204) dice ser pública a propósito, pero llama
`FiestaModule.getFiestas`, que pide sesión. Leé las fiestas con la lectura del servidor (`readData('fiestas.json', [])`) y
devolvé **sólo** `{ fiestaId }`, nada más de la fiesta. Prueba sin sesión: devuelve el id de la fiesta de hoy y ningún
otro dato.

## Bloque 8 — El Video de Vida sale con música (P2)

`herramientas/ak-editor/video_de_vida.py` ~925-960: el MP4 sale de `cv2.VideoWriter` sin audio. Después de escribir el
video, mezclar `ruta_audio` con ffmpeg (`-i video.mp4 -i audio -c:v copy -c:a aac -shortest`) al archivo final, con
entrada y salida suave del audio (`afade`). Prueba en `herramientas/ak-editor/pruebas/`: con un WAV de 8 s, el MP4 final
tiene una pista de audio (ffprobe) y dura lo mismo que el video.

## Pruebas

- `src/__tests__/borrar-el-ultimo-queda-borrado.test.ts`: con una sola plantilla de tareas, borrarla deja la colección
  vacía en la base de mentira; y en un archivo que no permite vaciarse, la escritura vacía tira error.
- `src/__tests__/sacar-un-dato-lo-saca-de-la-base.test.ts`: `updateMenuAsignado(id, undefined)` manda el borrado del campo.
- `src/__tests__/el-tablero-del-crm-cuenta-como-los-indicadores.test.ts`.
- `src/__tests__/volver-a-ninguna-saca-la-celiaquia.test.ts`.
- `src/__tests__/el-buzon-solo-acepta-fotos.test.ts`: un texto declarado `image/jpeg` se rechaza.
- `src/__tests__/el-kiosco-encuentra-la-fiesta-sin-sesion.test.ts`.
- `herramientas/ak-editor/pruebas/test_video_de_vida_con_musica.py`.

```comprobar
usa: task-templates.json en src/lib/firebase-sync.ts
usa: FieldValue.delete en src/lib/firebase-sync.ts
no-usa: || inv.isCeliac en src/app/actions/fiesta/invitados.actions.ts
usa: afade en herramientas/ak-editor/video_de_vida.py
prueba: src/__tests__/borrar-el-ultimo-queda-borrado.test.ts
prueba: src/__tests__/sacar-un-dato-lo-saca-de-la-base.test.ts
prueba: src/__tests__/el-tablero-del-crm-cuenta-como-los-indicadores.test.ts
prueba: src/__tests__/volver-a-ninguna-saca-la-celiaquia.test.ts
prueba: src/__tests__/el-buzon-solo-acepta-fotos.test.ts
prueba: src/__tests__/el-kiosco-encuentra-la-fiesta-sin-sesion.test.ts
prueba: herramientas/ak-editor/pruebas/test_video_de_vida_con_musica.py
```
