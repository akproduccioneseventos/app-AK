# Acá quedé

**27 de septiembre de 2026.** Orden 91 hecha por Claude, con la puerta completa y la tanda entera
de navegador en verde sobre el mismo commit. Evidencia: `docs/evidencias/92-puerta-del-candidato.md`.

## Lo último que entró

- **Orden 91 (Codex), hecha por Claude:** la cabina con IA guarda la foto sin esperar al servidor,
  y publica una sola foto por captura aunque la IA tarde (retención renovada + reclamo de la cola).
- **Orden 92 y matriz de lanzamiento de Codex** (`docs/evidencias/92-matriz-lanzamiento.md`):
  **publicar NO está aprobado todavía**. Sigue abierto lo que se lista abajo.
- **1231, orden 90 (Gemini):** las estaciones dicen dónde quedó la foto de verdad.
- **1230, devolución 89:** la cabina con IA dice dónde quedó la foto y no pisa al siguiente.

## Espera al dueño (no lo puede cerrar una IA)

- **Entorno de pruebas aislado** con cuentas por rol (organizador, cliente, invitado) para que Codex
  recorra lo interno sin tocar fiestas ni cobros reales. Un segundo proyecto de Firebase puede
  costar: se pregunta antes.
- **Qué versión está publicada**: se mira en la consola de Firebase. Desde el contenedor no se llega
  al dominio.
- **Integraciones reales** (Instagram, WhatsApp, Gmail, Mercado Pago): una prueba controlada cada una.
- **Ensayo físico**: `docs/ENSAYO-EN-EL-SALON.md`. El resultado va en
  `docs/evidencias/ensayo-en-el-salon-resultado.md` (la orden 92 queda en FALTA hasta entonces).

## Espera a Gemini

Nada.

## Trampas

- **Con la máquina cargada fallan pruebas al azar** (ingreso, estaciones, barra, cápsula del tiempo
  del buzón) y pasan solas con `npm run otravez`. Antes de tocar código, repetirla sola.
- La puerta se espera en primer plano; el contenedor se reinicia si la sesión queda quieta.
- Apagar procesos por número o nombre exacto, nunca `pkill -f` (error 20, pasó otra vez el 26/09).
- Antes de agregar una espera (`await`), mirar qué queda sin hacer mientras espera (error 26).
