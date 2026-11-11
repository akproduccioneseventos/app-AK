# Orden 269 — El catálogo de decoración no le paga dos veces a la IA (05/11/2026)

**Para Gemini.** Arrancá de la versión principal **actualizada** (`git fetch origin main`), rama nueva
`gemini/orden-269-decoracion-ia-una-vez`. **Una sola entrega, no fusiones.**

**Lo que ya anda y no se toca:** las otras dos pruebas del mismo archivo (aprobar una plantilla dos veces no duplica,
y lo aprobado llega al lienzo), los 86 elementos, el tope diario de 20 análisis y el tope de gasto de IA.

## El defecto, medido por Claude con la base de prueba

`src/__tests__/decoracion-catalogo-sdk.test.ts`, caso "several syncs and concurrent processors persist drafts and run
the model only once": **falla**. `analyzeDecorationCatalog` se llama **2 veces** (espera 1), y `registrarConsumoIA`
también. Es plata de IA gastada dos veces.

Lo que se midió, con un aviso puesto en `processDecorationDraft` (`src/lib/decoracion/catalog-service.ts`, ~180):

- El análisis A toma el candado (`deco_catalogo_jobs/analisis.json`), termina y lo suelta.
- Un segundo después, el análisis B toma el candado **para la misma foto** (`next.id` igual), porque leyó la lista
  (`const rows = await drafts()`, línea ~182) **antes** de que A la cambiara.
- Releer la lista después del candado, sólo para buscar `reused` y `previouslyDismissed`, **no alcanzó**: siguió
  dando 2. **Claude no llegó a la causa.** Lo que queda por mirar:
  - `drafts()` lee con `readStrict(FILE)` y `change()` guarda con `mutateDataItem(FILE, COLLECTION, id, ...)`.
    Fijate si con la base encendida leen y escriben **el mismo lugar**. Si `drafts()` lee una copia vieja, el reclamo
    `current.status === 'queued'` de `change` no debería pasar igual, salvo que `change` también lea esa copia.
  - Si el reclamo de B sale bien sobre una foto que A ya dejó en `review`, ahí está el defecto.

## Lo que se pide

- Que dos análisis a la vez, o uno detrás del otro, **nunca analicen la misma foto dos veces**, y que una foto igual a
  otra ya analizada reuse ese análisis sin llamar a la IA.
- **No se toca la prueba.** Tiene que pasar 5 veces seguidas.

Cómo se corre (la base de prueba en el puerto 8085, sin claves reales):

```
AK_DECORATION_SDK_QA=true FIREBASE_PROJECT_ID=demo-ak-decoracion-758 NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-ak-decoracion-758 \
node ./node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --only firestore --project demo-ak-decoracion-758 \
"FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 npx jest --runInBand src/__tests__/decoracion-catalogo-sdk.test.ts"
```

(con una copia de `firebase.pruebas.json` donde Firestore use el puerto 8085)

## Al terminar

`npx tsc --noEmit` y `npx jest --silent` con cero errores. Repasá `docs/ANTES-DE-ENTREGAR.md`. No subas `data/` ni `src/data/`.

```comprobar
archivo: src/lib/decoracion/catalog-service.ts
prueba: src/__tests__/decoracion-catalogo-sdk.test.ts
```
