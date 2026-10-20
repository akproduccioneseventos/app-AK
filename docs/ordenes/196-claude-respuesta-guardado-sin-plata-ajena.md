#196 - El guardado no devuelve costos a un perfil sin permiso

ID: AK-CODEX-150-SAVE-RESPUESTA-PERFIL. Responsable Claude (dinero/permisos).
Va en la tanda abierta, no en una propuesta separada. No reemplaza193/194/195.
Contrastado PR1337HEAD45a0b1d4783ad58846c2e2d07ad8f318287024bf y base remota
860aa8c2641a6b8af3806bae08011dffa6276c80. NO CONTRASTADO CON CAMBIOS
PRIVADOS NO PUBLICADOS deClaude/Gemini: verificar suHEAD antes de programar.

## Que se reprodujo y que no

saveFiesta, src/app/actions/fiesta/fiesta.actions.ts, devuelve r.updatedFiesta
o fiestaData sin recortar por perfil, luego de reponer internamente lo de plata.
El perfil operador REAL de perfiles.ts tiene CONTABILIDAD/GANANCIAS false.
En el cuerpo real de saveFiesta ejecutado con sesion/asignacion/transaccion
ficticias, se guarda correctamente pero la respuesta vuelve con:

- gestionCostos.total=9500;
- estadosCompra[0].montoPagado=60.30, pagado=true;
- estadosCompra[1].montoPagado=200, pagado=true.

La funcion REAL recortarFiestaPorPerfil, con ese mismo perfil/dato, elimina
esos campos. Control del recortePASS; dos variantes de nombre devuelven campos
indebidos, UNA causa de salida. Ver150-consumidores-entrega.json y
150-salidas-perfil.json. No se observo filtracion de dinero real ni se ejecuto
una sesion HTTP firmada/SDK: no extender el resultado a todas las acciones.

Consumidor cliente verificado en eseSHA:
src/app/(app)/fiestas/nueva/pagina-web/page.tsx, PaginaWebPageContent usa
useAutoSave.onSave -> saveFiesta; tambien reunion-organizacion la llama.
No es una funcion nueva sin consumidor. Que la UI no muestre el JSON no
autoriza a devolverlo al navegador.

## Confirmacion con asignacion real, no un permiso inventado

150-frontera-guardado.json fortalece la primera sonda:4casos3PASS/1FAIL con
quienEsElEquipo/usuarioDelEquipo/empleadoDe/esEquipoParaFiesta/
requireFiestaWriteAccess REALES, junto al modelo real de perfiles y saveFiesta.
Operador emparejado por empleado y asignado a la fiesta: permitido por el
guardia real. Entrada recortada SIN costos; respuesta SI trae9500 y60.30.
No es un eco de importes ya enviados. Operador no asignado y anonimo: rechazados
sin escrituras. Dueno: conserva acceso al dato. Misma causa, no cuatrobugs.
Solo verifySession y lectura/transaccion son dobles; firmadoHTTP/SDK pendiente.

## Criterio de arreglo y comprobacion

- Reponer campos para GUARDAR no debe reintroducirlos en la RESPUESTA.
- Conservar respuesta minima para cliente/publico y permisos del equipo;
  al equipo devolver solo lo permitido por su perfil, usando el recorte existente.
- No cambiar importes, atomicidad ni quien puede editar; no crear permisos nuevos.
- Probar ambas salidas de saveFiesta, con y sin rama transaccional, por perfiles
  que tienen y no tienen permiso. Demostrar que los datos guardados conservan
  lo original y que la respuesta no los contiene cuando corresponde.
- Completar la prueba de frontera HTTP/SDK ficticia antes de darla por aceptada.

```comprobar
archivo: src/app/actions/fiesta/fiesta.actions.ts
usa: saveFiesta en src/app/(app)/fiestas/nueva/pagina-web/page.tsx
usa: recortarFiestaPorPerfil en src/app/actions/fiesta/fiesta.actions.ts
prueba: docs/evidencias/150-salidas-perfil.mjs
prueba: docs/evidencias/150-frontera-guardado.mjs
prueba: PENDIENTE src/__tests__/save-fiesta-respuesta-respeta-perfil.test.ts
```
