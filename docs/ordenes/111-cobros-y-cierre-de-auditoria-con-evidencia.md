# 111 - Cobros y cierre de auditoria con evidencia

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
prueba: docs/evidencias/sondas/64-integral-source-probes.cjs
archivo: src/app/actions/fiesta/invitados.actions.ts
usa: getInvitados en src/app/recepcion/[fiestaId]/page.tsx
prueba: docs/evidencias/sondas/64-integral-source-probes.cjs
```
