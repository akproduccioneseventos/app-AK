## Descripcion del Cambio

Auditoria186-198 y orden210, sobre main fa3b492b8f1d6a77433a92f4d63b665cfea3747c.
Codex no cambia codigo de la app, no fusiona ni afirma cierre total.
NO FUSIONAR DOCUMENTACION SOLA: integrar esta evidencia en la siguiente tanda
de correcciones de Claude/Gemini. PR1345 ya integrada, esta rama nace de main nuevo.

Ocho defectos reproducidos y una friccion en el portal ACTIVO por clave: pago
sin formulario, errores de lectura falsamente vacios, token propio con sesion
cliente, avisos duplicados, adjunto irrecuperable, album oficial perdido y dos
inconsistencias de importes de cancelacion. Las tasas contractuales no cambian.

Cierres verificados por alcance: personal209 (3PASS), proveedor209/208 (13PASS),
residuales voz/Meta (8PASS). Se retiro la cadena mind-ar/canvas/node-pre-gyp
del lock actual; no se declara audit global de dependencias limpio.

## Tipo de Cambio
- [ ] Correccion de errores de la app
- [ ] Nueva funcionalidad
- [ ] Refactorizacion
- [x] Documentacion y pruebas de auditoria

## Lista de Verificacion
- [x] 193-197:67criterios focalizados,57PASS/10FAIL, misma fuente congelada.
- [x] 190:SDK Firestore demo real,9PASS/2FAIL;0documentos/cleanup200/cerrado.
- [x] 198 contrasta cuerpos/dependencias del SDK historico con fuente actual.
- [x] `node scripts/check-acentos.mjs`:3148archivos correctos.
- [x] `git diff --check` sin errores.
- [ ] Build/nativo de fa3b (no ejecutado; RAM menor al minimo seguro).
- [ ] Typecheck/lint/amplia de la app actual (corresponde a Claude tras arreglos).
- [ ] Graphify reconstruido (no necesario: solo evidencia/docs, consulta puntual).

Se conservan fallos iniciales de QA y sus correcciones. No se suman como bugs
ni se borran para ocultar resultados. Todos los fixtures/servicios son ficticios.

## Impacto en Firebase
- [ ] Cambia reglas/permisos productivos
- [ ] Modifica Cloud Functions
- [ ] Cambia Hosting/frontend publicado
- [ ] Requiere variables reales

No se tocaron produccion, datos del negocio, cuentas ni procesos ajenos.
Manual del dueno fuera de pendientes de Codex. No certificado de cero errores.
