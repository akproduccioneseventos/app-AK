# Orden143 - Credencial revocada y ubicacion bloqueada

NO CONTRASTADO CON LA TANDA DE PROGRAMACION LOCAL NO SUBIDA.

Claude: permisos/accesos y cabeceras; Claude compila. Codex audita.
10/10/2026. Main remoto8521548477d90cc2ffa05e9f2edb22c6c51a893b.
PR1282 ya fusionada dentro de la entrega1283; no hay otra PR abierta al consultar.
Antes de programar, comparar con HEAD real de la tanda local; no repetir arreglos.
Las rutas/simbolos siguientes existen en85215484, y no cambian desde2aac14e2.
No incorporar las sondas demo a produccion ni usar datos/credenciales reales.

## ACC92-REVOCACION P1: lector abierto admite el QR anterior

Reproduccion con navegador y lector html5-qrcode reales, PNG descargado del
portal del invitado. El operador inicia sesion y carga la fiesta. Despues se
reemplaza guestAccessToken en el SDK demo, sin recargar el lector. Se presenta
el PNG anterior. Resultado: ACCESO PERMITIDO y checkedIn=true; el token
nuevo permanece guardado. No es un intento sin sesion ni acceso a otra fiesta.

Evidencia:92-artifactos/main-primer/09-qr-revocado.json y captura del lector
en85215484; seis-segunda/06-qr-revocado.json conserva la reproduccion anterior.
Sonda92-entrada-pendientes.spec.ts falla exactamente true!=false.
Reentrada del QR vigente conserva el timestamp y avisa que ya fue usado.

Causa localizada: onScanSuccess en src/app/evento/accesos/[fiestaId]/page.tsx
valida el token contra fiesta cargada en memoria, pero llama checkInGuest con
solo fiestaId y guestId (117). checkInGuest en
src/app/actions/fiesta/invitados.actions.ts:335 exige permiso de operador,
pero no recibe ni valida la credencial actual en el guardado atomico.

Corregir la entrada VIA QR para comprobar fiesta, invitado y token vigente
dentro del turno de actualizacion, no solo mediante refresco previo del cliente.
Mantener permisos/idempotencia y la entrada manual autorizada de
src/app/recepcion/[fiestaId]/RecepcionClient.tsx:36/75; no imponer QR a ese flujo.
Probar revocacion concurrente/lector abierto, token ausente/ajeno/invalido,
vigente y dos lecturas simultaneas. Un helper verde no acepta el lector real.

## PERS92-GEO P1: cabecera impide la funcion ya existente

Con llegadaConUbicacion=true, salon con coordenadas y permiso del navegador
granted, document.featurePolicy permite=false. getCurrentPosition devuelve
code1: Geolocation has been disabled in this document by permissions policy.
El sitio publicado responde200 con la misma cabecera geolocation=().
Evidencia:92-cabeceras-ubicacion.json y
92-artifactos/ubicacion-final/01-ubicacion-nativa-politica.json.

next.config.js:61 impone geolocation=() a todas las rutas;
src/__tests__/security-headers-config.test.ts:17 exige esa prohibicion.
handleMarcarLlegada en src/app/acceso-personal/[tokenId]/page.tsx:50 usa
getCurrentPosition75 y registrarLlegadaPersonal56. El servidor en
src/app/actions/accesos-personal-view.ts:150 calcula radio y exige coordenadas.

Permitir geolocalizacion de origen propio donde necesita la funcion existente,
sin permitir terceros/iframes ni relajar la validacion del servidor. Actualizar
la prueba de cabeceras para comprobar la compatibilidad real del recorrido.
Mantener requerimiento de consentimiento del navegador y permiso denegado.
No confundir radio aprobado con confianza en GPS fisico: puede falsificarse.

Sonda4/4 pasa como DIAGNOSTICO: bloqueo nativo demostrado, coordenadas
simuladas dentro aceptadas/recarga, fuera14939m rechazadas con radio300m,
denegado sin escritura. Esas dos simulaciones no acreditan GPS nativo correcto.
Para aceptar el arreglo, repetir con grantPermissions/setGeolocation NATIVOS,
sin addInitScript que sustituya getCurrentPosition, y verificar cabecera publicada.

## Aceptacion

Pruebas QA entregadas en docs/evidencias/92-entrada-pendientes.spec.ts y
92-personal-ubicacion.spec.ts; ejecutar solo en TEMP/demo autorizado.
Pruebas permanentes/nativas y build por Claude: PENDIENTES. Registrar SHA,
entorno y resultados; no declarar arreglado por archivo existente.
No repetir139-142: correcciones presentes en main85215484, retest acotado aparte.

```comprobar
archivo: src/app/actions/fiesta/invitados.actions.ts
usa: checkInGuest en src/app/evento/accesos/[fiestaId]/page.tsx
prueba: docs/evidencias/92-entrada-pendientes.spec.ts
archivo: next.config.js
usa: registrarLlegadaPersonal en src/app/acceso-personal/[tokenId]/page.tsx
prueba: docs/evidencias/92-personal-ubicacion.spec.ts
prueba: src/__tests__/el-qr-viejo-no-entra.test.ts
prueba: tests/e2e/la-ubicacion-del-personal-no-esta-bloqueada.spec.ts
```
