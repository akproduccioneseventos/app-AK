# Indice corto de auditoria AK

Actualizado: 2026-09-14. Es un indice parcial, NO un certificado de toda la app.
Primero confirmar PR/HEAD actual. Ninguna fila vale automaticamente para otra version.

| Modulo | PR / SHA auditado | Resultado y evidencia | Pendiente |
| --- | --- | --- | --- |
| Decoracion | 1206 / 0f03c998cc36922f754d6e06e21e8c22ea47a796 | 2 FAIL, 2 PASS, propuesta no aprobada; [detalle](../evidencias/55-contraste-1206-opinion-y-guardado.md) | Claude: feedback/costos; Gemini: edicion durante guardado |
| Avisos | 1206 / 0f03c998cc36922f754d6e06e21e8c22ea47a796 | 3 FAIL, 2 PASS; [detalle](../evidencias/56-contraste-1206-avisos.md) | Defaults, destinatario/resultado, validacion |

## Validez

Sondas aisladas AST, sesion y almacenamiento simulados. No navegador, build ni Firebase real.
Cambios en simbolos, consumidores, entorno/configuracion/datos o integraciones invalidan
las conclusiones afectadas; no reusar una aprobacion de codigo como prueba del despliegue.
Otros modulos: buscar en YA-RESUELTO por tema. No estan declarados pendientes ni aprobados aqui.
No repetir pruebas de estas filas sin cambio o motivo; pasar el defecto ya reproducido al responsable.

## Consulta corta

1. Leer ESTADO-ACTUAL.md, confirmar HEAD y seleccionar la fila o buscar el tema en el historico.
2. Abrir solo la evidencia relevante. Consultar Graphify, diff y simbolos si falta contexto.
3. Responder con fallo/decision/nuevo resultado; enlazar pruebas, no copiar logs completos.
4. Actualizar una fila por modulo/tanda. Archivar detalles en evidencias; mantener este indice corto.

## Medicion sin inventar ahorro

Base observada: YA-RESUELTO tenia 532553 caracteres antes de esta ampliacion.
El indice evita su lectura completa rutinaria, no elimina la consulta historica dirigida.
En cada tarea anotar en el traspaso: documentos elegidos, pruebas reutilizadas/repetidas
y motivo. Tokens reales y ahorro porcentual: no medidos; no inferirlos del numero de agentes.
Fuente de instrucciones Codex: [AGENTS.md oficial](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
No instala herramientas ni cambia modelos, plan, facturacion o comportamiento de la app.
