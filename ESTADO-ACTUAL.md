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

- **Publicada y comprobada por Codex: la 1234** (`docs/evidencias/1234-evaluacion-publicada.md`).
  El despliegue ya no es un bloqueo. Las compilaciones de Firebase fallan de a ratos y la
  siguiente publica bien (`docs/evidencias/93-registro-del-despliegue.md`).
- Integraciones reales y ensayo físico: **recién cuando Codex no vea más errores**. Orden del
  dueño: no mencionarlos antes.

## Lo que sigue, y es de Codex

- **Recorridos completos por rol** con `npm run entorno:pruebas`: organizador, cliente, invitado y
  estaciones. Claude arregla lo que marque.

## Espera a Gemini

Nada.

## Trampas

- **Con la máquina cargada fallan pruebas al azar** (ingreso, estaciones, barra, cápsula del tiempo
  del buzón) y pasan solas con `npm run otravez`.
- La puerta se espera en primer plano; el contenedor se reinicia si la sesión queda quieta.
- Apagar procesos por número o nombre exacto, nunca `pkill -f` (error 20).
- Antes de agregar una espera (`await`), mirar qué queda sin hacer mientras espera (error 26).
- Lo que se afirma se comprueba en el último paso, no en uno del medio (error 27).
