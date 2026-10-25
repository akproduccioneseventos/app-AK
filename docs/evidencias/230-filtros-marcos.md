# Evidencia 230: filtros de cara y marcos

Revision principal: las conclusiones iniciales sobre ausencia de consumidores
NO se confirman. Gitgrep en el SHA exacto encuentra llamadas runtime en cinco
estaciones. TypeScript SI esta disponible en el artefacto candidato103, usado
por233. El intento230 no es un fallo de app ni un bloqueo actual de herramientas.
Se conserva debajo el informe inicial;233 reemplaza sus conclusiones de consumo.

- Candidato inspeccionado: `b91bdbeff7d3db7489fabdadd599776376c0577a`.
- Checkout observado: rama `codex/216-contraste-20261022`, HEAD `9d1a07f99b8d6972995ff8c2b9f1a5a1ac4a81de`; no equivale al candidato.
- SHA blob en candidato `src/lib/entretenimiento/filtros-cara.ts`: `c0052390f47537af2b7452189f9ccd3f03a0b41e`.
- SHA blob en candidato `src/lib/entretenimiento/marcos-dinamicos.ts`: `2bdc8cd80374291ec17a85673a346aa61cd23695`.
- En checkout, blob actual de `marcos-dinamicos.ts`: `b528c6f9d51a4974808475bd53bf2f7937c3ff6b`, por tanto no es el mismo código candidato.

## Hallazgos de código y consumidores

- `filtros-cara.ts`: funciones exportadas `evaluarEfectoReactivo`, `obtenerOpcionRuleta`, `puedeHacerFaceSwap`, `dibujarFiltroDeCara`; este último consume landmarks y hace llamadas canvas. El archivo carga MediaPipe dinámicamente al invocar `cargarDetectorDeCaras` y deriva segmentación a `recortarPersonaSinTela`.
- En el SHA candidato, las referencias encontradas a filtros son solo pruebas (`los-filtros-siguen-la-cara.test.ts`, `el-filtro-de-15-lleva-el-nombre.test.ts`, `los-efectos-reaccionan-a-la-cara.test.ts`); no se confirmó consumidor de runtime dentro de `src`.
- `marcos-dinamicos.ts`: exporta `dibujarMarcoDinamico`, que llama al contexto canvas para dibujar los estilos y retorna sin llamadas si `estilo === 'ninguno'`.
- La única referencia encontrada en `src` al marco es `src/__tests__/orden-14-entretenimiento-unificado.test.ts`. La integración reportada en `docs/YA-RESUELTO.md` es evidencia histórica/documental, no un consumidor runtime confirmado en el candidato.
- Comprobación requerida: archivo y símbolo existen en el candidato; consumidores runtime no hallados con búsqueda textual Git en `src`. No inventar otra ruta ni suponer integración activa.

## Ejecución y límite

- Graphify puntual solicitado: no disponible; el comando informó que falta `graphify-out/graph.json`. No se reconstruyó el grafo.
- Pruebas dinámicas: 0 casos ejecutados. `node --max-old-space-size=192` fue invocado con un harness de carga, pero abortó antes de evaluar código porque no existe `typescript` local. No se instaló dependencia ni se intentó acceder a red.
- Se descartó transpilación TS manual tras detectar sintaxis tipada inline; evitaría que la sonda probara fielmente el fuente.
- No Next/build/browser/SDK/cámara/modelo/servicios externos. No se observaron píxeles ni detección facial real.
- Casos solicitados (landmarks vacíos/ficticios, escala, coordenadas normalizadas/píxel/mixtas, bordes y llamadas de marcos) quedan pendientes de un runtime TS ya disponible o una estrategia de prueba aprobada; no se infiere su resultado desde grep ni desde pruebas preexistentes.

## Reproducción y comprobación

- Fuente: `git show b91bdbeff7d3db7489fabdadd599776376c0577a:<archivo>`; blobs indicados arriba.
- Fallo exacto del intento: `Cannot find module 'typescript'` desde `C:/Users/Usuario/Documents/Codex/ak-codex88/ak-auditoria192-portal/package.json`.
- `archivo`: `src/lib/entretenimiento/filtros-cara.ts`; `usa`: `dibujarFiltroDeCara` / `evaluarEfectoReactivo`, con referencias de pruebas confirmadas pero consumidor runtime no contrastado; `prueba`: pendiente, 0 casos.
- `archivo`: `src/lib/entretenimiento/marcos-dinamicos.ts`; `usa`: `dibujarMarcoDinamico`, referencia de prueba confirmada pero consumidor runtime no contrastado; `prueba`: pendiente, 0 casos.
