# Codex109 - avisos y cobertura, no certificado total

Fuente app8fa5b56a, HEAD43620d4c, main99faf4eb, PR1288 abierta.
User pide puntos3(seguridad) y4(cobertura). Sin cambios productivos/build/merge.
Tanda privada de Claude desconocida. Reutiliza aceptaciones84/88-108 por caso,
no vuelve a pedir comida/contabilidad/QR/mural ya aprobados por falta de palabra.

## Seguridad:27 revisados, ninguno borrado por decreto

Todos los27 avisos unicos106 tienen metadata primaria GitHub, version instalada,
padres de dependencia y evaluacion109-seguridad-contraste.json.gz. Auditoria106
reutilizada porque lock no cambio. No se declara un nuevo npm audit completo.
Se conserva primer timeout de metadata y fallos ENOBUFS de npm explain; metadata
faltante se recupera, padres de lock reemplazan explicaciones demasiado grandes.

-3 sharp: runtime publico comprobado. Request normal al optimizador200/image/png,
  9528bytes; instalado0.34.5/libvips8.17.3, Next admite rama35.4+. Requiere parche.
-9 tooling/build: entradas de glob/CSS/targets no controladas por requests en
  lo inspeccionado; no son9 fallos de navegacion. braces sin parche en snapshot.
-4 OpenTelemetry: alias NodeSDK no-op, sin paquete en nft inspeccionado. No
  certificado del servidor separado de desarrollo ni toda propagacion posible.
-11 condiciones no encontradas: grpc2,DOMPurify2,fast-uri3,fflate1,qs2,uuid1.
  Ausencia de llamada directa/nft NO basta para eliminar dependencia vulnerable.
  jspdf.html si se usa; su sanitize recibe string sin IN_PLACE/hooks. Unidades
  no prueban todos los proveedores ni permiten hacer overrides mayores ciegos.

Fuentes oficiales enlazadas por aviso en JSON; ejemplos de runtime:
https://github.com/advisories/GHSA-f88m-g3jw-g9cj
https://github.com/advisories/GHSA-rgj7-g3m4-5g8c
https://github.com/advisories/GHSA-wq5f-xc86-pv6w
No PoC malicioso ejecutado ni explotacion/ataque real afirmado.

## P1 nuevo: una familia, cinco endpoints

GET /api/employee-contracts/:filename, /api/contracts/:filename,
/api/payment-proofs/:filename, /api/budgets/:filename,
/api/salon-contracts/:filename. Handlers/perfiles iguales a main.
35 lecturas:7 perfiles por5 archivosPDF propios (bytes/marker/hash).
Cinco controles dueno200; cinco anonimos401; secretaria registrada sin asumir
que todo le debe estar prohibido.20 lecturas de operador/personal/cliente/invitado
reciben200 con bytes exactos de documento ajeno: FAIL de permiso/pertenencia.
No sesion productiva falsificada, no lectura de clientes reales. Orden155.

Los cinco perfiles distintos de dueno/anonimo reciben403 en backup: prueba de
que el servidor distingue perfiles. Click real del enlace backup operadorPC/movil
recibe403, noZIP. UI sigue ofreciendo accion no permitida: friccion, no fuga.
Datos de fixture retirados tras cada corrida. Positivos/negativos van juntos;
exit0 de la sonda acredita recoleccion, NO la politica de permisos aprobada.

## Inventario para dejar de adivinar cobertura

421archivos-ruta:373paginas y48handlers. AST enumera4992declaraciones de controles:
4147 enpaginas,845 en144componentes. No cuenta instancias renderizadas, variantes,
menus montados al pulsar ni teclas. No significa4992botones reales distintos.
106rutas tienen referencia textualE2E;315 no coincidieron. No es conteo de
aprobadas/sin probar: una prueba dinamica puede cubrir ruta sin citarla literalmente.
Por area13conrutas; barra tiene sus paginas mapeadas afiesta/estaciones por carpetas,
NO se concluye que falte modulo/barra ni que requiera otra implementacion.

Primer inventario del ayudante366 referencias incluia simbolos internos comunes;
se corrige por AST/exports y rutas exactas; ninguna referencia se convierte en PASS.
Se descartan propuestas de /api/backup, /api/contracts y /api/cron genericos porque
no existen en esa forma; existen rutas con sufijos. No se envian esas rutas aClaude.
El recuento no usa pruebas propuestas como realizadas ni todo el texto de un informe
como aprobacion de todas las pantallas. Resultado fuente/confianza separado.

Conciliacion posterior109-matriz-conciliada.json.gz: se validaron hashes del archivo
comprimido y JSON106 original (692suites/4139pass) y se indexaron imports AST.
11rutas tienen referencia unitaria directa;325 importan dependencia con pruebas;
106 tienen referencia E2E. Son conjuntos solapados, no sumar para crear porcentaje.
73no tienen enlace automatico a ninguno de esos tres tipos: hay aliases, paginas
con prueba dinamica y recorridos antiguos que necesitan contraste manual. No son
73defectos ni73modulos nunca auditados. No se ejecutaron4139pruebas otra vez.
La matriz conserva suite/titulos/status/mocks, dependencia directa ySHA; incluso
una unidad directa aprobada no certifica todos los botones de esa pagina.
Los cuatro artefactos grandes se suben gzip sin perdida, no200mil lineas de JSON.
109-artifactos-comprimidos.json conserva hashes crudos/comprimidos; lectores admiten
gzip cuando no existe la copiaJSON local. No se elimina evidencia ni cambian resultados.

## Limites reales del punto4

Queda COMPLETO el inventario reproducible de estos archivos/controles declarados,
no su aceptacion funcional. Se cerraron pruebas nuevas de acceso a documentos,
revelando un defecto pendiente: no se declara cada boton/variante/permiso aprobado.
Falta conciliar casos dinamicos/unitarios/manuales por consumidor y ejecutar los
estados realmente faltantes; no convertir315 coincidencias ausentes en315ordenes.
Retests152-154 siguen separados;19 originales,proveedores/modelos reales,
Hosting mismoSHA/hardware no se certifican por estos casos. No0errores globales.

## Incidentes del auditor, no de la app

Primera sonda: falta expires en cookie de APIRequestContext, no solicitud valida.
Segunda: cookie con payload de usuario sin serializar como ResponseCookies; falla
firma en todos los roles, incluido dueno. No se cuenta como controles denegados.
Correccion solo harness: encodeURIComponent del token completo, el parser de
cookie decodifica una vez. Dueno200 y backup403 para otros demuestran el control.
Primeros JSON/execs preservados; fixtures retirados tambien en fallos.
No quitar HMAC, cambiar session-token ni permitir mas acceso para aprobar sondas.
Servidor propio detenido intencionalmente; exit4294967295 del wrapper por
Stop-Process no es caida de la app. Puerto3300 libre y sin diff en datos al cerrar.
