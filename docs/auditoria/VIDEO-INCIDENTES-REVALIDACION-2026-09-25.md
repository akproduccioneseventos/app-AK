# Video de vida e incidentes - revalidacion 25/09/2026

Main: 2c652dddeaf33e4d709256a60a57ceac6376a225. Consulta GitHub: sin PR abiertas al iniciar esta tanda; orden83 ya fusionada.
Alcance: correcciones historicas VID01/VID02/INC01. Excluye mejoras nuevas81.
Graphify consultado: grafo ausente en copia aislada; se reutilizaron rutas de evidencia y busquedas puntuales, sin regenerarlo.

## Resultado: 7 PASS, 1 FAIL
Funciones reales extraidas por AST; almacenamiento/autenticacion simulados. No app modificada, build, merge ni datos reales.
Evidencias: docs/evidencias/video-incidentes-2c652dd.cjs y video-incidentes-2c652dd-resultados.json.

### Video de vida: seis controles aprobados
- Foto50 aceptada y subida una vez; foto51 rechazada antes de subir.
- El limite actual documentado en src/lib/video-vida/tope-de-fotos.ts es50 (orden69). Se retira el criterio antiguo que esperaba100; no restaurar ese limite sin decision.
- Borrado completo informa exito.
- Borrado totalmente fallido, parcialmente fallido y almacenamiento no inicializado informan fallo; no falso exito.
Cierra estos casos en sonda, NO certifica ZIP, navegador, todas las autorizaciones ni Storage real.

### INC01: correccion parcial, falta concurrencia distribuida
Con una instancia: comentario y resolucion simultaneos conservan1 comentario, estado Resuelto, dos exitos.
Con dos instancias (dos AsyncMutex reales independientes, almacenamiento compartido): estado Resuelto, CERO comentarios, dos exitos. Se pierde comentario silenciosamente.
src/app/actions/incidents.ts:54 addActualizacionIncidenteInterno y :78 resolverIncidenteInterno leen/escriben lista entera. Los wrappers :137/:142 tienen mutex solo local.
Consumidor verificado: src/app/(app)/incidentes/page.tsx:244 y269.
Persistencia declara incidentes.json -> incidentes; apphosting permite4 instancias.
Es reproduccion del intercalado con almacenamiento simulado, no incidente constatado en Firebase de produccion. La correccion local existente es valida pero insuficiente para varios servidores.

## Para Claude: completar el arreglo existente
No volver a agregar mutex. Usar mutacion transaccional individual del incidente (patron mutateDataItem existente) y lectura dentro de transaccion. Conservar control de sesion y comportamiento de UI.
Validar comentario+resolucion y dos comentarios con dos instancias. Reintentos transaccionales no duplican comentario; identificador estable por operacion. Si se crean incidentes simultaneos no depender solo de Date.now.
Probar error de persistencia, incidente inexistente y permisos denegados sin falso exito. Registrar SHA y resultados. Una tanda, no PR por hallazgo.
Prueba integrada sugerida pendiente: src/__tests__/incidentes-dos-servidores-no-pierden-comentarios.test.ts.

## Continuidad
No repetir BAR02/regalos/documentos ya comprobados. BAR01 recuperacion ante reinicio sigue en REVALIDACION-ANTERIORES-2026-09-25.md; no revalidado aqui.
No declarar todos los historicos corregidos: estos resultados cierran solo los casos anteriores enumerados.

```comprobar
archivo: src/app/actions/incidents.ts
usa: addActualizacionIncidente en src/app/(app)/incidentes/page.tsx
prueba: src/__tests__/incidentes-dos-servidores-no-pierden-comentarios.test.ts
```
