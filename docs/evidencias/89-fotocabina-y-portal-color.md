# Auditoria 89 - Fotocabina: contenido de la foto; portal: color persistido

10/10/2026. Fuente ejecutada `2aac14e290b20945bd984a0c5e2ffdbe50eb853c`.
Main contrastado `0af74652ebdf4c813b9eb443c358d51bc24542d7`; consumidores
de fotocabina/portal y sus dependencias directas sin cambio en ese delta.
Se agrega a la PR documental1282, sin otra PR ni fusion. No producto modificado.
No conozco la tanda de programacion local no subida: orden140 exige contraste.

## Nuevo fallo reproducido: ENT89-IMAGEN P1

La fotocabina compone una imagen1200x1800 con plantilla pero foto interior negra.
No hay sesion del equipo; se entra con permiso firmado de esa estacion.
Camara nativa falsa de Chromium, boton real, Firestore/Storage demo, una foto por
tanda, sin filtros/chroma. No se fabrica el resultado de la app.

Control independiente de la MISMA srcObject: reproduce y obtiene307200pixeles
no negros en640x480. Video de la app: ancho1080, readyState4, pista live,
paused=true; foto resultante:0de280000pixeles no negros dentro de la fotografia,
excluyendo plantilla y pie. Capturas e imagen final inspeccionadas visualmente.
Sonda final `89-fotocabina-entrega-sucesiva.spec.ts` exige la imagen de la camara
antes de aprobar QR/descarga/persistencia de dos tandas. Falla esa asercion.

Datos: `89-e2e-nativa-y-portal-original.json`, adjuntos materializados en
`89-artifactos/`: diagnostico-camara, control-independiente, camara-antes,
pixeles-captura y recuerdo-compuesto. Orden140 paraGemini; Claude compila.
No se afirma defecto comprobado en Hosting/camara fisica, ni causa exacta
resuelta. No confundirlo con el antiguo null-ref ya corregido.

La aceptacion88 de tira/dimensiones y las pruebas existentes no comprobaban
la persona dentro de la foto. Siguen probando composicion, no captura completa.
Esta distincion invalida un certificado de estacion completa por esa prueba.

## Intentos de QA: no sumarlos como defectos

- Primero Storage inicia descarga al navegar: MIQA esperaba una imagen inline.
  Corregido: descargar desde el QR y comparar bytes. No cambio de la app.
- Segundo, dos archivos con IDs distintos eran iguales: no demuestra reutilizar
  una foto si la senal artificial puede repetirse. Esa asercion fue retirada.
- Camara canvas propia entregaba negro. No se usa para confirmar ENT89.
- Camara nativa primero se exigia lista antes de la accion, sin control. Se
  incorpora reproductor independiente de la MISMA senal; no fuerza el video de
  la app. La captura negra se comprueba despues del boton real.
- Una foto por tanda no tiene miniaturas de tres: MIselector espero una que no
  existe. Ahora se lee Captura Final y la region fotografica, no la decoracion.
- Portal: click inicial del segundo navegador antes de inicializar la sesion
  no abrio el modal; MIQA esperaba luego un swatch inexistente. Se espera cookie
  de portal creada por la pagina antes del click, sin sustituir auth/respuestas.

Raws originales conservados para explicar descartes. No son seis errores de
producto ni seis nuevas aprobaciones. No se ejecuta toda la app otra vez.

## Portal cliente: resultado final

PC: un E2E aprobado, ceroomitidos,42.1s.
`89-portal-color-desktop.json`; sonda `89-portal-color-persistido.spec.ts`.
Cliente sin cuenta del equipo cambia Dorado aEsmeralda desde Personalizar portada;
SDK lee primaryColor=#0d9488; otro navegador sin cuenta recibe swatch seleccionado;
la otra fiesta ficticia conserva #d97706. UI->SDK->otro consumidor, no solo toast.
Movil: un E2E aprobado, ceroomitidos,44.0s, `89-portal-color-mobile.json`.
Son dos recorridos nuevos en dos viewports, no dos areas completas aprobadas.
Capturas moviles inspeccionadas: el primer viewport no muestra texto solapado.
En el modal, campoURL queda visualmente muy estrecho y swatches se expanden;
friccion visual observada, no se probo escrituraURL ni se declara todo el modal
aprobado. Se conserva como observacion para la lista de mejoras posterior.

Se descarto propuesta preliminar del ayudante sobre corazones en PublicPortalView:
esa vista NO es el consumidor actual de /portal/c. La ruta usa
PublicPortalClientExperience. No crear orden por codigo sin consumidor real.

## Entorno y limites

TEMP reservado `ak-codex88/ak-entorno-aislado-RCYMug`, Nextdev por ruta;
emuladores127.0.0.1:8085/9195, proyecto demo-ak-producciones. Sin build nuevo,
credenciales reales, pagos, mensajes, publicaciones ni permisos de dispositivos
fisicos. Claves dummy: Vision devuelve rechazo y la subida queda para revision
manual; no prueba proveedor real. No nueva dependencia ni compilacion de app.
Graphify falta en este checkout y la ruta historica del Escritorio ya no existe;
no se reconstruyo un grafo entero para dos consumidores. Se verificaron simbolos
y rutas actuales por busqueda exacta. Ayudante economico terminado/cerrado.

SDK verifico al terminar: cero fiestas de las sondas89 y cero archivos de sus
capturas en el Storage demo. No se borraron datos ajenos.
Servidor/emuladores propios detenidos tras las pruebas, con PID/comando/fecha
comprobados; no quedan sesiones ni agentes pendientes de esta tanda.
Syntax-only de tres sondas y check-acentos2628archivos aprobados. No typecheck,
lint ni build amplio nuevos; no se modifica codigo de producto.

Pendientes siguen visibles: compras139, dibujo3D historico, captura140 y huecos
de matriz84. Hardware/proveedores/19originales son limites separados. No cerrar
14areas ni declarar ceroerrores. Mejoras de toda la app/IA DESPUES del cierre.
