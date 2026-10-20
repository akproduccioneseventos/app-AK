# 155 - Galeria publica: recorrido de teclado del componente

Rol: prospecto que abre una foto, cambia de imagen y vuelve a la galeria.
Fuente: main `894d01603e0e03cebc8f90a6ccf869ef86bbe1de`.
Resultado: PARCIAL,7PASS/2FAIL; los dos FAIL describen UNA friccion de foco.

## Lo observado

Se renderizo GallerySection REAL con React, framer-motion y next/image reales,
en jsdom, sin red ni imagenes/datos del negocio. Las tres imagenes son ficticias.
El control positivo usa Radix real y SI consigue mover el foco al dialogo,
descartando que el DOM de prueba sea incapaz de hacerlo.

-PASS: control positivo; abrir visor; avanzar; retroceder; volver de primera a
  ultima; enfocar boton Cerrar; cerrar con Escape.
-FAIL: al abrir, document.activeElement sigue siendo el boton Abrir foto de la
  cuadricula, fuera del dialogo. Se conserva outerHTML exacto en el JSON.
-FAIL: enfocando Cerrar y cerrando con Escape, el dialogo desaparece pero el foco
  queda en BODY, no en el boton que lo abrio. No se afirma que Escape no funcione.

No se probo Tab nativo, lector de pantalla, geometria, imagenes remotas ni todos
los estados de la galeria. Esto NO es una aceptacion del recorrido en navegador.
La restauracion de foco y entrada al modal son la recomendacion199, no dos bugs.

## Consumidor y contraste

src/app/page.tsx: AsyncGallerySection devuelve GaleriaUnificadaSection; su
contenido fotos renderiza GallerySection en
src/components/landing/GaleriaUnificadaSection.tsx. No es un componente sin uso.
GallerySection y los seis modulos efectivamente cargados no cambian en1337/45a0.
Claude publico fc5e606a solo cambia ESTADO-ACTUAL respecto main. NO CONTRASTADO
CON CAMBIOS PRIVADOS NO PUBLICADOS: contrastar antes de implementar.

No se encontro este criterio de foco en los recibos134/150/154 ni en la busqueda
dirigida del historial y193/194/196. Esto no convierte la busqueda en cobertura
exhaustiva de todas las auditorias. No se reabren171/184/186 ni198.

## Incidencias de QA conservadas

-155-galeria-teclado-inicial.mjs: un parentesis de mas, fallo sintactico antes de
  ejecutar casos. Archivo conservado, no es un fallo de app.
-155-galeria-control-appdialog.mjs: control positivo mal elegido. El Dialog de
  la app cancela autofocus expresamente; por eso no era un control valido para
  exigirlo. No se informa ese resultado como otro defecto ni se pide cambiar
  Dialog global. Se reemplazo SOLO el control por Radix sin esa cancelacion.
-Cua: abrir la web agoto navegacion, getFrameTree agoto espera y el ultimo intento
  reinicio el kernel. El inventario si mostro la URL/titulo; no es evidencia de
  que el recorrido se haya realizado. No se clasifican esos errores como app.
  La pestaña creada es temporal, sin marca de conservacion; cierre al acabar el
  turno segun el proveedor, no se afirma cierre manual comprobado.
-Luna acotado no pudo leer los recibos en su entorno y no propuso candidatos.
  Se cerro; no se atribuye a ese agente la comprobacion de este hallazgo.

## Reproduccion

`node --max-old-space-size=384 docs/evidencias/155-galeria-teclado.mjs`

La sonda preserva su recibo y apunta deliberadamente al SHA auditado. Para el
arreglo se necesita otro namespace y SHA, no borrar el JSON ni convertir esta
sonda congelada en una supuesta prueba de una version futura. No se compilo la
app ni se cambio codigo de produccion, importes, fotos o clasificacion.
