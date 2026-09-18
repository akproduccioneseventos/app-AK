# Indice corto de auditoria AK

Actualizado: 2026-09-14. Es un indice parcial, NO un certificado de toda la app.
Primero confirmar PR/HEAD actual. Ninguna fila vale automaticamente para otra version.

| Modulo | PR / SHA auditado | Resultado y evidencia | Pendiente |
| --- | --- | --- | --- |
| Decoracion | 1206 / 0f03c998cc36922f754d6e06e21e8c22ea47a796 | 2 FAIL, 2 PASS, propuesta no aprobada; [detalle](../evidencias/55-contraste-1206-opinion-y-guardado.md) | Claude: feedback/costos; Gemini: edicion durante guardado |
| Avisos | 1206 / 0f03c998cc36922f754d6e06e21e8c22ea47a796 | 3 FAIL, 2 PASS; [detalle](../evidencias/56-contraste-1206-avisos.md) | Defaults, destinatario/resultado, validacion |

| Persistencia / arranque | 1207 / 29943cdd80ed7c14ceabc650544eb2aa304516a2 | 1 FAIL, 1 PASS; [orden58](../ordenes/58-guardar-sin-borrar-por-demora.md) | Claude: no escribir tras lectura incierta |

| Touchpix | 1202 / 6622427c604930b02910a2a2778bf20a72683f40 | 1 FAIL, 1 PASS aislados; [orden48](../ordenes/48-entretenimiento-recuerdos.md) | Gemini: callback de A no reinicia B |

| Redes / apertura | 1202 / 6622427c604930b02910a2a2778bf20a72683f40 | 2 FAIL, 1 PASS aislados; [orden47](../ordenes/47-marketing-redes.md) | Gemini: no afirmar apertura bloqueada; pruebas obligatorias |

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


## Actualizacion prioritaria 2026-09-16

Las filas anteriores son historicas. [Diagnostico conjunto](DIAGNOSTICO-CONJUNTO-2026-09-16.md) contiene contraste con main da6c566 y los cinco HEAD abiertos. STORE01: correccion presente en main, no nueva prueba Firebase. DECO15: correccion presente en 1206/4cd2d024, pendiente validacion. ENT03: 1209/f6b619a corrige reset tardio pero sonda real reproduce Subiendo persistente y cola alterada (1 PASS/1 FAIL). No certificado de toda la app; [inventario 360 paginas](INVENTARIO-PANTALLAS-2026-09-16.md) no implica recorridos ejecutados.


## Respaldos - 2026-09-16

Main da6c566: 3 fallos reproducidos / 4 controles correctos en sonda aislada. Copia parcial completa; borrar punto con sesion operador; UI anuncia restauracion parcial como completa. [Detalle y limites](RESPALDOS-2026-09-16.md). Ninguna de las cinco PR abiertas toca estos archivos. Responsable Claude; sin cambios de app ni pruebas destructivas reales.


## Actualizacion 17/9 - reportes y conexiones

PR1209 b4c6929 incorpora correcciones. [Contraste vigente](CONTRASTE-1209-2026-09-17.md): 1 PASS / 2 FAIL aislados (zona horaria reporte y consumidor TikTok). [Historia main](REPORTES-CONEXIONES-2026-09-16.md) no es orden de rehacer lo presente. Gmail distribuido/limite memoria YouTube pendientes de validar; sin certificacion integral.


## Respaldos revalidados 17/9

PR1209 b4c6929: 9 PASS / 1 FAIL aislados. Permisos y aviso parcial mejorados; BKP01 sigue abierto al incluir readData real (error -> default vacio -> copia completa). [Detalle](RESPALDOS-REVALIDACION-2026-09-17.md). Sin build ni Firebase real.


## Area nueva post-fiesta 17/9

Main da6c566: [encuestas/resenas](POSTFIESTA-2026-09-17.md), 2 PASS/3 FAIL aislados. PF01 rechazo bloquea formulario; PF02 concurrencia pierde respuesta; PF03 campos publicos no validados. No todo post-fiesta auditado, no pruebas reales externas.

- 2026-09-18: LOGISTICA-2026-09-18.md; PR1209 e43260f, 3 PASS/2 FAIL; disponibilidad por origenId y borrado de activo renombrado. Hallazgos abiertos, no modulo completo probado.

- 2026-09-18: RETORNOS-2026-09-18.md, e43260f, 2 PASS/2 FAIL: LOG03 cantidades remotas y LOG04 orden de respuestas. Retorno basico conserva autoria; no certifica modulo completo.

- 2026-09-18: INSUMOS-2026-09-18.md, PR1209 e43260f, 1 PASS/2 FAIL: ajuste masivo oculta propagacion fallida y escribe menus no vinculados. Responsable Claude; pendiente correccion.
