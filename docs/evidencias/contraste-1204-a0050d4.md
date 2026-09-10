# Contraste de ordenes 51, 52 y 54 contra la tanda abierta

> HISTORICO: #1204 ya fue fusionada. Estado posterior:
> [contraste1205](contraste-1205-1b65b7c.md). No enviar estos pendientes sin comparar.

Fecha: 2026-09-09. Codex. No es una auditoria completa ni aprobacion de PR.
PR: #1204, rama `feat/ordenes-47-48-49-pendientes`.
Codigo probado: `a0050d40181dbaf8f0e54ffa3f2d8ce191b7185d`.
Comparacion historica: main `8c5eb6e173e7b7b8dce6a8811cade7cf38411dfe`.
Se consultaron registro compartido y diff de la entrega antes de repetir las sondas.
No extrapolar estos resultados a commits posteriores ni a otras PR.

## Resultado

19 comprobaciones: 7 PASS, 12 FAIL. Seis FAIL historicos ahora pasan; el septimo
PASS conserva la eliminacion de la clave de acceso. No son 12 modulos nuevos.

| Orden | Ya pasa: conservar, no reimplementar | Sigue fallando en sonda |
| --- | --- | --- |
| 51 | PLAN-01 guardado de tareas, PLAN-04 borrado moodboard, PLAN-06 error de costos | PLAN-02 tarea borrada por guardado posterior de compras; PLAN-03 escrituras simultaneas de tareas/menu; PLAN-05 ultima decoracion no vacia sus costos |
| 52 | DECO-03 error al guardar imagen generada | DECO-01 foto de referencia ignorada; 02 paleta editada ignorada; 04 cupo concurrente; 05 arco renderizado como mesa; 06 rotacion de barra; 07 escala al importar salon; 08 falso exito del autoguardado |
| 54 | PORTAL-01a error de guardado llega al cliente, 01b no notifica un guardado fallido; PRESERVE clave filtrada | PORTAL-02a proyeccion envia itinerario privado; 02b vista activa lo incluye |

La afirmacion de cuatro arreglos de orden51 queda contrastada parcialmente: tres
casos pasan y tres fallan en este SHA. No afirmar un cuarto sin identificarlo.

## Alcance real de la evidencia

- Funciones/componentes extraidos del codigo objetivo por AST; no copias antiguas
  ejecutadas contra main. Las tres sondas terminaron con salida 1 por assertions,
  sin errores de carga, rutas inexistentes o simbolos ausentes en lo ejecutado.
- Persistencia, sesion, generador de IA y React se simulan. PLAN-02/03 reproducen
  sobrescrituras de snapshots con almacenamiento en memoria. El diff confirma que
  `saveFiesta` no cambio entre main y esta PR (solo cambia `archiveFiesta` en ese
  archivo). Falta comprobar transacciones y concurrencia con Firebase real/emulado.
- DECO-01/02/04 prueban acciones de IA, no un flujo visual ya conectado: no confirman
  gasto real ni que el usuario pueda invocarlas desde la pantalla actual.
- 3D: se comprueban elementos, propiedades y escala; no render GPU, hardware ni
  capturas visuales. Los archivos extraidos existen; no queda identificado por eso
  cual era exactamente la ruta historica objetada por Claude.
- Portal: se comprueba la proyeccion y `PublicPortalClientExperience`, consumidor
  activo de `/portal/c/[accessKey]`; no usar `PublicPortalView` antiguo como evidencia.
- Sin build, E2E autenticado, despliegue, cambios de datos reales ni prueba de login.
  No se reviso nuevamente contabilidad/ventas: este contraste cubre solo 51/52/54.

## Trabajo que corresponde

1. No rehacer los seis casos que ahora pasan. Conservar sus comprobaciones.
2. Claude: PLAN-02/03/05 (comida, guardado compartido y costos), PORTAL-02
   (privacidad). Revisar primero el HEAD mas reciente antes de implementar.
3. Gemini: pendientes de decoracion/3D, con Claude revisando cupos y persistencia
   sensible. Antes de conectar IA, corregir sus limites y contrato de referencia.
4. No cambiar que se muestra comercialmente sin decision del dueno. Ninguna nueva
   funcion ni cambio visual se aprueba por este documento.
5. Integrar evidencia con la misma tanda de codigo. Claude compila y registra SHA;
   Codex revisa evidencia. No crear/fusionar una PR documental independiente.

## Repeticion acotada

Desde el checkout que contiene las sondas, con un checkout objetivo limpio:

```powershell
node docs/evidencias/contrastar-sondas.cjs C:/Users/Usuario/Documents/Codex/ak-contraste-1204-a0050d4 C:/Users/Usuario/Desktop/app/app-AK/node_modules/typescript
```

El ejecutor informa SHA objetivo, hash de cada sonda y cada resultado. Es herramienta
de auditoria, no dependencia de produccion. Un FAIL puede indicar un cambio del
contrato de la sonda: inspeccionar el motivo antes de atribuirlo a la app.
