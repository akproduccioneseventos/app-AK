# Video de vida: limite y eliminacion - 2026-09-18
SHA contrastado: PR1209 e43260f068a751b5c6e2cc519db84e595c14c89f.
Puntos nuevos, no revalidacion de permisos ni optimizacion de fotos. Registro consultado: la exigencia de sesion para eliminar ya estaba implementada; no se repitio esa prueba.
Codex revisa; Gemini interfaz/limite; Claude valida borrado y consistencia de datos y compila. Sin ejecucion delegada afirmada.

## VID01 P2 - Configuracion y subida discrepan sobre cantidad
src/app/(app)/fiestas/nueva/video-vida/page.tsx: input photo-count min=1 max=200, loadData genera photoCount casilleros y PhotoUploadSlot llama saveLifeStoryVideoPhoto.
src/app/actions/fiesta/video-vida.actions.ts: saveLifeStoryVideoPhoto rechaza photoNumber > 50 sin consultar el limite configurado.
Sonda con evento configurado para 100: foto 50 PASS, foto 51 rechazada antes de subir.
Corregir usando limite coherente validado en servidor y formulario. No reducir silenciosamente una configuracion existente. Si se pretende cambiar el maximo de negocio, consultar al dueno.
Aceptacion pendiente: configurar 100 y subir 51 y 100; rechazar valores fuera del limite real. No se realizaron subidas reales.

## VID02 P1 - Eliminacion fallida se anuncia como completa
deleteAllVideoVidaPhotos captura y descarta el error de cada file.delete; devuelve success=true.
Consumidor real: handleDeleteAll en la pagina administrativa muestra Fotos Eliminadas / Todas las fotos han sido borradas del servidor.
Sonda: Storage rechaza delete; removed=false, success=true. Control delete exitoso PASS.
Corregir contabilizando exitos/fallos, comunicando parcialidad y ofreciendo reintento de fallidos. Conservar permiso existente. No limpiar indicadores como si no quedaran fotos.
Aceptacion pendiente: fallo total y parcial no anuncian borrado completo; reintento y listado reflejan lo realmente almacenado.

## Evidencia y limites
docs/evidencias/video-vida-sonda.cjs: 4 pruebas aisladas, 2 PASS/2 FAIL; funciones reales extraidas por AST, sesion y Storage simulados.
Ejecutar con TypeScript disponible: node docs/evidencias/video-vida-sonda.cjs SNAPSHOT_ACTIONS_TS del SHA indicado.
No navegador autenticado, archivos reales, build, merge ni cambio de app. No certifica todo video de vida.
Graphify local no disponible (repo original ausente); lectura remota focalizada.
Guardado rechazado/configuracion, descarga ZIP y representacion de URLs quedan sin certificar en esta tanda.
