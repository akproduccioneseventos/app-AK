# Triage Jest 661

- Alcance: solo lectura y clasificación; no se modificó la app ni se ejecutaron suites/build.
- Destino inspeccionado: `a3ecd008976aa4a7879490d6701928ba9f56f7fc` (rama local `codex/653-correcciones-20261025`; PR 1363 según el solicitante).
- Recibo 660: 843/869 suites aprobadas; 26 suites fallidas, 73/5277 pruebas fallidas; 5204 aprobadas. `numRuntimeErrorTestSuites=0`, `openHandles=[]`.
- Recibo 593: 865/865 suites, 5253/5253 pruebas aprobadas. No es comparación directa: cambia el conteo de suites/pruebas y se produjo con otro driver/contexto.

## Evidencia del entorno

`660-verificacion-congelada.mjs` construye `env` heredando `safe`, lo extiende únicamente con `NODE_ENV:'test'` y pasa ese entorno al comando canónico `jest --runInBand --no-cache`. En el driver no se ve saneamiento explícito de `AK_USE_LOCAL_JSON_ONLY` ni `AK_ALLOW_LOCAL_JSON_WRITES`. El setup ejecuta `scripts/entorno-de-pruebas.mjs`, pero el recibo de entorno conservado no registra sus valores efectivos al arrancar Jest. Por ello la herencia concreta de ambos `true` es una sospecha consistente con el pedido, no un hecho probado por el recibo disponible.

`jest.config.js` usa `jest.setup.js`, `ts-jest`, jsdom, alias `@/` y mocks de OpenTelemetry; no define un entorno alternativo de Firestore. `package.json` declara `"test":"jest"`; las reglas Firebase van por el script separado `test:rules` con emuladores. El recibo 593 disponible es `593-jest-resultados.json` (éxito); no encontré un driver 593 por nombre en ese directorio, solo drivers de otras tandas. No atribuyo sus resultados a un driver no inspeccionado.

## Clasificación de los 26 archivos fallidos

**Probable contaminación por modo JSON (repetir con flags controlados; no declarar falsos positivos aún):**

- `configurador-solicitud-atomica.test.ts` (11): la operación informa que la base no está disponible; el stack apunta a la guarda que rechaza `AK_USE_LOCAL_JSON_ONLY=true`.
- `el-ajuste-de-costos-no-miente.test.ts` (3): respuesta explícita de requisito de base de datos.
- `data-service.test.ts` (3), `collection-fallback-empty-after-delete.test.ts` (5), `lib/data-item-service.test.ts` (3): errores explícitos de escritura deshabilitada en modo local.
- `orden-168-lecturas-que-deciden.test.ts` (1), `insumo-receta-conserva-unidad.test.ts` (4), `la-plata-no-se-pierde-entre-servidores.test.ts` (3), `una-sena-de-contrato-es-una-por-presupuesto.test.ts` (3), `dos-cobros-a-la-vez-no-se-pisan.test.ts` (2): expectativas/consumidores de Firestore o `dataService` no satisfechos. Compatibles con modo JSON, pero requieren rerun para distinguir el efecto de flags del estado de mocks.
- Los restantes archivos fallidos presentan aserciones de estado/resultado (incluidos ventas, permisos, Instagram, foto y concurrencia). El modo JSON puede explicarlas, pero no hay mensaje causal suficiente para asegurarlo: quedan **no concluyentes hasta rerun**.

**Otra causa visible que no se explica solo por los flags:** `src/lib/ai/gemini-image.test.ts` (1) recibió clave `dummy` en vez de `test-key`; investigar fixture/mock/configuración QA. No es evidencia de egress real ni se hizo llamada externa.

**Timeouts / fallos QA de mocks / fallos reales:** el resumen JSON no registra suites con error de runtime y no aporta categoría timeout. Entre las 26 suites no hay base suficiente para etiquetar un fallo funcional como confirmado; los `TypeError` de `readDataConDetalle`/`writeData` pueden ser mocks incompletos o incompatibilidad del consumidor y quedan abiertos. No convertirlos en bugs confirmados antes del rerun. Las 73 aserciones tampoco equivalen a 73 causas independientes.

## Corrección de entorno propuesta (no aplicada)

En el driver de validación, aislar el entorno de Jest de los flags del modo de pruebas locales: retirar explícitamente `AK_USE_LOCAL_JSON_ONLY` y `AK_ALLOW_LOCAL_JSON_WRITES` del `env` heredado al lanzar Jest, sin habilitar servicios reales ni escribir datos reales. Registrar los valores efectivos (ausente/false/true) y verificar que cada suite usa sus mocks esperados. No cambiar variables globales ni el comportamiento de producción. El principal hará primero rerun de las 26 suites fallidas con entorno controlado; actualizar clasificación solo con ese resultado. No declarar aprobadas pruebas que aún no se hayan vuelto a ejecutar.

**Comprobar**
- archivo: `docs/evidencias/660-jest-resultados.json`, `docs/evidencias/660-verificacion-congelada.mjs`, `jest.config.js`, `package.json`, recibo `593-jest-resultados.json`.
- usa: invocación canónica `jest` del driver de verificación 660 y setup `jest.setup.js` indicado por Jest.
- prueba: pendiente; rerun focal de las 26 suites con entorno QA saneado, sin suites/build completos y sin egress real.
