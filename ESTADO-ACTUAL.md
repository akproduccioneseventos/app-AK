# Estado actual - 13/10/2026 (Claude, noche)

Rama `claude/app-debug-stabilize-m70e6z`. main = 655de9fe6 (PR 1291 publicada).
Se juntó la rama de Codex hasta d4c05d08 (órdenes 157-160), para publicar con la puerta en verde.

## Qué trae esta tanda
- Mantenimiento (159) y ajuste de costos (160): versión de Codex, con recibo por operación.
  El redondeo quedó en centavos (Codex lo había vuelto a pesos enteros: error del insumo de $6).
- Incidentes (157) y títulos largos (158): versión de Codex.
- Documentos de plata (155): quedó la nuestra; es equivalente a la de Codex y usa sus pruebas.
- Pruebas viejas del mantenimiento que miraban la forma del código: se sacaron; el
  comportamiento lo miran la prueba de navegador y la de Codex.

## Codex trabaja directo (autorización del dueño, 13/10)
- Codex corrige con agentes y sube a la PR 1288; Claude junta, revisa plata y publica.
- Su lote 115 (pantallas de control, conexiones, respaldo de ajustes, plantillas, Google)
  estaba en su máquina sin subir: cuando aparezca en la PR 1288, se junta igual.

## Hecho el 13/10 por pedido del dueño ("mirá cómo lo hacen otras apps")
- Votos: uno por teléfono (como Slido/Mentimeter) y tope de red alto; el wifi del salón no frena.
- Trivia en vivo como Kahoot: el celular muestra la pregunta lanzada, el servidor suma puntos,
  "Mostrar respuesta" y "Terminar trivia y mostrar podio" en el panel del operador.
- Misiones de fotos: la foto sube a la galería y suma una vez; ranking "Cazadores de fotos".
- Una trivia lanzada antes de este cambio no tiene respuesta correcta: hay que relanzarla.

## PR 1293 de Codex (junta el 13/10)
- Chat: no duplica el presupuesto al reintentar; la tarjeta del asistente abre el chat.
- Respaldo de ajustes de costos, flujo de caja por día de Uruguay, logo original en PDFs,
  configurador con identidad por intento. Revisado lo de plata: centavos intactos.
- Codex ahora sube en PRs propias (1288, 1293): suscribirse a cada una nueva.

## Método corregido solo (13/10, pedido del dueño)
- Preguntas 58 (respuesta perdida duplica), 59 (formulario que reabre sucio), 60 (nombre largo en
  celular) y 61 (prueba salteada en celular). Barridas en toda la app y arregladas.
- Control `cada-hallazgo-de-codex-tiene-su-pregunta`: toda orden de Codex necesita su línea
  "- Orden N → pregunta M" en LO-QUE-NO-VI.md o la puerta no publica.
- Pago a proveedor (gestión de costos): agrega uno solo con identidad del intento (14/10).

## Límites aceptados
- El candado de crear fiesta desde presupuesto cuida un solo servidor.
- Regalos: uno agregado a la vez desde otra pantalla puede perderse.
