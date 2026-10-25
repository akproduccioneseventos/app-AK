# PARA GEMINI - Orden 195 (Codex 186, renumerada por Claude): la cola de la puerta no borra escaneos nuevos

**Va en la MISMA propuesta que las órdenes 188 a 194**, desde la rama `claude/app-debug-stabilize-m70e6z`.
La cola sin señal de la puerta es de la orden 181, que entra con la devolución 188: cuando la traigas,
`sincronizarCola` tiene que quitar de lo guardado **sólo los escaneos que esa vuelta confirmó**, leyendo
la cola de nuevo después de la respuesta. No reemplaces lo guardado con la copia que leíste antes de
esperar. Pasá `docs/ANTES-DE-ENTREGAR.md` entero (pregunta 27: qué pasa con lo que llegó mientras esperabas).

Lo que sigue es el informe de Codex, tal cual:


ID: AK-CODEX-149-COLA-PUERTA. Responsable Gemini; Claude valida/integra.
Devolucion de la cola offline de orden181, no nueva funcion de negocio.
NO CONTRASTADO CON LA TANDA PRIVADA ACTUAL DE CLAUDE/GEMINI.
Antes de programar contrastar su HEAD: no duplicar una correccion existente.
Numero186 libre enmain y las cinco propuestas de app abiertas contrastadas.

## Fuente y resultado

PR1329 ABIERTA, b8491bda3f25aadc71f36f42d5878a47261bb1bf.
Main7230 no contiene esta cola; no afirmar que este defecto ya esta publicado.
Archivo real src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx,
CheckinScannerContent, callback sincronizarCola, lineas83-107 de ese SHA.
149-checkin-cola.mjs extrae el callback REAL por TypeScript AST y ejecuta
su cuerpo con almacenamiento/accion ficticios y espera controlada.
Tres casos:2PASS/1FAIL. Fuente/hash/observado en149-checkin-cola.json.

## Reproduccion observada

1. Cola[A]. sincronizarCola leeA y espera la respuesta de su envio.
2. Mientras espera, otro escaneoB se agrega mediante la misma forma de
   lectura/anexado que usa processCheckIn. Cola[A,B].
3. Llega exitoA. Se reemplaza TODO lo almacenado con pendientesRestantes
   calculados sobre la lectura vieja: queda[]. B nunca fue enviado.
   Esperado cola[B].

Control secuencialA confirmadoPASS. Respuesta perdida conservaA encolaPASS.
NO se ejecutaron dos sincronizadores en paralelo ni navegador/camara fisicos.
No reportar duplicacion de invitados: checkInGuest en invitados.actions.ts
devuelve el ya registrado, comprobado en fuente. Dos solicitudes no demuestran
dos ingresos persistidos.

## Entrega y aceptacion

- Preservar lo agregado mientras espera: retirar solo entradas efectivamente
  confirmadas de ESA ejecucion, sin vaciar una copia vieja.
- Cubrir superposicion online/intervalo, recarga y respuesta perdida, sin
  borrar entradas de otra fiesta ni cambiar tokens/fecha original del escaneo.
- Mantener el ingreso sin señal y contador fiel; no dar por enviado lo pendiente.
- Agregar pruebas de comportamiento y viaje ficticio de volver online. La
  sonda149 demuestra el callback, no toda la pantalla.
- Integrar con la tanda, no abrir/fusionar una PR por cada hallazgo.

```comprobar
archivo: src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx
usa: sincronizarCola en src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx
prueba: docs/evidencias/149-checkin-cola.mjs
prueba: src/__tests__/la-cola-de-la-puerta-no-borra-escaneos-nuevos.test.ts
```
