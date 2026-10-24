# 221 - Claude: factura ausente no puede quedar cargando

NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Verificar antes de programar
que no exista un arreglo privado activo de este mismo estado.

## Fuente y defecto P2 comprobado

Fuente ejecutada:3e45a4ac6b479f89605163168e31b37dc84f2d0f.
PR1353 publica3f9460185143ef034dcd713e975d2a0af5e20f1a conserva identicos
src/app/(app)/invoices/[id]/page.tsx,actions/invoices.ts yactions/settings.ts.
No se acepta toda la candidata por ese contraste.

345 ejecuta ViewInvoicePage real en ReactDOM/jsdom con lecturas controladas:

- ControlPASS: si getInvoiceById sigue pendiente, aparece la carga.
- CriterioFAIL: si termina normalmente devolviendo null y las otras lecturas
  tambien terminaron, el componente sigue mostrando Loader2 indefinidamente.
- Las tres lecturas fueron llamadas una vez; no hubo excepcion ni toast.
  El fallo es la asercion de que ya no debe quedar animate-spin, no un import,
  una espera de captura o un timeout del equipo.1PASS/1FAIL,una causa.

La condicion actual isLoadingInvoice||!invoice||!templateSettings confunde
"todavia leyendo" con "ya termino sin factura". Esto explica un estado real
mal resuelto del componente, pero NO demuestra que el presupuesto/factura de
un cliente real haya desaparecido ni que haya un error en los importes.
La apertura generica previa sin cuerpo, por si sola, no daba esa prueba causal.

## Correccion acotada

- Separar carga, resultado ausente/no disponible y error de lectura.
- Mostrar un estado legible con Volver y Reintentar cuando corresponda.
  Mantener el recorte de permisos: no revelar datos de una factura ajena.
- No cambiar cobros, saldos, cuotas, moneda, redondeos ni reglas de acceso.
- Probar lectura pendiente, null resuelto, rechazo de lectura y factura valida.
  Comprobar que el reintento deja la pantalla utilizable, sin duplicar pagos.
- Usar345-factura-ausente.test.tsx como reproduccion; no borrar su caso fallido
  ni arreglarlo relajando la asercion. La prueba de regresion de la app todavia
  debe crearse/ejecutarse porClaude. No es un arreglo hecho porCodex.

La bateria existente321 sigue siendo834suites/5136PASS en3e.345 es una sonda
nueva y focal, no un cambio del resultado historico ni una aceptacion de3f.

## Retest final387 - misma orden, no un nuevo encargo

Fuente publica1353:917a98e32c63fe2f832f5cdc16db87f4fc722b6c.
En390 tambien se observo HEAD privado igual917, sin cambios tracked, a las
17:21UTC del24/10. Cambios privados posteriores no publicados NO CONTRASTADOS.
Claude la referencia como su orden224: NO confundir con la otra221 deGemini.

El caso original null YA ESTA CORREGIDO:387 controlPASS, sin spinner y con
estado de ausencia. La lectura pendiente tambienPASS, mantiene carga.
Permanece UNA variante del estado de error: getInvoiceById resuelve una
factura ficticia valida de1000, pero getInvoiceTemplateSettings rechaza con
QA387_TEMPORARY_READ_FAILURE. El componente avisa por toast y despues deja
en el cuerpo: Factura no encontrada / no existe o fue eliminada.
Resultado observado387:2PASS/1FAIL, asercion de texto; no timeout del equipo.
No se demostro desaparicion de factura ni error contable.

Completar la separacion YA pedida entre error y ausencia: si falla una lectura,
mostrar estado persistente No se pudo cargar y reintento/volver, conservando
permisos. No declarar inexistencia ni eliminacion a partir de un rechazo.
No cambiar importes ni cobros. Usar387-factura-error-no-es-ausencia.test.tsx
como reproduccion adicional y conservar los controles de null y pendiente.
La bateria canonica386 pasa862suites/5243tests en917; esta sonda adicional
demuestra un hueco no cubierto por ella, no contradice su resultado verde.

```comprobar
archivo: src/app/(app)/invoices/[id]/page.tsx
usa: ViewInvoicePage en src/app/(app)/invoices/[id]/page.tsx
prueba: src/__tests__/factura-ausente-no-queda-cargando.test.tsx
```
