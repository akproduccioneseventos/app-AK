# Contraste estatico 214 en candidata PR1353

## Fuente y alcance

- Orden contrastada: `docs/ordenes/214-gemini-filtros-datos-reactivos-y-ruleta.md`.
- Recibo antecedente: `docs/evidencias/233-filtros-funciones.json` y `.mjs`; ese recibo ejecuta 12 criterios en `b91bdbeff7d3db7489fabdadd599776376c0577a` (9 PASS/3 FAIL), no en esta candidata.
- Candidata: PR1353 `3f9460185143ef034dcd713e975d2a0af5e20f1a`; base main `3e45a4ac6b479f89605163168e31b37dc84f2d0f`. Checkout de auditoria `b8b8398761dd7eaa9c0eb070e476e12ab23d1265`; contraste por `git show`/`git diff`, sin cambiar checkout.
- Limite pedido: filtros/caras/efectos/ruleta y consumidores Fotocabina, Touchpix, Bogue, Espejo; extractor facial, marcos y pruebas directas. Sin QA ejecutado, build, servidor, instalaciones, dinero/auth/permisos. No se inspeccionan privados posteriores. No es aprobacion de PR ni afirmacion de cero errores.
- `docs/YA-RESUELTO.md` ya registra las tres causas del recibo 233: tres consumidores con lista vacia; guiño/cejas sin efecto; ruleta que cambia con el reloj. Se contrastan contra 3f, no se vuelven a presentar como hallazgos nuevos de main.

## Criterios de la orden en 3f

| Criterio | Consumidor/simbolo exacto en 3f | Estado estatico y prueba asociada | Lo que no demuestra |
|---|---|---|---|
| Datos de cara reales para filtros en consumidores | `dibujarFiltroDeCara` en `src/app/evento/fotocabina/[fiestaId]/page.tsx` (argumento `carasDetectadasRef.current`), `.../touchpix/[fiestaId]/page.tsx`, `.../bogue/[fiestaId]/page.tsx` y `.../espejo-magico/[fiestaId]/page.tsx` (estos tres argumentos son `[]`). | Parcial: Fotocabina conecta la ref; no se ve conexion equivalente en los otros tres. `src/lib/caras/extractor-facial.ts`: `asegurarModelosFaciales`/`extraerDescriptorFacial` existen, pero no acreditan por si mismas alimentacion del render. Pruebas directas presentes en arbol: `src/__tests__/los-filtros-siguen-la-cara.test.ts` y `src/__tests__/los-efectos-reaccionan-a-la-cara.test.ts`; no ejecutadas ni evaluadas en este contraste. | Presencia de extractor/tests no demuestra ciclo de deteccion en cada consumidor, camara, modelo real ni captura. Recibo 233 ejercito entrada sintetica y detecto los argumentos vacios en b91; no es resultado de 3f. |
| Guiño destella y cejas cambian filtro en el efecto activo | `evaluarEfectoReactivo` y `dibujarFiltroDeCara` en `src/lib/entretenimiento/filtros-cara.ts`. | El simbolo de evaluacion expone `destelloOjo`/`cambiarFiltro`; el renderer llama al helper. No queda acreditado solo por ello que ambos flags causen el efecto exigido. Tests directos de efectos/cara existen en el arbol, sin ejecucion. | El recibo 233 comparo eventos canvas y encontro igualdad en b91, pero no se puede trasladar ese resultado a 3f; aqui no se hizo ejecucion ni comparacion equivalente. |
| Ruleta fija durante un intento de 3 segundos | `obtenerOpcionRuleta` y llamada desde `dibujarFiltroDeCara` en `src/lib/entretenimiento/filtros-cara.ts`. | No se confirma estaticamente que se guarde una opcion/semilla por intento: el consumidor deriva la entrada de `timestampMs % 10000`. Test directo pertinente: `src/__tests__/los-efectos-reaccionan-a-la-cara.test.ts` (presente, no ejecutado). | La forma del codigo no prueba por si sola el comportamiento visible por frame ni el resultado de un intento en UI. Los tres valores distintos del recibo 233 pertenecen a b91, no son una ejecucion de 3f. |
| Marcos dinamicos existentes y uso | `dibujarMarcoDinamico` en `src/lib/entretenimiento/marcos-dinamicos.ts`; consumidores existentes observados en Bogue y Fotocabina. | Cambio presente en la libreria; se agregan estilos `revista`, `polaroid`, `cartel_neon`; Bogue/Fotocabina consumen el simbolo. Test directo de orden 14 figura en el arbol. | El contraste acotado no valida render visual ni cada estacion; no implica agregar marcos a Plataforma 360 ni modificar su prioridad. |

## Riesgos sustentados (maximo 3)

1. **Hueco de entrada aun visible en diff 3e..3f:** Touchpix, Bogue y Espejo invocan `dibujarFiltroDeCara` con `[]`; el extractor nuevo no esta conectado en esas llamadas. Fotocabina si pasa `carasDetectadasRef.current`. Hallazgo estatico de integracion; comportamiento no ejecutado en 3f.
2. **Efectos reactivos y ruleta quedan por validar:** existen funciones/flags, pero no hay evidencia de QA de 3f que pruebe el efecto visible, el cambio de filtro controlado o la opcion estable durante el intento. Recibo 233 no se reutiliza como resultado de candidata.

## Cierre del contraste

La candidata incorpora cambios respecto de main en los modulos y consumidores delimitados. La presencia del codigo y de pruebas en el arbol no equivale a pruebas aprobadas. Este documento es contraste estatico acotado; el principal conserva la evaluacion final y QA autorizado.
