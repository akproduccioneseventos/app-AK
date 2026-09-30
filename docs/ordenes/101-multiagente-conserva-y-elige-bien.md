# 101 - No perder conversaciones ni completar otra tarea

Fecha: 2026-09-30. Codex audita, Claude corrige integridad de datos y compila.
Juntar con orden 100 en la tanda; no fusionar documentos por separado ni cambiar producto.
Hallazgos historicos 111/112 ahora reproducidos; no se cuentan otra vez como defectos nuevos.

## Base y contraste

Main 62dcb2cb4df718a81c3654028199e49628367d8c.
PR1246: 70b016ece91b8e82e7b2054061a8c8f2af072e19; base claude/revision-entrega-96-98.
Se compararon blobs remotos en ambos SHA y el snapshot local:
- chat-store.ts: 7ba60e87b6ab54878c4c39be410b982805e74557
- memory-store.ts: 8e0dcfc65555e4541ae2c7266d0044452a8bc3b0
- actions/multiagent.ts: 633082586a84c0be53412c8645fba673cb5345cc
- firebase-sync.ts: 4cf852cab7d9e89bb5515d3e1375a74ea5f1c8ed
Los cuatro coinciden. Clasificacion: sonda reproducida en main y codigo identico en tanda; no incidente observado en produccion.

## P1 - Dos escrituras pierden historial y aprendizaje

appendMultiAgentChatTurn lee todo multiagent/chats.json, agrega una sesion y vuelve a escribir todo.
saveAgentLearning hace lo mismo con multiagent/memory.json y profiles.
Dos llamadas que leen el mismo estado inicial responden bien, pero la ultima pisa a la otra.
Sonda con dos fiestas ficticias distintas: chat returned=2/persisted=1; memoria returned=2/persisted=1.
No es efecto del limite de 160 sesiones/120 aprendizajes: se parte de cero y hay solo dos.
firebase-sync.ts:378-400 guarda documento con set merge:true, que no combina elementos de arrays sessions/profiles.
Consumidor: actions/multiagent.ts:290 y 313/326; ruta api/multiagent/message/route.ts:55-56; widget llama en 597.
Usar mutacion atomica compatible con varios servidores, no solo mutex de proceso; conservar scopes y limites.
Aceptacion: dos sesiones distintas, dos turnos de una misma sesion, aprendizajes de mismo/distinto perfil, fallo de guardado sin exito ficticio. Demostrar ambos aportes despues de releer.

## P2 - Un texto parcial puede ignorar el ID exacto de tarea

actions/multiagent.ts:145-160 combina coincideId OR coincideTexto y se queda con el primer match.
Fixture:
1 salon: Confirmar proveedor del salon
2 comida: Confirmar proveedor de comida
Con tareaId=comida y texto=Confirmar proveedor, completa salon y anuncia exito.
Con solo ese texto ambiguo tambien completa salon sin pedir precision.
Esto NO reabre el caso de tarea sin ID ni texto (ya resuelto); es otro caso de seleccion.
Dar prioridad al ID exacto. Si hay ID invalido, no sustituirlo silenciosamente por texto.
Si solo hay texto y varias candidatas, pedir aclaracion sin escribir; una coincidencia unica conserva flujo acordado.
No inventar destino ni tocar datos reales para probarlo.

## Reproduccion y limites

Sonda: docs/evidencias/sonda-multiagente-2026-09-30.cjs.
Ejecutar node ruta/a/la/sonda.cjs ruta/al/checkout-exacto.
Transpila funciones reales; dependencias de modelo, autenticacion y persistencia simuladas; cero red.
Imprime resultados y escribe multiagent-62dcb2c-result.json junto a la sonda.
El campo sha describe esta revision original: al reusar sobre otro checkout registrar su SHA aparte.
La sonda no sustituye E2E, Firestore ni prueba de despliegue.
Las suites existentes el-secretario-hace-tres-cosas-mas.test.ts y multiagent-chat-scope.test.ts pasaron 7 pruebas; no cubren estos casos.
No codigo de producto modificado por Codex.

## Verificacion que debe agregar Claude

Pruebas propuestas, NO existentes ni ejecutadas en esta auditoria. Agregar comportamiento, no busquedas de cadenas.
Registrar SHA y resultados en YA-RESUELTO. Compilar el conjunto; validar una sola vez sobre candidato congelado.
Si la tanda cambia, contrastar antes de aplicar para no repetir una correccion.

```comprobar
archivo: src/lib/multiagent/chat-store.ts
usa: appendMultiAgentChatTurn en src/app/actions/multiagent.ts
archivo: src/lib/multiagent/memory-store.ts
usa: saveAgentLearning en src/app/actions/multiagent.ts
archivo: src/app/actions/multiagent.ts
usa: sendPersistentMultiAgentMessage en src/app/api/multiagent/message/route.ts
prueba: src/__tests__/multiagent-concurrent-persistence.test.ts (PROPUESTA PENDIENTE)
prueba: src/__tests__/multiagent-task-identity.test.ts (PROPUESTA PENDIENTE)
```
