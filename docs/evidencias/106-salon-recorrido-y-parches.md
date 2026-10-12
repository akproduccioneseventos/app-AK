# Codex106 - Salón real, controles y dos parches compatibles

Base contrastada: PR1288 abierta, HEAD48829bfde9e419903944b60f8b4f26fe86dc1415.
Main99faf4eb, sin cambios desde la tanda105. No se fusiona ni se repite toda la auditoría.

## Fallos reproducidos antes de corregir
- App construida a33a54d91bf704f52fe11d1afbc956ebd8e819a5, mismo código de app en488.
- Navegador PC/celular: 4 pruebas fallan; 2 muestran la ayuda dentro del lienzo.
  La captura móvil105 ya mostraba el solapamiento con el dock de navegación.
- Las otras2 comprueban que Recorrer no mueve los píxeles de la escena.
  El estado enRecorridoCamara sólo alcanzaba el icono y el aviso; nunca OrbitControls.
- Las bibliotecas anteriores fallan las3 regresiones: headers de prototipo,
  nombres de archivo con CR/LF y offset indexado enorme. No se afirma explotación
  en una ruta de la app ni se ejecuta un bucle malicioso de millones de líneas.

## Corrección mínima y antecedentes conservados
- Primer retest583c9b27: 4138Jest/tipos/acentos/build pasan, navegador6pass/2fail.
  Recorrer ya gira; Pausar conserva demasiada inercia(PC9.4%, móvil5.2% de píxeles).
  Se mantiene el criterio de la prueba: desactivar damping sólo durante el giro
  automático evita acumular inercia; la interacción manual conserva damping.
  El texto de rueda se muestra sólo en escritorio. Se repetirán los controles
  sobre el nuevo SHA; NO se aprueba por los resultados anteriores.
- La ayuda existente pasa al flujo normal encima del lienzo; no tapa la cámara.
- Recorrer transmite autoRotate a SceneContent/OrbitControls; apagado por defecto.
  Pausar recorrido conserva el control manual. El aviso ya no promete pantalla completa.
- Sólo2 entradas del lock: @fastify/busboy3.2.0→3.2.2 y source-map-js1.2.1→1.2.2.
  Rangos existentes firebase-admin13.10.0(^3.0.0) y postcss8.5.26(^1.2.1).
  No force, cambios mayores, downgrades, dependencias nuevas ni nuevos permisos.
- Regresiones de bibliotecas reales y4 pruebas nuevas del navegador PC/celular.
  Se conserva105 como histórico válido para su SHA, no como prueba del nuevo código.

## La captura encuentra lo que el contador de pruebas no encontraba

- b7206bc77917c8b5f31e01b4a024ed8a4a02f8ce pasó4138Jest y8navegador.
  Sus capturas muestran12mesas anunciadas y un salón vacío. NO era un vacío esperado.
  Esas pruebas acreditaban dibujo/cámara, no mobiliario ni color seleccionado.
- Consumidor page configurador-reunion devolvía elements/primaryColor; SceneContent
  leía salonElements/colorPalette. Se corrige el consumidor, sin inventar campos
  de compatibilidad globales. Un Pick estricto evita volver a escribir claves ajenas.
- El título heredaba text-foreground de CardTitle, negro sobre slate950:
  contraste medido1.001:1 en PC/celular. Se añade text-white sólo al consumidor.
- Los colores LED se comprimían en el encabezado de escritorio;44px cuadrados,
  shrink-0 y envoltura del encabezado conservan círculo y señalan selección.
- Prueba React del consumidor: antes salonElements undefined; después12mesas y
  pista/DJ/barra, LEDazul y13mesas al subir adultos100→105, total120→125.
  Sólo catálogo, precios, router y renderer están simulados en esta prueba.
  No certifica cálculos comerciales. El navegador usa el renderer/WebGL reales.
- Se conservan dos fallos del harness, NO defectos de app: catálogo vacío bloquea
  por diseño; expectativa10mesas se rectifica a12 tras el efecto real de invitados.
- Nuevas4 pruebas de navegador: contraste/círculos y cambio real de píxeles por
  LED/invitados en PC/celular. Baselineb720 falla contraste y ausencia aria-pressed;
  esa corrida NO alcanzó las aserciones de color/mesas del lienzo.
- Fuente final congelada8fa5b56a2833938541a657dcd15ef88130d24b0e.
  Focalizadas4pass, tipos/acentos exit0(2771archivos);692suites/4139Jest
  aprobadas,0fallidas/0omitidas. Build canónico exit0 con lint/tipos/PWA activos.
  Standalone desactivado SOLO QA local: no certifica empaquetado Firebase.

## Aceptación final del navegador, sin ocultar intentos anteriores
- App8fa, matriz de12casos únicos aprobada en106-validacion.json.
- Ronda de12:11pass/1timeout en la sonda móvil que consultaba getParameter.
  Se conserva106-3d-pre-framebuffer. La app NO cambió para el retest.
- Se observa bindFramebuffer en memoria en lugar de consultar GPU por frame.
  Retest dirigido:2cámaras aprobadas,0omitidas/0flaky, mismo timeout120s.
  Los10otros casos ya aprobados sobre8fa se reutilizan; se selecciona el último
  resultado de cada cámara. No se afirma que una corrida12/12 existió.
- Giro real: diferencia viewMatrix PC0.03943098/móvil0.06843501; al pausar0.
  Los píxeles siguen variando3.6%-3.7% por luces de PistaBaile3D.useFrame;
  eso NO era un fallo de la pausa. No se apaga la pista ni se afloja el criterio.
- Fuente app8fa; harness6c3d69717f4aff83a389ff28fd169a99e0297e3e sólo cambia E2E
  y documentación. Tipos del harness exit0 con4GB. Se conservan errores iniciales
  de tipos de la sonda y OOM auxiliar2GB: no se presentan como defectos de app.
- Capturas inspeccionadas PC/móvil: mesas/pista/DJ/barra dibujadas, LEDazul real,
  círculos sin compresión y ayuda fuera del lienzo. Contraste supera4.5:1.
- Fricción aparte: barra flotante sobre parte de Guardar enPC; flujo de guardado
  no probado aquí. No se cierra por haber corregido el salón.

## Fuentes y alcance de seguridad
- [Busboy boundary](https://github.com/advisories/GHSA-xjh9-v7x6-24jw),
  [headers](https://github.com/advisories/GHSA-x8mw-p69m-v3mx),
  [CR/LF](https://github.com/advisories/GHSA-gxm5-99cw-xjw9).
- [Source maps](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
- Las versiones parchean4 avisos únicos. El retest cubre headers/CRLF/offsets,
  NO una explotación pública ni el caso boundary de252bytes. Audit posterior:
  0critical/25high/65moderate/1low,91entradas agregadas y27GHSA únicos,
  frente a31antes. Se eliminan4avisos y no aparece ninguno nuevo.
- Instalación limpia exit0 con --ignore-scripts (prepare asume .git directorio);
  no se certifica ese hook. node_modules privado, no junction. Sin datos reales,
  cuentas pagas ni pruebas físicas. Graphify queda registrado aparte.

## Entrega para Claude
- Orden152 en docs/ordenes: comprobar barra/guardado aislado y clasificar27GHSA.
  No se inicia otra IA al escribirla; no se programa mas en esta tanda.
- Graphify incremental exit0 en6c3d6971:6archivos reextraidos/2529reutilizados;
 13713nodos/42463relaciones/838comunidades finales. Salida local ignorada por Git.
  Log106 conservado; no se agrega una dependencia de produccion.
