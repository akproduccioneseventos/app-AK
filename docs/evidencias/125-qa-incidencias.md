#125: evidencias de entrada y pendientes reales

- Fuente app742, PR1297edeaf contrastada abierta; mainf04. PrivadoClaude NO
 CONTRASTADO. Se reutiliza build124 SOLO porque codigo y dependencias no cambian.
- Dos Luna acotados leyeron aliases y paquetes; no tomaron decisiones de plata,
 seguridad o fusion. Ambos cerrados. Inventarios son CANDIDATOS, no aprobaciones.
- Blog: lectura temprana mostraba href relativo. Al hacer clic llego a
 /#landing-services, target real,scroll1920,targetY160.39. Falso positivo;
 NO reencargar un arreglo ya hecho del pie de pagina.
- Kiosco anonimo no lee fiestas privadas; no inventar fallo de la app por no
 haber iniciado sesion. Con sesion QA ficticia, lista FiestaQA125 y once roles.
- Primer bootstrap se nego a empezar: el servidor QA ya habia creado11registros
 de cache/respaldo en su emulador. Se detuvo SOLO Next propio; se comprobaron
 namespaces automatico/backup_snapshots_v2/backup_system/json_documents y se
 limpio recursivamente SOLO ese SDKdemo. No datos/cuentas externos alterados.
- Nuevo bootstrap sanitiza arrays y objetos JSON antes de iniciar Next y guarda
 huellas por archivo. El candado inicialmente rechazo esos fixtures como codigo
 cambiado. Se adapto SOLO launcher125: source Git no puede cambiar, y runtime
 acepta exclusivamente huellas exactas de fixtures del proceso propio activo.
 No se relajaron controles sobre codigo ni cambios ajenos. Restaurar al terminar.
- Sondas CUA: Configuracion de Kiosco es texto, no heading; RegExp no admitido
 por waitForURL; primeros URLleidos antes de completar redirect. Se conservaron
 estos errores propios, no se convirtieron en defectos ni ajustes de produccion.
- Origen de redirects QA observado localhost, no127. Se comparo destino real,
 sin cambiar la app. /evento/actual conserva fiestaId tambien en query: eso NO
 es fallo. No se certifica OAuth/hosting ni cookies de la version publicada.
-32destinos de redirects comprobados en navegador; NO32modulos completos.
-94GET de entradas y1exclusion(importa29originales):74HTTP200,2HTTP307,
 12HTTP308,3HTTP400,2HTTP404,1HTTP503. 503de marketing necesita clasificar
 configuracion/permiso antes de llamarlo defecto; no asumir que todo5xx es bug.
- Diagnostico autentificado del503 confirma JSON: MARKETING_API_SECRET_KEY
 ausente en el entorno QA. Es bloqueo esperado de configuracion, no nuevo defecto.
 Primera lectura anonima siguio login y la sonda intento parsear HTML como JSON:
 fallo de diagnostico propio, no de la API. Se repitio con redirect manual,
 actor ficticio y content-type observado; no se tocaron respuestas de la app.
- Ediciones con ID qa125-not-provisioned NO prueban guardar un registro valido.
 No operaciones de dinero, mensajes reales, modelo externo ni equipo fisico.
-7wrappers y3reexports adicionales observados en navegador; once entradas
 comparten KioskSetup y preseleccionan su rol. No son21modulos aprobados.
-Defecto nuevo confirmado: campos fiesta/totem sin nombre accesible y seleccion
 de rol solo visual. Delta125 asocia labels/IDs, grupo/aria-pressed, h1 y alerta;
 no cambia rutas, permisos, apariencia, handlers ni decision SIN PIN.
-Primera prueba del ayudante colgada: mock useRouter devolvia objeto nuevo por
 render y reejecutaba el efecto. Se conserva125-before-router-mock-* con2fallos;
 se corrigio SOLO la prueba con router estable. Primera fuente era sucia:
 su SHA edeaf NO identifica el parche aun no comprometido. No certificarlo.
-Focales sobre fuente543b7f83:4suites17tests PASS. Smokes CLI/tar/RE2/selector4PASS;
 emuladores CLI15/Java21:3suites29tests PASS, avisos de permisos denegados
 esperados y open-handles previos conservados; salida0 y apagado normal.
-Java17 global se conserva. Primer intento sin AK_QA_JAVA_HOME se freno ANTES
 de iniciar: JAVA_HOME apuntaba a17. Se repitio con Java21 verificado solo para
 el proceso QA. Nunca usar ese bloqueo de entorno como nuevo error de la app.
-Main avanzo a d8800936 y Claude integro1297 via1298 durante125. Se creo rama
 desde ese main y se traslado SOLO delta125; codigo app main sin otras diferencias.
-Npm125 baja30->9avisos unicos y critical1->0.104entradas agregadas restantes
 (19high/85moderate), no104fallos funcionales. No equivale a seguridad completa.
-Antes de build se detecto que el nuevo grupo accesible perdia8px de separacion
 original. Se detuvo SOLO Jest propio de543, se archivo125-before-spacing-*,
 se preservo space-y-2 y se congelo58691f22. Corrida interrumpida NO PASS
 ni fallo nuevo de app: reiniciada amplia final sobre fuente586.
-Amplia586 completa:751suites4728tests PASS. Build586 fallo por displayName
 faltante en mock NUEVO de prueba: no error nuevo de la app publicada. Mock
 corregido y ESLint focal/focal2tests PASS en d200; salida anterior archivada
 125-before-display-name-*. No desactivar lint ni contarlo como build aprobado.
-Buildd200 INTERRUMPIDO propio al llegar maina4b609a0/PR1299, que integra
 CLI15.33/UUID11 de Claude y cambios reales de widget/ControlTower. Se conserva
 125-before-main1299-*. No valida esos cambios. Merge38ffd5b8 conserva ambos
 registros deYA y overrides compatibles; no se reemplazo doc ni codigo de Claude.
-RE21.27 candidato corre Node24 pero engines exige22.22.2/24.15 o superior;
 workflow usaNode20. Se RECHAZO como parche general y restauro1.24 del consumidor
 superstatic sin override. Re2 queda vulnerable: no esconder aviso ni mantener
 modulo incompatible para bajar contador. Prueba nativa previa1.27 historica
 archivada. El propio candidato fue descartado antes de entrega.
-Fuente0008a5ac: npm12avisos unicos/91entradas,0critical/19high/72moderate.
 Comparacion con Claude1299:13->12unicos por selector6.1.4; CLI/UUID YA main,
 no se entregan como trabajo nuevo. Mayor7 del selector sigue pendiente.
-Main4b6d6620/1300 agregaFTP6 de Claude y guardia de dependencias: integrado
 sin repetir su parche. RE21.24ya en consumidor real superstatic, no root;
 smoke propio prueba resolucion del consumidor y dice securityFixed=false.
-PWA: primeros6fallos eran mockmatchMedia ausente, archivados comoQA. Antes
 real4fallos/2PASS, final7PASS y ESLint limpio. Director reviso delta local;
 fuente42a25a31 congelada con main1300. NO instalacion real del OS certificada.
-Npm42:11GHSA/87entradas (15high/72moderate/0critical). Orden163 de Claude
 contiene guards estaticos; no son por si solos prueba de todas las cadenas
 transitivas de carga/ejecucion. No certificar seguridad total ni0avisos.
-Revision humana de screenshot42 detecto texto del totem invisible aunque
 inputValue era correcto. Reproducido en MISMO build42, no CSSmock:
 valorqa125-totem,colorrgb3/7/17,fondorgb2/6/23,contraste1.0013 (<4.5).
 Se reutilizo fuente42 sin el cambio de color para medir antes; se restauro
 SOLO el cambio propio despues. No modificar fotos para ocultar el defecto.
-Fixeconomico: texto slate100/placeholder slate400 solo ese Input. Fuente
 b520f7ce congelada, sin cambiar funciones/handlers/dimensiones/tema global.
 Focales y amplia/build/nativos nuevos requeridos;42quedaantes-del-color.
 Dependencias42se reutilizan SOLO al verificar blobs package/lock identicos.
-Primera sonda nativa encontro2alertas (la real y announcer deNext); selector
 propio ambiguo archivado125-before-alert-selector-*. Se especifico texto de
 errorreal, SIN cambiar la app. No es fallo de la pantalla.
-Final125 b520:759suites4765tests,buildtiposlint,6nativos PC/Pixel7 PASS;
  contraste texto18.414/placeholder7.868 y captura despues legible. SDK0,
  servicios/agentescerrados, bytesrestaurados. GatePASS_DELTA125_ONLY.
-Graphify local15117nodos44629edges1008comunidades,0LLM. Se renombraron
  comunidades porhub; NO se pidieron etiquetasLLM ni graficoHTML>5000nodos.
-PR1301 abierta paraClaude; baseMain4b6d6620 todavia igual al contrastar.
  Fuente prueba b520 es distinta deHEADde entrega con documentos; no confundirlas.
