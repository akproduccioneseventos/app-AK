# 527 - Limite de memoria observado, no defecto de app

Fuente congelada978af7d65a60bd287f3ee3cc05037a29566074f4.
El emulador propio510, Java21 con heap256MiB, registra su PRIMER
`java.lang.OutOfMemoryError: Java heap space` despues de02:05:21 Uruguay
del25/10/2026 (05:05:21UTC), en `510-firestore.log`.
Luego aparecen errores RPC `2 UNKNOWN: Application error processing RPC`.

Los casos SDK cuyo periodo incluye o sucede ese momento quedan
INCONCLUSOS por entorno, no defectos independientes ni controles aprobados.
Se preserva512, sin editar resultados para ocultar fallos. No se reinicia
la bateria5253 que paso ni se reejecutan viajes aprobados sin afectacion.

Recuperacion prevista: emulador nuevo, heap512MiB, fuente/build978 intactos,
solo specs afectados y el lector auxiliar de cola que fallo por proceso.
El helper528 usa REST SOLO contra el mismo emulador demo para no crear
una conexion gRPC nueva por cada lectura sincrona de fixture. La app sigue
usando su Firebase Admin SDK real. Se documentara ese cambio de transporte;
ninguna asercion original ni codigo de app se modifica para dar verde.
Los recibos de recuperacion son PENDIENTES hasta existir y ejecutarse.
