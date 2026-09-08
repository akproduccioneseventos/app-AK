# Orden 48 - Entretenimiento: preservar el recuerdo y terminar la participacion

Fecha: 2026-09-08. Codex revisa y propone; Gemini programa; Claude Opus compila.
Estado: primera tanda de revision estatica, NO auditoria de entretenimiento terminada.
Base: main 8c5eb6e173e7b7b8dce6a8811cade7cf38411dfe, confirmado en GitHub en esta sesion.
Los archivos citados se cotejaron sin diferencias respecto de ese commit en la copia de
revision. No se cambio codigo ni se ejecutaron compilaciones, camaras o impresoras.

## Reutilizar lo de Claude

Se consultaron las entradas pertinentes de YA-RESUELTO.md hasta el 5 de septiembre.
Ya constan fondos con segmentacion real, firma/dibujo, musica/camara lenta en 360, marca
junto a QR y colas offline. NO pedir crearlos nuevamente ni afirmar que ninguna estacion
respeta ajustes. El Espejo requiere habilitar el modo correcto en la fiesta de prueba.
Una funcion existente puede tener un borde pendiente: estos hallazgos describen esos bordes,
no invalidan todo el trabajo. No se ha leido todo el historico ni probado todo el hardware.

## ENT-01 / P1: aviso remoto bloquea la conservacion sin conexion

Archivo: src/app/evento/fotocabina/[fiestaId]/page.tsx, handleAcceptAndPublish, lineas 824-847.
Tras poner processing, espera updateEntertainmentSessionStatus ANTES del try y ANTES de
comprobar navigator.onLine y guardar en IndexedDB. La funcion importada es una server action
de src/app/actions/fiesta/sesion-entretenimiento.ts. Si su transporte rechaza por falta de
red, no se alcanza el guardado offline ni el catch/finally de la subida.
Impacto condicionado a ese fallo: el invitado puede quedar esperando y su recuerdo no llega
a la cola aunque la estacion ya implementa guardado sin conexion.

Gemini: conservar primero el resultado o asegurar la ruta offline sin dependencia del aviso
remoto. Los avisos secundarios no deben impedir persistencia local ni repetir una subida ya
confirmada. Conservar controles de permiso y moderacion; no confundir rechazo definitivo con
falta de red. No eliminar la sincronizacion con el operador para sortear el problema.
Prueba requerida: capturar online, cortar red justo antes de aceptar y rechazar la server
action. Verificar archivo local, aviso honesto, recuperacion al volver y una sola publicacion.

## ENT-02 / P2: descarga directa sin la firma o dibujo mostrado

Archivo: misma fotocabina. El lienzo se superpone a capturedImage en lineas 1455-1472.
handleImprimir (705-715) y handleAcceptAndPublish (824-828) fusionan el dibujo con canvas.
handleDownload (968-975) descarga capturedImage directamente, sin esa fusion.
LienzoDibujoCompartido mantiene un canvas separado y no actualiza capturedImage al dibujar.
Condicion: dibujar y descargar sin imprimir antes. La imagen descargada no incorpora el
dibujo mostrado; lo implementado para imprimir/publicar no cubre esta tercera salida.

Gemini: un resultado final coherente para vista, descarga, impresion y publicacion. No
acumular la misma firma varias veces ni arrastrarla a la siguiente persona. Preservar
calidad, proporciones, marcos y cantidad de fotos; no reescribir toda la captura.
Pruebas requeridas: trazo reconocible y descarga directa; comparar pixeles/imagen final,
descarga repetida sin engrosar trazo; borrar dibujo y comenzar siguiente participante.

## ENT-03 / P1: Touchpix reinicia durante una subida pendiente

Archivo: src/app/evento/touchpix/[fiestaId]/page.tsx, lineas 711-843.
El timer de reviewSeconds se activa con capturedImage y !isProcessing; no depende de
isUploading. handleUpload deja capturedImage mientras espera al servidor. Si la subida
tarda mas que el tiempo restante, el timer llama retake(), limpia imagen/consentimiento,
renueva photoSessionId y abre camara; la promesa anterior todavia puede mostrar exito
y programar otro retake tras completarse.
No se probo filtracion real de datos. El riesgo observado es reinicio y respuesta tardia
de un ciclo previo mientras empieza otro; no hay prueba de uso real en esta tanda.

Gemini: impedir que el timer borre un recuerdo con entrega pendiente y ligar callbacks al
ciclo que los origino. Mantener salida recuperable ante error/timeout; no dejar la estacion
ocupada indefinidamente. Conservar el reinicio automatico aprobado despues de la revision
o entrega y los consentimientos existentes. No basta con cambiar el numero de segundos.
Pruebas requeridas: upload diferido mas alla de reviewSeconds, fallo, exito tardio y reset
del operador. Una respuesta del ciclo A no debe reiniciar ni confirmar el ciclo B.

## ENT-04 / P2: valor numerico de repeticiones sin contador observado

Archivos: plataforma-360/[fiestaId]/page.tsx:1059, bogue/[fiestaId]/page.tsx:1279 y
touchpix/[fiestaId]/page.tsx:1446/1515, todos bajo src/app/evento.
El runtime define maxRetakes entre 0 y 10 (station-config.ts:163), pero en estas pantallas
solo se consulta > 0 para mostrar el boton. No se encontro contador ni descuento en esas
rutas o en la accion de sesion inspeccionada. Asi, 1 y 10 no expresan limites distintos
en los controles revisados. No confundir repetir una toma con iniciar otra participacion.

Gemini: rastrear el contrato completo antes de tocarlo. Si hay limite en otro consumidor,
aportar referencia y prueba; si no, proponer a Codex como respetar el valor por ciclo.
Consultar al dueno si aplicar el limite altera el uso aprobado. No imponer limites globales
por invitado/evento ni inventar identificacion del participante para resolverlo.
Pruebas propuestas: valores 0/1/2 y reinicio para siguiente persona/orden del operador.

## Cobertura y direccion de experiencia

Lectura puntual: configurador, fotocabina, Touchpix, partes de 360/Bogue, barra, contrato
de estacion, lienzo y accion de sesion. No es prueba de cada boton. Barra ya tiene envio
de cola al volver la red: no se reporta ausente por el antecedente viejo. Mural, totems,
espejos comun/firma, buzon, karaoke y restantes experiencias requieren cobertura especifica.
No hubo navegador abierto utilizable al consultar ventanas; no se inicio otra sesion de
control ni se dio por probada una pantalla a partir de codigo. Impresion, movimiento del
equipo 360, camara real, IA externa y QR en segundo dispositivo siguen sin comprobar aqui.

Direccion propuesta, complementaria a la orden estetica: espera visual atractiva que invite
a participar; al capturar, una accion clara; al terminar, recuerdo protagonista y estado
inequivoco (guardado en este equipo / enviado / pendiente). No nueva pantalla de administracion
para el invitado ni efectos que distraigan de posicionarse, leer el QR o retirar el recuerdo.
Conservar personalizacion y mejoras ya hechas. Probar con equipo real antes de prometer
equivalencia con un sistema comercial. No agregar funciones solo para aumentar el catalogo.

## Entrega

Gemini confirma vigencia contra su main actual y evita pisar la rama local de otra IA.
Corregir solo lo autorizado; ENT-04 requiere aclarar contrato si cambia funcionamiento.
Una PR de la tanda, abierta, con evidencia focalizada y actualizacion del registro comun.
Claude Opus compila el commit final y registra entorno/comando/resultado. Codex revisa
hallazgos sensibles y evidencia; no ejecuta codigo ni duplica el build por defecto.
No usar datos/fotos de clientes para pruebas destructivas o publicacion. No fusionar.

## Comparacion externa solicitada: 8 de septiembre de 2026

Investigacion en documentacion oficial, no prueba practica ni ranking de calidad. No se
compraron licencias ni se instalaron productos. Las capacidades dependen de plataforma,
plan, equipo y permisos. El modulo de AK llamado Touchpix no demuestra por su nombre una
integracion con la plataforma comercial. No copiar sus marcas, assets ni codigo propietario.

### Referencias y traduccion a AK

1. **Foto Master / FMX:** documenta presets que combinan recorrido y composicion final,
   sincronizacion de evento y una prueba completa de captura, impresion y galeria antes
   de operar. Fuente: [guia de preparacion](https://support.fotomaster.com/articles/retro-mirror-booth-software-setup).
   Para AK: aprovechar plantillas y checklist existentes. Proponer un ensayo observable
   del preset elegido y guardar equipo/configuracion/resultado, no otro listado de tildes.
   Evidencia necesaria: el recuerdo de prueba coincide con lo configurado y se entrega.
2. **Snappic VideoFX:** combina efectos y transiciones mediante plantillas, con requisitos
   de camara/fps y limitaciones expresas. Fuente: [VideoFX](https://help.snappic.com/en/articles/9013100-videofx-templates).
   Para AK: pocas experiencias completas con ejemplos de video reales producidos por AK,
   para elegir sabiendo como queda el resultado. Ya hay musica, camara lenta y presets;
   no volver a pedir esas funciones como ausentes. Comprobar que cada opcion cambia el
   archivo final, no solo su nombre. No prometer alta velocidad con camara incompatible.
3. **Touchpix Scanpix:** documenta galeria/entrega por LAN y estacion secundaria; requiere
   equipo/router/red local. Fuente: [Scanpix](https://touchpix.com/knowledge-base/int-solutions/scanpix-touchpix-internet-free-sharing/).
   **Snappic** tambien documenta sincronizacion local de cabina a estacion de entrega con
   Wi-Fi/Bluetooth y dispositivos compatibles. Fuente: [sincronizacion local](https://help.snappic.com/en/articles/8857324-local-sharing-station-syncing).
   Para AK: evaluar retirar el recuerdo desde otro dispositivo, sin mantener ocupada la
   captura. Guardar offline en IndexedDB no prueba entrega local entre dispositivos.
   No se verifico equivalencia en AK; no declarar ausencia total solo por una busqueda.
   Requiere estudio y aprobacion de hardware/arquitectura antes de programar. No prometer
   AirDrop o servidor LAN desde un navegador sin validar soporte, red y privacidad.
4. **LumaBooth/dslrBooth:** documenta captura con camaras compatibles, composicion e
   impresion; parte del resultado depende del equipo, no de CSS.
   Fuentes: [flujo de Windows](https://support.lumasoft.co/en/articles/12831557-overview),
   [producto](https://dslrbooth.com/dslrBooth-Photo-Booth-Software).
   Para AK: registrar compatibilidad real de los equipos que usa el dueno. No prometer
   conexion universal USB o impresion automatica porque el navegador abre Imprimir.
5. **Walls.io:** permite aportes directos por QR sin perfil social y moderacion manual o
   automatica. Fuente: [Direct Posts](https://walls.io/features/direct-posts).
   Para AK: conservar el mural propio y mejorar preview/confirmacion de envio y pendiente
   de moderacion. Evaluar una presentacion del momento elegido por el operador en vez de
   llenar la pantalla con todo simultaneamente. Ya hay dedicatorias y controles; probarlos
   antes de proponer otro panel. NO mezclar Instagram con el mural de la fiesta.

### Evolucion mas vistosa, pero no prioridad de estabilidad

Snappic documenta animar una foto con IA y entregar el resultado al terminar el proceso,
sin que la persona espere ocupando la cabina. Su AI Video se anuncia en beta y por creditos:
[AI Video](https://help.snappic.com/en/articles/16199075-setting-up-ai-video).
Propuesta para evaluar en AK: recuerdo breve animado con estilo de fiesta, sobre el sistema
existente y con entrega privada por QR/portal, SIN exigir mail o telefono. No agregar otra
pantalla de Face Swap solo por novedad. Antes: verificar si ya existe, calidad con grupos,
espera, consentimiento, proveedor, costo por resultado y limite por evento. Tener Gemini
configurado no demuestra disponibilidad de un modelo de video ni consumo gratuito.
No implementarlo sin aprobacion de cambio funcional/costo; no bloquear el recuerdo normal.

### Orden recomendado y aceptacion

Primero ENT-01/02/03 y aclarar ENT-04. Despues proponer evolucion sobre lo existente:
- P1 producto: ensayo completo de estacion y recuperacion sin perder recuerdos.
- P2 experiencia: ejemplos animados reales de las plantillas, seleccion sencilla y resultado
  consistente. Medir tiempo de preparacion y de participacion antes/despues.
- P2 operacion, sujeto a viabilidad: entrega en segundo equipo, primero con el mecanismo
  existente; LAN offline solo si equipo/seguridad quedan resueltos y aprobados.
- P3 opcional: video IA con costo y limites transparentes, sin promesa de instantaneidad.
Las propuestas no son defectos verificados ni autorizacion para desarrollar todo. Gemini
debe comprobar lo existente y presentar alcance concreto; Codex revisa, Claude compila.
La comparacion cubre cabinas/espejos/360 y mural, no un estudio exhaustivo de barra, karaoke,
audio guestbook o todas las plataformas de eventos.

## Comprobacion automatica y evidencia

Los archivos de prueba siguientes son entregables propuestos, aun no creados aqui.
Reutilizar pruebas equivalentes y actualizar referencias, no duplicar auditorias pasadas.
El control detecta presencia/menciones, pero no ejecuta pruebas: exigir resultados y SHA.
La primera prueba debe demostrar persistencia sin red y dibujo presente en la descarga;
la segunda, impedir que una subida tardia reinicie el ciclo de otra persona. No basta
con abrir la ruta o comprobar que existe el boton. ENT-04 sigue sujeto a aclarar contrato;
las mejoras externas son propuestas, no quedan aprobadas al pasar este bloque.
No crear nuevos helpers o pruebas vacias solo para dejar en verde el inventario.

```comprobar
archivo: src/components/entretenimiento/LienzoDibujoCompartido.tsx
usa: LienzoDibujoCompartido en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: handleAcceptAndPublish en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: handleDownload en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: handleUpload en src/app/evento/touchpix/[fiestaId]/page.tsx
prueba: tests/e2e/48-fotocabina-recuerdo-seguro.spec.ts
prueba: tests/e2e/48-touchpix-entrega-sin-reinicio.spec.ts
```
