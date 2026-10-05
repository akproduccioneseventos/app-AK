# Revision independiente de la auditoria de Sol

Fecha: 5/10/2026. Codigo: `212ba37da9c7540fd044b9de6e0edfe448ddfbe5`.
Documentacion revisada: informes 66/67 y orden 116 en `ba5b90aa`.
GitHub main sigue en ese SHA de codigo y no habia PR abierta. No se conoce trabajo local
no subido de otras IA. `git diff 212ba37 HEAD -- src scripts package.json package-lock.json`
no mostro cambios versionados. Los JSON locales ajenos no se modificaron; las sondas simulan IO.

## Dictamen

La auditoria sirve para corregir defectos concretos y justifica no aprobar la publicacion.
No cumple todavia la revision completa de toda la app solicitada. Sol lo declaro como
parcial en sus informes y en el cierre; no emitio certificado de cero errores.
Esta revision tampoco certifica toda la app ni confirma independientemente las trece
observaciones de codigo. Contrasta las cinco sondas, una muestra de fronteras de permisos,
el menu publico y la descripcion de voz, ademas de la trazabilidad del informe.

## Deficiencias de la auditoria, por importancia

1. **P1 - Cobertura incompleta para el objetivo de publicacion.** El informe 67 admite
   recorridos internos, embudo/PDF/CRM y varios escenarios sin verificar. El E2E del invitado
   quedo inconcluso. La suite general no permite asegurar cada modulo/boton/rol. Falta una
   matriz de casos por recorrido con SHA, resultado, evidencia y motivo del bloqueo. El
   contador 0/14 significa cero areas certificadas, no cero trabajo realizado ni 14 areas rotas.
2. **P2 - Justificacion incorrecta del hallazgo de menus.** En el test de puertas abiertas,
   la frase sobre ocultar costo/margen/proveedor corresponde a servicios de empresa. Menus
   excluye receta/margen. El codigo conserva el costo intencionalmente y el simulador lo usa.
   Corregido el informe 66: la exposicion existe, pero su tratamiento requiere preservar el
   calculo y contrastar la politica; quitar el campo sin mas puede provocar una regresion.
3. **P2 - Evidencia general insuficientemente transportable.** Los informes 66/67 anotan
   589 suites/3.383 pruebas, pero no enlazan la salida completa, comando exacto y manifiesto
   de ejecucion asociado a ese SHA. No se repitio la suite por costo y porque no cambio el
   codigo. Es un resultado registrado previamente, no revalidado en esta revision. Adjuntar
   la salida original si se conserva; una nueva corrida queda para la verificacion final
   de Claude. Esto no implica que se hayan inventado los resultados.
4. **P3 - Descripcion exagerada de GET.** El reproductor usa `fetch`; no agrega por si solo
   texto al historial de navegacion. El texto si viaja en URL y podria quedar en registros
   de solicitudes. Corregido el informe 66. POST ya existe: no pedir implementarlo de nuevo.

Referencias: `src/__tests__/auditoria-puertas-abiertas.test.ts:79-83`,
`src/app/actions/menus-catering.ts:176-186`, `src/app/simulador-ak/page.tsx:92`,
`src/lib/asistente/reproductor-voz.ts:74`, `src/app/api/asistente/voz-parte/route.ts:63`.

## Cinco hallazgos reproducidos nuevamente

Se leyeron las tres sondas antes de ejecutarlas. Compilan las funciones TS para una VM,
con datos sinteticos; no cargan las credenciales ni llaman a servicios reales.
Los tres procesos salieron con codigo 0, que significa que reprodujeron el defecto.

| Comando ejecutado | Resultado observado |
| --- | --- |
| `node docs/evidencias/66-sonda-social-colision.cjs` | Cuatro casos: canciones/dedicatorias en misma fiesta y fiestas distintas. En cada uno: `acknowledged:2`, `persisted:1`, IDs identicos. |
| `node docs/evidencias/66-sonda-tareas-automaticas.cjs` | Dos instancias: `acquired:[true,true]`; liberacion del dueno anterior: `thirdAcquired:true`; cuatro servicios fallidos: `reportedFailures:[]`, metricas y recordatorios marcados completos. |
| `node docs/evidencias/66-sonda-acceso-personal.cjs` | Token vencido: control rechaza, portal devuelve datos y dos mutaciones aceptan. NaN/Infinity: `arrivalAccepted:true`, `distanceIsNaN:true`, `checkInSaved:true`. |

Tambien se siguio la lectura real de fiesta y el modo `publicRsvp` del portal para comprobar
que el mock no estaba sustituyendo un control de vigencia posterior. No se encontro tal control.
La politica de perfiles confirma que sesion y permiso son conceptos distintos; los hallazgos
de acceso necesitan aun probar accion/rol/evento y preservar al operador autorizado.

## Aciertos que se conservan

- SHA exacto y contraste con main; aviso de tanda no subida desconocida.
- Fallos y concurrencia con sondas ejecutables, no solo buscar nombres en archivos.
- Servicios simulados, limites de las pruebas y recorrido parcial declarados.
- Separacion de propuestas visuales y defectos; no inventar una aprobacion de las 14 areas.
- El modelo `gemini-3.8-flash-tts` si figura en la documentacion oficial consultada hoy:
  https://ai.google.dev/gemini-api/docs/models . No reportar modelo inexistente. Que exista
  no prueba disponibilidad, costo o funcionamiento con las credenciales de esta app.

## Lo que falta de la parte virtual

- Completar los recorridos internos por rol con fixtures aisladas: cliente, invitado,
  organizador, personal y operador; registrar envio, guardado y lectura desde el otro rol.
- Terminar simulador comun/IA, paquetes/extras/precios, presupuesto multipagina y CRM.
- Probar capturas, timeout/reintento, entrega y video con audio real de navegador; barra
  con ingredientes insuficientes y fallos de persistencia en un entorno aislado.
- Comprobar las observaciones restantes de codigo con escenarios concretos y registrar
  las excepciones de negocio. No tratar una sesion generica como prueba de acceso por rol.
- Asociar a las 19 importaciones una conciliacion de origen/destino y cantidades/importes,
  sin modificar datos reales; cerrar las diferencias verificadas y no suponer que existen.
- Recibir las correcciones, revisar su SHA y conservar los resultados vigentes del resto.

Los ensayos externos/fisicos siguen la fase final que decidio el dueno. No desplazan el
trabajo virtual pendiente ni se convierten en nuevas funcionalidades. No hubo codigo de
app, build, fusion ni envio de mensajes a otras IA en esta revision.
