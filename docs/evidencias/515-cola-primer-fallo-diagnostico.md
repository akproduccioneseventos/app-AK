# Diagnostico del primer fallo de cola (512, batch 010)

## Alcance y base
- Repo consultado: `C:/Users/Usuario/Documents/Codex/ak-codex88/ak-auditoria267-cierre`.
- HEAD local al consultar: `099ea3cc7b292a3692067c77da926acb88e1b374`.
- Spec de contraste: blob congelado `978af7d65a60bd287f3ee3cc05037a29566074f4:tests/e2e/81-cola-aislamiento-y-reintento.spec.ts`; no se asume que ese checkout sea la fuente de la documentación.
- No se ejecutó QA, test, build ni se inspeccionó la corrida en vivo; el batch 512 sigue activo según el pedido.

## Evidencia observada
- `512-pruebas.log:197-216`: los proyectos chromium-desktop y chromium-mobile fallan en la ruta de `leerFiesta` (helper `tests/e2e/helpers/fiesta-de-prueba.ts:2`, llamado desde el spec línea 155); error `QA495 fixture bridge:` sin mensaje tras los dos puntos.
- Ambos `error-context.md` atribuyen el error al mismo wrapper `__qa495`; no registran error de cámara, permiso, locator ni expectativa visual.
- El log marca `LOCAL DOUBLE only; no Firebase provider acceptance` y `AK_QA_EGRESS_BLOCKED` (external services disabled). Esto describe el límite del entorno FIS; no demuestra causalidad específica del error del bridge.
- Blob 978: fixtures se escriben en `beforeAll` con `guardarFiesta`; la cámara falsa y permiso se usan antes de las capturas. El error registrado en línea 155 ocurre al verificar datos luego de reconectar, mediante lectura del helper, no al accionar UI/cámara.
- El bridge convierte cualquier `status !== 0` de `spawnSync` en el mismo error, interpolando `stderr`; el artefacto no aporta status, signal, stdout ni stderr útiles para atribuir por qué terminó el proceso.

## Clasificacion
- Fallo de prueba/fixture (lectura del fixture por puente QA495) demostrado como punto inmediato de interrupción en ambos proyectos.
- Causa raíz del bridge: NO CONTRASTADA. No hay evidencia suficiente para decidir entre proceso auxiliar/entorno/emulador u otra causa.
- No es fallo de selector ni oráculo observado: el flujo llega a las verificaciones de lectura; las aserciones de cola/aislamiento no quedan demostradas ni refutadas.
- No atribuir a permisos de cámara: no aparece error de permiso y el fallo ocurre en la lectura posterior. Tampoco queda probado que las capturas y la sincronización hayan tenido éxito.
- Comportamiento de aplicación: NO CONTRASTADO por esta corrida. SDK real y doble FIS local limitan el alcance; sin aceptación del proveedor ni lectura fixture válida no hay evidencia de aislamiento/sincronización de backend.

## Conclusión
No modificar prueba ni emitir orden/aprobación a partir de esta evidencia. Para resolver la causa haría falta evidencia ya producida por la corrida (detalles del proceso bridge/emulador); no repetirla ni alterar fixtures mientras siga activa.
