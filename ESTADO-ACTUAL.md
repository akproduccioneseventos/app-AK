# Estado actual — 20 de octubre de 2026

Rama de trabajo: `claude/app-debug-stabilize-m70e6z` (subida, al día). Versión publicada: la de la
propuesta 1323 (`7230f9d02`). **Nada de esta tanda está publicado todavía.**

## En qué se está
Esperando UNA entrega de Gemini con las órdenes 188 a 195 (el dueño le pega el mensaje con la rama). Claude revisa, corre la puerta y fusiona.
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

## Errores de plata y permisos abiertos en la app publicada (orden 197, van primero)
- Pagos a proveedores con el mismo nombre (desde el 16/10).
- Despertador bloqueado: las tareas automáticas no corren solas (desde el 20/10).
- Ingreso con Google sin perfil, preguntas de seguridad sin tope, cambio de clave sin sesión, eco de WhatsApp (desde el 20/10).
- La fiesta entera (costos y sueldos ajenos) le llega a la secretaria y al operador (desde el 16/10, orden 183).
- Guardar una fiesta le devuelve costos y sueldos ajenos a quien no tiene permiso (desde el 20/10, orden 198).
- Saldos sin el ajuste anual y un cobro a confirmar contado como ganancia (desde el 20/10).

## Revisado hasta (lo usa el despertador de cada hora)
- Codex 1324: `2852f0881` (auditoría 150 juntada; su 196 pasó a ser la **198**). Antes `2ccdb3858` (auditoría 149, juntada; su orden 186 pasó a ser la **195**).
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
