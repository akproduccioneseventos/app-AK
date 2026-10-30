# Estado actual — 30 de octubre de 2026
## Entrega para Claude: PR 1375
- Rama `gemini/orden-255-asistente-ak`, continuacion desde `5035fedc7`, conserva `dcdac4ee3` y main `5c22efad3`.
- Devolucion 256 leida en Claude `b424ef472`: retirar audiobox, conservar charla automatica de anuncios, Previsor manual y contrato independiente del permiso de fotos.
- Audio con `@breezystack/lamejs@1.2.7` exacta, PCM16/MP3 real y limites. Version expresamente indicada por la orden 256; no se agregan otras bibliotecas.
- Anuncios Meta/Twilio vuelven a la charla habitual; presupuesto/fotos quedan para envio humano. Numeros sin origen publicitario no reciben respuesta automatica.
- Planes de reunion/semana/seguimiento con datos reales; aprobacion guarda borrador idempotente. Resumen con respuestas numericas y pendientes actuales. Avisos internos a coordinacion asignada.
- Hechos posfiesta con procedencia, referencias en compras/personal, aprendizaje por tono y borradores de redes sin publicar ni afirmar generar video.
- Codigo validado `041f8750ff06f4ae1408ce5d992cde8dfba40ed0`; despues solo evidencia. Once casos juntos en `src/__tests__/el-asistente-de-ak.test.ts`.
- Puerta rapida DESDE CERO: exit 0; tipos 40s, Jest completo 246s, seguridad de la base 33s. La cache anterior de Windows era invalida y se corrigio; no reutilizar su hash vacio.
- Jest directo antes del arreglo del control: 934 grupos/5688 PASS, 3 pruebas omitidas; advertencia de proceso abierto no reproducida en los 28 grupos/204 pruebas modificadas con deteccion de handles. El control nuevo y su aislamiento tambien pasan.
- E2E observaciones: 2 PASS PC/Pixel7, guardado/recarga/referencia sin alterar la otra fiesta; datos sinteticos y sesion firmada, sin saltar autenticacion. Arranque frio de next dev tuvo bloqueos previos, causa no probada.
- No se agregan archivos de `data/` ni `src/data/`. No se enviaron mensajes reales por Meta; no afirmar proveedores ni despliegue verificados.
- Claude conserva build, lanzamiento completo y publicacion. Mantener PR abierta, no fusionada.
- Matriz y límites: `docs/evidencias/orden-255-asistente-aceptacion.md`.

Rama de trabajo: `claude/app-debug-stabilize-m70e6z`. Versión publicada: la integración de 1370 y 1374 (esta tanda).

## Publicado en esta tanda
- **1370 de Gemini (órdenes 247, 249, 251 y 252):** sesiones que se cortan, perfil roto que no entra, último dueño, casillas de módulos fuera, enlace del presupuesto que se apaga, factura y presupuesto que no se borran con cobros, centavos del contador, un solo número de plata (comisión, mes de pagos, seña sin presupuesto, saldo), pregunta frecuente del ajuste.
- **1374 de Gemini (orden 254):** plantillas de decoración que se publican solas y objetos nuevos a la biblioteca.
- **Completado por Claude:** dueños con candado entre servidores, presupuesto que se vuelve a mirar en la transacción del borrado, recortes achicados para que entren en la base y gasto contado siempre, tipos de la comisión y del renglón cerrado, sesión de prueba con usuario adentro en las pruebas de navegador.

## Pendiente
- **Codex:** cerrar evidencia de ordenes 255/256 en 1375. Orden 253 se informo publicada por Claude; no rehacerla en esta PR.
- **Gemini**: órdenes 242 a 246 y 248 (una sola propuesta).

## Para el dueño (abogado)
- Revisión legal del contrato de Codex: `docs/evidencias/738-legal-contratos-dictamen.md` en la rama de Codex. No se cambia nada sin abogado.

## Errores de plata y permisos abiertos
- Ninguno conocido después de esta publicación.
