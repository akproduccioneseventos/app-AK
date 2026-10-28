# Orden 254 — Las plantillas de decoración se publican solas, y los objetos nuevos pasan a la biblioteca (28/10/2026)

**Para Gemini. Una sola propuesta**, rama nueva desde `main` actualizada (`gemini/orden-254-decoracion-sola`). Arrancá
**después** de que esté publicada la entrega de las decoraciones de Codex (propuesta 1372: catálogo de 86 elementos y
borradores desde fotos). Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md`.

Pedido del dueño, 28/10/2026: *"las plantillas que se hagan solas total, van a la lista de plantillas, y los elementos
nuevos"*.

Hoy, la IA analiza cada foto de decoración y deja un borrador **"por revisar"**, que alguien tiene que aprobar. Lo que la
IA no reconoce queda en `unknowns` y no se usa. El dueño quiere que todo eso pase **solo**.

## Lo que ya existe (no se rehace)

`src/lib/decoracion/catalog-service.ts`:

- `syncDecorationCatalog` (~31) pone en la fila cada foto nueva.
- `processDecorationDraft` (~73-119) analiza con `src/ai/flows/analyze-decoration-catalog.ts`. Ya tiene:
  - tope de gasto (`hayPresupuestoParaIA` y `registrarConsumoIA('catalogo-decoracion')`);
  - candado entre servidores, con 20 por día;
  - reuso de fotos idénticas.
- `approveCatalogDraft` (~121) aprueba.
- `approvedCatalogTemplates` (~152) es lo que ve la lista de plantillas, a través de `getDecoCanvasTemplates`
  (`src/app/actions/deco-canvas-templates.ts:23`).
- `deleteDecoCanvasTemplate` (~60-62) ya deja sacar una plantilla del catálogo.

**No se toca:**

- el tope de gasto;
- el candado;
- los 86 elementos cargados;
- los permisos de las acciones en `src/app/actions/decoracion-catalogo.ts`, que piden ADMINISTRACION u ORGANIZACION.

## Bloque 1 — se aprueba solo

En `processDecorationDraft`, cuando el análisis termina bien (~106-107):

- Si tiene **al menos 2 elementos reconocidos**, pasa directo a `'approved'`, por el mismo camino que
  `approveCatalogDraft`: no dupliques la lógica, llamá a una función interna común.
  - **Nombre:** el título de la foto de origen, o el tipo de evento con la fecha (por ejemplo "Decoración XV — oct
    2026"). Nunca vacío.
  - Queda marcada `aprobadaSola: true`, para que en la lista se vea la etiqueta "Armada por la IA".
- Si tiene menos de 2, queda `'review'` como hoy, porque no alcanza para una plantilla.
- **Se puede deshacer:** en la lista de plantillas, una "Armada por la IA" tiene el botón "Sacar" (el
  `deleteDecoCanvasTemplate` que ya existe), y no vuelve a aparecer aunque la foto se procese de nuevo.

## Bloque 2 — los objetos que la IA no conoce pasan a la biblioteca

Hoy van a `unknowns` como texto. Ahora, por cada uno, y sólo si quedó presupuesto de IA:

1. **Recorte del objeto.** Pedile a la IA de imágenes (`generateGeminiImage`, `src/lib/ai/gemini-image.ts:45`) el
   recorte de **ese** objeto sobre fondo transparente, partiendo de la foto. Tiene que salir en PNG con transparencia.
   - **Si no sale transparente o falla, no se agrega nada** y queda en `unknowns`.
   - Validá el tipo y el tamaño: PNG y 4 MB como máximo.
2. **Se guarda como elemento nuevo de la biblioteca de decoración**, en la misma lista y el mismo formato que los 86 de
   `public/media/decoracion-ak`, pero en el almacenamiento de la app, no en `public`.
   - Va con categoría, el nombre que dio la IA y la marca `nuevoIA: true`.
   - En la biblioteca se ve con la etiqueta "Nuevo (IA)" y se puede borrar.
3. **El gasto:**
   - Cada recorte cuenta una vez: sumá `'recorte-decoracion'` a `FuncionConCosto` y a `COSTO_ESTIMADO_UYU`
     (`src/lib/ai/consumo.ts`), con el costo de una imagen.
   - Como máximo 5 recortes por foto y 20 por día, con el mismo candado entre servidores que ya existe.
4. **No se duplica:** si ya existe un elemento con el mismo nombre normalizado en la misma categoría, se usa ese y no se
   crea otro.

La plantilla del bloque 1 incluye también estos elementos nuevos.

## Pruebas

**Jest**, en `src/__tests__/las-plantillas-de-decoracion-se-publican-solas.test.ts`, con la IA simulada. Tiene que
comprobar:

- (a) Una foto con 3 elementos reconocidos termina `'approved'` y aparece en `getDecoCanvasTemplates`, con
  `aprobadaSola`.
- (b) Una foto con 1 elemento queda `'review'`.
- (c) Un objeto desconocido con un recorte transparente válido aparece como elemento nuevo y en la plantilla. Con un
  recorte sin transparencia, no.
- (d) Sin presupuesto de IA, no se pide ningún recorte y la plantilla igual se aprueba con lo reconocido.
- (e) El mismo objeto en dos fotos crea un solo elemento.
- (f) Una plantilla sacada con "Sacar" no vuelve al reprocesar.

Rompé (a) a propósito y fijate que se ponga en rojo.

**Navegador:** en la lista de plantillas de decoración se ve una "Armada por la IA" con su etiqueta, y "Sacar" la quita.

Corré `npx tsc --noEmit`, `npx jest --silent` y `npm run "publicar?:rapido"`, y pegá las últimas líneas de cada uno.

```comprobar
usa: aprobadaSola en src/lib/decoracion/catalog-service.ts
usa: nuevoIA en src/lib/decoracion/catalog-service.ts
usa: recorte-decoracion en src/lib/ai/consumo.ts
prueba: src/__tests__/las-plantillas-de-decoracion-se-publican-solas.test.ts
```
