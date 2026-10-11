# Auditoria100 - Un corte real de lectura llega como portal invalido o calendario vacio

Fuente ejecutada y main contrastado: ca5b714d75635b633bf4618529938ed37fd40f73.
Rama QA codex/auditoria-97-ia-contexto-20261011; PR1288, sin fusionar.
Resultado: FAIL. Dos efectos verificados PC/movil, una causa compartida.
Orden151 Claude: lector/permisos; Gemini UI solo si hace falta; Claude compila.
Tanda correctiva LOCAL NO CONTRASTADA: comprobarla antes de programar.

## Alcance nuevo, no repetir lo anterior

El registro de Claude indica que el portal lanza cuando falla la lectura y
que el presupuesto avisa si no puede leer fechas. Los tests de ese barrido
simulan leerFiestasCrudas/getFiestas lanzando: no ejecutan la dependencia
real que esta debajo. Esta auditoria recorre justamente esa cadena, no vuelve
a pedir la funcionalidad ya escrita ni reabre el lector Video de Vida148.
No hay delta en149/150 ni en el residuo147; no se repitieron sus sondas.
Los criterios aceptados88-98 se conservan. No14areaslimpias/no0errores.

## Entorno y mecanismo de fallo

TEMP propio ak-entorno-aislado-100, detached ca5b714d, sin .env productivas.
Next dev3300, Firestore8085/Storage9195, proyecto demo-ak-producciones, dummy
keys. Chromium PC1280x720 y Pixel7 emulado412x839; no telefonos fisicos.
No datos reales, presupuestos guardados, cobros ni envios. Sin build de app.

100-corte-lectura.cjs se precarga SOLO en Next aislado. Mientras existe el
flag propio, Query.get de la coleccion fiestas rechaza con codigo14. Todas
las demas consultas y las lecturas de comprobacion SDK siguen reales.
No se reemplazan leerFiestasCrudas, getFiestaByAccessKey, getOcupiedDates,
acciones HTTP, componentes o mensajes. Es un fallo CONTROLADO en el limite
del proveedor, no una caida espontanea medida en produccion.
El JSONL registra consulta filtrada2 y lectura completa0, con fecha/PID.

Los fixtures viven SOLO en Firestore. El ayudante existente crea JSON local
automaticamente; la sonda corregida lo retira antes del recorrido, para no
confundir una copia local con recuperacion de la base. Cada fixture esta
guardado y comprobado por Admin SDK real. Al quitar el corte se abre la
misma pantalla y el documento sigue igual.

## LEC100-PORTAL P2 - Enlace valido anunciado como invalido

Ruta /portal/c/[accessKey], rol cliente sin sesion del equipo.
1. Crear fiesta ficticia con enabled=true y clave propia SOLO en emulador.
2. Abrir su portal: Personalizar portada aparece; sin cookie ak_session.
3. Activar corte de lectura; recargar la misma direccion.
4. Dice Portal no encontrado y que el enlace no es valido/ha expirado,
   pide uno nuevo. Reintentar NO aparece; el documento existe por SDK.
5. Quitar corte y recargar manualmente: portal abre y datos iguales.

PC y movil: dos negativos en100-portal.json/resultados. UI/SDK/log/capturas
en100-artifactos/100-portal-*. Dos consultas fallidas verificadas por caso:
primaria con filtros2 y compatible con filtros0. No token vencido ni dato perdido.
Impacto: el cliente cree que perdio acceso y contacta al equipo innecesariamente.
No se certifico el reset del error boundary: la cadena no llega a ese boundary.

Control genuino sin enlace: Portal no encontrado correcto PC/movil, dos
aprobaciones en100-browser-setup-primer.json. No repetir el control sin delta.
100-missing-resultados.json enlaza los dos PNG extraidos de attachments inline
del raw original; no se reutilizaron rutas de capturas sobrescritas en el rerun.

## LEC100-FECHAS P2 - Error de fechas convertido en lista vacia

Ruta /presupuestos/nuevo/crear, rol equipo ficticio con sesion firmada.
Fiesta conocida por SDK con fecha2027-08-08; sin copia local.
1. Abrir formulario de presupuesto: paso1 termina de cargar.
2. Activar corte de lectura y recargar; consulta completa fiestas falla.
3. Formulario carga campos y Siguiente; NO aparece el aviso existente
   No pudimos leer las fechas ocupadas.
4. Respuesta real Next Action200 incluye1:[]; warning=0 en ambos viewports.
5. Quitar corte y recargar: formulario abre; documento de fiesta intacto.

Dos negativos en100-dates.json/resultados. Datos, respuestas HTTP, corte y
capturas en100-artifactos/100-dates-*. No se guardo presupuesto ni se probo
una reserva doble; no afirmar que el fallo modifico dinero o fechas.
Impacto: el equipo no sabe que debe comprobar disponibilidad por otro medio.

## Causa contrastada y limite del arreglo anterior

- src/lib/firebase-sync.ts:553 listCollectionFromFirestore captura errores
  reales y devuelve[] (tambien tiene vacios intencionales de build/sin dbAdmin).
- src/lib/fiesta/leer-fiestas.ts:54 leerColeccion recibe[] y no puede distinguir
  fallo de coleccion realmente vacia. Su propio catch ademas cae a JSON local.
- getFiestaByAccessKey:212 consulta directa falla y pasa al lector compatible;
  devuelve null. PublicPortalPage:161 acaba en notFound, no PortalError.
- getFiestas:210 usa ese lector. getOcupiedDates:218 recibe[] y retorna[];
  el catch del consumidor nunca se activa, occupiedDatesFailed siguefalse.
- src/__tests__/una-lectura-que-falla-no-se-muestra-como-vacio.test.ts simula
  el lector crudo: explica por que ese test puede pasar y este recorrido no.

No cambiar todo el lector compartido a throw a ciegas. Un agente economico
READ ONLY verifico consumidores y modos: conservar build/sin base/local y
validar contratos de lectores antes de propagar fallos reales. No se le
delegaron decisiones de permisos/dinero ni correcciones; no hizo tests/build.
El director verifico los dos efectos, cadena y evidencias. No promesa de
ahorro medido de tokens ni auditoria completa de todos los consumidores.

## Corridas, error propio QA y limpieza

Primera corrida: dos controles de enlace inexistente pasan; dos casos de
outage paran en preparacion porque el helper habia escrito JSON local. NO son
dos fallos de app. Raw100-browser-setup-primer.json/100-e2e.log conservados.
Retirados dos documentos y cuatro archivos SOLO propios, registrado en
100-limpieza-setup-primer.json. Corregida la sonda, no codigo de producto.
Despues SOLO los dos casos de outage se repiten: ambos llegan al negativo
de app y recuperan datos. Se agrega calendario PC/movil, dos negativos.
Negativos reales4; control genuino2pass. No sumar errores de preparacion al
numero de defectos de app ni a nuevas areas; dos efectos/una causa.

```powershell
node docs/evidencias/100-ejecutar-aislado.mjs start
$env:QA100_REPORT='100-portal.json'
node docs/evidencias/100-ejecutar-aislado.mjs e2e --grep 'Existing client'
node docs/evidencias/100-ejecutar-aislado.mjs dates
```

100-limpieza.json: sin documentos/archivos/colecciones restantes del demo.
100-runtime-detencion.json: arbol propio detenido;3300/8085/9195 libres.
Agente cerrado. Sin dependencia de produccion instalada ni codigo app cambiado.
No se ejecutaron build/tipos/lint completos, cuenta real/Hosting, hardware o
conciliacion de19 originales. Claude compila; ninguna PR fusionada por Codex.
