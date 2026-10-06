# Auditoria 70 - simuladores y contabilidad

Area: plata y simuladores (alcance pedido por el dueno).
Commit: `6a2143ffe6c257ca94e9761dd7cfacfafafe8e35`, main/PR1257, 6/10/2026.
Hallazgos: **seis reproducidos; cierre NO aprobado**. Orden 120 para Claude.
No se programo app, compilo ni fusiono. No se tocaron datos productivos.

| Caso | Prioridad | Resultado |
| --- | --- | --- |
| COB10 | P1 | Personal sin contabilidad agrega pago confirmado y lo borra |
| GAS01 | P1 | Personal lee, crea y borra gastos |
| GAS02 | P1 | Misma operacion simultanea: dos registros y doble monto |
| GAS03 | P2 | NaN e Infinity aceptados hasta persistencia |
| PLAN01 | P1 | Plan viejo revierte un pago de 1000 a pendiente |
| LEDGER01 | P1 | Ajuste contractual: resumen saldo 15000, libro saldo 0 |

Rutas, consumidores, reproduccion y aceptacion: orden 120. Sondas sobre codigo
real con persistencia en memoria. GAS01/COB10 usan politica real de perfiles y
sesion sintetica; no prueban explotacion HTTP ni Firestore real. PLAN01 prueba
la accion con guardado sintetico; `saveFiesta` real escribe el plan recibido,
pero no se ejecuto la carrera integrada. No son los arreglos 118/119 repetidos.

## Evidencia

- 599 suites / 3445 pruebas / 0 fallos / 0 omitidas, 248,206 segundos.
- Comando, SHA256, commit y conteos: `70-resultados/manifest.json`.
- Original completo: `70-resultados/jest.json.gz`.
- Sonda ejecutable `70-sondas-contables.cjs`; salida `70-resultados/sondas.json`.
- Error propio de seleccion: `money` coincidio con ruta absoluta del worktree
  y ejecuto toda la bateria. No se repitio. Usar `--runTestsByPath` en adelante.
- Ayudante acotado reviso simuladores, cerrado al acabar. Sus 18 pruebas estan
  incluidas en las 3445, no se suman. Sin hallazgos adicionales confirmados.

## Matriz de alcance

| Bloque | Comprobado | Limite |
| --- | --- | --- |
| Precios, descuentos, regalos, invitados, ajuste | Suites pricing/financial-guardrails/formal-budget/payment-plan | Catalogo productivo no conciliado |
| Paquetes y extras | Suites package-customization/public-simulator-package-flow y lectura | Sin recorrido visual nuevo |
| Simulador IA | simulador-copilot/asistente-presupuesto-catalogo | Sin Gemini real |
| Presupuesto/CRM | simulator-budget-pdf-flow/public-simulator-identity-boundary | Local/mocks, no Firebase |
| PDF largo | Generador real, 52 servicios, cuatro paginas A4 renderizadas y vistas | Sin descarga navegador/logo remoto |
| Cobros/facturas | Regresiones aprobadas; COB10 nuevo | Sin HTTP por perfil ni cobros reales |
| Cuotas | Regresiones aprobadas; PLAN01 nuevo | Falta retest integrado |
| Gastos | Lectura y sondas GAS01/02/03 | Persistencia sintetica |
| Panel/libro | LEDGER01 contradiccion numerica | Sin conciliacion de saldos reales |
| Costos/rentabilidad/sueldos | Suites motor-de-costos/comision MP/recibos y lectura puntual | Sin comprobantes reales |
| Mercado Pago | Suites core/deposit; revision firma/moneda/monto/reversos | Sin checkout/webhook del proveedor |
| 19 importados | NO comprobados con datos del negocio | Fixture vacia no demuestra faltantes |

## PDF visual

`70-pdf-y-resultados.cjs` usa el generador real con datos ficticios; NO cotizacion
comercial. 52 servicios a 1000, cuatro regalos: 48000 vigente, 480/persona,
55200 proyectado 2027. Se vieron los cuatro PNG conservados: numeracion 1 a 4,
sin recortes/superposiciones visibles. Pagina 4 con condiciones/enlace y espacio
libre: oportunidad de mejorar aprovechamiento, no error contable.
Poppler aviso fuentes opcionales ausentes pero produjo las cuatro imagenes.
No confundir muestra correcta con descarga funcionando o menus reales correctos.

## Falta para cierre integral

1. Corregir orden 120 y repetir casos sobre SHA exacto.
2. Orden 114, entorno estable: telefono solo y varios presupuestos por prospecto;
   paquete/menu, guardado, compartir/descargar y cotejar PDF/CRM en PC y movil.
3. Fotos/textos del catalogo real contra material aprobado.
4. Conciliacion individual de los 19 importados: fechas, fiesta/factura, pagos
   confirmados/pendientes/rechazados, saldo y recibos.
5. Permisos HTTP, concurrencia con base/emulador, Mercado Pago sandbox y avisos,
   sin dinero productivo.

No hubo herramienta de navegador disponible en esta sesion ni se levanto otra
copia Next dev inestable. Claude conserva compilacion. GitHub billing no se
considero error de app. No aprobar publicar con estos seis casos pendientes.
