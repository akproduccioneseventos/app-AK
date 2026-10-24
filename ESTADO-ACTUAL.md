# Estado actual — 20 de octubre de 2026

Rama de trabajo: `claude/app-debug-stabilize-m70e6z` (subida, al día). Versión publicada: la de la propuesta 1360 (`3e45a4ac6`, 23/10): órdenes 218 y 219 (aviso de pago reintentado, texto y plan de pagos con firma) y el barrido de las preguntas 93 y 94 (cancelación, cambio de fecha, cobro de factura).

## En qué se está
Codex 186-206: orden 210 publicada (1351); orden 211 (aprobaciones y contrato firmado, incluye un error mío ya publicado) hecha, falta publicar. Para Gemini: orden 212 (lo de pantalla del portal) y las 180 a 195 que siguen pendientes.
Codex sólo audita.

## Terminado en esta tanda
- Junté en la rama los arreglos de Codex 136/138 (1328) y la evidencia de Codex 134 (1324).
- Devolví la entrega de Gemini 1333 (órdenes 180 a 183 y 185): sola rompía 7 pruebas, junto con
  la rama 12, y dejaba pública una función de costos sin permiso → **orden 188**.
- Cerré sin fusionar 1330, 1331, 1332, 1334, 1335 y 1333. Lo que servía pasó a las órdenes.
- **Orden 189:** las novedades que eligió el dueño, con realidad aumentada de verdad (apuntar a la
  invitación impresa), Play Store, iPhone desde la web, selfie, cámara descartable, trivia con IA
  real, efecto Coldplay y armador de mesas.
- **Orden 190:** hablarle a la app como en una llamada, que haga tareas con confirmación, avisos al
  teléfono según el perfil, ícono "Hablar con AK" y "los dots de AK" (asistentes con nombre, objetivo
  y qué hacen solos). Se habla siempre a "Asistente AK", que deriva solo; el dueño llega a todo.
- Método: preguntas 69 a 73 (COMO-AUDITAR) y 54 (ANTES-DE-ENTREGAR). El control de acentos ya lee
  nombres de archivo con tilde.
- Decisiones nuevas anotadas en CLAUDE.md (19/10): realidad aumentada SÍ; Play Store sí; Apple no.

- **Orden 191:** filtros que siguen la cara, "Mis 15", estilo Canva y efectos de Instagram/TikTok.
- **Orden 192:** un solo centro de presencia y redes, bandeja única de mensajes, respuestas solas con reglas.
- **Barrido de las 73 preguntas** (20/10): registro `docs/barridos.json` + control que lo exige.
  Lo confirmado (plata incluida) va en la **orden 193**; ~25 preguntas quedaron "parcial".
- **Orden 194:** 36 de 45 hallazgos de la auditoría de Gemini (20/10) eran ciertos. Lo urgente: el despertador
  no llega a la app. Preguntas 74–81 y `npm run formas-ya-arregladas` (lo arreglado en un archivo, buscado en todo).
- **Despertador de Claude cada hora:** revisa solo lo que entreguen Gemini y Codex (decisión del dueño 20/10).
- Cerrada la 1336 de Gemini (arrancaba de la 1333 devuelta). Error 39 anotado.

## Errores de plata y permisos abiertos en la app publicada
- Ninguno. La orden 197 (con 183 y 198) se publicó el 20/10 en la propuesta 1339.

## Revisado hasta (lo usa el despertador de cada hora)
- Gemini 1353 (`d2f49f09f`, órdenes 226-227): devuelta con la orden 228 — sacaba `clientPortalSettings` al cliente (PIN vacío cancelaba la fiesta), acción nueva sin sesión, prueba vieja de la 224 y tres de navegador en rojo.
- Codex 1361 (`fcad4e36e`, 362-443): juntado. Sobre la 917: 225 y 217 cerradas; siguen el fondo claro (otra regla) y la factura que dice "no existe" si falla la lectura → orden 227 (barrido: 10 pantallas). 214 sin cambios.
- Gemini 1353 (`917a98e32`, órdenes 222-225): compila, 862 suites en verde, órdenes 220-225 HECHA. Frena en "lo que se dijo": cinco pantallas tocadas sin prueba y la de realidad aumentada con `toBeVisible` → orden 226 (sólo pruebas).
- Codex 1361 (`98f54f952`, 347-361): juntado. Volvió a probar la entrega 1353 (`3f9460185`): 212 A7/A8 y 217 R1-R4 pasan; 214 sigue igual. Nuevo: un 503 tomado por rechazo manda el recordatorio dos veces, y una prueba del asistente sin `mutarDocumento` → orden 225 para Gemini, pregunta 97.
- Codex 1361 (`b8b839876`, 267-345): juntado. Dos hallazgos de pantalla: órdenes 223 (contraste, ampliada a 5 pantallas) y 224 (cargando infinito, ampliada a 14), las dos para Gemini.
- Codex 1361 (`47d24689a`, 285-308): juntado. Confirma cerradas las órdenes 218 y 219; sin hallazgos nuevos. Su revisión de navegador sigue activa en esa misma rama.
- Gemini 1353 (`3f9460185`): compila, pero no trajo la rama de Claude ni hizo los bloques 2 a 4 de la orden 222. Sigue devuelta.
- Gemini 1353 (`b02fad0a3`, orden 221): devuelta por cuarta vez con la orden 222 (no compila, presupuesto de WhatsApp sin precios, formas que mienten, prueba de realidad aumentada vacía).
- Gemini 1353 (`045123535`, orden 220): devuelta por tercera vez con la orden 221 (4 guardados con import sin usar, voz del cliente con token inventado, seña y saldo al personal, prueba de voz en rojo, pendientes de 196 y 202).
- (antes) Gemini 1353 (`7f2b251e9`, órdenes 180-195, 212, 214, 215, 217): devuelta otra vez con la orden 220 (costos públicos sin permiso, prueba de la 183 sobre copias, un error de tipos, 6 guardados de lista entera, frase de la 190).
- Codex 1359 (`914d78307`, auditorías 260-264): juntado. Dos fallas nuevas de plata y contrato (órdenes 218 y 219), arregladas por Claude el 23/10; preguntas 93 y 94.
- Codex 1359 (`e9477ba8e`, auditorías 254-255): juntado. Confirma arreglados la firma del contrato (216, C1-C4) y el recordatorio R1 (217); sin hallazgos nuevos. R2-R4 siguen con Gemini.
- Codex 1356 (`5ec6bb2fa`, recuento único 253): juntado, sin hallazgos nuevos.
- Codex 1356 (`dcfe7b458`, auditorías 240 y 249-251): juntado. Firma del contrato (216) arreglada por Claude; recordatorio: R1 por Claude, R2-R4 a Gemini (orden 215, bloque 6).
- (antes) Codex 1356 (`3155a27ba`, auditoría 240): juntado. Las cuatro fallas de la firma del contrato en el portal las arregló Claude (orden 216-claude).
- Codex 1354 (`8ef06a7f4`, auditorías 213-239): juntado. Las dos fallas de plata de las aprobaciones (firma que llega en el medio, deshacer que pisaba a otro) las arregló Claude (orden 213-claude); filtros → orden 214 para Gemini.
- Gemini 1353 (`b91bdbeff`, órdenes 180 a 195): devuelta con la **orden 215** (más la 214 de Codex). No compila (1 error), 38 pruebas fallan, y la bandeja de mensajes quedaba sin permiso. Abierta, sin fusionar.
- Codex 1345 (`89d968d6b`, auditorías 176-185): juntado. El rol de cocina y la pregunta 87 (precio y cita por nombre parcial) los arregló Claude; el resto, orden 208.
- Codex 192 (`f80113d35`, auditorías 186-202): juntado. Orden 210: plata del portal hecha por Claude; orden 212 para Gemini.
- Gemini 1346 (`512881c25`, órdenes 205 a 208): revisada y juntada; compila, 5.075 pruebas en verde. Claude arregló la voz con la base que repite el guardado.
- Gemini 1344 (`bfde3916a`): devuelta con la **orden 205** (Codex) y la **206** (fechas). Abierta, sin fusionar.
- Codex 1345: `1cb47af06` (antes `f776ae29e`) (auditorías 160-169 juntadas): orden 204 del proveedor y el Tab de la 199 arreglados por Claude.
- Codex 1340: `588fd64d7` (auditorías 156-159 juntadas: órdenes 200 y 201 de permisos arregladas por Claude; la fecha del seguimiento quedó en la 193 para Gemini). Antes `fdc24539a` (auditoría 155 juntada: foco de la galería pública → orden 199, con el video de ayuda sumado por el barrido de la pregunta 83). Antes `9301e146c` (auditorías 151-154 sobre la publicada 894d0160): sin hallazgos nuevos; confirma cerradas 171, 184 y 186; sigue abierta la 172 (dock en celular), ya pedida a Gemini. La 1324 quedó cerrada al entrar en la 1339.
- Codex 1324: `2852f0881` (auditoría 150 juntada; su 196 pasó a ser la **198**). Antes `2ccdb3858` (auditoría 149, juntada; su orden 186 pasó a ser la **195**).
- Claude hizo lo chico (20/10): orden 199 (foco de los visores), fecha del seguimiento (Codex 159) y las mesas de la 202 (falso positivo). A Gemini le quedan la 196 y la 202 (bloques 1 y 3).
- Gemini 1343 (`f10414c06`, órdenes 196 y 202): **cerrada sin fusionar**; no compilaba (5 errores), 7 pruebas en rojo, el presupuesto por WhatsApp no lo llamaba nadie y salía en $0 → **orden 203**.
- Gemini 1341 (`7dd30ef2c`, órdenes 180-183): **cerrada sin fusionar**; comentarios y pruebas vacías en vez de código → **orden 202**.
- Gemini 1338 (orden 197): `2e5363f25`, juntada, terminada por Claude y publicada en la 1339.
- Gemini 1337: `45a0b1d47` (órdenes 188 a 192) → **devuelta con la orden 196**; faltan 193 a 195.
- 1325 a 1329: viejas, superadas por las órdenes 188 a 194; no se revisan de nuevo.

## A medias / trabado
- Órdenes 180–183 y 185 siguen sin entrar: van dentro de la devolución 188.
- Orden 182 (5 pestañas, portal en 5 pasos, Marketing): lo armado no se ve en las pantallas.
- Hay que medir cuántos minutos de voz en vivo gratis da Gemini por día antes de subir el tope de
  10 minutos.
- Respaldo local de la integración rota: rama local `respaldo-integracion-f9878` (no subida, se
  puede tirar).

## Lo próximo
1. Cuando Gemini entregue 188: revisar plata y permisos línea por línea (candado de la plata,
   `recortarFiestaPorPerfil`, guardado que no borra), puerta, fusionar con `expectedHeadSha`.
2. Después 189 y 190, en el mismo orden. 190 toca permisos: con lupa.
3. Pendiente del dueño, sin apuro: si quiere sumar "Mi día" como puerta de entrada al reordenar.
