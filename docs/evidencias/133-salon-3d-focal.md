# Salon 3D: sonda focal inconclusa

- App/build sintetico: `a635b27071ecea22092eba2a285892c84c6f9d08`; el arbol `src` coincide con `main` `9aa64f991f5ddceefa8d278a3f298be861eb10bb`.
- Prueba ejecutada: `tests/e2e/la-vista-3d-muestra-los-muebles.spec.ts`, una variante de escritorio; el propio test omite movil deliberadamente.
- Observacion: el canvas 3D se ve en la captura y el log registra multiples avisos de lentitud de WebGL (`GPU stall due to ReadPixels`). Playwright termina con `Tearing down "context" exceeded the test timeout of 90000ms` y timeout de la grabacion de trazas. Firebase del navegador tambien intenta crear una instalacion con la clave sintetica invalida.
- Resultado: **INCONCLUSO**, no un defecto confirmado ni un aprobado. El timeout ocurre en la etapa de teardown, sin una asercion funcional reportada como fallida; pero el test no obtuvo estado PASS y la captura no demuestra la posicion correcta de todos los muebles.
- Accion: no repetir la suite extensa de 3D ni este mismo recorrido. Para cerrar esta comprobacion hace falta una ejecucion aislada sin grabacion de traza y con salida de red bloqueada, o validar el criterio funcional en un navegador/entorno que cierre WebGL correctamente.
- Captura observada: `docs/evidencias/133-salon-3d-focal.png`.

No se usaron cuentas, eventos, pagos ni datos reales.
