# 505 — Nota de alcance corregida

## Base y contraste

- SHA de aplicación congelada solicitado: `978af7d65a60bd287f3ee3cc05037a29566074f4`.
- El checkout documental observado está en `099ea3cc7b292a3692067c77da926acb88e1b374`, no en el SHA congelado.
- `docs/evidencias/487-delta-y-consumidores.md` y `docs/evidencias/488-matriz-cierre-definida.md` existen solo en el estado local no versionado; `git show 978af7d...:<ruta>` confirma que no pertenecen al commit congelado. Esta nota corrige el límite factual de esos documentos, no los modifica.
- Se consultó el spec `tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts` directamente en el SHA congelado.

## Aclaración AR

El spec sí cubre un caso E2E de ausencia de target: navega a `/evento/ar/fiesta-sin-realidad-aumentada`, verifica el aviso “Esta invitación todavía no tiene realidad aumentada” y que “Cargando Realidad Aumentada...” no permanezca.

El comentario del propio spec precisa que el entorno no tiene cámara ni archivo `.mind`. Por tanto, esa prueba no valida cámara AR real, tracking/detección de target, render sobre cámara ni funcionamiento con un target cargado. El documento 487 es inexacto al afirmar que no hay caso E2E existente que recorra las páginas AR y compruebe sus estados/interfaz; sí existe el caso acotado descrito. No extender su alcance a AR real.

## Criterio finito

La ausencia de una matriz exhaustiva de cada acción × estado × rol no debe convertirse en una petición de otra definición para aplazar la evaluación. El dueño ya pidió una matriz finita y observable para toda la app. Mantener como unidades verificables los compromisos, consumidores y criterios concretos; registrar por cada uno el estado observable y evidencia reproducible, sin enumerar infinitas variantes ni afirmar cobertura universal.

Para AR, separar al menos estos resultados observables: (1) invitación sin target: aviso visible y carga terminada, cubierto por el spec citado; (2) target presente y experiencia de cámara/tracking: no cubierto por ese spec y sin resultado afirmado aquí. La segunda fila queda no contrastada en esta evidencia, no es por sí sola prueba de fallo ni instrucción automática de reimplementar.

## Límites de esta nota

Esto corrige alcance documental, no ejecuta pruebas ni valida la app, la QA, un despliegue o el cierre global. No cambia compromisos, no inventa resultados y no convierte una prueba existente en prueba de cámara AR real.

### Fuentes exactas

- `git show 978af7d65a60bd287f3ee3cc05037a29566074f4:tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts`
- `docs/evidencias/487-delta-y-consumidores.md` (estado local no versionado)
- `docs/evidencias/488-matriz-cierre-definida.md` (estado local no versionado)
