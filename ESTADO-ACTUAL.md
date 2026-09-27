# Acá quedé

**27 de septiembre de 2026.** Orden 93 de Codex: los dos arreglos de código están hechos. El
despliegue que falló espera el registro de Firebase.

## Lo último

- **Orden 93, P1:** el entorno de pruebas corre en una copia descartable sin `.env*`, y no arranca si
  Next vería alguna variable que no sea de prueba.
- **Orden 93, P2:** la cabina con IA dice "publicada" sólo cuando la subida de la original se
  confirmó; si no, "se está subiendo" o "no se pudo publicar".
- **Orden 92:** `npm run entorno:pruebas` (entorno por rol) y `/api/health` → `version`.
- **Orden 91:** la foto se guarda sin esperar al servidor y sale una sola por captura.

## Espera al dueño (no lo puede cerrar una IA)

- **Publicado hoy: la 1234** (con las órdenes 91, 92 y 93). Las compilaciones de Firebase fallan
  de a ratos (1225, 1226, 1229, 1231, 1233) y la siguiente, con el mismo código y más, publica
  bien: `docs/evidencias/93-registro-del-despliegue.md`. La causa se ve sólo en el registro interno
  de una fallida.
- Integraciones reales y ensayo físico: **recién cuando Codex no vea más errores**. Orden del
  dueño: no mencionarlos antes.

## Listo para Codex

- `npm run entorno:pruebas` ya no puede leer claves de archivos: puede recorrer por rol.

## Espera a Gemini

Nada.

## Trampas

- **Con la máquina cargada fallan pruebas al azar** (ingreso, estaciones, barra, cápsula del tiempo
  del buzón) y pasan solas con `npm run otravez`.
- La puerta se espera en primer plano; el contenedor se reinicia si la sesión queda quieta.
- Apagar procesos por número o nombre exacto, nunca `pkill -f` (error 20).
- Antes de agregar una espera (`await`), mirar qué queda sin hacer mientras espera (error 26).
- Lo que se afirma se comprueba en el último paso, no en uno del medio (error 27).
