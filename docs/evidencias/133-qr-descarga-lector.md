# QR descargado y lector real de la app

- Resultado: **4 PASS, 0 FAIL, 0 omitidos**. Dos longitudes de token en Chromium desktop y Pixel 7, 87.9 s.
- App/build: `a635b27071ecea22092eba2a285892c84c6f9d08`; arbol `src` identico a main `9aa64f991f5ddceefa8d278a3f298be861eb10bb`.
- Prueba ejecutada SHA256 `7cd3cd2c626d7e6126f0c467ee2705b3b27facb4e2238ab86964d292e9509350`.
- Se uso el boton real Guardar QR. El PNG descargado era cuadrado, sin pixeles grises, con margen blanco y modulos enteros.
- Los mismos bytes descargados se entregaron al lector `html5-qrcode` real de `/evento/accesos/:fiestaId`, mediante archivo. La camara se simulo con el helper existente; no se uso hardware.
- La lectura marco `checkedIn` y guardo la hora; repetirla con el mismo archivo conservo la hora del primer ingreso.
- Datos y sesiones ficticios locales; sin service workers y con solicitudes HTTP externas del contexto bloqueadas. No se modifico codigo de la app. Al terminar: puerto3300 libre y cero fixtures `e2e_qr147_*` en ambas carpetas.
- Cierra el retest virtual de orden147 EN ESTE ALCANCE. No prueba una camara fisica, impresion del QR, PWA/offline ni todos los controles de acceso.

```comprobar
prueba: tests/e2e/133-qr-descarga-lector-local.spec.ts
archivo: docs/evidencias/133-qr-descarga-lector-local-execution.json
archivo: docs/evidencias/133-qr-descarga-lector-local-results.json.gz
```
