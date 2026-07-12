# Matriz de certificacion para publicacion

Este documento evita repetir auditorias y evita declarar como aprobado algo que no fue probado.

## Estados

- `APROBADO_LOCAL`: codigo revisado y pruebas locales aprobadas.
- `CORREGIDO_PENDIENTE`: correccion implementada en una PR separada; falta integrarla y probar el conjunto.
- `PENDIENTE`: todavia no se completo la revision o prueba indicada.
- `PRUEBA_REAL`: solo puede aprobarse con servicios, datos o dispositivos reales.

## Cobertura completada

| ID | Alcance | Estado | Evidencia |
| --- | --- | --- | --- |
| BASE-01 | Build base, TypeScript, Jest, Playwright y reglas Firestore | APROBADO_LOCAL | PR #746; 100 suites/844 pruebas, 10 E2E, 4 reglas y 262 paginas compiladas |
| AUTH-01 | Inicio de sesion, recuperacion Gmail y redireccion publica | APROBADO_LOCAL | PR #746; pruebas de autenticacion y resultado real del envio |
| MONEY-01 | Senas, pagos, facturas, flujo de caja, costos y rentabilidad por evento | APROBADO_LOCAL | PR #746; pruebas financieras focalizadas y suite completa |
| PLANNER-01 | Activacion y sincronizacion de modulos contratados | APROBADO_LOCAL | PR #746; pruebas del mapa de modulos |
| PUBLIC-01 | Simulador publico, portal cliente y muro social publico | APROBADO_LOCAL | PR #746; Playwright escritorio/movil y pruebas funcionales de portal |
| SECURITY-01 | Sesiones del portal, DTO publico, documentos privados, descargas y Google OAuth | CORREGIDO_PENDIENTE | PR #747; TypeScript, lint y 101 suites/858 pruebas |
| FLOW-01 | Enlaces inexistentes, creacion de evento, confirmaciones falsas de guardado y borrado de factura | CORREGIDO_PENDIENTE | Rama `audit/workflow-integrity`; pruebas de regresion focalizadas |

## Cobertura pendiente, sin declarar aprobada

| ID | Alcance | Estado | Condicion para aprobar |
| --- | --- | --- | --- |
| ENTERTAINMENT-01 | Permisos operador/invitado, PIN de kiosco, consentimiento IA, estaciones, captura remota y QR | PENDIENTE | PR separada, pruebas unitarias y recorridos E2E por estacion |
| PUBLIC-UX-01 | Web, promociones, conversion, cliente, invitado, invitacion, responsive, accesibilidad y rendimiento | PENDIENTE | Auditoria unica por ruta publica y pruebas PC/movil |
| INTERNAL-01 | Modulos internos restantes de empresa, planificacion y operacion no cubiertos arriba | PENDIENTE | Inventario Graphify, acciones verificadas y pruebas focalizadas |
| API-01 | Rutas API y acciones de servidor restantes no cubiertas por SECURITY-01 | PENDIENTE | Matriz de autenticacion publica/privada y pruebas 401/403 |
| COMBINED-01 | Conjunto final con todas las PR aplicadas | PENDIENTE | TypeScript, lint, Jest completo, reglas Firestore, Playwright y build limpio |
| PROD-01 | Firebase real, Gmail real, Instagram, datos del panel y recuperacion de clave | PRUEBA_REAL | Smoke test posterior al despliegue con credenciales reales |
| DEVICES-01 | Camaras, plataforma 360, espejo, Touchpix, impresion y operador | PRUEBA_REAL | Prueba con hardware real y checklist de operador |

## Regla de OK

No se emite `OK de publicacion` mientras exista un item `PENDIENTE`.

El `OK de produccion` requiere ademas que todos los items `PRUEBA_REAL` hayan sido ejecutados y documentados.
