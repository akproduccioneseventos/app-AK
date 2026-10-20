#150 - Viaje comercial movil cerrado y contraste con la entrega real

20/10/2026. Codex SOLO prueba/documenta; sin appedit ni merge. Dos agentes
economicos acotados, cerrados. El principal verifico/corrigio sus entregas.

## Lo que SI se completo

Viaje antes omitido133: Pixel7, main7230f9d02b32805952a185f704a0208bd5d643e6,
build135 verificadoporSHA/health.1PASS,0FAIL,0SKIP,36segundos. Presupuesto y
prospecto unicos, campanaFacebook conservada, PDF descargado, compartir y
coordinar interceptados sin enviar nada, CRM visible tras desplegar columna
movil y recargar. IDs de documento y contenido de negocio persisten. JSONlocal,
NO SDK/Firestore deproduccion. Gate PASS_COMMERCIAL_MOBILE_MAIN_JSON_ONLY.

PDF real descargado:2paginasA4,20servicios sin nombres omitidos, total84838,
precio porpersona1697 redondeado, regalos incluidos sin cobrar, numeracion y
cabeceras. Ambas paginas renderizadas y revisadas. Enlace personalizado NO
se corta: extremo554.97pt enpagina595.28, margen40.31pt. La sospecha visual
de enlace desbordado queda DESCARTADA por geometria. No orden por ese motivo.

Tres corridas previas NO aprobadas, conservadas como erroresQA, no appbugs:
1. No desplegar columnaCRMmovil; ya estaba documentada136.
2. Comparar timestamp e IDs internos de items como si fueran datos inmutables.
3. Normalizador propio usaba items, no el campo real itemsPresupuestados.
El caso final exige el mismo presupuesto y TODO lo demas salvo esos metadatos;
PDF/contactos nunca son opcionales. Originales y4reportes/logs comprimidos,
descargas de todos los intentos archivadas. Ver150-consolidado.json.

## Tanda actual: no confundir main, ramaClaude y PR1337

PR1337ABIERTA fuente45a0b1d4783ad58846c2e2d07ad8f318287024bf, base remota
860aa8c2641a6b8af3806bae08011dffa6276c80. Esa base NO esmain7230.
Las cinco pantallas de171/172/179/184 son identicas directamente a1328ef0;
perfiles.ts difiere. No equivale a identidad transitiva de toda la app.
package.json solo agrega un script respecto7230; dependencias/secciones de
resolucion ylock iguales permiten reutilizar node_modules, no afirmarpackage
completo identico. No reconstruccionGraphify ni nueva dependencia deproduccion.

Leidas193/194/195 enlaentrega:193bloque2 YA recoge variantes financieras149;
195 renumera186 con elMISMO ID AK-CODEX-149-COLA-PUERTA. No reenviarlas como
trabajo nuevo. Las pruebas de150 contrastan codigo cambiado, no repiten149:
-6casos sobre cuerpos reales saveFiesta/updateFiestaPartial/catering:
  4PASS/2FAIL. saveFiesta preserva identidad; parcial rechaza lista intacta
  y catering cruzaA/B conigualnombre/distintoID. Permisos calculados con modelo
  REAL; sesion/asignacion/read/transaccion dobles. Sigue pendiente193, noSDK.
-Cola de1337 reescrita:2PASS/1FAIL, todavia borraB mientras confirmaA. Ya195.
  No doble ingreso persistido demostrado. No camara/navegador en esta sonda.

NUEVO196/Claude: la respuesta de saveFiesta devuelve costos y pagos al
operador sinCONTABILIDAD/GANANCIAS. Control recortarFiestaPorPerfilPASS;
2variantes de salida incumplen ese filtro, UNA causa. Consumidor 'use client'
pagina-web usa useAutoSave -> saveFiesta, verificado enSHA45a0.
Es cuerpo real ejecutado con fronteras ficticias, NO explotacionHTTP real
ni filtracion de datos reales. No declarar todas las acciones afectadas.

Fortalecido150-frontera-guardado:4casos3PASS/1FAIL con guardia de asignacion,
modelo de perfiles yaccion REALES. Operador asignado permitido, entradaSIN
costos yrespuestaCONcostos; operador noasignado yanonimo rechazados sin writes,
dueno conservaacceso. Solo sesionverificada/datos/transaccion son dobles.
No repetir anterior sonda como si esto fuera otrobug ni afirmarHTTPfirmado.

El agente encontro estado filtroPublicaciones sin consumo en listadoPosts,
solo una pistaESTATICA de interfaz; NO usuario/navegador ejecutado y NO orden
de programacion emitida por esa lectura. Filtros faciales/mesas no aceptados
por lectura. No aprobar toda1337 por el cuerpo de su descripcion o sus verdes.
Cambios privados NO PUBLICADOS deClaude/Gemini siguen NO CONTRASTADOS.

## Observaciones UX, no defectos ni nuevas reglas

Capturas reales del viaje150: enCRMmovil las cinco tarjetas estadisticas
desplazan la lista de prospectos hacia abajo; enel resumen comercial hay
varias zonas con acciones dePDF/WhatsApp/reunion repetidas. Podria compactarse
lo interno y simplificar el cierre comercial sin esconder servicios ni quitar
promociones. Son propuestas pendientes de decision del dueno, no frenan el
PASS del viaje ni autorizan cambios silenciosos. Capturas fullPage no sirven
para juzgar por si solas posicion de elementos fijos; no se reporta ese falsofallo.

## Pendiente real y recursos

150-entorno.mjs prepara QA45a0, excluye credenciales, congela fuente, verifica
dependencias/lock, health y restauraJSON recursivo/testfiles. Preparadas fases
mobile171/172, date184 yagenda/catalogo179. No usar build14217d para45a0.
Preflight conguardia2GiB rechazo inicio; segundo intento conespera maxima10min
tambien fue rechazado. No se registro duracion exacta de esa espera. NO hubo
build ni archivo150-entorno.json ni servidores de esa copia.
Esto es bloqueo de entornoQA, NO error de build de la app. No se paro nadaajeno.

Quedan esos retests nativos de la fuente corregida y aceptacion de los
arreglos193/195/196, con SDK/frontera autentica ficticia donde corresponda.
Los viajes135/141/178142 y ligeros146 se conservan por alcance. No reabrirlos.
Cobertura421rutas/14areas/7perfiles sigue siendo inventario, no todos los
controles/estados aprobados. No porcentaje ni0errores ni certificado total.
19originales/OAuth/modelo/voz/Hosting/hardware requieren su evidencia externa.
