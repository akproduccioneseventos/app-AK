# Matriz de certificacion para publicacion

Este documento evita repetir auditorias y evita declarar como aprobado algo que no fue probado.

## Estados

- `APROBADO_LOCAL`: codigo revisado y pruebas locales aprobadas.
- `CORREGIDO_PENDIENTE`: correccion implementada en una PR separada; falta integrarla y probar el conjunto.
- `VALIDACION_PARCIAL`: correccion integrada y probada, pero falta un recorrido especializado o real.
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
| SECURITY-01 | Sesiones del portal, DTO publico, documentos privados, descargas y Google OAuth | APROBADO_LOCAL | PR #747 integrada; rutas protegidas dinamicas, TypeScript, seguridad y build conjunto aprobados |
| FLOW-01 | Enlaces inexistentes, creacion de evento, confirmaciones falsas de guardado y borrado de factura | APROBADO_LOCAL | PR #748 integrada; pruebas de regresion y suite conjunta aprobadas |
| API-01 | Clasificacion completa de rutas API y firmas de webhooks Meta/Twilio | APROBADO_LOCAL | PR #747; todas las rutas clasificadas, Twilio form-urlencoded y HMAC Meta/Twilio probados |
| COMBINED-01 | PR #747, #748, #749 y #750 aplicadas sobre la base #746 | APROBADO_LOCAL | 899 pruebas Jest, 4 reglas Firestore, 10 Playwright PC/movil, TypeScript, lint sin errores y build 259/259 paginas estaticas |

## Cobertura pendiente, sin declarar aprobada

| ID | Alcance | Estado | Condicion para aprobar |
| --- | --- | --- | --- |
| ENTERTAINMENT-01 | Permisos operador/invitado, PIN de kiosco, consentimiento IA, estaciones, captura remota y QR | VALIDACION_PARCIAL | PR #749 integrada, pruebas unitarias y build aprobados; faltan recorridos con camaras y dispositivos reales |
| PUBLIC-UX-01 | Web, promociones, conversion, cliente, invitado, invitacion, responsive, accesibilidad y rendimiento | VALIDACION_PARCIAL | PR #750 corrige WhatsApp y promociones; Playwright PC/movil aprobado; faltan accesibilidad y rendimiento por ruta |
| INTERNAL-01 | Modulos internos restantes de empresa, planificacion y operacion no cubiertos arriba | PENDIENTE | Inventario Graphify, acciones verificadas y pruebas focalizadas |
| PROD-01 | Firebase real, Gmail real, Instagram, datos del panel y recuperacion de clave | PRUEBA_REAL | Smoke test posterior al despliegue con credenciales reales |
| DEVICES-01 | Camaras, plataforma 360, espejo, Touchpix, impresion y operador | PRUEBA_REAL | Prueba con hardware real y checklist de operador |

## Regla de OK

No se emite `OK de publicacion` mientras exista un item `PENDIENTE`.

El `OK de produccion` requiere ademas que todos los items `PRUEBA_REAL` hayan sido ejecutados y documentados.
