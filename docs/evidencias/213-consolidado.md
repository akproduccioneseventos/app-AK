# 213 - Portal activo, navegador PC y Pixel7

Fuente fa3b492b8f1d6a77433a92f4d63b665cfea3747c; artefacto206 exacto.
Health coincide con SHA; seis servicios externos false. 12 casos: 8PASS,
4FAIL, 0omitidos, 0flaky, sin errores globales Playwright. NO cuatro bugs nuevos.

Por cada viewport pasaron: tres cuentas ficticias visibles sin desborde
horizontal; alta real de cancion en servidor y persistencia al recargar;
personalizar portada abre/cierra con boton dentro del viewport; cortar POST
antes de enviarlo conserva dos adultos y muestra error. No se valido guardar
una foto ni importarla desde un servicio real.

Los cuatro FAIL reproducen DOS causas YA incluidas en210: A7, clicar Informar
pago no abre input/formulario de comprobante; A8, enlace oficial entregado no
aparece en el portal activo. PC y Pixel7 repiten cada causa. No nueva orden.
Ver 213-resultados.json.gz, capturas213-artifacts y207fuente de sondas.
Las trazas originales se conservan localmente;231/235 registran hashes ygzip.

Inspeccion visual manual: controles y cuentas legibles en captura movil;
modal de portada PC con cierre visible. Las imagenes externas fueron bloqueadas
por aislamiento: NO calificar falta de fondo como defecto ni declarar galeria
real aprobada. La captura fullPage mide26749px y parece repetir bandas; el
snapshot accesible del fallo no acredita portales multiplicados. No se reporta
otro bug a partir de esa apariencia de captura ni se altera la evidencia.

Al terminar: 76JSON restaurados, sourceDiff vacio, servidor18788 y proceso de
pruebas11576 cerrados. No credenciales, cuentas, pagos ni mensajes reales.
La espera213 registro11sondas acotadas, sin detener procesos ajenos. No fueron
11 pruebas de la app. 209 fue un intento interrumpido, no una aprobacion total.

Dependencias: mismo limite206 (@types/estree1.0.8instalado frente1.0.9lock);
no npm-ci limpio. Este cierre cubre ocho escenarios y dos fallos del portal,
no todos los botones/roles ni integraciones externas.
