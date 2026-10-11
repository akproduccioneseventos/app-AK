## Descripcion del Cambio

Auditorias97-98: IA con widget/API/SDK reales en entorno aislado9a y contraste
contra main755. No correcciones de app; orden149 para Gemini/Claude.
Dos causas P2: primera generacion falla antes de proveedor por sdk-node
anulado; respaldoFiestaA priorizaB. Chatpersistente A-B/NOtarea ficticia
pasan PCmovil. Raw/capturas/minisonda/historial/limites en informe97.

1286/1287 fueron fusionadas por otraIA durante pruebas. Nueva rama desde755,
no seguir subiendo a rama cerrada.144/145/146/148 codigo presente:no duplicar;
147arreglo retirado sigue abierto. Health metadata ahora755,no certificado.
Orden149 termina comprobar con archivos/simbolos/consumidores reales.
98ejecutada755:18pass/16pares PCmovil;146voz,148lectorfotos,145Touchpix y
144espejo/mural publico PASAN sus criterios previos. Dos espejos reforzados,
no contar como funciones adicionales. Informe98/raw/capturas en esta PR.
No repetir/reprogramar esos arreglos.149dosP2/147QR/3D/limites siguen aparte.
NUEVO150P1:muralrecortado por CSSlive>*positionrelative ganandofixed.
PCmovil4fail;control SOLOpositionfixedrestaura540/659px y texto pintado.
NOcorreccion de app. Funcionales18pass+visuales4fail NOconjuntoverde.

## Tipo de Cambio
- [ ] Correccion de errores (bug fix)
- [ ] Nueva funcionalidad (feature)
- [ ] Refactorizacion / Optimizacion
- [x] Actualizacion de documentacion / Configuracion (sondas QA)

## Lista de Verificacion antes de solicitar revision
- [ ] npm run typecheck de app: no repetido;Claude compila.
- [ ] npm run lint completo: no repetido en QA documental.
- [ ] graphify:update: no cambios estructurales de app;grafo ausente.
- [x] Emuladores demo+navegador PC/movil (2positivas/2negativas).
- [x] Retests98 PC/movil:18ejecucionespositivas/16pares;visual4negativas,ninguna omitida.
- [x] Comparacion causal miniwebpack, NO build de producto.
- [x] Sintaxis de sondas y git diff --check.
- [x] Fixtures propios retirados/runtime detenido/puertos libres.

Tests negativos no son un conjunto verde ni arreglo terminado. No modelos
reales contestando, costo de proveedor, envio, cobro, datosclientes o merge
por Codex. Tanda local NO contrastada: verificar antes de programar.

## Impacto en Firebase
- [ ] Afecta reglas Firestore / Seguridad.
- [ ] Modifica Cloud Functions.
- [ ] Modifica Hosting / Frontend.
- [ ] Requiere variables productivas adicionales.

QA/documentacion se integra con la proxima tanda correctiva, no se fusiona
sola. Dueno autoriza fusion. No0errores/certificadofinal/14areaslimpias.
