# Respaldos: evidencia adicional al diagnostico conjunto

Fecha: 2026-09-16. Codex solo audita. Responsable de permisos/datos: Claude.
Base main: da6c566fbefdf82efec484f7fc9830db6ab5c4de.
Contrastados los diffs completos de PR 1197, 1202, 1206, 1207 y 1209: no modifican los archivos de respaldos, require-session, perfiles o middleware. No se detecto una correccion de estos hallazgos en esas tandas. Esto no comprueba trabajo local aun no subido.

## Resultado reproducido

Sonda: docs/evidencias/backup-fallos-reales.cjs, Node 24 y TypeScript 5.9.3.
Extrae funciones reales por AST y ejecuta almacenamiento/red/sesion simulados. 7 casos: 4 controles PASS, 3 casos FAIL. No se accedio a datos reales, no se borro ni restauro un respaldo real, no se ejecuto compilacion ni React/navegador autenticado.

### BKP01 - P1: copia parcial declarada completa

src/app/actions/backup.ts: readAllBackupData captura los errores de cada lectura y descarta esos archivos. createRestorePointInternal publica igualmente status=complete y success=true, sin comprobar que esten todas las colecciones esperadas. runAutoBackup puede luego registrar finalizacion exitosa.

Sonda: dos colecciones sinteticas; presupuestos.json falla al leer. Se crea manifiesto complete con una sola coleccion y success=true. Control con ambas lecturas correctas: complete con dos colecciones.

Impacto: el encargado cree tener un respaldo completo justo cuando la base falla. No se afirma que los respaldos actuales del negocio esten incompletos; no se inspeccionaron.

Criterio para cerrar: una lectura obligatoria fallida no acredita proteccion completa, no actualiza ultima copia completa ni elimina copias buenas por rotacion. Si se conservan copias parciales, deben identificarse como parciales y enumerar faltantes. Probar todas las lecturas fallidas, una fallida, documento realmente vacio y recuperacion posterior. No modificar silenciosamente el alcance de copia.

### BKP02 - P1: autorizacion insuficiente para operaciones de respaldo

deleteRestorePoint y restoreFromPoint solo invocan requireAppSession. Ese helper solo verifica session.success; no rol ni permiso. Middleware tambien solo exige presencia de cookie antes del control runtime. El proyecto ya define ADMINISTRACION y perfiles sin ese permiso.

Sonda: verifySession simulado valido para role=user/perfil=operador. El deleteRestorePoint REAL alcanza deleteV2Snapshot y devuelve success=true. Anonimo queda bloqueado; administrador pasa. Son pruebas aisladas de la barrera de la accion, no una explotacion HTTP sobre produccion.

Inspeccion relacionada: /api/backup/upload y /api/backup/download tambien validan success pero no permisos. Descargar incluye informacion de otras areas. No se ejecuto ninguna descarga de datos privados ni restauracion real. La prueba ejecutada corresponde a borrar un punto; ampliar pruebas al resto antes de dar por cerrada esta familia.

Criterio para cerrar: Claude debe aplicar la politica vigente del dueno en CADA frontera de servidor, no solo ocultar botones. El operador y personal no pueden restaurar/borrar respaldos ni obtener una exportacion completa. Probar propietario, secretaria, operador, personal, anonimo y perfil desconocido, sin escrituras/lecturas sensibles cuando se rechaza. Si se desea delegar alguna facultad nueva, pedir decision al dueno.

### BKP03 - P1: restauracion parcial anunciada como completa

src/app/api/backup/upload/route.ts acumula errors y responde HTTP 200 con success=true incluso en resultado parcial. BackupPage.handleRestoreFromZip solo verifica response.ok; ignora errors, skipped y message, muestra Restauracion Completa y recarga.

Sonda sobre el callback REAL de src/app/(app)/settings/backup/page.tsx: respuesta 200 con errors=['presupuestos.json'] produce aviso Completa y una recarga. Control sin errores produce el aviso esperado.

Impacto: una persona puede seguir trabajando sin saber que solo se restauro parte del conjunto. No se probo atomicidad ni consistencia de una restauracion real.

Criterio para cerrar: distinguir resultado completo, parcial y fallido; conservar detalle de errores y evitar recarga que lo esconda. Prevalidar contenido antes de comenzar y acordar estrategia de recuperacion ante fallo a mitad; no prometer rollback si no existe. Probar fallo de la primera, intermedia y ultima escritura y cero archivos admitidos. La copia previa tampoco basta si es parcial.

## Observacion adicional, inspeccion estatica

BackupPage inicializa backupStatus=null y convierte fallo de getBackupStatus a null; el distintivo usa backupStatus?.isStale ? advertencia : ACTIVO Y PROTEGIDO. El estado desconocido queda visualmente en la rama verde. No se monto la pantalla: confirmar en navegador/componente antes de cerrar. Debe distinguir cargando, desconocido, reciente y vencido. No sumar una pantalla nueva para esto.

## Contraste con el registro anterior

YA-RESUELTO anota que un fallo no actualiza la fecha de copia buena. Esa afirmacion sirve cuando createRestorePointInternal devuelve error. BKP01 muestra un caso diferente: una lectura falla pero la creacion devuelve exito. No se repite la auditoria anterior; se amplia la frontera del fallo probado.

Los tests backup.test.ts y backup-upload.test.ts revisados cubren exportacion normal/importacion compatible y simulan administrador. No prueban estos tres caminos. No se afirma que sean todos los tests de respaldo del repositorio.

## Entrega y limites

Observaciones para la tanda posterior al diagnostico, como pidio el dueno. No se programa la app, no se fusiona y no se inicia otra IA automaticamente. Reutilizar esta sonda y agregar pruebas que llamen a las funciones/pantallas reales. La sonda no certifica Firebase, sesion publicada, permisos de infraestructura ni restauracion integral.

