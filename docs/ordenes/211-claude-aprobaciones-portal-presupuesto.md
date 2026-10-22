# Orden211 - Aprobar de verdad los cambios del cliente

NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.
Claude: dinero, comida, datos y proteccion de contrato. Gemini solo si Claude
necesita ayuda visual. Una tanda con210 en PR1350; no otra PR por cada bloque.
Fuente EJECUTADA fa3b492b8f1d6a77433a92f4d63b665cfea3747c, main observado.
Claude6e67caa14 runtime igual. Verificar cualquier entrega posterior antes de
programar. Codex no implemento correcciones ni modifico contratos del negocio.

## Sonda y consumidor

204 final:12criterios4PASS/8FAIL, CINCO causas, no ocho bugs independientes.
Se ejecutan approveClientMenuChangeRequest y approveClientServiceChangeRequest
REALES de src/app/actions/fiesta/portal.actions.ts, llamando updatePresupuesto,
guardarPresupuestoSinTurno, mutex, guarda de contrato, recalcularCostoItem y
normalizador REALES. La sesion, lecturas/escrituras de presupuesto/fiesta, CRM
y sincronizacion del evento son adaptadores controlados. No SDK/HTTP/nativo ni
un cobro real. El error QA204_BUDGET_WRITE_FAILED es inyectado deliberadamente.
Se conserva el primer corte11 y el final12; no fue un falso positivo corregido.

La pagina src/app/(app)/fiestas/nueva/portal-cliente/page.tsx llama estas acciones
en handleApproveMenuRequest y handleApproveServiceRequest y toma success como
aprobado/presupuesto actualizado. Eso se verifico en el consumidor; no se afirma
haber visto el toast en un navegador por204. No confundir estas funciones con
approveClientGuestCountChangeRequest, que es otra accion con otro recorrido.

## B1 - Se aprueba aunque no se pudo actualizar el presupuesto, P1

Las dos acciones no comprueban el resultado de updatePresupuesto. Caso contrato
firmado: la guarda REAL rechaza modificar estructura, presupuesto queda1000 y
0escrituras, pero solicitud queda aprobada y accion devuelve success:true.
Menu tambien sube la fiesta25->27 aunque el presupuesto sigue25/1000.
Si el presupuesto no existe o la escritura falla, se repite el exito falso.
Son cuatro variantes de UNA causa. No aprobar ni anunciar actualizado cuando
falta/rechaza/falla el presupuesto; conservar una solicitud recuperable y aviso
verdadero. NO quitar ni debilitar la prohibicion de editar contratos firmados.
Una adenda/flujo autorizado debe seguir las reglas vigentes de Claude/el dueno.

## B2 - Aumento de adultos aprobado no llega al desglose/precio, P1

Sin contrato firmado,25adultos, menu por persona40 =1000. Solicitud+2adultos,
adicional80: la fiesta queda27 y la solicitud aprobada. Pero solo se incrementa
invitadosCantidad y no invitadosAdultos; el normalizador REAL vuelve a25 y1000,
mientras totalFinal queda1080. No es un motor simulado que ignora el desglose.
Actualizar la fuente canonica del desglose antes de recalcular; fiesta, cantidades,
precio y saldo deben coincidir tras relectura. No inventar edades ni redistribuir
adultos/menores contra las reglas existentes de catering.

## B3 - Dos unidades de un extra se multiplican dos veces, P1

Solicitud generada con cantidad2, unitario de catalogo200, precioBase400 (total
de linea) y montoAdicional400, ajuste0. Al aprobar se pone precioUnitario400 con
cantidad2: el calculador REAL produce800 y presupuesto1800, no1400. totalFinal
queda1400, creando DOS totales distintos. Una unidad es control positivo y pasa.
No asignar un subtotal al campo unitario; conservar la semantica del catalogo y
recalculo. No resolver esto forzando el total almacenado y dejando items malos.

## B4 - Guardado parcial y reintento agregan dos veces el mismo extra, P1

El presupuesto se escribe primero. Se inyecta fallo al guardar la fiesta: responde
false, pero ya quedo1200 y la solicitud sigue pendiente. Reintentar EL MISMO
requestId agrega otra linea200: termina1400 y aprobada en vez1200una sola vez.
Dar identidad estable a la aprobacion por requestId/fiesta/actor y coordinar su
efecto con la resolucion del pedido, incluyendo resultado perdido/concurrencia.
No deduplicar por servicioId/nombre/telefono/fecha: dos solicitudes diferentes
del mismo servicio son legitimas. No revertir snapshots enteros que borren
pagos/cambios de otra persona. Preservar los permisos de la accion financiera.

## B5 - Si no pudo leer la firma, permite cambiar el contrato, P1

isBudgetContractSigned en src/app/actions/presupuestos.ts captura rechazo de
getAllFiestas y devuelve false. En204 el contrato de fixture ESTAfirmado, pero
esa lectura rechaza: la guarda pasa y se escribe1200. Se pierde la distincion
entre no firmado y no se pudo comprobar. Fallar de forma segura, con error
recuperable y sin modificar el presupuesto. No extender permiso ni apagar la
proteccion por indisponibilidad. Es un caso de lectura fallida, no se afirma
haber roto Firestore de produccion ni haber alterado un contrato real.

## Regresion y cierre

Pasan una unidad normal, pedido ya rechazado, pedido inexistente y sin sesion.
Agregar regresiones durables PENDIENTES hasta que existan y se ejecuten. Reusar
la sonda204 cambiando gate al SHA corregido, sin relajar resultados esperados.
Probar luego el consumidor nativo y guardado completo sobre la fuente conjunta.
Una validacion amplia final congelada corresponde a Claude. No cerrar toda
contabilidad/contrato por estos doce casos ni marcar cinco arreglos por grep.

```comprobar
archivo: src/app/actions/fiesta/portal.actions.ts
usa: approveClientMenuChangeRequest en src/app/(app)/fiestas/nueva/portal-cliente/page.tsx
usa: approveClientServiceChangeRequest en src/app/(app)/fiestas/nueva/portal-cliente/page.tsx
archivo: src/app/actions/presupuestos.ts
usa: updatePresupuesto en src/app/actions/fiesta/portal.actions.ts
usa: guardarPresupuestoSinTurno en src/app/actions/presupuestos.ts
prueba: docs/evidencias/204-aprobaciones-portal-presupuesto.mjs
```
