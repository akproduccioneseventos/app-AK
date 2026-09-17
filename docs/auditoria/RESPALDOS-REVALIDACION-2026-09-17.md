# Respaldos: revalidacion de la correccion pendiente

PR1209: b4c6929202b898740f81846e922daf8b771515be, reconfirmado antes de entregar. Codex revisa y documenta; Claude compila. No se modifica codigo de app ni se fusiona.

## Resultado: 9 PASS, 1 FAIL en sonda aislada

La sonda docs/evidencias/backup-b4c692-retest.cjs ejecuta funciones reales extraidas por AST con Node24/TypeScript5.9.3. Usa almacenamiento, sesion y red simulados. No es E2E ni restauracion real. Se reutiliza la ejecucion del mismo SHA; no se repite compilacion.

### Correcciones comprobadas en estos casos

- Una lectura que lanza error hasta readAllBackupData impide crear manifiesto completo.
- Una lectura correcta permite crear respaldo con las dos colecciones sinteticas.
- deleteRestorePoint rechaza permiso denegado/anonimo y permite administrador. Se ejecuta requirePermiso real; verifySession y evaluacion puede estan simulados. No certifica cookies ni toda la matriz de perfiles.
- handleRestoreFromZip, con los helpers reales, muestra resultado parcial sin recargar cuando errors contiene presupuestos.json. Resultado completo conserva aviso y recarga.
- comoEstaElRespaldo distingue consulta desconocida y cargando, sin dar al-dia por null. No se inspecciono visualmente la pantalla montada.

## BKP01 sigue parcialmente abierto: el lector oculta la falla

Cadena comprobada: createRestorePointInternal -> readAllBackupData -> readData.
Archivos reales: src/app/actions/backup.ts y src/lib/data-service.ts.

El arreglo nuevo detecta un throw de readData. Pero el readData real captura el error de readFromFirestore y, sin copia generica ni copia local disponibles, devuelve defaultValue. Por eso readAllBackupData ve una lectura exitosa de [] en vez de una lectura fallida.

Sonda adicional: readFromFirestore lanza error de base no disponible, readGenericJsonFile devuelve null, readLocalJsonFallback devuelve null. Estos lectores inferiores son simulados; readData, readAllBackupData y createRestorePointInternal son reales. Resultado: success=true, status=complete, customers.json count=0 y presupuestos.json count=0. Esperado: rechazar copia completa porque no se pudo comprobar la fuente.

No significa que se hayan vaciado datos del negocio. Solo se crearon objetos en memoria. Si se restaura posteriormente una copia asi, el riesgo es recuperar datos vacios creyendo que eran completos. Tampoco se inspeccionaron respaldos actuales de produccion.

## Indicacion para Claude

Conservar las correcciones que pasan. El camino de respaldo debe usar una lectura que distinga vacio confirmado, ausencia confirmada y fuente no disponible, con procedencia/frescura si admite fallback. No cambiar globalmente readData ni todos sus consumidores sin analizar impacto. No basta una prueba que simule readData lanzando: incluir el lector real en la cadena.

Criterios: error remoto sin fallback no crea copia completa ni rota copias buenas; coleccion realmente vacia si se admite; fallback viejo no se anuncia como lectura actual; restaurar una copia comprobada en entorno aislado. Revisar igualmente descarga ZIP, que tiene su propio circuito de lectura y exportacion. No queda certificada por el arreglo de snapshots.

## Limites restantes

No probadas restauracion integral, consistencia entre colecciones, caida a mitad, descargas reales ni permisos HTTP completos. No construir un certificado general a partir de nueve casos correctos. El hallazgo amplifica la misma BKP01, no crea una tarea duplicada. Claude compila y deja SHA/entorno/resultados; el dueno decide fusion.

