# Incidencias de las sondas151-154, no defectos de app

Se conservan recibos, fuentes iniciales y logs para no esconder fallos de QA ni
volver a emitir ordenes por ellos. Los resultados finales no borran los previos.

-151: el descubrimiento de acciones encontro dos alias y la primera asercion
  exigia uno. Otra sonda uso `/eventos` y recibio `{}` sin ejecutar saveFiesta.
  Esos negativos NO se aceptan. El transporte correcto pagina-web/RSC dio3PASS
  y1FAIL de sueldo, luego corregido por Claude y contrastado154.
-152: la primera amplia heredo banderas de navegador/JSON sobre tests que usan
  dobles Firestore. Corrida invalida, abortada solo su propio Jest PID3060,
  padre13136 y comando comprobados. La amplia final uso ambiente limpio.
-152 final:4997PASS/1FAIL. El unico fallo fue ENOENT `data/blog-posts.json`;
  el archivo Git estaba omitido por skip-worktree S. No fallo una asercion de
  contenido.154 uso blob canonico `9a2ac6b8cedaef2b903937b9e2ec16fb43a8d653`
  con las mismas aserciones y paso. NO se declara otra amplia entera verde.
-152 SDK: el JAR esperado no estaba; Java no arranco el emulador,0casos.
  Se restauro el JAR oficialv1.22.0 desde Google,136707194bytes,SHA256
  `9b6498b7f62714d67f48f59b3818883cd682dbcd46b9f59511de81c97bb5166c`,
  contrastado con metadatos instalados de firebase-tools. No dependencia productiva.
-Tras la interrupcion entre turnos faltaban fuente/build de TempQA152. No se
  conoce la causa y no se atribuye a otra IA. Se preparo copia persistente153.
-153: no quedo proceso activo ni BUILD_ID. Su recibo parcial dice building;
  no se acepta como compilacion terminada ni se atribuyen viajes nativos a ella.
-154 inicial: cargador TypeScript sin esModuleInterop produjo crypto.default
  undefined ANTES de casos,exit1. Se archivo, se alineo el loader al proyecto y
  la final exige9casos y al menos2transacciones. No fallo de autenticacion app.
-154 final uso SDK sin Next/browser/build, Java256MiB/Node192MiB y guardia768MiB.
  No relaja el minimo2GiB para compilaciones pesadas ni detuvo procesos ajenos.

Los recibos finales de fuente,0documentos demo y limpieza delimitan la aceptacion.
Ninguna incidencia de esta lista cuenta como nuevo defecto de producto.
