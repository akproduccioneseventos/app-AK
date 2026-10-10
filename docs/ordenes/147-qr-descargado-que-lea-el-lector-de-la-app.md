# Orden147 - El QR descargado debe funcionar en el lector de AK

NO CONTRASTADO CON LA TANDA DE PROGRAMACION LOCAL NO SUBIDA.

Gemini corrige exportacion/imagen; Claude revisa entrada/permisos y compila.
Fuente ejecutada y main remoto: 9a054620718673f00e10b52f0811cc1af729ba4e.
PR1286 es QA/documentacion, NO arreglo de producto. Contrastar la entrega real
antes de programar. No duplicar orden143: revocacion de permisos YA pasa94.

## QR94-LECTOR P2 - El archivo valido no lo lee el propio Control de Acceso

En navegador, Guardar QR descarga el canvas170x170 del portal del invitado.
Una credencial concreta falla en el lector real html5-qrcode de la app:
NotFoundException: No MultiFormat Readers were able to detect the code.
No alcanza a llamar checkInGuest y checkedIn queda false; NO es rechazo de
token ni fallo de concurrencia. Otras credenciales pasaron, incluida la
reentrada movil: el problema depende de la imagen, no ocurre en todas.

Original preservado: docs/evidencias/94-artifactos/qr-reentrada-original.png.
Sonda: docs/evidencias/94-qr-imagen.spec.ts. Dos controles complementarios:
- ZXing directo decodifica el ORIGINAL170x170 y el control234x234 con borde32:
  el payload es identico y valido. El control ampliado3x no decodifica; no
  recomendar aumentar tamano a ciegas ni reemplazar la aceptacion por un mock.
- MISMO archivo/payload, MISMO lector/fiesta/invitado: original checkedInfalse,
  borde blanco32 checkedIntrue. Raw94-qr-lector-control.json, 23.200s.
  Adjunto94-artifactos/94-qr-lector-control-26-0.json contiene ambos estados
  y el error real. El control NO sustituye al archivo entregado por la app.

Consumidor real: src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx,
downloadQR obtiene directamente qr-guest-portal.toDataURL. QRCodeStylized
size170/levelH sin margen; el padding blanco visible pertenece al DIV, no
al PNG. La evidencia demuestra incompatibilidad de esa entrega con el lector;
no prueba que el margen sea la unica causa interna del reescalado del lector.

Corregir entrega/lector para conservar zona blanca de seguridad y resolucion
legible. Comparar original contra controles, no alterar tokens ni omitir la
validacion del servidor. Revisar otras exportaciones SOLO si comparten la
misma causa; no declarar RSVP defectuoso sin reproducirlo.

## Aceptacion pendiente de la correccion

En el SHA corregido, descargar desde Guardar QR y subir EXACTAMENTE esos bytes
al lector real. Debe permitir la primera entrada, impedir repetirla, conservar
timestamp y rechazar un token revocado DESPUES de abrir el lector. Probar
payloads cortos/largos, distintos patrones y PC/celular. No parchear PNG en
la prueba positiva, no generar un QR alternativo ni llamar la accion directo.
Conservar archivo negativo y controles como regresion, no borrar evidencia.

Prueba permanente propuesta PENDIENTE de crear/ejecutar:
tests/e2e/qr-descargado-lector-real.spec.ts. La sonda documental existe y
diagnostica el fallo; que su control pase NO certifica el producto.

```comprobar
archivo: src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx
usa: downloadQR en src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx
usa: checkInGuest en src/app/evento/accesos/[fiestaId]/page.tsx
prueba: docs/evidencias/94-qr-imagen.spec.ts
prueba: docs/evidencias/92-entrada-pendientes.spec.ts
```
