# Orden 339 — El auditor robot: la app se prueba sola como la prueba el auditor

**Para Gemini. Es la orden más importante de la lista. Si todavía no arrancaste la 336, empezá por ésta; si ya la
arrancaste, ésta va inmediatamente después, antes que la 337 y la 338.** Una sola propuesta, rama nueva
`gemini/orden-339` desde la principal recién actualizada. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

## Por qué (lo midió Claude el 23/11/2026)

Cada auditoría trae una tanda nueva de errores, y el dueño pidió un mecanismo que lo corte. Las preguntas y los escaneos
nacen **después** del error y buscan **texto** en el código. Los errores que encuentra el auditor son de **comportamiento**:
una pantalla que abre otra fiesta, un "Guardado" que no guardó, una propuesta que se pierde al volver, un PDF cortado.

Dos hechos medidos:
1. **Las pruebas de navegador nunca vieron una fiesta activa.** `playwright.config.ts` ~18 corre con
   `AK_USE_LOCAL_JSON_ONLY: 'true'`, y en ese modo sólo existen fiestas históricas: toda pantalla `/fiestas/nueva/*` abre
   vacía o "no encontrada". Ninguna prueba hizo nunca lo que hace el auditor: entrar a una fiesta, tocar Guardar y recargar.
2. **La lista de cierre (orden 313) nunca corrió:** `npm run "cierre?"` da 456 de 456 casilleros sin mirar, y sólo mira
   apariencia (desbordes, contraste), no comportamiento.

**La idea:** en lugar de una pregunta por error, **reglas generales que se aplican solas a TODAS las pantallas**, con datos
de verdad. Son las diez condiciones de aceptación que el mismo auditor escribió en su informe
(`docs/auditorias/2026-11-23-funcional.md`, y la página 39 del PDF). Si el robot las cumple, el auditor no encuentra esas
formas; si encuentra una forma nueva, se suma **una regla** al robot, no una pregunta suelta.

## Bloque 1 — Una base de prueba con dos fiestas de verdad
1. Un proyecto nuevo de Playwright, `auditor-robot`, en `playwright.config.ts`, que corre contra el **emulador** de la base
   (mismo arranque que `test:rules` en `package.json` ~25: `firebase emulators:exec --config firebase.pruebas.json
   --project demo-ak-producciones`) y **sin** `AK_USE_LOCAL_JSON_ONLY`. Nada de claves reales (lo exige
   `src/__tests__/el-entorno-aislado-no-lleva-credenciales-reales.test.ts`).
2. Un sembrador, `tests/robot/sembrar.ts`, que carga con firebase-admin (`FIRESTORE_EMULATOR_HOST`): **dos fiestas
   activas** con nombres bien distintos ("ROBOT Boda Ana y Luis" y "ROBOT Quince Sofía"), fecha dentro de 20 días, cliente,
   presupuesto aceptado con comida, invitados (uno con credencial), mesas, menú asignado, personal, carta de tragos y lista
   de carga; un menú y un servicio **en borrador**; y la fiesta de muestra `fiesta_muestra_auditor` como en producción
   (`src/lib/automatico/al-entrar-a-la-app.ts` ~326). Los datos salen de los tipos de `src/types/fiesta.ts`, no inventados.
3. Sesión del equipo con `ponerSesionDelEquipo` (`tests/e2e/helpers/fiesta-de-prueba.ts`).

## Bloque 2 — Las reglas, aplicadas a cada pantalla sola
La lista de pantallas sale de `getAllRoutes()` (la misma que usa `scripts/lista-de-cierre.mjs`); **no se escribe a mano**.
Cada pantalla que lleva `fiestaId` se abre **con la fiesta A y después con la B**. Por pantalla:

1. **Contexto:** se ve el nombre de esa fiesta y **nunca** el de la otra ni "muestra"; ningún `href` visible contiene
   `undefined`, `null` o `fiestaId=&`; ningún texto visible con un marcador `{MAYÚSCULAS}` sin reemplazar.
2. **No se cae:** no aparece la pantalla de "¡Ups! Algo salió mal" ni un error en la consola del navegador.
3. **Ida y vuelta en pantalla:** cada botón cuyo texto sea Guardar / Guardar cambios / Actualizar: se cambia el primer campo
   de texto editable a `ROBOT-<número>`, se toca, se recarga, y el valor tiene que estar. Después se repite **cortando la
   respuesta del servidor** (`page.route(..., r => r.abort())`): **no** puede aparecer "Guardado" ni un cartel de éxito.
4. **Agregar y cancelar:** cada botón que empiece con "+" o "Añadir"/"Agregar" que abra un diálogo: se cancela y la
   lista tiene que quedar igual que antes.
5. **Volver no pierde:** en `/presentacion-led` y `/presupuestos/nuevo/crear`, completar datos, abrir cada galería o botón
   que navegue, volver: los datos siguen. "Plan de Pagos" lleva los mismos datos que "Generar Presupuesto Manual".
6. **Las descargas entran en la hoja:** cada botón "PDF" / "Descargar": se baja el archivo y se mira con `pdfjs-dist`
   (agregarlo como dependencia de desarrollo, es gratis) que tenga páginas, que no haya páginas vacías y que el texto no se
   salga del ancho. Con el presupuesto de 1, 5 y 30 renglones.
7. **Lo público no muestra borradores:** con la sesión borrada, `/presentacion-led`, `/simulador-de-presupuesto`, la portada
   y `/public/*` no muestran el menú ni el servicio en borrador, ni nada de la fiesta de muestra.
8. **Una lectura que falla no es un cero:** en `/customers`, `/empresa/contabilidad` y los reportes, cortando la lectura
   se ve un aviso, nunca "0", "$0" ni una lista vacía presentada como dato.

Cada falla se anota con pantalla, regla y qué elemento, igual que hoy anota el recorrido.

## Bloque 3 — El número, y que frene
1. `scripts/lista-de-cierre.mjs` suma estas reglas como columnas: cada pantalla queda `verde` / `rojo` / `sin-mirar` por
   regla. `npm run "cierre?"` da **un solo número** (casilleros en rojo o sin mirar).
2. `npm run robot:todo` corre todas las pantallas (de a 4 carriles, con el emulador) y actualiza la lista. Lo corre Claude al
   cerrar cada tanda y le da el número al dueño.
3. La puerta (`scripts/se-puede-publicar.mjs`) corre el robot **sólo sobre las pantallas que toca el cambio**
   (`scripts/pantallas-tocadas.mjs`) y **frena** si una queda roja. Que no frene por lo viejo: lo viejo baja con el número.
4. Primera corrida completa en la misma propuesta: entregá el número con el que arranca y la lista de rojos. **No arregles
   los rojos en esta orden** (son las órdenes 336-338 y las que salgan); esta orden sólo construye el robot.

## Lo que NO hay que hacer
- No escribir una prueba por pantalla a mano: las reglas recorren la lista sola.
- No marcar verde una pantalla porque "abre": cada regla mira el resultado (el valor después de recargar, el nombre de la
  fiesta, el PDF bajado).
- No apagar una regla para que el número baje. Si una regla da falso rojo en una pantalla, se anota la excepción con el
  motivo en `docs/robot-excepciones.json`, y Claude la revisa.

## Cómo se prueba que el robot sirve (rompiéndolo)
En la misma propuesta, una prueba que **rompe a propósito** una copia de cada caso del informe y mira que el robot lo
marque rojo: el `getFiestaActual()` de `video-vida.tsx`, el "Destornillador" que queda al cancelar en `carta-tragos.tsx`, el
cartel fijo "Tildes sincronizadas online" y el `fiestaId: ''` de las alertas. Si con el error puesto el robot da verde, el
robot está mal.

## Barrido en toda la app
El robot **es** el barrido: sus reglas recorren todas las pantallas de `getAllRoutes()`. Las formas del informe funcional
(preguntas 218 a 226) quedan cubiertas por las reglas 1 a 8 del bloque 2; la primera corrida completa entrega la lista de
rojos de toda la app.

```comprobar
usa: auditor-robot en playwright.config.ts
archivo: tests/robot/sembrar.ts
usa: robot:todo en package.json
usa: ROBOT en tests/robot/sembrar.ts
usa: pdfjs-dist en package.json
usa: robot en scripts/se-puede-publicar.mjs
usa: robot en scripts/lista-de-cierre.mjs
archivo: docs/robot-excepciones.json
prueba: tests/robot/las-reglas-del-robot.spec.ts
prueba: src/__tests__/el-robot-marca-rojo-lo-que-encontro-el-auditor.test.ts
```
