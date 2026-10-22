# Orden210 - Portal del cliente: ocho defectos reproducidos y una friccion

NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.
Fuente ejecutada: main fa3b492b8f1d6a77433a92f4d63b665cfea3747c.
Claude publico6e67caa14e4131a14234e1dea53bff37223becd9: runtime equivalente
en los consumidores contrastados. Gemini512881c2534da6d633bc7cc8840bd197c46db3b9
ya entro en main. No programar contra su rama antigua ni fusionar documentos solos.
Contrastar cualquier HEAD posterior ANTES de cambiar. Una sola tanda conjunta.
Codex SOLO audito; no implemento estos arreglos ni cambio datos del negocio.

## Resultado ejecutado

193/194/195:46criterios,36PASS/10FAIL. Son OCHO defectos y UNA friccion,
no diez errores independientes. 188/189 conservan el primer hallazgo en09ea;
190 confirma dos de ellos con Firestore Admin SDK demo (11criterios9PASS/2FAIL).
No sumar190 como dos errores nuevos. 193/194 repiten los consumidores en main
nuevo;195 agrega operaciones del contrato. Datos, contratos y cuentas ficticios.

## Claude: saldos, acceso propio y veracidad

### A1 - Avisos de un mismo pago duplicados al mismo tiempo, P1

submitClientPayment, src/app/actions/fiesta/portal.actions.ts. Dos llamadas
solapadas por500 obtienen dos notificationId y dos clientPaymentNotifications
pendientes. El control de repeticion consulta ANTES de actualizarFiesta; incluso
con el mutador real y su transaccion SDK terminan las dos. El reintento secuencial
SI conserva un ID, y250/300 distintos SI deben conservarse. No se observaron dos
cobros contables: son DOS AVISOS pendientes del mismo informe. Resolver el mismo
intento dentro de la escritura atomica sin suprimir dos pagos legitimos del mismo
monto. Si requiere identidad del intento, conservarla ante respuesta perdida.
No deduplicar por nombre/telefono/fecha ni modificar el estado de un pago real.

### A2 - Comprobante perdido sin aviso ni recuperacion, P1

Misma accion. uploadToStorage rechaza; devuelve success:true y guarda nombre,
pero sin comprobanteUrl. Al recuperar Storage y repetir, retorna el ID anterior
ANTES de subir: uploadCalls sigue1 y el comprobante no aparece. Probar error
visible o advertencia verdadera, y recuperar el adjunto en el mismo aviso sin
duplicar el importe. NO convertir un adjunto opcional en requisito de todo pago.
190 usa SDK para la fiesta; Storage es doble controlado, NO bucket externo.

### A3 - Enlace propio pierde presupuesto al iniciar sesion cliente, P1

getPresupuestoById, src/app/actions/presupuestos.ts, consumido por PublicPortalPage
en src/app/portal/c/[accessKey]/page.tsx. Sin sesionAK, token valido de ese
presupuesto devuelve su documento. Con sesionAK firmada perfil cliente y EL MISMO
token valido, devuelve null por el camino de permisos generales. La pagina activa
anuncia Falta el presupuesto. Respetar la capacidad publica de ESE documento sin
dar CONTABILIDAD global ni acceso a presupuestos ajenos. Mantener tokens invalidos,
otroID y permisos de cobros protegidos; los controles positivos/negativos existen.

### A4 - Error de lectura se presenta como presupuesto inexistente, P2

PublicPortalPage captura rechazo con catch(()=>null). Con presupuesto existente
y lectura fallida, el cliente ve Falta el presupuesto / Cuando AK lo cargue.
Mostrar indisponibilidad/reintento sin afirmar ausencia ni inventar cero/saldo.
errorCatalogo no representa el error de presupuesto. No rehacer el arreglo de la
LISTA interna de presupuestos: es otro consumidor publico comprobado en193.

### A5 - Segunda cancelacion informa devolucion aunque queda deuda, P1

cancelServicesOrParty, portal.actions.ts. Presupuesto1000, servicios700+300,
pagado confirmado100 (pendiente200/rechazado50 NO cuentan), ajuste0. Cancelar700
guarda multa210; cancelar luego300 conserva210 y agrega90. Queda total300,
saldo200. La segunda respuesta anuncia refundAmount10/pendingDue0: calcula
solo sobre la nueva multa90, no sobre todo lo persistido. El cliente activo usa
esos valores en handleConfirmCancellation. Documento/respuesta/lector deben
coincidir con la misma base guardada. No cambiar las tasas contractuales30/10.

### A6 - Cancelacion total con descuento fijo descuenta otra vez, P1

Misma accion. Subtotal1000, descuento fijo100, total contratado900, pagado100.
Multa calculada270; devuelve pendiente170. Pero al persistir se vuelve a restar
el descuento100: total170 y saldo70. Respuesta y presupuesto difieren100.
195 reproduce ambos numeros por el helper financiero REAL. Con descuento
porcentual pasa el control. Claude determina el calculo coherente con la regla
contractual existente; no es autorizacion para inventar una politica nueva.

195 ejecuta cuerpos reales, firma de portal y resumen financiero; mutador de
presupuesto serializado, lectura/guardado de fiesta, disponibilidad, archivos y
avisos controlados. No certifica saveFiesta completo, SDK ni documento fisico.
Los13PASS incluyen PIN/sesion negativos, cambio/reintento/concurrencia de fecha,
rollback ante fallos de archivo/fiesta y pagos pendientes/rechazados excluidos.

## Gemini: consumidor visible, con revision de Claude en pagos

### A7 - Informar pago no abre ningun formulario, P1

PublicPortalClientExperience, src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx.
193 monta la pagina real y pulsa Informar pago: no aparece formulario. El estado
paymentModalOpen se declara pero no se consume en el JSX. No alcanza con que la
accion submitClientPayment exista: conectar el formulario visible a esa accion,
error/espera/exito y mismo intento. Mostrar monto y adjunto opcional, sin agregar
cobros confirmados desde el portal. Claude valida acceso y A1/A2 conjuntamente.

### A8 - Entrega oficial desaparece en el portal activo por clave, P1

getFiestaByAccessKey devuelve fotografiaYFilmacion.servicios con el album oficial
marcado Entregado completo y linkEntrega. mapFiestaToPortalDTO, page.tsx, conserva
solo notasGenerales. La UI activa no tiene ese enlace ni acceso al modulo legado
fotos-video. 194 comprueba lector positivo, perdida del DTO y ausencia en DOM.
Conservar solo campos publicables y mostrar entregas reales, sin exponer notas
internas/costos. NO crear otro album ni reabrir auditoria86: aquella prueba miraba
/portal-cliente/[id]/fotos-video, esta prueba mira /portal/c/[accessKey].

### F1 - Atajo Pagos cierra lo que debe mostrar, friccion P2 separada

En la misma UI, la tarjeta Pagos hace click() al disparador del acordeon.
Abierto por defecto, tocar el atajo lo CIERRA. Desde cerrado SI lo abre.
Hacer visible el destino y desplazar al mismo, no alternarlo a ciegas. No es
otro defecto de importes ni una propuesta de redisenar toda la pagina.

## Aceptacion y limites

Adjuntar rojo/verde por ID de criterio, SHA conjunto y consumidor real. Agregar
regresiones durables donde corresponda: propuestas PENDIENTES hasta crearse y
ejecutarse, no aprobar por nombre de archivo ni comprobacion textual. Reusar las
sondas193/194/195 y190, cambiando gate/fuente solo al entregar codigo nuevo.
Una validacion amplia final congelada corresponde a Claude. UI nativa/HTTP y
persistencia completa se verifican aparte: ReactDOM/acciones compuestas no las
suplantan. No cambiar condiciones, prioridades comerciales ni permisos globales.

```comprobar
archivo: src/app/actions/fiesta/portal.actions.ts
usa: submitClientPayment en src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx
usa: cancelServicesOrParty en src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx
archivo: src/app/actions/presupuestos.ts
usa: getPresupuestoById en src/app/portal/c/[accessKey]/page.tsx
archivo: src/app/portal/c/[accessKey]/page.tsx
usa: PublicPortalClientExperience en src/app/portal/c/[accessKey]/page.tsx
prueba: docs/evidencias/193-portal-cliente-version-nueva.mjs
prueba: docs/evidencias/194-portal-controles-version-nueva.mjs
prueba: docs/evidencias/195-portal-operaciones-contrato.mjs
prueba: docs/evidencias/190-pago-informado-sdk.mjs
```
