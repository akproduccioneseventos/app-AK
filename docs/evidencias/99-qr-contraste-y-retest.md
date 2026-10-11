# Auditoria99 - QR recibido: avance real, cierre parcial

Rol: invitado guarda el pase; equipo lo lee y controla segunda entrada.
Fuente ejecutada: ca5b714d75635b633bf4618529938ed37fd40f73 (main/PR1289).
Rama QA: codex/auditoria-97-ia-contexto-20261011, PR1288, NO fusionar sola.
Resultado: PARCIAL. Ocho recorridos: seis pasan, dos fallan. No app sin errores.

## Contraste antes de probar

- Main paso de755f0707 a ca5b714d: incorpora qrConZonaBlanca y nivelM en
  portal/RSVP, otros exportadores y copyClipboard honesto. No reimplementar.
- PR1288 sigue abierta, sin una rama correctiva nueva visible. Trabajo local
  de otras IA NO CONTRASTADO: verificar antes de programar.
- next.config.js, multiagent-flow.ts y CSS/superficie live no cambiaron:
  conservar149 y150; NO repetir sus sondas ni emitir otra orden igual.
- Los criterios aceptados88-98 conservan evidencia; no se rerunaron.
- Se incorporo main a la rama QA local para resolver SOLO conflictos de
  registros. Archivos de producto son identicos a origin/main; no arreglo de
  app por Codex. Los cambios de1289 pertenecen a su autor, no a esta auditoria.
- Graphify ausente en este checkout; no extraccion general para este retest.

## Entorno y prueba

TEMP propio ak-entorno-aislado-99, HEAD ca5b714d. Next dev3300, Firestore8085,
Storage9195, proyecto demo-ak-producciones. Sin .env ni claves productivas;
credenciales dummy, sin mensajes/cobros/publicaciones a clientes.
Chromium PC1280x720 y Pixel7 emulado412x839/DPR2.625: NO telefono fisico.
No mocks de acciones, base, permisos de invitado o libreria lectora. Camara
ficticia solo habilita la pantalla del operador; lectura real POR ARCHIVO,
no certificacion de escaneo optico. Fixtures escritos y leidos por Admin SDK
real en emulador; tambien copia JSON de prueba, no usarla para dar por guardado.

99-qr-retest.spec.ts descarga con Guardar QR. PNG entregado SIN editar al input
del html5-qrcode real. Comprueba formato, borde blanco, acceso visible, SDK,
partySize2 y segunda entrada sin cambiar timestamp. No llama checkInGuest a mano.

| Caso | PC | Vista movil |
| --- | --- | --- |
| Pase exacto historico94 q92rmv2yk9b9, generado de nuevo por el portal | PASS | PASS |
| Token corto, id de fiesta e2e99 | PASS | FAIL lectura |
| UUID, id de fiesta e2e99 | PASS | FAIL lectura |
| Identificadores largos con forma de evento/invitado | PASS | PASS |

Primer grupo:99-browser-primer.json, seis recorridos4pass/2fail,5.3min.
Segundo:99-browser.json, SOLO historico94, dos recorridos2pass,46.4s.
Los tiempos incluyen compilacion fria local; NO medicion de velocidad productiva.
Sin omitidos. Aceptacion acotada: caso historico y seis pares positivos, no
todo el modulo, otras exportaciones, RSVP o todas las combinaciones de QR.

## QR99-LECTOR P2 - Residuo de147, NO una orden duplicada

Observado: los PNG moviles616x616 tienen borde blanco, pero el lector muestra
NotFoundException: No MultiFormat Readers were able to detect the code.
Dos archivos preservados:
- 99-artifactos/99-browser-primer-03-0.png (corto).
- 99-artifactos/99-browser-primer-04-0.png (UUID).
Sus capturas -03-1/-04-1 muestran el error. No ACCESO PERMITIDO.

99-qr-persistidos.spec.ts vuelve a sembrar SOLAMENTE esos invitados ficticios,
con el payload documentado en los GET originales de99-start.log. No cambia
tokens, imagen ni bytes. Cada PNG sigue fallando y checkedIn=false tanto con
viewport412 como1280 (lector CSS max384). NO demostrar reescalado como causa
unica: la geometria del lector casi no cambia con ese control de ancho.
Repeticion:99-control-repeticion.json/resultados, dos sondas positivas que
CONFIRMAN el negativo, no dos funcionalidades aprobadas.

Controles de densidad, misma fiesta/gid/token/ruta y boton real:
- Corto: archivo original616 falla; navegador DPR1 genera234 y el lector
  SI registra entrada; DPR2 genera470 y NO lee. Causalidad acotada al caso.
- UUID: original616 y controles234/470 NO leen. Cambiar densidad por si solo
  NO es solucion demostrada para los dos casos.
99-control.json/resultados: una sonda pasa y otra falla al exigir que alguno
de los controles lea. Capturas, archivos y SDK en99-artifactos/99-control-*.
El control positivo NO aprueba el PNG que descargaba el invitado originalmente.

ZXing directo tampoco pudo leer estos dos PNG: Dimensions could be not found
y FormatException. La primera sonda paro ANTES de recorrer la app: conservar
99-control-decoder-primer.json como diagnostico, NO dos defectos nuevos de app
ni prueba de que los payloads fueran rechazados por permisos.
No afirmar que todo QR es invalido, que el borde no sirve o que basta agrandar.

Impacto: un invitado con un pase descargado desde celular puede quedar sin
lectura en la entrada. El equipo no llega al guardado. El aviso tecnico no
orienta al operador; conservar esta friccion como parte de147, no sumar paneles.

Siguiente correccion: Gemini imagen/compatibilidad; Claude entrada/permisos y
compilacion. Contrastar tanda local antes. Usar estos DOS archivos como
regresion y mantener servidor/token/revocacion intactos. No volver a restaurar
el arreglo retirado ni pasar todos los casos a otro tamano sin comprobarlos.
Prueba permanente qr-descargado-lector-real.spec.ts ya EXISTE en ca5b714d;
la evidencia anterior de cuatro casos no cubria estos dos patrones nuevos.
Ampliarla con casos reproducibles y los PNG preservados, no borrar sus negativos.

## Comandos y cierre

```powershell
node docs/evidencias/99-ejecutar-aislado.mjs start
node docs/evidencias/99-ejecutar-aislado.mjs e2e
node docs/evidencias/99-ejecutar-aislado.mjs e2e --grep original94
node docs/evidencias/99-ejecutar-aislado.mjs control --project chromium-mobile
```

La sonda control evoluciono de ZXing previo -> repeticion -> densidades; los
JSON de las tres corridas quedan separados. No sumar aprobaciones diagnosticas
al contador de recorridos de negocio. Conservadas seis aceptaciones y dos
fallos de negocio, no suite totalmente verde.

Fixtures retirados en finally; lectura final del emulador no deja colecciones
con datos. El primer helper de limpieza tenia una ruta LOCAL heredada deTEMP98:
su lectura de la base demo8085 vale, su comprobacion local NO. Se corrigio el
helper y se verifico por separado TEMP99, incluyendo q92rmv2yk9b9, sin borrar
archivos ajenos.99-limpieza-verificada.json documenta esto; no ocultar el error QA.
99-runtime-detencion.json: arbol propio detenido;3300/8085/9195 sin listeners.

No build de producto, tipo/lint completo, cuentas reales, hardware, correo,
Hosting revision o los19 documentos originales probados. Claude compila.
No declarar0errores/14areaslimpias.149,150,3D y limites de acceso/datos/release
siguen separados; NO volver a ordenar144-146/148 ya aceptados98.
