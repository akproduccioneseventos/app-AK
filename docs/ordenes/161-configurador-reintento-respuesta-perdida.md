# 161 - El reintento del configurador no debe duplicar presupuesto

Actualizacion118: IMPLEMENTADA Y PROBADA en fuente662f123d. Gate118-aceptacion:
731suites4564tests/build/tipos/lint PASS,6flujos nativos PC/Pixel7 PASS. Solo161;
152/friccion y otros consumidores legacy NO cerrados. Ver118-correcciones.md.
El informe117 de abajo es HISTORICO; los2->3 originales se conservan en
117-configurador-antes-arreglo.json y117-ack-antes-arreglo-*.json.

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.
Destinatario: Claude (presupuestos/datos), o Codex principal bajo la autorizacion
del 13/10. No encargar la decision de persistencia a un agente economico.
Esta orden no inicia otra IA. No fusionar; el dueno fusiona.

## Base y defecto comprobado

PR1293 ABIERTA, rama codex/116-respaldo-logo-main-20261013,
HEAD479408f2b0674f2d83a498ad4a2010ac87c477d6, fuente compilada
1656ac2ed15f30f56c5a2cb1ddba119f755728e1; main4c5ef2f9.
Solo1293 esta abierta al consultar. Verificar referencias otra vez antes de editar.
No certificado en publicado. No repetir115 ni116.

Ruta real /empresa/configurador-reunion, ConfiguradorReunionPage,
handleSaveBudget en src/app/(app)/empresa/configurador-reunion/page.tsx;
consume savePresupuesto de src/app/actions/presupuestos.ts.

P1 DEFECT: el servidor termina el guardado; la sonda retira exclusivamente su
respuesta HTTP antes de entregarla al navegador. La pantalla muestra Error
inesperado. Al pulsar otra vez Generar Presupuesto Formal se crea OTRO presupuesto
con los mismos datos. En PC y Pixel7: antes del reintento2 documentos (uno de
control y el recien guardado), despues3; esperado2. Firestore SDK confirma las
cantidades; no es doble clic ni solicitud que nunca llego.

Control positivo PC/movil: cortar ANTES de llegar al servidor y reintentar deja
UN presupuesto, total850 de servicio1000 con15% vigente, y Ver Presupuesto abre
/presupuestos/<id real>. No cambiar ese calculo ni permisos.

Evidencia: docs/evidencias/117-configurador-resultados.json,
117-ack-desktop.json,117-ack-mobile.json,117-contraste.json.
Primer timeout5s del harness conservado117-configurador-inicial.json: el servidor
ya habia guardado; se amplio a60s solo la espera de UI, no el criterio2documentos.

## Correccion requerida, sin perder presupuestos legitimos

1. Identificador por INTENTO LOGICO creado antes de enviar, estable en error,
   demora, perdida de respuesta y doble toque. Conservarlo mientras el resultado
   sea incierto. No crear el identificador solo en el servidor.
2. Persistencia idempotente comprobada: misma operacion devuelve el mismo
   presupuesto sin volver a crear numero, prospecto, notificacion o fiesta.
   Resolver atomicamente; un estado local saving o solo mutex de proceso no
   acredita varios servidores. Validar clave, permiso, actor y carga vinculada.
3. NUNCA deduplicar por nombre, telefono, fecha o total: el dueno requiere VARIOS
   presupuestos legitimos de un prospecto. Una nueva cotizacion deliberada debe
   tener nueva operacion y poder guardarse con los mismos datos o modificados.
   No deshabilitar permanentemente Guardar tras el primer presupuesto.
4. Si hay respuesta incierta, no prometer que no se guardo. Comprobar por la
   operacion o reintentar idempotentemente. Preservar avisos de fallo CRM, importes,
   centavos, regalos y permisos. No fusionar operaciones de otros usuarios.
5. Pruebas: fallo antes de escritura; perdida ACK posterior; doble toque;
   dos consumidores simultaneos; recarga tras resultado incierto; nueva cotizacion
   del mismo telefono; cambio deliberado de paquete; clave invalida/ajena.
   PC/movil: boton real, SDK, un ID por intento y destino persistente tras recarga.
6. Congelar fuente nueva, focalizadas primero y una validacion amplia final. El
   build1656 no acredita el arreglo nuevo. YA-RESUELTO y ESTADO se actualizan
   con SHA y resultado, no con existencia de archivos.

## Observaciones separadas, no nuevo encargo duplicado

El indicador desktop cubre2/3puntos del boton inferior al desplazarlo a la vista;
el foco de teclado funciona y el boton superior permite guardar. Es FRICCION P2
de152 existente, no prueba de que todo guardado falle. Mantener mover/minimizar/chat.
No crear otro encargo de flotantes. Variante movil:3/3puntos libres.

El candidato sugerido por el ayudante sobre backup/ZIP se descarta:116 ya prueba
rechazo ante fallo de lectura y ZIP incompleto; "no se certifica" se referia a no
emitir un respaldo incompleto como bueno. No repetirlo.

La prueba siguiente es la sonda REAL que ya falla en1656; no prueba propuesta ni
aprobada. Debe pasar despues del arreglo sin cambiar el esperado2documentos.

```comprobar
archivo: src/app/actions/presupuestos.ts
usa: savePresupuesto en src/app/(app)/empresa/configurador-reunion/page.tsx (handleSaveBudget)
prueba: docs/evidencias/117-configurador-probe.mjs
```
