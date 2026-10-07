# 112 - Cobros y cierre de auditoria con evidencia

## Destino, version y contraste

Codex revisa y documenta. Claude lleva cobros y permisos y compila; Gemini lleva
las correcciones del contador. No fusionar esta documentacion sola ni abrir una
PR por hallazgo. Juntar las correcciones de la tanda y mantener la decision del
dueno sobre funcionamiento y fusion.

- Main revisado: `c13073f692691fc48e6d9f71f287e5c0451019f8`.
- PR 1251: `feat/super-asistente-unificado`,
  `ea2cb46d732b815492ee5c176cd9ea6e61e867de`.
- Publicacion que respondio `/api/health`: `0864e136189a0e3a630d7db108d4edbe655d7f6d`,
  compilada `2026-10-02T02:29:00.553Z`. No es el main actual.
- Los archivos contables de las sondas no cambian entre esas tres versiones.
  No hay una correccion de estos casos en la PR 1251 contrastada.
- El contador pertenece a la fusion 1253 en main; la PR 1251 no lo incluye.
  Trabajar sobre main actualizado, no reponer la version vieja de esa rama.

Revalidar los SHA antes de programar si avanzo cualquiera de las ramas.
Evidencia, cobertura y limites: `docs/evidencias/64-auditoria-integral-2026-10-02.md`.

## Estado al 3 de octubre de 2026 (Claude)

- **A (COB01 a COB05): HECHO** en la fusion `39da52a` (PR 1254), con
  `src/__tests__/los-cobros-de-factura-no-se-duplican-ni-pasan-la-tolerancia.test.ts` y
  `src/__tests__/dos-cuotas-a-la-vez-no-se-pisan.test.ts`, las dos rojas sobre el codigo viejo.
  COB05: la app sigue trabajando en pesos; una factura que ya este en otra moneda se cobra con
  sus centavos y su rotulo. No se agrego ninguna moneda.
- **C (PER01): CONFIRMADO Y HECHO.** `getInvitados` es una accion del servidor que importa el
  muro social (pantalla del navegador): se podia llamar desde internet. Ahora pide sesion del
  equipo; la tarea de recordatorios lee la fiesta cruda. Prueba:
  `src/__tests__/la-lista-de-invitados-pide-sesion.test.ts`.
- **B.2 (AUD02): HECHO** por Claude (una linea): `fileURLToPath`, con prueba que corre el
  comando de verdad en `src/__tests__/codex-tiene-un-final.test.ts`.
- **B.1 (AUD01): GEMINI**, con el detalle de abajo.
- **D:** Claude corre la tanda entera de navegador compilada y deja el resultado prueba por
  prueba en `docs/evidencias/65-navegador-completo.json`.

## A. Claude: cinco casos contables existentes, no cinco frentes nuevos

Se reutiliza la auditoria 63, cuyos blobs siguen siendo identicos. La sonda
actual ejecuta las funciones originales con entradas y persistencia simuladas;
no cobra, envia mensajes ni escribe en Firebase.

1. **COB01, prioridad 1: factura guardada, espejo que lanza excepcion.**
   `addPaymentToInvoiceInner` en `src/app/actions/invoices.ts` guarda el pago antes
   de llamar `addPagoToPresupuesto`. El fallo devuelto compensa; la excepcion
   lanzada no. Dos intentos rechazados dejan dos pagos por 200 cuando cada
   intento era de 100. Cubrir excepciones y reintentos con una identidad estable
   o reconciliacion que no registre nuevamente el mismo cobro. No confundir un
   registro duplicado con un cargo duplicado a una tarjeta: no se probo un cargo.
2. **COB02, prioridad 1: dos cuotas actualizadas a la vez.**
   `updateCuotaEstado` en `src/app/actions/payment-plans.ts` lee antes de guardar
   el array completo. En la sonda de guardado de documento completo, dos
   respuestas exitosas dejan solo una cuota pagada. La lectura y modificacion
   deben compartir la operacion atomica sobre la fiesta actual; no basta con
   poner turno solamente alrededor de la escritura. Confirmar la regresion
   con el backend de pruebas antes de darla por corregida.
3. **COB03, prioridad 2: el formulario calla un fallo devuelto.**
   `handleAddPaymentSubmit` en `src/app/(app)/invoices/[id]/page.tsx` atiende el
   exito y las excepciones, pero no el resultado `{success:false,error:...}`.
   Mostrar el error y conservar lo escrito para corregirlo, sin anunciar pago
   guardado. El caso probado genera cero avisos de error.
4. **COB04, prioridad 2: tolerancia acumulable en factura independiente.**
   Con total 1000 ya cubierto, tres pagos posteriores de 1 dejan total 1003.
   Mantener la tolerancia comercial existente sin permitir que cada nuevo pago
   vuelva a habilitarla. Caso reproducido en factura SIN presupuesto vinculado;
   no generalizarlo a la vinculada, cuyo segundo control limita el pago.
5. **COB05, prioridad 2 y decision condicionada: moneda libre incompatible.**
   El campo actual admite escribir USD, pero `parseCleanMoney` redondea 12.50 a
   13 y el recibo dice PESOS URUGUAYOS. No agregar multimoneda por esta auditoria.
   Contrastar la decision UYU del manual con el dueno: si es solo UYU, impedir
   monedas incompatibles tambien en servidor; si se conserva otra moneda,
   respetar sus decimales y rotulos. No cambiar la politica monetaria sin esa
   confirmacion.

Regresiones nuevas de estos cinco casos: PENDIENTES de crear y ejecutar por
Claude. La sonda demuestra el problema actual; su codigo de salida 0 NO significa
que la app este corregida. Reusar las pruebas financieras existentes y sumar
solo los casos que les faltan.

## B. Gemini: que el contador no de una certeza que no midio

1. **AUD01, prioridad 2: alcance e invalidacion incompletos.**
   `docs/codex/areas.json` cubre 184 de las 416 rutas (370 paginas y 46 API).
   Quedan 232 fuera, incluidas `portal-cliente`, blog, CRM, pagos rapidos y los
   webhooks. `cambioDesde` solo compara las carpetas declaradas. La sonda con
   areas hipoteticamente limpias y un cambio en `portal-cliente/[id]/page.tsx`
   sigue dando terminado. Hoy las 14 estan sin revisar: NO se acusa una
   aprobacion real obsoleta. Completar el inventario y cubrir dependencias
   compartidas/configuracion para que tambien invaliden sus areas consumidoras.
   Reusar el mapa y el analizador de consumidores existentes; no inventar otro
   panel ni reconstruir una arquitectura paralela.
2. **AUD02, prioridad 2: el comando no imprime nada en Windows.**
   El guard de entrada en `scripts/codex-limpio.mjs` usa `new URL(...).pathname`.
   Windows produce `C:\\C:\\Users\\...`, distinto del nombre ejecutado. El proceso
   termina 0 sin imprimir el estado. Usar la conversion correcta de URL a ruta
   y comprobar la ejecucion REAL del CLI, no solo sus funciones importadas.

Las pruebas actuales del contador comprueban carpetas existentes y helpers, no
el alcance total ni el comando Windows. Esas regresiones tambien estan PENDIENTES.
No marcar areas limpias por presencia de archivos, referencias o tests de texto.

### B.1 para Gemini, con los nombres exactos (Claude, 3/10)

**Contraste actual de Codex, 7/10/2026:** main `9bb955ac`, sin PR abierta.
El contador y su analizador siguen sin el arreglo. El inventario actual es
**419 rutas, 185 cubiertas y 234 fuera**, no las 416/232 históricas de arriba.
La sonda real `node docs/evidencias/76-contador-probe.mjs` conserva la lista
completa: un cambio simulado en el portal sigue dejando el área hipotética
limpia, y el resumen hipotético afirma terminado con rutas afuera. Las áreas
REALES no se modificaron ni están certificadas; sonda verde significa fallo
reproducido. No es un fallo del asistente ni un pedido de otro panel.
Antes de programar, contrastar también la rama de trabajo si hay una entrega
nueva no publicada. Reunir con 122 RED03 y 126 en UNA tanda de código y docs.

Trabajar desde la principal actualizada. **Una sola propuesta.** Leer antes
`docs/ANTES-DE-ENTREGAR.md`.

1. **`scripts/pantallas-tocadas.mjs`:** sacar de `pantallasTocadasDesde` (linea ~235) el
   recorrido de "quien usa a quien" a una funcion exportada nueva,
   `archivosAlcanzadosDesde(cambiados, nombresDe)`, que devuelva el conjunto `alcanzados`
   (rutas relativas con `/`). `pantallasTocadasDesde` la usa y **sigue devolviendo lo mismo
   que hoy** (no tocar `SOLO_CON_LA_BASE_REAL`, `AFECTAN_TODO` ni el corte del 50%).
2. **`scripts/codex-limpio.mjs`:**
   - `cambioDesde(commit, carpetas, git)`: tomar TODOS los archivos cambiados
     (`git diff --name-only <commit>..HEAD`). Da `true` si alguno cae en `carpetas`, **o** si
     alguno de `archivosAlcanzadosDesde(cambiados, () => '*')` cae en `carpetas`, **o** si un
     cambiado entra en `AFECTAN_TODO` (exportarla). Sin poder comparar, `true` como hoy.
   - Nueva `rutasSinArea(areas)`: lista cada `src/app/**/page.tsx`, `page.ts` y `route.ts` que
     no cae en ninguna carpeta de ninguna area.
   - `resumen()` devuelve tambien `sinArea` y **`terminado` es falso mientras `sinArea` no este
     vacia**. El comando imprime: `N pantallas sin area: Codex no las mira`.
3. **`docs/codex/areas.json`:** repartir las rutas que hoy quedan afuera (unas 232) entre las
   14 areas existentes, **sin crear areas nuevas**, por carpeta (no archivo por archivo cuando
   la carpeta entera es del area). Guia: `portal-cliente` -> Portal del cliente; blog, landings
   -> Web publica; CRM, prospectos -> Asistente AK si es el secretario, si no Web publica;
   `pagos-rapidos`, webhooks de Mercado Pago -> Cobros; webhooks de Meta/Instagram -> Instagram;
   `api/cron` -> Tareas automaticas. **No tocar** `estado`, `ultimaRevision` ni `nota`.

**No tocar:** las pruebas de seleccion de la puerta (`se-prueba-*`), `pruebas-que-tocan.mjs`, ni
el formato de `areas.json` mas alla de sumar carpetas.

**Lo que tiene que comprobar la prueba** (`src/__tests__/codex-tiene-un-final.test.ts`):
- Con todas las areas en `limpia` y un cambio en `src/app/portal-cliente/[id]/page.tsx`, el
  area del portal da `volver-a-mirar` (git falso que devuelve ese archivo).
- Con un cambio en un archivo de `src/lib` que importa una pantalla de un area, esa area da
  `volver-a-mirar`; uno que no importa nadie de esa area, no.
- `rutasSinArea` sobre el `areas.json` real da `[]`, y sobre un `areas.json` con un area
  menos da distinto de `[]` y `terminado` falso.
- Romperla a proposito: con la funcion vieja de `cambioDesde`, la primera da verde -> esta mal.

## C. Claude: confirmar alcance de una lectura antes de corregirla

**PER01, no demostrado por HTTP:** `getInvitados` en
`src/app/actions/fiesta/invitados.actions.ts` pasa `LECTURA_COMPLETA` a
`getFiestaById`. La sonda sin sesion muestra contacto y credencial sinteticos,
mientras la lectura normal los recorta. Consumidores reales: recepcion y cron
de recordatorios. NO se probo una extraccion remota ni se inspeccionaron datos
de invitados reales. Comprobar el transporte y los permisos de esos consumidores
en el entorno preparado antes de convertir esto en una correccion de producto.

Si el transporte permite esa consulta no autorizada, separar una lectura interna
del servidor de la accion accesible y cubrir anonimo, cliente de otra fiesta,
equipo y cron autorizado. No romper los recordatorios ni cambiar el QR por nombre
que el dueno decidio conservar. Si la lectura solo queda disponible internamente,
anotar el descarte con evidencia; no ejecutar una correccion por una suposicion.

## D. Claude: evidencia final, no otra promesa de toda la app

- Compilar una vez el conjunto congelado y registrar SHA, ambiente, resultado y
  errores. Codex NO ejecuto una compilacion final ni una prueba de Firebase real.
- Completar el resto del navegador en el entorno aislado COMPILADO. La corrida
  dev Windows y sus reinicios no certifican produccion. Adjuntar resultado JSON
  por test, no solamente un total verde ni pruebas de otra version.
- Entregar el entorno estable o sus artefactos con SHA comprobable: quedan 434
  de 480 casos de escritorio sin ejecutar. No hay BUILD_ID en las copias locales
  auditadas, y el servidor historico 127.0.0.1:3300 rechaza conexion. No afirmar
  que Codex tiene disponible una compilacion preparada solamente porque existe
  en otra maquina. Codex conserva la revision, Claude la compilacion.
- Repetir primero los casos de navegador dudosos del informe 64. No programar
  animacion, catalogo o captura por un timeout local sin reproducirlo en el
  entorno estable y contrastar la tanda.
- `/api/health` distingue version, configuracion y la consulta de Firebase, pero
  una clave presente NO demuestra Gmail, Instagram, Gemini o Mercado Pago
  funcionando. La conexion real necesita su propia evidencia sin revelar claves.
- No investigar los rojos de facturacion de GitHub como errores del codigo.
- Reservar el ensayo fisico de camara/impresora/360/barra y una comprobacion
  autorizada de integraciones para su limite real; no sustituirlos con mocks.
- Subir el registro junto con la tanda. El dueno conserva la fusion.

```comprobar
archivo: src/app/actions/invoices.ts
usa: addPaymentToInvoice en src/app/(app)/invoices/[id]/page.tsx
prueba: docs/evidencias/sondas/64-cobros-source-probe.cjs
archivo: src/app/actions/payment-plans.ts
usa: updateCuotaEstado en src/app/(app)/fiestas/nueva/plan-pagos/page.tsx
prueba: docs/evidencias/sondas/64-cobros-source-probe.cjs
archivo: scripts/codex-limpio.mjs
usa: codex-limpio.mjs en .claude/hooks/session-start.sh
usa: archivosAlcanzadosDesde en scripts/codex-limpio.mjs
usa: rutasSinArea en scripts/codex-limpio.mjs
prueba: src/__tests__/la-lista-de-invitados-pide-sesion.test.ts
prueba: docs/evidencias/sondas/64-integral-source-probes.cjs
archivo: src/app/actions/fiesta/invitados.actions.ts
usa: getInvitados en src/app/recepcion/[fiestaId]/page.tsx
prueba: docs/evidencias/sondas/64-integral-source-probes.cjs
```
