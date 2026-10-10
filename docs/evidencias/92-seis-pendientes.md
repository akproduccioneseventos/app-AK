# Auditoria92 - Los seis huecos solicitados

10/10/2026. Codex audita, no programa producto ni fusiona. Claude compila.
Primera fase2aac14e290b20945bd984a0c5e2ffdbe50eb853c. Durante las pruebas
Claude fusiono1282/1283. Se contrasto y se cambio el TEMP al main exacto
8521548477d90cc2ffa05e9f2edb22c6c51a893b, sin perder trabajos locales.
Las aprobaciones de compras, album y papel se repitieron porque cambiaron
sus consumidores. No se repitio toda la auditoria ni se marcaron14areas limpias.
Programacion local no subida: NO CONTRASTADA. Nueva orden143 para Claude.

## Entorno y limites

Nextdev3300, Firestore8085/Storage9195, demo-ak-producciones; datos propios.
Sin cuentas, dinero, mensajes ni credenciales reales; sin hardware ni build
optimizado. Dos agentes economicos prepararon sondas, despues se cerraron.
Sus borradores no fueron aceptados sin revision: tenian rutas/expectativas
equivocadas. No se cuentan sus afirmaciones como pruebas.

TEMP permite adicionalmente imagenes de127.0.0.1:9195 para el ensayo de video;
la app de produccion no se modifica. El contraste de geolocalizacion mantiene
su cabecera ORIGINAL. Override conservado en92-config-temp.patch.
pdf-lib1.17.1 instalado solo en TEMP/pdf92 para leer paginas PDF, no en la app.
88-preparar-aislado.mjs acepta --sha para no ejecutar otra vez una copia vieja.
El entorno y los resultados identifican exactamente el SHA, no solo la rama.

## 1. Catering integrado - APROBACION ACOTADA

Main85215484. UI elige menu, SDK guarda menuAsignadoId; recarga conserva
seleccion. Presupuesto de28:20adultos+5ninos+3adolescentes. Hoja real muestra
20porciones adulto,8infantiles,28entradas. Familia confirmada3 con Celiaco
y nota de utensilios separados llega a cocina; familia pendiente7 no se suma.

Compras reales:5kg/$500,1.60kg que compra2/$100,2.80kg que compra3/$60;
total660. PEDIDO y PAGADO TOTAL guardan estadosCompra; recarga y segundo
navegador los ven; invitados y menu permanecen. Es un estado de pago al
proveedor, NO una prueba de transferencia, cobro ni asiento contable bancario.
montoPagado queda0 por esta accion; no se declara movimiento de dinero real.

main-segundo:1E2E aprobado,207.830s (251.824s la tanda de dos pruebas).
Artefactos03/06/07/08 prueban menu, cocina, cantidades, costo y guardado.
Capturas11/12. Link Hoja de cocina no completo en15s; abrir su URL directamente
si completo. Queda friccion NO atribuida a produccion: la primera tanda mostro
reinicio de Nextdev por memoria. No se fabrica otro bug ni se declara que el
enlace directo/tiempo de desarrollo certifica navegacion de Hosting.

## 2. Invitado/entrada - REENTRADA BIEN, REVOCACION FALLA

PNG descargado del portal, lector html5-qrcode por archivo, operador con sesion.
QR vigente primera vez registra llegada. Segunda lectura muestra ya utilizado,
no agrega invitado ni cambia timestamp. Fuente2aac14e2; estos consumidores
siguen iguales en85215484. No camara/portero fisicos comprobados.

ACC92-REVOCACION P1 tambien falla en85215484: lector abierto antes de rotar
token; PNG viejo despues de rotar -> ACCESO PERMITIDO y checkedIn=true.
SDK mantiene token NUEVO. main-primer/09-qr-revocado.json y21captura;
seis-segunda/05reentrada y06revocacion anteriores. Orden143 no pide rehacer
entrada manual ni quitar permisos; pide validar credencial actual en servidor.

## 3. Llegada con ubicacion - BLOQUEO NATIVO DEMOSTRADO

PERS92-GEO P1. Permiso navegador granted, politica permite=false, errorcode1:
Geolocation has been disabled in this document by permissions policy.
next.config.js prohibe geolocation en TODAS las rutas; test actual exige eso.
Publicado akproducciones.uy200 trae misma cabecera. No se conoce SHA publicado
solo por ese GET. Main85215484 conserva config/consumidores de2aac14e2.

4E2E diagnosticos pasan (48.284s), NO4aprobaciones GPS: uno prueba bloqueo
NATIVO, otro denegacion real; dos inyectan coordenadas solo en el navegador
QA para comprobar servidor: salon0m aceptado/persistido/recarga y14939m
rechazado por radio300m sin escribir llegada. El inicial caso fuera no probaba
radio: rechazaba por falta de coordenadas. Se descarto esa falsa aprobacion.
Raws92-ubicacion-final.json, artefactosubicacion-final01-05, cabeceras92.
Retest despues de Claude SIN sustitucion de getCurrentPosition, ver orden143.

## 4. Impresion conjunta - APROBADA EN PAPEL VIRTUAL

Main85215484. Dos fiestas, tres recibos:1000/500/2000. Todas:3secciones y3A4;
filtro empleadoA:2secciones/2A4, excluyeB. Nombre con <texto literal> se muestra
como texto, no HTML. Datos de sueldos intactos. PDF leido por parser real;
92-recibos-paginacion-main.json, main-primer05-08 ycapturas17/18.
29.8s,1E2E aprobado. Porcentajes0 en este caso: NO retest de centavos142.

Para observar popup se evita su cierre200ms y se intercepta window.print
en headless, luego popup.pdf conserva DOM/CSS de impresion. No confirma
dialogo OS, impresora fisica, descarga PDF nativa, firma legal ni aportes.
Correcciones142 presentes en main, pero no confundir con aceptar todo142.

## 5. Album/dedicatoria/audio/volumen - RESULTADOS

Main85215484:200medios aprobados -> ZIP200, cada archivo con bytes exactos;
portada selecciona40, NO solo40descargables. Una dedicatoria extra no es una
imagen y actualmente no entra en el ZIP, por diseno observado, no bug supuesto.
Mensajes1 muestra texto; audio WebM real creado en QA reproduce paused=false.
Esto no prueba microfono/grabacion del invitado ni parlantes fisicos.

403 simulado en un medio caducado: ZIP trae los2disponibles; la version nueva
avisa2de3 y ofrece Reintentar. Token vencido se simula via HTTP403, no una
caducidad de credenciales del proveedor. Estado final de la sonda de ese aviso
se registra en92-album-final.json:1pasa,16.3s;20.868s incluyendo la tanda.
No contar los reintentos de QA como fallos.
main-primer01-03, main-segundo01/02 y album-final contienen evidencia.
No repetir orden141: codigo presente en main; esta tanda no retesta WebM
nombrado, todos los enlaces fallando, ni ZIP del equipo de la orden anterior.

## 6. Video de vida - ARCHIVO FINAL BIEN; LECTOR VISUAL LIMITADO

Main85215484 + allowlist HTTP soloTEMP. Sin sesion de equipo: subir01.png,
reemplazar por01.jpg con bytes/MIME comprobados. Storage conserva SOLO01.jpg;
HTTP200 devuelve exactamente el ultimo archivo. Fiesta/Storage propios borrados
al acabar. main-primer10/11/12.1E2E pasa para archivo/HTTP/recarga de formulario.

Recarga del formulario NO muestra la foto persistida en este emulador:
getLifeStoryVideoPhotos usa ACLpublica o firma deURL; no devuelve las URLs
locales de uploadToStorage. Es limite ya registrado88, no fallo publicado
demostrado ni otro encargo duplicado. Archivo final aceptado; entrega visual
tras recarga NO acreditada. No generacion del video editado final, voz ni IA real.

## Errores de mis sondas que NO son defectos de la app

- Seleccionar valor actual no dispara guardado: usar menu control y luego aprobado.
- QR de fixture demasiado largo a170px no lo leyo el lector; con longitud real
  el PNG descargado SI se decodifica. No arreglar produccion con este descarte.
- Contador del album incluye dedicatorias y seleccion maxima40: no pedir200en portada.
- Foto Subida devuelve nodo y status accesible; selector amplio era ambiguo.
- URL emulada no estaba permitida en NextImage: se habilita solo en TEMP, no producto.
- Expresion que prohibia 3recuerdos rechazaba erroneamente 2de3; corregida.
- Descargar genera evento antes del montaje del toast: esperar status, no leer vacio.
- GET de control a portada disparo compilacion74s/reinicio Nextdev. No confundir
  carga de QA con caida de Hosting ni repetir muchos builds para compensarlo.

Raws iniciales/segunda/main se conservan con sus fallos. Rutas equivocadas de
los ayudantes y esas expectativas se corrigieron SOLO en QA. No hubo codigo
productivo nuevo ni certificado0errores. La nueva PR entrega evidencia y143,
no es el arreglo de ACC92/PERS92 ni inicia el trabajo de otra IA por escribirla.

## Cierre de la tanda

92-limpieza-demo.json confirma cero restos propios en colecciones/Storage;
ajustes globales demo restaurados. Runtime propio detenido, cero procesos
restantes; no se detuvieron servicios de otras IA. Sintaxis5sondas y3runners
correcta, check-acentos2648archivos ygitdiffcheck bien. ESTADOactual40lineas.
No se ejecuto typecheck/lint/build global ni se certifico despliegue/0errores.
