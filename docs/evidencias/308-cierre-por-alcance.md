# Auditoria de cierre267-307: evidencia y limites

Fuente actual3e45a4ac6b479f89605163168e31b37dc84f2d0f, main dePR1360.
Baseline nativo725e62ba2f909578628fad47402d125ed9632c70.
Codex no cambio codigo de la app ni fusiono. QA ficticio, claves yHOME aislados,
sin proveedores/cuentas/cobros/mensajes/hardware reales. Cambios privados posteriores
NO CONTRASTADOS. El trabajo manual del dueno no forma parte de este pendiente.

## Cierres comprobados

| Control | Fuente y resultado observado | Limite |
| --- | --- | --- |
|218: respuesta tardia de intento fallido|285,3e,2PASS AdminSDK real: conserva aprobacion/acreditacion unica|Un intercalado y su control; identidad/notificaciones controladas|
|219: escritor iniciado antes de firma|286,3e,2PASS AdminSDK real: firmaA bloquea textoB y conserva huella|Gancho adaptado al borde actual actualizarFiesta; no dos servidores|
|Regresiones de los autores|287,3e,3suites16PASS|Jest con dobles; no toda contabilidad/contratos|
|Compilacion QA actual|291,3e,exit0/tipos/lint/sourceDiff0|Dependencias reutilizadas; @types/estree1.0.8 vs1.0.9lock, no npm-ci limpio|
|Conciliacion del reporte|276,8pruebas del parser PASS;277 compara formato real con stats productor|Prueba de herramientaQA, NO8funciones de app|
|Portada: seleccionar360 y consultar|307,3e,2PASS PC/celular: clic confiable, h3 cambia y enlace comercial menciona360|Interaccion real de esa seccion; no toda web|
|VideoVida lectura yEspejo moderacion|304,3e,5PASS1SKIP:4casos lector PC/celular y1espejoSDK escritorio|Emuladores locales, camara ficticia, falloVision controlado; no proveedor/hardware|

285/286 limpiaron todos sus documentos ficticios (0restantes,DELETE200).
284 explica que219 ya persiste por actualizarFiesta y no por el antiguo escritor;
se movio SOLO el punto de inyeccion de la sonda, no las aserciones.
263/264 conservan los fallos del antes; no son defectos aun abiertos en3e.

## Bateria de navegador, sin inflar cantidades

269 termino19grupos antes de su limite global de cuatro horas;274 continuo
solo los archivos que tenian casos no ejecutados. Los fallos iniciales permanecen.
277, NO el contador preliminar273, concilia ambos recibos originales:

- 1144casos unicos reportados;542ejecutados.
- 496ultimosPASS y46ultimosFAIL/timeout, NO46causas de app confirmadas.
- 600SKIP declarados:516son capturas optativas, no funciones sin probar.
- 2FIXME de la vidriera de portada; el equivalenteXVsi se ejecuto.
- Recorrido-de-pantallas estaba excluido por driver Y configuracionQA.

Errores QA del parser inicial: omitir titulo colapsaba tests generados,
tomar expected/unexpected como passed/failed, y leer proyecto desde spec.
276-inicial conserva esa version;276 actual y277 la corrigen sin borrar datos.

278/279 y288 separan fallos de captura/teardown/selector y candidatos funcionales;
ningun candidato de esa clasificacion preliminar equivale a una orden nueva.
Un ejemplo visto en pantalla: cocina muestra8/8/2027 correctamente pero su
captura agota5000ms esperando estabilidad; eso no reabre184 por fecha.

## Continuidad actual (NO resultados anticipados)

- 296 completo un lote27PASS3FAIL; segundo lote interrumpido cuando RAM bajo
  repetidamente de128MiB. Fallos/teardown/captura conservados, no se dieronPASS.
- 309 termino los arboles propios; taskkill devolvio error por un hijo que ya
  salia/protegido.312 verifico raices ausentes y restauro losJSON desdeGit fuente
  congelada; no comparacion con los snapshots en memoria que se perdieron.
- 305 quedo interrumpido sin iniciar sus trabajos.311 continua con307,304,
  310(restantes,UNarchivo/lote) y297; no dos servidoresQA a la vez.
- 297 activa recorrido original: solo escritorio y un carril; guard DNS/contexto.
  Abrir rutas y tomar fotos NO certifica cada boton, rol o sincronizacion.
- 303/304 TERMINARON:5PASS1SKIP, cleanupFirestore200, sourceDiff0.
  El SKIP es espejo en celular, deliberado por el test original. No equivale
  a un quinto caso sin probar ni a certificarVision/firmantes externos.
- 299:1PASSmovil/1FAILescritorio tras clic a coordenada manual; captura posterior
  muestra otra posicion del boton. La geometria pudo cambiar mientras se
  desplazaba. No es defecto confirmado.306/307 usara actionability, evento
  confiable y cambio visible delh3/contacto; no mera presencia de texto enDOM.
 307 TERMINO2PASS sin cambiar app:294/295/298/299 quedan como problemas
  del clicQA previo, no una orden para reprogramar la portada.

Los recibos se actualizan al terminar cada corrida; pendiente no significaPASS.
La fuente compilada no se modifica durante pruebas. Los bytes de datos locales
se restauran despues de cada lote; los servicios propios se cierran al finalizar.

## Trabajo ya encargado, no ordenes duplicadas

217R2-R4,212,214 y215 siguen conGemini, segun ultimoSHA publico contrastado.
No volver a programar218/219 ni los cierres254/255 porque un informe historico
los muestre en rojo. Contrastar una entrega nueva antes de retest o de ordenar.

## Criterio de conclusion

El indice253 conserva las14areas auditadas y sus comprobaciones concretas.
AUDITADO no significa cada accion/estado/rol aceptado. Ni una ruta existente,
ni un build, ni un test omitido sustituyen un resultado observado.
Esta entrega NO es certificado de0errores ni de toda la app lista.
