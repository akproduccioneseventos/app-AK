# Operacion, cocina y cobros: seguimiento QA 133

- App evaluada: build aislado `a635b27071ecea22092eba2a285892c84c6f9d08`; su `src` equivale al de `main` `9aa64f991f5ddceefa8d278a3f298be861eb10bb`.
- Entorno: copia sintetica con servicios de Gemini, Mercado Pago, Instagram, Workspace y correo deshabilitados; sin datos, cuentas ni cargos reales. La afirmacion anterior de que corrio "sin credenciales" queda corregida: el servidor imprimio `Firebase Admin SDK initialized with Application Default Credentials` porque el proceso conserva rutas de usuario (`HOME`/`APPDATA`). `AK_USE_LOCAL_JSON_ONLY=true` dejo `dbAdmin` nulo y los accesos observados usaron el fallback JSON; no se observo una escritura en Firestore real, pero la exclusion de ADC y de salida de red no quedo demostrada.
- Pagos rapidos: encabezado y contenido visibles en escritorio y movil (2/2 PASS).
- Plan de cuotas abierto antes de registrar un cobro: al guardar, la pantalla solicita recargar y no deshace el cobro, escritorio y movil (2/2 PASS).
- Flujo de caja: 2/2 PASS, escritorio/movil. La pantalla presenta una proyeccion o, si falla la lectura, un error sin mostrar ceros que parezcan ingresos reales.
- Hoja de cocina: acceso desde catering y apertura/impresion (2/2 PASS). Una comprobacion adicional de consola no pudo evaluarse: el SDK de Firebase del navegador intento crear una instalacion con la API key sintetica invalida y recibio `400 INVALID_ARGUMENT`. El entorno del servidor marcaba los servicios reales deshabilitados, pero el SDK cliente aun emitio la solicitud. No se atribuye como defecto funcional de la app; esa asercion queda inconclusa hasta bloquear solicitudes externas en QA.
- Totales: 7 aprobados, 2 omitidos intencionalmente por el test movil de cocina, 1 fallo de la comprobacion de consola por la limitacion anterior. Ningun error funcional confirmado en cobros/cuotas/caja/cocina en estos recorridos; no equivale a auditoria completa de esos modulos.
- El servidor aislado se detuvo y el puerto 3300 quedo libre.

Una corrida posterior del viaje RSVP (`viaje-invitado.spec.ts`) se interrumpio al detectar la misma inicializacion ADC. No existe archivo de resultado de Playwright, por lo que no se cuentan sus casos como aprobados ni fallidos. Los archivos sinteticos del evento de esa corrida no quedaron en las dos carpetas locales de datos. Ver hallazgo de aislamiento y orden 174.

Pruebas ejecutadas sin cambios en la app:

```text
tests/e2e/49-contabilidad-cobros-conciliados.spec.ts
tests/e2e/49-contabilidad-permisos-y-errores.spec.ts
tests/e2e/el-plan-de-cuotas-no-deshace-un-cobro.spec.ts
tests/e2e/la-hoja-de-cocina.spec.ts
```
