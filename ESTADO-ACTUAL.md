# Estado actual — 20 de octubre de 2026

Rama de trabajo: `claude/app-debug-stabilize-m70e6z` (subida, al día). Versión publicada: la de la propuesta 1347 (`09ea4138f`, 21/10): reglas de personal del dueño, permisos del barrido completo y arreglos de plata.

## En qué se está
Esperando que Gemini complete la propuesta 1346 con la orden 208 (incluye la 207).
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
- Gemini 1346 (`d95c35ba2`, órdenes 205 y 206): compila y Jest en verde; **devuelta con la orden 208** (la realidad aumentada sin video, prueba de mentira, `paso-4-resumen` tocado y falta la 207). Sigue en la misma propuesta.
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
