# Auditoria101 - Contraste de la entrega1290

Fuente ejecutada: main99faf4eb061fa46341cfdde6f81b93b3bfb9c73c.
Rama QA codex/auditoria-97-ia-contexto-20261011; PR1288, sin fusionar.
Resultado: PARTIAL.149 dos criterios aprobados;150 geometria vacio y foto
principal movil aprobadas, foto principal PC no cerrada;147 corto pasa y
UUID falla.7parespositivos/2negativos/1par parcial; no app entera aceptada.
No es una orden duplicada:149/150/147 tienen cambios en1290.151 no tiene
delta y NO se repite. Tanda local no subida NO CONTRASTADA.

## Entorno y alcance

TEMP propio ak-entorno-aislado-101, detached99faf4eb, sin .env productivas.
Firestore8085/Storage9195, proyecto demo-ak-producciones, Next dev3300.
PC1280x720/Pixel7 emulado412x839 DPR2.625. Sin build completo de la app.
Reuso de dependencias existentes, sin agregar paquetes de produccion.
No cuentas reales,19 presupuestos originales, envios/cobros ni hardware.

Proveedor Gemini bloqueado SOLO en Next mediante101-proveedor-caido.cjs:
error controlado al fetch, no respuestas del modelo o API inventadas.
Widget/API/Firebase reales. No certificar voz/modelo de pago/autonomia.
Graphify ausente en esta copia; no reconstruccion por una entrega acotada.

##149 - Dos criterios correctivos de IA

101-sonda-empaquetado.mjs aplica la configuracion webpack real al entry
minimo NodeSDK, no compila la aplicacion. Nativo, alias actual y control
sin alias construyen el SDK. El negativo97 false/no-constructor se conserva
como historia, NO como fallo actual. 101-empaquetado.json registra fuente.

101-ia-respaldo-historial.spec.ts, SOLO el caso de alcance97 antes negativo:
abrir FiestaA con FiestaB atrasada; preguntar desde el widget real de A.
Respuesta HTTP/JSON dice resumen automatico por proveedor caido, identifica
A y NO incluyeB; action none/savedChattrue. PC y movil PASAN.
No se repitio el historial A/B positivo97 sin cambios en su contrato.
No se probo el recorrido general ni todos los agentes por esta aceptacion.

PC primero agoto120s: ruta fria57.9s y APIfria42s, con cargas intermedias.
Raw101-e2e-primer.json conserva timeout y el positivo movil. Repetido SOLO
PC con240s y rutas calientes pasa16.444s. No convertir demora del dev/QA
en defecto de producto ni medida de performance publicada. El primer API
llego al error controlado del proveedor, NO al constructor roto.
El recolector no aceptaba e2e por el digito; corregido SOLO en QA. Las
capturas automaticas del timeout no se recuperaron; raw/error/log si.

##150 - Pintura y geometria, no solo DOM

101-mural.spec.ts siembra fiesta y post aprobado SOLO en emulador, abre el
mural publico sin sesion del equipo. Mide fixed/viewport/panel, decodificacion
y caja visible, captura PC/movil. NO inyecta position fixed ni cambia CSS.
Vacio genuino: titulo recibe su punto, panel tiene alto; PC/movil PASAN.
Foto principal movil: natural602, opacity1, caja398.8x429.2, panel614,
raiz839. Datos/post existen por SDK. Raw101-mural-selector-primer.json.
Foto principal PC: fue visible en capturas iniciales, pero la ultima sonda
no llego a medirla; captura muestra vacio y Reconectando. Sin snapshot SDK
en ese timeout ni respuesta individual identificada, causa NO confirmada.
No nueva orden de bug por una medicion incompleta; pedir contraste a Claude.
Geometria vacio: panel590/659,raiz720/839; titulo pintado en ambos.

Error propio QA: pointReceives exigido a la imagen rechazaba una capa de
caption/gradiente legitima. La captura muestra la foto visible; dos negativos
de esa exigencia NO son defectos app. Raw101-mural-primer.json preservado.
Intermedio elimino esa exigencia y paso, pero midio la copia decorativa de
fondo opacity0.3. No se usa para aceptar la geometria de la foto principal.
Sonda img.object-contain acepta foto movil pero no encuentra la PC. La ultima
sonda PC excluye el fondo borroso; tampoco encuentra la principal. Estos
dos intentos no prueban un selector malo ni una foto perdida: son parciales,
con captura vacia/reconectando. Un vistazo aparte del navegador devolvio[]
cuando el fixture ya se estaba retirando; NO diagnostico de producto.
Vacio no se repite. No reabrir moderacion144 aceptada98 ni exigir quitar la
capa de captions. Raw intermedios y capturas preservados, no conjunto verde.
Cada fase tiene prefijo primer/intermedio/selector-primer/ultimo en mapas y
capturas. Se retiraron SOLO copias generadas con prefijo ambiguo101-mural-NN;
asi una captura vieja no se presenta como evidencia de la ultima corrida.

##147 - QR que antes fallo, mismo contenido

101-qr-retest.spec.ts usa los ids/guestIds/tokens exactos de los dos patrones
moviles negativos99, conservados en el control99:
e2e_99_qr_corto_1791695521018 y e2e_99_qr_uuid_1791695586308.
PC/movil, boton GuardarQR, PNG descargado directo al lector de la app y
SDK checkedIn/checkInTimestamp; segunda lectura no cuenta dos veces.
Resultado101-qr.json: corto PC/movil2pass con segunda lectura/timestamp
intacto; UUID PC/movil2fail, lector NotFoundException: No MultiFormat Readers
were able to detect the code. Misma causa residual147, NO dos bugs nuevos.
Sin bordes/escalado de rescate ni regeneracion en QA.

Ambos PNGUUID nuevos son276x276 y EXACTAMENTE iguales, SHA256
178ee11b19547512912630eaca90474726b0244b409b2afa73ba92a677c62498.
No es aun el difuminado por DPR de99: el archivo ya no cambia con el DPR.
101-qr-control.spec.ts vuelve a subir ese archivo conservado, mismo invitado
y lectorreal: PC/movil2 controles diagnosticos pasan al confirmar el FALLO.
SDK antes/despues iguales (hash del documento y datos invitado), checkedInfalse.
Estos controles NO son2 QR aprobados. No token revocado/permiso rechazado.
No se identifico la causa interna del decodificador ni se probo otro motor.
jsqr/pngjs/zxing/qr-scanner ausentes; no se instalaron dependencias de app.

El archivo descargado de modulos enteros puede ser MENOR que el canvas
de pantalla con DPR2.625; se retira la vieja exigencia de ser mas grande.
Se conserva formato PNG, geometria cuadrada/margen blanco y criterio de
lectura real. Esa dimension no es un requerimiento del negocio.
No repetir original94/production-shaped sin necesidad en esta vuelta;
sus resultados99 siguen historicos, NO ocho positivos del nuevo helper.

## Cierre y limites

101-limpieza.json: sin fixtures propios restantes, cero archivos/documentos
retirados al final y sesiones propias restantes cero. Se conservaron SOLO
agregados del demo: chats/memory/ai-consumo/voz-uso/rate-limit. No base real.
101-runtime-detencion.json: arbol propio detenido,puertos3300/8085/9195libres.
Claude compila y registra
Hosting del mismo SHA por separado. Actions rojos por facturacion no usados.
No correcciones de producto por Codex, no PR fusionada, no14areaslimpias ni
certificado0errores. Orden151 y limites3D/19/integraciones/hardware continúan.
Sintaxis de sondas,check:acentos2745 y diff de producto contra main vacio.
No tsc/Jest/build completos por esta tanda de QA; no validar release con ello.

Comandos: node docs/evidencias/101-ejecutar-aislado.mjs start; luego modos
e2e --grep 'respaldo de ESTA', mural, qr --grep '(short|uuid)', qrcontrol.
Los reportes primer/intermedio explican reintentos/errores propios. Informe
manda para conteo final; no sumar corridas repetidas como funcionalidades.
