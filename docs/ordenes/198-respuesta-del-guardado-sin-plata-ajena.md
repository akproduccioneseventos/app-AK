# PARA GEMINI - Orden 198 (Codex 196, renumerada por Claude): lo que devuelve un guardado respeta el perfil

**Va en la propuesta CHICA de la orden 197**, porque esto ya está en la app publicada: guardar una fiesta
le devuelve al navegador costos, pagos a proveedores y sueldos ajenos aunque el perfil no los pueda ver.

**El barrido de Claude encontró la misma forma en otros dos lugares** (pregunta 68), y son peores
porque piden sólo sesión, así que llega también el perfil `personal`:

- `src/app/actions/fiesta/reuniones.actions.ts` ~27: devuelve `updatedFiesta` entera, con sólo
  `requireAppSession`.
- `src/app/actions/multiagent.ts` ~589 (`crearTareaDesdeMultiagente`): devuelve `fiesta: updatedFiesta`
  entera, con sólo `requireAppSession`.

**Arreglo, igual para los tres:**

- Lo que se devuelve pasa por `recortarFiestaPorPerfil` (o `paraAfuera` si no es del equipo).
- Si la pantalla que llama no usa la fiesta devuelta, no se devuelve: alcanza con `success`.
- Además, las dos acciones de arriba piden el permiso del área: `ORGANIZACION`.

Lo que sigue es el informe de Codex, tal cual:



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

Ampliacion sin repetir los casos anteriores:150-otros-perfiles prueba los otros
cinco perfiles. Personal/cliente/prospecto/invitado SIN credencial del portal
son rechazados; esto NO prueba sus portales dedicados. La secretaria guarda
por la otra rama (sin actualizarFiesta) y tambien recibe datos recortados.
150-secretaria-sueldos-ajenos confirma especificamente actorsec150 recibiendo
eventSalary3000 del empleadoop150. No es su propio recibo ni un valor enviado:
la entrada no tenia ese sueldo. El caso juzga SUELDOS, no decide si un total
contable es visible; esa distincion evita inventar una regla de contabilidad.
Misma causa de respuesta cruda en ambas ramas, no nueva orden independiente.

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
prueba: docs/evidencias/150-secretaria-sueldos-ajenos.mjs
prueba: src/__tests__/save-fiesta-respuesta-respeta-perfil.test.ts
usa: recortarFiestaPorPerfil en src/app/actions/fiesta/reuniones.actions.ts
usa: recortarFiestaPorPerfil en src/app/actions/multiagent.ts
```
