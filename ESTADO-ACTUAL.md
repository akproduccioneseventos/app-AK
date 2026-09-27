# Acá quedé

**27 de septiembre de 2026.** Orden 91 hecha por Claude, con la puerta completa y la tanda entera
de navegador en verde sobre el mismo commit. Evidencia: `docs/evidencias/92-puerta-del-candidato.md`.

**Contraste Codex sobre main `86de081`: orden 93 abierta. No aprobar publicacion.**

## Lo incorporado

- Orden 91: captura sin espera y coordinacion entre cola e IA. No rehacer esos arreglos.
- `npm run entorno:pruebas`: implementado; aislamiento incompleto, ver orden 93.
- `/api/health` con version: implementado, aun no observado en el dominio.
- Matriz de lanzamiento: `docs/evidencias/92-matriz-lanzamiento.md`.

## Pendiente comprobado por Codex

- Entorno: `.env.local` puede reintroducir credenciales; corregir antes de pruebas por rol.
- Cabina IA: "publicada la original" puede anunciarse con la subida aun en curso.
- Firebase check 108579203448: Build failed. Falta log; consola pide sesion.
- Health publico sin version al consultar. No certificado como candidato desplegado.
- Evidencia e instrucciones: `docs/ordenes/93-aislamiento-rescate-y-despliegue.md`.

## Espera al dueño (no lo puede cerrar una IA)

- **Integraciones reales** (Instagram, WhatsApp, Gmail, Mercado Pago): una prueba controlada cada una.
- **Ensayo físico**: `docs/ENSAYO-EN-EL-SALON.md`. El resultado va en
  `docs/evidencias/ensayo-en-el-salon-resultado.md` (la orden 92 queda en FALTA hasta entonces).

## Reparto

- Claude: aislamiento y causa del build. Gemini: aviso de rescate. Codex: contraste.

## Trampas

- **Con la máquina cargada fallan pruebas al azar** (ingreso, estaciones, barra, cápsula del tiempo
  del buzón) y pasan solas con `npm run otravez`. Antes de tocar código, repetirla sola.
- La puerta se espera en primer plano; el contenedor se reinicia si la sesión queda quieta.
- Apagar procesos por número o nombre exacto, nunca `pkill -f` (error 20, pasó otra vez el 26/09).
- Antes de agregar una espera (`await`), mirar qué queda sin hacer mientras espera (error 26).
