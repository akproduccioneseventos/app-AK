# Acá quedé

**27 de septiembre de 2026.** PR 1234 desplegada: Codex confirma App Hosting success y
health con version `5e384c6`. Ver `docs/evidencias/1234-evaluacion-publicada.md`.

## Lo último

- **Orden 93, P1:** el entorno de pruebas corre en una copia descartable sin `.env*`, y no arranca si
  Next vería alguna variable que no sea de prueba.
- **Orden 93, P2:** la cabina con IA dice "publicada" sólo cuando la subida de la original se
  confirmó; si no, "se está subiendo" o "no se pudo publicar".
- **Orden 92:** `npm run entorno:pruebas` (entorno por rol) y `/api/health` → `version`.
- **Orden 91:** la foto se guarda sin esperar al servidor y sale una sola por captura.

## Espera al dueño (no lo puede cerrar una IA)

- Log de PR 1233: causa historica pendiente; ya NO bloquea el despliegue actual exitoso.
- **Integraciones reales** (Instagram, WhatsApp, Gmail, Mercado Pago): una prueba controlada cada una.
- **Ensayo físico**: `docs/ENSAYO-EN-EL-SALON.md` → `docs/evidencias/ensayo-en-el-salon-resultado.md`.

## Listo para Codex

- `npm run entorno:pruebas` ya no puede leer claves de archivos: puede recorrer por rol.
- Falta completar recorridos; prueba fisica del dueno AL FINAL, no frena esas revisiones.

## Espera a Gemini

Nada.

## Trampas

- **Con la máquina cargada fallan pruebas al azar** (ingreso, estaciones, barra, cápsula del tiempo
  del buzón) y pasan solas con `npm run otravez`.
- La puerta se espera en primer plano; el contenedor se reinicia si la sesión queda quieta.
- Apagar procesos por número o nombre exacto, nunca `pkill -f` (error 20).
- Antes de agregar una espera (`await`), mirar qué queda sin hacer mientras espera (error 26).
- Lo que se afirma se comprueba en el último paso, no en uno del medio (error 27).
