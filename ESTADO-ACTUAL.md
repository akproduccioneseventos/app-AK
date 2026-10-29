# Estado actual — 29 de octubre de 2026

## Orden 255 en curso en la propuesta 1375
- Base revisada: `31f01384f7bc832ed004cfb2e60246a1074a8015`, rama `gemini/orden-255-asistente-ak`.
- `origin/main` está en `5c22efad3e1f16075bf1689caa6c7ca41099763a`; no se hizo pull, rebase ni merge. El HEAD local sigue en la base indicada.
- Cambios locales sin commit: entrada de audio/foto validada, comprobantes como propuestas, reserva atómica de consumo para medios, plan de reunión sin contactar clientes, anticipador de mozos, vigilancia nocturna y bloqueo de tareas que contacten clientes sin aprobación.
- La voz saliente sigue pendiente: no hay encoder compatible; cuando está habilitada, se informa por texto y no se intenta enviar WAV.
- Verificación focalizada conjunta: 5 suites, 36 pruebas aprobadas; ESLint puntual aprobado. Sin typecheck, build ni Firebase real.
- Pendientes: caso 7 (borrador comercial, fotos con permiso promocional verificable y presupuesto sin cambio de estado); caso 10 (informe posfiesta con datos reales y consumidor de producción); alerta de cuotas, que corresponde al equipo de Claude. `el-asistente-de-ak.test.ts` todavía no reúne los 11 casos en ese único archivo; los casos 7 y 10 tampoco están cubiertos.
- No se integró `origin/main`, no hay commit ni push. La Orden 255 sigue incompleta y no está publicada.

Rama de trabajo: `claude/app-debug-stabilize-m70e6z`. Versión publicada: la propuesta de hoy (decoraciones de Codex 1372 y voz del cliente rescatada de la 1368), sobre la 1369.

## Publicado hoy
- Decoraciones AK: 86 elementos y borradores de plantillas desde fotos del catálogo (Codex 1372). Permiso arreglado para que lo vea el control de puertas abiertas.
- Voz del cliente en su portal (orden 238), rescatada de la 1368; su parte de la 239 se descartó (main ya la tenía).
- Cerradas 1329, 1337 y 1344: su contenido ya estaba publicado.

## Para Gemini
- **1370** (órdenes 247 y 249) devuelta: orden 252 (6 fallos de Codex) y la **orden 251 entera**, en la misma propuesta.
- **1371** (orden 250, foto del salón) devuelta: orden 253 (la foto llega como texto, errores invisibles, genera sin captura, cupo entre servidores).
- **Órdenes 242 a 246 y 248** (una sola propuesta): todavía sin entregar.
- **Orden 254**: plantillas de decoración que se publican solas y objetos nuevos a la biblioteca. Arranca después de esta publicación.

## Codex
- Numera órdenes que ya existen (pasó con 241, 242, 250 y 251): que mire el último número antes.

## Para el dueño (abogado)
- Revisión legal del contrato de Codex (retracto en venta a distancia, Ley 20.531 desde 1/1/2027, penalidades, imagen de invitados, firma, comprobantes): `docs/evidencias/738-legal-contratos-dictamen.md` en la rama de Codex. No se cambia nada sin abogado.

## Errores de plata y permisos abiertos
- Los de las órdenes 247, 249, 251 y 252 (encontrados 27/10), en la app publicada hasta que Gemini corrija la 1370.
