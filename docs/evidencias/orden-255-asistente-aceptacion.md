# Orden 255: entrega para verificar y publicar

PR 1375, rama `gemini/orden-255-asistente-ak`. Base de Claude
`dcdac4ee3c4bc469876fede37aac60a489a61603`. Codigo entregado
`790cf920941e64de5c3683d701284157bb21c8d7`; el siguiente commit solo agrega
esta evidencia y limpia una linea vacia final. No fusionada ni publicada.

## Matriz

Los once casos ejecutan codigo productivo con limites externos simulados en
`src/__tests__/el-asistente-de-ak.test.ts` (22 comprobaciones).

| Caso | Resultado verificado |
| --- | --- |
| 1 | Contexto de secretaria sin importes; dueno con permiso los recibe. |
| 2 | Recordar, consultar y olvidar en flujo WhatsApp, aislando memorias. |
| 3 | Dos pasadas producen una entrega/fallback, sin marcar WhatsApp enviado en fallback. |
| 4 | Audio transcrito atendido; fallo pide texto; voz y fallback seguro. |
| 5 | Boleta crea propuesta, no gasto. |
| 6 | Reunion crea una tarjeta de tres pasos, sin mensaje al cliente. |
| 7 | Presupuesto en borrador y tres fotos autorizadas; excluye revocadas; bandeja sin envio. |
| 8 | 150 invitados con tres mozos de seis requeridos produce alerta. |
| 9 | Atraso detectado; consumidor del cron deduplica propuestas por hora. |
| 10 | Cierre concurrente/repetido guarda un informe estable. |
| 11 | Servidor rechaza tareas de contacto al cliente en modo sola. |

Regresion conjunta: 22 suites, 131 pruebas, todas aprobadas. Incluye voz real
WAV/MP3 decodificable, cuota compartida, Meta simulado, consentimiento y
revocacion, simulador publico sin cambio de estado predeterminado, rechazo de
precio cero antes de escribir, cuotas reconciliadas y candado de la plata.
Tambien prueba reintento transaccional del resumen y webhook sin envio autonomo.

## Controles

- `node --max-old-space-size=4096 node_modules/typescript/bin/tsc --noEmit`: exit 0.
- Jest focalizado conjunto: 22 suites/131 PASS.
- ESLint de archivos modificados y nuevos: exit 0.
- `npm run check:acentos`: exit 0, 3471 archivos.
- Revision de limites aplicables de `docs/ANTES-DE-ENTREGAR.md` realizada.
- Datos generados localmente por pruebas excluidos de la entrega.
- `npm run graphify:update`: exit 0, extraccion incremental y agrupacion completas; HTML omitido por tamano del grafo.

El primer `npx tsc --noEmit` agoto el heap de 2 GB. Con 4 GB detecto una
comparacion imposible en fotos, corregida antes del resultado aprobado.

## Limites Operativos

No se ejecutaron build, bateria completa ni E2E de navegador; Claude conserva
esa verificacion y la publicacion. No se enviaron mensajes reales ni se probaron
credenciales Meta/Gemini/Firebase. Firebase, IA y envios se simulan en pruebas;
el codificador/decodificador de MP3 es real, dependencia MIT sin binarios.

Sin paquete/precios configurados se prepara revision humana, nunca un monto
inventado. Si existen menos de tres fotos autorizadas, se usan solo las validas
y queda una propuesta para completar la seleccion. Las autorizaciones nuevas
deben registrarse expresamente; no se deducen de un consentimiento comercial.

El informe muestra no disponible cuando no existen datos confirmados de
catering o fotos promocionales. No inventa sobrantes ni modifica compras,
pagos, presupuesto firmado, personal o inventario. Las alertas conservan el
horario de descanso y las decisiones del dueno.
