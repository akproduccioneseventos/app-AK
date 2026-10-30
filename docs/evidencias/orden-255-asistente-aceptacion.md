# Ordenes 255 y 256: evidencia de la PR 1375

Rama `gemini/orden-255-asistente-ak`, continuacion desde
`5035fedc71d5e87bbb12c4f424a29cebba8cc2cb`, conserva la correccion de Claude
`dcdac4ee3c4bc469876fede37aac60a489a61603` y main
`5c22efad3e1f16075bf1689caa6c7ca41099763a`.
Devolucion 256 contrastada con `claude/app-debug-stabilize-m70e6z` en
`b424ef47225a0a24a54a289d9ab5101c619b4f1c` (30/10/2026).
No fusionada ni publicada. Validacion final de esta continuacion pendiente.

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
| 6 | Reunion, semana y seguimiento crean planes con registros reales. Aprobar confirma un borrador, sin enviar ni reservar agenda. |
| 7 | Presupuesto en borrador y tres fotos autorizadas; excluye revocadas; bandeja sin envio. |
| 8 | 150 invitados con tres mozos de seis requeridos produce alerta. |
| 9 | Atraso detectado; consumidor del cron deduplica propuestas por hora. |
| 10 | Cierre concurrente/repetido guarda un informe estable. |
| 11 | Servidor rechaza tareas de contacto al cliente en modo sola. |

La matriz usa codigo productivo con proveedores simulados; no certifica credenciales reales.
Casos 6 y 11: al retirar temporalmente sus guardas, sus pruebas fallaron; despues
se restauraron las protecciones. La charla automatica autorizada de anuncios
es una decision previa del dueno y se conserva; presupuesto/fotos no se envian solos.

## Devolucion 256

- Audio: se retira `audiobox`; se utiliza `@breezystack/lamejs@1.2.7`, version
  exacta autorizada por la orden. El parser propio valida RIFF/fmt/data y PCM16.
  La conversion se prueba con el codificador real, no un mock.
- Anuncios: `processIncomingMessage` vuelve despues de `correspondeContestarSolo`.
  Meta conserva su envio habitual, Twilio su TwiML escapado. El presupuesto/fotos
  completo queda en bandeja. Sin origen publicitario no se llama a ninguno.
- Previsor: `ejecutarAgenteManual` llama al mismo `ejecutarAnticipador` del motor.
- Contrato: carga independiente del permiso de fotos, fallo visible y reintento;
  ni se concede consentimiento ni se oculta el contrato ante una consulta fallida.
- Las pruebas historicas `solo-contesta-a-los-de-la-publicidad` e `ia-86-agentes-publicidad-e-intervalo`
  permanecen sin modificaciones respecto a `5035fedc7`.
- Focalizado de anuncios/Previsor/contrato: 4 suites, 20 pruebas PASS.

## Continuacion 255

- Planes validan evento/contacto y agenda interna real; aprobacion idempotente
  confirma el guardado antes de resolver la propuesta. Google no conectado no
  se presenta como agenda comprobada.
- Resumen identifica las acciones realmente entregadas al mismo telefono/dia.
  "Despues" prioriza pendientes actuales, sin resucitar tareas resueltas.
- Avisos operativos solo al dueno o coordinador asignado y autorizado, sin plata
  ni invitados, con descanso y deduplicacion por tema/hora/destino.
- Hechos observados posfiesta tienen procedencia y permisos; compras/personal
  muestran referencias, no aplican cambios automaticamente.
- Aprendizaje usa rasgos de tono, no copia datos de otro cliente. Redes prepara
  una publicacion y un guion; no crea ni afirma generar un video.
- Consentimiento se revalida al seleccionar, editar y publicar fotos.
- Reintento del borrador comercial recupera el presupuesto realmente guardado
  y no sobrescribe revision humana; sin transaccion remota no usa una salida insegura.

## Navegador

`tests/e2e/orden-255-observaciones-posfiesta.spec.ts`: **2 PASS** (PC y Pixel7).
Recorrido real: guardar sobrante 0.5 kg, recargar, entrar a otra fiesta, leer su
referencia y comprobar que compras/personal no cambiaron. Datos sinteticos
locales, cookie firmada, sin `NEXT_PUBLIC_E2E`. Capturas PC/movil en `test-results/`.
El test limpia unicamente sus propios IDs.

Antes hubo bloqueos al abrir en PC con next dev; no se borran ni se atribuyen
a una causa demostrada. Una sonda observo un error JS de sintaxis en una apertura;
otra apertura pudo hidratar. La corrida aprobada uso el mismo servidor ya iniciado.
No certifica arranque en frio ni build productivo. Con claves dummy se observo
ademas un error Firebase Installations; no se presenta como conexion real aprobada.

## Controles Generales

La puerta rapida anterior a la devolucion 256 dio exit 0: tipos, Jest completo
y seguridad Firestore/Storage. No equivale a validacion del audio/webhook nuevos.
Se repetiran los controles sobre el codigo final y se registraran aqui sus salidas.
No se agregan archivos de `data/`, `src/data/` ni herramientas locales al producto.

Durante el cierre se reprodujo una falla del propio control en Windows: Git
recibia comillas simples literales, fallaba y las tres consultas vacias producian
siempre `c65f37b2cb1ae26c89e9b4f26e2ca9e9cde4ae5b`. Esa cache NO es evidencia del
codigo nuevo. Se corrigen huella y estado sucio con argumentos estructurados,
sin shell, y fallo cerrado ante error Git. Prueba con repositorios temporales
reales: cambia por codigo guardado o sin guardar, no por datos/documentos excluidos.
Al retirar la guarda de error, la prueba fallo; la guarda quedo restaurada.
La puerta final se ejecutara desde cero con `AK_PUERTA_DESDE_CERO=true`.

## Limites Operativos

Claude conserva build, verificacion completa de lanzamiento y publicacion.
No se enviaron mensajes reales por Meta ni se verificaron credenciales de sus
proveedores. El E2E usa datos sinteticos; las pruebas de envio simulan la red.

Sin paquete/precios configurados se prepara revision humana, nunca un monto
inventado. Si existen menos de tres fotos autorizadas, se usan solo las validas
y queda una propuesta para completar la seleccion. Las autorizaciones nuevas
deben registrarse expresamente; no se deducen de un consentimiento comercial.

El informe muestra no disponible cuando no existen datos confirmados de
catering o fotos promocionales. No inventa sobrantes ni modifica compras,
pagos, presupuesto firmado, personal o inventario. Las alertas conservan el
horario de descanso y las decisiones del dueno.
