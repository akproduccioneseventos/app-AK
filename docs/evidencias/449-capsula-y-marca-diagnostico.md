# Diagnostico 449: capsula y marca

Solo lectura de app. Fuente congelada QA917: `917a98e32c63fe2f832f5cdc16db87f4fc722b6c`; no confundirla con el HEAD de la rama documental de auditoria. El ayudante no ejecuto pruebas, servidores ni builds.

## Capsula: modos/grabacion

`tests/e2e/entertainment-stations.spec.ts:112-187` verifica cuatro botones de modo, selecciona Grabar Video, comprueba canvas 640x480 con pixeles de marco floral, comienza/parada MediaRecorder, `Video Grabado`, blob reproducible, repetir y tracks cerrados. Fixture necesario: fiesta `FIESTA_ID` y sesion app (`addAppSession`); `getUserMedia` falso que devuelve `canvas.captureStream(20)` y conserva tracks en `__buzonTestStreams`. En QA917 el test se salta fuera de chromium-desktop (línea 113).

374 desktop y 412 mobile informan `Detener Grabación` visible pero separado del DOM al click (línea 173 en QA). La prueba ya había llegado a la grabación; no demuestra fallo de modos, del marco ni de MediaRecorder. Control fiel: conservar todos los asserts y flujo, pero esperar transición estable de captura/revisión antes de actuar; registrar DOM/estado de grabación y traza al desprenderse. No tratar el timeout como bug ni aumentar tiempo para ocultarlo.

## Capsula: video galeria

`entertainment-stations.spec.ts:190-257`: abre Subir video, crea en browser video corto con MediaRecorder (colores cambiantes), lo asigna a `input[type=file][accept="video/*"]`, dispatch `change`; exige `Video Cargado`, blob visible y pixeles del marco. Fixture: mismo evento/sesion con configuración de marco floral; browser Chromium con MediaRecorder/canvas y tipo MIME soportado. No depende de gtag.

374 desktop llega a la etiqueta esperada y falla `Video Cargado` ausente (línea QA250); el context muestra de vuelta pantalla “Selecciona un video”, sin input visible. 412 mobile se omite por `test.skip` QA191. Posible abortador previo: `click(Subir video)` puede cambiar vista y desmontar input; `locator('input...')` podría apuntar a input de selector real, y la asignación programática + `change` no equivale al flujo nativo de archivo. Diagnóstico, no causa confirmada: control nativo fiel es `setInputFiles` sobre el input real con un video fixture generado antes, esperar evento de selección/preview, mantener asserts originales de carga y pixeles. No reemplazar los asserts.

## Marca Bogue

`las-estaciones-respetan-los-ajustes.spec.ts:35-55, 87-125, 128-168`: fixture `crearFiestaDeEstaNoche`/`guardarFiesta` con `others.entretenimiento.modules.bogue` (`brandText=MARCA`, `qrCallout`, cuenta regresiva), permiso `crearPermisoDeEstacion`; cámara falsa via canvas. Assertion requiere texto exacto en compartir o QR. 412 mobile termina “Bogue: no llego…” en el bucle de 90 s; no prueba marca ausente, ni es un timeout de Playwright.

Selector potencialmente abortador: `llegarACompartir` toma el primer botón habilitado cuyo nombre coincide con `sacar|empezar|comenzar|iniciar|grabar|foto|video` y traga error de click (109-113). Puede iniciar otro modo/no ser disparador. Además Bogue puede esperar gesto/fin de loop; cámara canvas constante no prueba una captura/loop nativo efectivo. Control fiel: inspeccionar botones accesibles del estado Bogue en trace y anclar acción al control real de captura; alimentar stream de cámara cambiante y esperar señal de captura/QR. Mantener aserción de marca en pantalla de compartir. Sin inferir bug de gtag bloqueado.

**Resultado:** diagnósticos de arnés/precondiciones por confirmar con control nativo; no atribución de defecto de producto ni aceptación de estos casos.
