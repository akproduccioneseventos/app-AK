# Orden145 - Touchpix captura camara, no solo marca

Gemini programa; Codex reproduce/registra; Claude compila. No rehacer140:
OTRO consumidor. Ejecutado8521548477d90cc2ffa05e9f2edb22c6c51a893b,
main9a054620718673f00e10b52f0811cc1af729ba4e SIN delta Touchpix.
Sin PR abierta al consultar; trabajo local no subido NO CONTRASTADO CON LA
TANDA: comparar antes de programar. No fusionar automaticamente.

## ENT93-CAM P1

Foto normal, invitado con permiso de estacion, sin cuenta de equipo. Camara
ficticia640x480/30fps azul-verde/cuadro amarillo; backend demo. Captura y
descarga/URL200/bytes PASAN, pero JPEG negro con marca. No IA/hardware real.

Control independiente MISMA srcObject con play/requestVideoFrameCallback:
297200 pixeles de senal. Original640x480/readyState4/paused:true/hidden/stream
presente:0, sigue igual15s. Control NO llama play sobre video de app, se retira
antes de medir original. El espejo con misma fuente SI captura azul/cuadro.
93-touchpix-control.json;93-salidas/touchpix-camara-estado.json y JPEG final.

## Consumidor comprobado y correccion

src/app/evento/touchpix/[fiestaId]/page.tsx: startCamera conecta srcObject sin
comprobar play/frame; useEffect lo llama al abrir/cambiar wizard/captura.
videoRef hidden/autoPlay; takePhoto->handleCapture->captureRawPhoto dibuja
tras isVideoFrameReady. Dimensiones/estado NO prueban imagen.

- Asegurar montaje, reproduccion y primer frame; avisar rechazo de play/permiso.
- No disparar antes de imagen; revisar hidden/autoplay conservando vista canvas.
- Recarga/segunda captura/cambio de camara no usan track detenido/solicitud vieja.
- Mantener consentimiento/cola/original/moderacion/permisos. Cerrar tracks propios.

Aceptacion PENDIENTE: reusar93-pendientes-anteriores.spec.ts, control positivo y
captura/Storage conservan>500 pixeles de senal fuera de marca. PC/movil, segundo
invitado, reinicio y permiso denegado. Colores SOLO en prueba: no bloquear fotos
nocturnas reales ni inventar respaldo. Propuesta siguiente aun NO existe/ejecutada.

```comprobar
archivo: src/app/evento/touchpix/[fiestaId]/page.tsx
usa: startCamera en src/app/evento/touchpix/[fiestaId]/page.tsx
prueba: tests/e2e/touchpix-camara-y-recuerdo-con-imagen.spec.ts
prueba: src/__tests__/las-estaciones-aseguran-el-cuadro-antes-de-dibujar.test.ts
usa: asegurarCuadroDeVideo en src/app/evento/touchpix/[fiestaId]/page.tsx
```
