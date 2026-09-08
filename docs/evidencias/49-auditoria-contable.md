# Evidencia 49 - Revision contable del 8 de septiembre de 2026

## Version y alcance

Codigo de main: `8c5eb6e173e7b7b8dce6a8811cade7cf38411dfe`.
Worktree local al ejecutar: `fd4d1658df9fb3e136479d60fb5fc4041f2c96f6`
(solo agrega documentacion a esa base). Comprobado diff vacio de acciones contables
revisadas respecto de main. No hubo cambios de codigo de app ni compilacion.

Codigo leido: acciones de presupuestos, facturas, planes de pago, guardado de fiesta,
pagos de proveedores, dashboard, data-service, perfiles/sesion, mutex, guardrails y
deduplicacion; pantallas contables y consumidores directos. Lectura parcial de
Mercado Pago. No se inspeccionaron todas las ramas ni todos los modulos contables.

Graphify consultado con presupuesto reducido. Serena intento activar el worktree,
pero fallo al iniciar servidor TypeScript; no se instalo una nueva dependencia.
El agente economico reviso pantallas y entrego hallazgos estaticos; Codex los contrasto.

## Metodo reproducible sin acceso a datos reales

Desde la raiz del repo, con TypeScript ya instalado:

```powershell
node docs/evidencias/49-sondas-contables.cjs
```

Esta ejecucion uso la instalacion existente, sin instalar paquetes:

```powershell
node docs/evidencias/49-sondas-contables.cjs C:/Users/Usuario/Desktop/app/app-AK/node_modules/typescript
```

El script extrae declaraciones reales con el parser TypeScript y las ejecuta en
un contexto aislado. Las dependencias de almacenamiento, autenticacion y avisos son
dobles de prueba. No se importa el servidor de la app, no se lee .env, no se escribe
en Firebase, no se envia correo, no se registra ningun pago y no se usa la red.
El uso de transpileModule es para ejecutar las sondas, NO un build de la app.

## Resultado observado: salida 1, siete aserciones fallidas

| Caso | Resultado observado | Resultado exigido |
| --- | --- | --- |
| CON-01a | savePlanDePagos devuelve success=true con saveFiesta=false | Error de guardado |
| CON-01b | updateCuotaEstado devuelve success=true y llama un aviso pese a saveFiesta=false | Error y cero avisos |
| CON-02a | El espejo devuelve success=true con updatePresupuesto=false | Propagar error |
| CON-02b | Pago de factura confirmado deja gemelo pendiente_confirmacion | Conciliacion coherente sin duplicar |
| CON-03 | Dos cobros 1000 y 2000 devuelven exito; persistido total 2000 | Persistido total 3000 |
| CON-04 | Cuatro fuentes caidas: success=true, seis meses en cero | Error o fuentes incompletas explicitas |
| CON-05 | Operador sin CONTABILIDAD provoca lectura de facturas | Rechazar antes de leer |

CON-03 ejecuta addPagoToPresupuesto, updatePresupuesto y AsyncMutex reales. La
normalizacion financiera y el almacenamiento son dobles; verifica perdida de lista
por snapshot obsoleto, no funcionamiento real de Firestore ni calculo de impuestos.
CON-05 verifica entrada de accion y politica real de perfiles, no ataque HTTP real.
CON-02b prueba el mismo monto/dia de un comprobante pendiente y su confirmacion de
factura; no declara confirmado un comprobante enviado por el cliente sin verificar.

La orden 49 explica correcciones y criterios. Las sondas estan deliberadamente
fallando sobre la base auditada. No cambiarlas para aceptar el fallo ni llamarlas
E2E. Gemini debe agregar pruebas convencionales con sus mocks y emulador, cubriendo
los mismos resultados y las rutas consumidoras antes de pedir aprobacion.

## Antecedentes que no se borran ni se vuelven a prometer

El registro anterior tiene una aprobacion general de cobros/permisos del 15 de agosto
y otra de deduplicacion del 25 de agosto. Se preservaron. Estos casos nuevos muestran
que esa evidencia no cubria guardados que devuelven false, confirmaciones de gemelos
pendientes ni lectura anterior al mutex. No se afirma que toda la correccion anterior
este mal. Las pruebas existentes de cuotas simulan saveFiesta siempre exitoso.

Se preservan: regla de regalos, control de pagos rechazados/pendientes, deduplicacion
de senas deliberada del dueno, restricciones de edicion de facturas cobradas, aviso
por plan incompleto y protecciones de division por cero. No se certifican de nuevo
por haberlas leido en el registro.

## Sin aprobar todavia

No hubo navegador autenticado, revision de los 19 eventos reales, cotejo de comprobantes,
prueba de emulador, sandbox de pagos, PDF, integracion completa ni compilacion. No hay
certificado final de contabilidad. El despliegue actual puede tener otros cambios:
comparar SHA y repetir solo lo afectado cuando Gemini implemente la orden.
