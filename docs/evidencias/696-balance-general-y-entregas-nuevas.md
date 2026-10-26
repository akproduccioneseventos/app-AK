# Balance general de auditoria - 26/10/2026

Pedido: revisar toda la auditoria, lo corregido y lo que falta, sin reiniciar
lo ya comprobado. Este es un balance de evidencia, NO una ejecucion nueva
de pruebas ni aprobacion automatica de las dos propuestas nuevas.

## Versiones contrastadas

| Version | SHA | Estado observado |
| --- | --- | --- |
| Main | 3e45a4ac6b479f89605163168e31b37dc84f2d0f | Sigue siendo main; no se publico otra version por Codex. |
| App de ultima matriz Codex | d4c69f2b2395ad3abcaee4fb166bcefbdc1457e0 | Build680/tipos/lint,681:5278PASS y682:22PASS, sobre ESA fuente. |
| PR1363/Codex | 47502ecb0e9f94e4862c680ac734beebae27be81 | App igualD4;691/694/695 son balance e instalacion aislada. Abierta. |
| PR1364/integracionClaude | 99d0900ddccec6b745fb1bb7c5b905f2c2fe4047 | NUEVA. Conserva los4blobs focalesD4; incluye otros cambios. No aceptada entera por Codex. |
| PR1365/Gemini234-235 | 3bedbeecbe066e20d810d341451d3914b4781191 | NUEVA. Web del evento conIA y automatizaciones. No auditada funcionalmente por Codex aun. |

Los resultados de Claude/Gemini en las descripciones de sus PR son resultados
REPORTADOS por ellos. No se presentan como pruebas ejecutadas por Codex.
Cambios privados posteriores no publicados NO CONTRASTADOS.

## 1. Todo lo que SI tiene auditoria documentada

AUDITADO significa comprobaciones concretas registradas del area. No significa
que cada boton/estado de cada perfil haya quedado aceptado. El indice253 y
los recibos originales conservan la fuente y alcance de cada comprobacion.

| Area | Comprobaciones registradas | Cierre / limite actual |
| --- | --- | --- |
| Cobros, cuotas, facturas y recibos | Reintentos, concurrencia, saldos, rechazo, importes y lectura ausente/fallida |124/128/130/133/154/222; factura387 y681:3PASS. No cobro real ni homologacion de nuevos consumidores. |
| Contrato, seña y firma | Resumen del cliente, constancia, firma concurrente, texto firmado, cancelacion y reprogramacion |254SDK11PASS;285/286 cierran intercalados. No certificado legal ni firma fisica. |
| Comida, compras e insumos | Fecha civil enUruguay, cantidades, compras y controles de costos |129/131/133/151/154. Nuevos choques de alergias235 quedan fuera de esos recibos. |
| Ingreso, sesiones y permisos | Propio/ajeno, perfiles, datos recortados y rol antiguoadmin |136/154/156/157/160/178;230 yvarianteD4 cerradas. Nuevos onceconsumidores233 requieren contraste propio. |
| Fiesta y planificacion | Agenda, mesas, invitados, tareas, asignaciones y persistencia por viajes |126/131/132/133/135/151. No cada tarjeta/accion aceptada. Nuevas tareas235 no homologadas. |
| Portal cliente | Pago, banco, album, musica, portada, cambios, firma y recarga |188-195/221-229/240/242;357 cierra botones de pago/album por su alcance. No todas las combinaciones aceptadas. |
| Portal invitado | Identidad, enlaces, limites de acceso y contenidos pendientes privados |126/133/157;647 compruebaMuro. No todos los proveedores reales ni cada invitacion. |
| Web, blog y simuladores | Recorridos publicos, guardado, PDF/CRM, menu/paquetes y navegacion |133/150/154/155/161/172/442/554/650.1364 cambia precios/PDF: revisar SOLOdelta, no reencargar fallos viejos. |
| Redes y galeria | Duplicacion, sincronizador por alcance y protocoloMeta |155/161/164/174/180/197/237. Nuevos borradores235 no probados. NoOAuth/canal real certificado. |
| Entretenimiento | Fotocabina,360,espejo,estaciones,tokens,AR,3D,filtros ymedios por casos |125/133/135/157/174/180/182/233/609/614/685. No calidad global de modelo ni equipos reales. |
| Barra ytotem | Pedidos, orden, stock0, veinte ciclos sugerir/cancelar, DJ ycontraste |132/135/455/546/609/620.220 cerrada por alcance; no pantalla/equipo fisico certificado. |
| Asistente, voz yWhatsApp | Intento vs cotizacion nueva, resultados veraces, ACK, confirmaciones yprotocolo |118-121/135/157/162/171/174/180/182/237. Dobles no certifican voz/modelo/canal real. Nuevos automatismos235 sin aceptar. |
| Personal yrecibos | Acceso propio, preservacion de datos porID, rol cocina/atencion yagenda |129/131/133/154/160/178/179/181/191/209. No salarios/permisos nuevos aprobados por indice. |
| Tareas automaticas | Reservas, errores de lectura/envio, reintentos yrecordatorios |129/131/158-160/162/164/247-250/388.217 cerrada por los escenarios registrados, no por respuestaHTTP sola. |

## 2. Corregido y comprobado: no volver a pedirlo desde informes viejos

- Guardado manual/configurador tras perder respuesta:118/119; mismo intento
  no implica otra venta; cotizacion deliberada identica sigue permitida.
- Firmas/constancias/resumen ycompensaciones concurrentes:254/285/286, con
  el alcance de esos recibos, sin extenderlos a nuevos cambios de contrato.
- Avisos de pago, pedidos de servicios/menu yreintentos:221/222/223/242.
- Filtros214, barra220 ylectura fallida de factura221:597/482 y691 concilian
  sus cierres; no son cinco causas aun abiertas por la tabla historica253.
- Muro:647 prueba unID,pending no publico yrecarga PC/movil;650 descarta
  el diagnostico viejo porPNG1px/regex incorrecta. No fingir fallaStorage.
- Perfil invalido conroleadmin, audio importado, captura vacia, cuenta,
  reintento ytema del buzon:685/D4, con5278pruebas canonicas y22
  criterios de navegador. Los seis oficiales683 estan INCLUIDOS en22.
- Instalacion limpia690:2061paquetes,694 confirma2061versiones exactas,
  sin obligatorios ausentes ni modificarlock;Sharp encode/decodePASS.

No sumar intentos de distintas versiones como nuevas funcionalidades.
640 historico mantiene258claves:211PASS/11FAIL/36SKIP ydosMuro aparte;
11FAIL no significan oncebugs vigentes.421rutas/7perfiles son inventario,
NO un certificado de cada control ni catorce areas completamente limpias.

## 3. Lo corregido en entregas nuevas, TODAVIA sin aceptacion propia global

En1364 compare los blobsD4 de require-session.ts, buzon/[fiestaId]/page.tsx,
recorded-video.ts yvideo-frame-processor.ts: CUATRO identicos. Esto confirma
que Claude conservo esos arreglos, no que toda la integracion este probada.

1364 agrega44archivos de src/tests/scripts frente aD4: incluye precios y
catalogo de simulador, documentosPDF, resumen, permisos233, publicidad que
propone yno ejecuta sola, acceso de redes yenlace de asistencia. Package,
lock, reglasFirestore/Storage yNextconfig consultados siguen igualesD4.

1365 tiene59archivos de src/tests/scripts cambiados contra su ancestro comun
con main. Las ramas1364/1365 NOson equivalentes; su merge-base es
b4ec9a1ef6f98f3993e1bafbfeaed73b48fdb5d0. Una diferencia entre sus arboles
NO es automaticamente una eliminacion introducida por laPR: no reportar
retrocesos de toda la app mirando un diff directo entre ramas divergentes.

## 4. Lista estable y concreta de trabajo que falta a Codex

1. Retest del DELTA1364: precios/variantesbuffet/redondeos/total PDF-pantalla,
   onceconsumidores de permisos233, confirmacion del agente de publicidad,
   destino del editor de invitacion yacceso al centro de redes. No reauditar
   loscuatroblobsD4 ni toda la app desde cero.
2. Auditoria funcional de la NUEVA1365/ordenes234-235: generar web sinpisar
   contenidos/manuales, deshacer/rehacer; borradores de CRM/WhatsApp/redes;
   extraerrecibos sincontabilizar sinconfirmacion; tareas/logistica/DJ;
   feedback, alergias, paletas yresumen de consultas. Separar modelo doblado
   de proveedorreal yconservar decisiones dinero/comida/permisos deClaude.
3. Validacion sobre UNA fuente conjunta congelada cuando exista: confirmar
   que integrar ambas entregas conserva cierres yno duplica acciones ni
   altera permisos/importes.5278/22 sobreD4 NO aceptan ese nuevo conjunto.

Son pendientes de AUDITORIA de codigo NUEVO, no nuevos defectos demostrados
ni ordenes para reprogramar lo ya cerrado. No se inicia otra compilacion en
esta tarea de recuento. No se inventa un SHA de integracion que aun no existe.

La comprobacion extra de tipos con dependenciaslimpias692/693 es INCONCLUSA
porheapOOM1536/2048, no un errorapp probado ni unPASS. No repetirla igual.
Build680/tipos sigue aprobado para su entorno original. No nueva deuda de
programacion por ese limite. No proveedores/Hosting/modelo/voz reales
certificados; no se atribuye al dueño trabajo de auditoria virtual.

## Resultado para el dueño

Se revisaron las14areas con evidencia concreta y se corrigieron los casos
enumerados. Eso NO permite decir toda la app/cadaboton/cadarol sin errores.
La revision pendiente ahora corresponde a las dos entregas NUEVAS ysu
integracion, no a volver a empezar las14areas. Los arreglos en propuestas
abiertas tampoco son automaticamente arreglos publicados en la web.
