## Descripcion del Cambio

Auditorias97-99: IA con widget/API/SDK reales en entorno aislado9a y contraste
contra main755. No correcciones de app; orden149 para Gemini/Claude.
Dos causas P2: primera generacion falla antes de proveedor por sdk-node
anulado; respaldoFiestaA priorizaB. Chatpersistente A-B/NOtarea ficticia
pasan PCmovil. Raw/capturas/minisonda/historial/limites en informe97.

1286/1287 fueron fusionadas por otraIA durante pruebas. Nueva rama desde755,
no seguir subiendo a rama cerrada.144/145/146/148 codigo presente:no duplicar;
147recibida en1289, retest99 parcial. Health metadata755,no certificado.
Orden149 termina comprobar con archivos/simbolos/consumidores reales.
98ejecutada755:18pass/16pares PCmovil;146voz,148lectorfotos,145Touchpix y
144espejo/mural publico PASAN sus criterios previos. Dos espejos reforzados,
no contar como funciones adicionales. Informe98/raw/capturas en esta PR.
No repetir/reprogramar esos arreglos.149dosP2/147QR/3D/limites siguen aparte.
NUEVO150P1:muralrecortado por CSSlive>*positionrelative ganandofixed.
PCmovil4fail;control SOLOpositionfixedrestaura540/659px y texto pintado.
NOcorreccion de app. Funcionales18pass+visuales4fail NOconjuntoverde.
99ca5b714d:QR ocho recorridos6pass/2fail,PNG exactos+SDK. Historico94SI;
dos patrones movilesNO. Repeticion confirma;DPR1solo cortoSI,UUIDNO.
Se amplia147sin orden duplicada;149/150sin delta,no se repiten.
Main1289 incorporada localmente SOLO para resolver conflictos en registros;
producto identico a main, cambios1289 no son de Codex. PRno fusionada.

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
- [x] Retest99QR PC/movil:6pass/2fail,no omitidos;controles no aprueban PNGoriginal.
- [x] Comparacion causal miniwebpack, NO build de producto.
- [x] Sintaxis de sondas y git diff --check.
- [x] Fixtures propios retirados/runtime detenido/puertos libres.

Tests negativos no son un conjunto verde ni arreglo terminado. No modelos
reales contestando, costo de proveedor, envio, cobro, datosclientes o merge
por Codex. Tanda local NO contrastada: verificar antes de programar.
Error propio QA:helperlimpieza apuntaba carpetaTEMP98;lectura DBdemo correcta,
control local separado TEMP99 y ruta corregida, documentado,no ocultado.

## Impacto en Firebase
- [ ] Afecta reglas Firestore / Seguridad.
- [ ] Modifica Cloud Functions.
- [ ] Modifica Hosting / Frontend.
- [ ] Requiere variables productivas adicionales.

QA/documentacion se integra con la proxima tanda correctiva, no se fusiona
sola. Dueno autoriza fusion. No0errores/certificadofinal/14areaslimpias.
