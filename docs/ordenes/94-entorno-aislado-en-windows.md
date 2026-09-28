# 94. El entorno aislado no arranca en Windows

28/09/2026. Codex revisa; Claude corrige el entorno y valida. No cambiar la app ni datos reales.

## Contraste

- Reproduccion en main 5e384c684c326dbcf79a12dae760ba4fe7e0b705.
- Contrastado con origin/main 621f41c (PR 1235 fusionada): scripts/entorno-de-pruebas.mjs no cambio. No habia PR abierta al consultar.
- Son bloqueos del ensayo local, NO evidencia de un fallo de produccion. Recorridos por rol todavia pendientes.
- npm ci --ignore-scripts --no-audit --no-fund termino: 2102 paquetes. Windows, Node v24.19.0.

## Dos fallos reproducidos

1. npm run entorno:pruebas falla en prepararCarpetaAislada, fs.symlinkSync(..., 'dir'): EPERM. El worktree ya fue creado y el fallo ocurre antes del manejo de limpieza. Usar un enlace de directorio compatible con Windows sin requerir privilegios adicionales; conservar comportamiento en otros sistemas y limpiar tambien fallos de preparacion.
2. Para avanzar se adapto SOLO la llamada en memoria a junction, sin editar codigo. Luego el script aborta con: HOMEDRIVE, HOMEPATH, LOGONSERVER, SYSTEMDRIVE, USERDOMAIN, USERNAME, USERPROFILE, WINDIR. Prueba independiente: spawnSync(process.execPath, ['-e', 'console.log(JSON.stringify(Object.keys(process.env).sort()))'], {env:{}, encoding:'utf8'}) devuelve esas variables aunque env este vacio. Son agregadas por el arranque en Windows, no prueba de credenciales filtradas. nombresQueSobran debe reconocer explicitamente este caso, sin permitir nombres arbitrarios ni omitir el control de archivos .env.

## Aceptacion

- Arranca desde un checkout limpio en Windows sin modo desarrollador ni privilegios de administrador, con las mismas claves falsas y datos aislados.
- Mantener rechazo de una credencial arbitraria inyectada por .env; no desactivar aislamiento para hacer pasar el ensayo.
- Probar error de enlace, error al calcular ambiente y error de compilacion: no deben quedar copias temporales sin gestionar.
- Claude registra SHA, sistema y resultado del arranque real; Codex retoma organizador, cliente e invitado. No marcar estos recorridos aprobados por pasar pruebas del script.
- Adjuntar a la siguiente tanda; no fusionar documentacion sola.

# Prueba propuesta, pendiente de crear y ejecutar en Windows.
```comprobar
archivo: scripts/entorno-de-pruebas.mjs
usa: prepararCarpetaAislada en scripts/entorno-de-pruebas.mjs
usa: nombresQueSobran en scripts/entorno-de-pruebas.mjs
prueba: src/__tests__/entorno-aislado-windows.test.ts
```
