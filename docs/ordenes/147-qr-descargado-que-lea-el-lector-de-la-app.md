# Orden147 - El QR descargado debe funcionar en el lector de AK

## Actualizacion99: correccion recibida, NO cierre general

Ejecutado ca5b714d (main/1289), con borde y nivelM presentes. Seis de ocho
recorridos pasan, incluido el pase historico94 PC/movil. Dos PNG descargados
en vista movil siguen dando NotFoundException; mismo archivo repetido deja
checkedIn=false. No duplicar esta orden ni volver al codigo viejo.
Informe: docs/evidencias/99-qr-contraste-y-retest.md.
Archivos negativos exactos:99-artifactos/99-browser-primer-03-0.png y-04-0.png.
Control DPR1 resuelve SOLO el corto; UUID no se resuelve con DPR1 ni2. No
recomendar un nuevo tamano universal. Mantener permisos y rechazo de revocados.
La prueba permanente de abajo YA EXISTE; ampliar patrones, no crearla otra vez.
Trabajo correctivo LOCAL NO CONTRASTADO; antes de tocar, contrastar su HEAD.

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

## Contraste101 de1290 - Modulos enteros, UUID todavia no aceptado

Fuente EJECUTADA main99faf4eb061fa46341cfdde6f81b93b3bfb9c73c.
NO CONTRASTADO CON TANDA CORRECTIVA LOCAL NO SUBIDA. No reimplementar el
generador anterior ni pedir otra propuesta: esta es UNA ampliacion de147.
Informe101-retest-1290-ia-mural-qr.md/raw101-qr/qrcontrol/artifactos.

- Id e2e_99_qr_uuid_1791695586308, guestIdg99uuid, token UUID
  11111111-2222-4333-8444-555555555555: GuardarQR entrega PNG276cuadrado,
  el lector real no lo detecta en PC ni movil. Mismos datos del negativo99.
- Ambos archivos SON iguales SHA256178ee11b19547512912630eaca90474726b0244b409b2afa73ba92a677c62498.
  Repeticion con el PNG conservado confirma el error, SDK intacto/checkedInfalse.
- Corto PC/movil si lee, segunda lectura no duplica y conserva timestamp.
  No es permiso ni marca de entrada falsa. No declarar100% por una muestra
  aleatoria que no incluyo este caso conocido; 299/300 no cierra el negativo.

Revisar compatibilidad de la exportacion con el decodificador real usando
ESTE PNG como regresion, y validar consumidor antes de cerrar. No adjudicar
causa interna al lector sin comparar ni aumentar borde/resolucion a ciegas:
modulos enteros/DPR independiente ya estan implementados. No cambiar tokens,
permisos ni contenido comercial del QR sin decision del dueno. Si se elige
otro motor o respaldo, justificar y probar; Codex no instalo ni programo uno.
No afirmar que RSVP/los otros QR fallan por este caso: no ejecutados101.

## Aceptacion pendiente de la correccion

En el SHA corregido, descargar desde Guardar QR y subir EXACTAMENTE esos bytes
al lector real. Debe permitir la primera entrada, impedir repetirla, conservar
timestamp y rechazar un token revocado DESPUES de abrir el lector. Probar
payloads cortos/largos, distintos patrones y PC/celular. No parchear PNG en
la prueba positiva, no generar un QR alternativo ni llamar la accion directo.
Conservar archivo negativo y controles como regresion, no borrar evidencia.

Estado historico94 (superado en ca5b714d): prueba entonces propuesta pendiente.
Estado99: prueba creada en1289; aceptacion parcial y patrones pendientes arriba.
tests/e2e/qr-descargado-lector-real.spec.ts. La sonda documental existe y
diagnostica el fallo; que su control pase NO certifica el producto.

```comprobar
archivo: src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx
usa: downloadQR en src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx
usa: checkInGuest en src/app/evento/accesos/[fiestaId]/page.tsx
prueba: docs/evidencias/94-qr-imagen.spec.ts
prueba: docs/evidencias/92-entrada-pendientes.spec.ts
usa: qrParaDescargarEntero en src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx
usa: qrParaDescargarEntero en src/app/invitacion/[fiestaId]/rsvp/page.tsx
usa: qrConZonaBlanca en src/app/(app)/fiestas/nueva/invitados/page.tsx
usa: qrConZonaBlanca en src/components/invitacion/edit/ControlPanel.tsx
usa: qrConZonaBlanca en src/components/invitacion/edit/SeccionRedesSociales.tsx
usa: qrConZonaBlanca en src/app/(app)/fiestas/nueva/pagina-web/page.tsx
prueba: src/__tests__/el-qr-descargado-tiene-zona-blanca.test.ts
prueba: tests/e2e/qr-descargado-lector-real.spec.ts
prueba: docs/evidencias/99-qr-retest.spec.ts
prueba: docs/evidencias/99-qr-persistidos.spec.ts
prueba: docs/evidencias/101-qr-retest.spec.ts
prueba: docs/evidencias/101-qr-control.spec.ts
```
