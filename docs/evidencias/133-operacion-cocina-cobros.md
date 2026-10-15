# Operacion, cocina y cobros: seguimiento QA 133

- App evaluada: build aislado `a635b27071ecea22092eba2a285892c84c6f9d08`; su `src` equivale al de `main` `9aa64f991f5ddceefa8d278a3f298be861eb10bb`.
- Entorno: copia sintetica aislada, sin credenciales ni servicios de Gemini, Mercado Pago, Instagram, Workspace o correo; sin datos, cuentas ni cargos reales.
- Pagos rapidos: encabezado y contenido visibles en escritorio y movil (2/2 PASS).
- Plan de cuotas abierto antes de registrar un cobro: al guardar, la pantalla solicita recargar y no deshace el cobro, escritorio y movil (2/2 PASS).
- Hoja de cocina: acceso desde catering y apertura/impresion (2/2 PASS). Una comprobacion adicional de consola no pudo evaluarse: el SDK de Firebase del navegador intento crear una instalacion con la API key sintetica invalida y recibio `400 INVALID_ARGUMENT`. El entorno del servidor marcaba Firebase deshabilitado, pero el SDK cliente aun emitio la solicitud. No se atribuye como defecto funcional de la app; esa asercion queda inconclusa hasta bloquear solicitudes externas en QA.
- Totales: 5 aprobados, 2 omitidos intencionalmente por el test movil de cocina, 1 fallo de la comprobacion de consola por la limitacion anterior. Ningun error funcional confirmado en cobros/cuotas/cocina en estos recorridos; no equivale a auditoria completa de esos modulos.
- El servidor aislado se detuvo y el puerto 3300 quedo libre.

Pruebas ejecutadas sin cambios en la app:

```text
tests/e2e/49-contabilidad-cobros-conciliados.spec.ts
tests/e2e/el-plan-de-cuotas-no-deshace-un-cobro.spec.ts
tests/e2e/la-hoja-de-cocina.spec.ts
```
