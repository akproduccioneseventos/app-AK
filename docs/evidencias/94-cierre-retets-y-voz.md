# Auditoria94 - Retests pendientes y voz real del widget

10/10/2026. Fuente ejecutada: **9a054620718673f00e10b52f0811cc1af729ba4e**.
Main remoto sigue en ese SHA; rama QA codex/auditoria-93-cierre-antiguos-20261010,
PR1286 abierta. NO CONTRASTADO CON LA TANDA DE PROGRAMACION LOCAL NO SUBIDA.
No hay otra PR abierta accesible en este contraste. No dar por inexistente
trabajo local de Gemini/Claude; contrastarlo antes de programar orden146/147.

## Metodo y entorno

- Se reutilizaron informes84/88-93, YA-RESUELTO y el inventario de pruebas.
  Un agente economico hizo inventario acotado, fue cerrado; no tomo decisiones
  de permisos/dinero ni programo. No repetir resultados sin delta causal.
- TEMP nuevo ak-entorno-aislado-94, worktree separado del SHA anterior; Next
  **dev**, Firestore8085/Storage9195 demo-ak-producciones. Variables filtradas,
  claves dummy, sin .env ni credenciales/proveedores reales. No build optimizado.
- Sesion de equipo ficticia y permisos de estaciones en el emulador. No prueba
  el login de una cuenta real ni autoriza tocar presupuestos/clientes reales.
- Camara/audio NATIVOS falsos Chromium. No reemplazar una camara sana por un
  archivo negro y llamarlo control; se inspeccionaron pixels/bytes del resultado.
- No producto modificado, reglas relajadas, dependencias nuevas, merge, cobro,
  OAuth, correo, WhatsApp o publicacion real. Graphify no existe en este checkout;
  no reconstruir el grafo entero para esta tanda de QA/documentacion.

## Resultado de aceptacion

14 suites Jest, **143 aprobadas**, 0 fallos, 17.874s (94-jest.json).
Prueban unidades/servidor con mocks; NO aceptacion de toda la aplicacion.

**20 ejecuciones positivas de navegador**, correspondientes a 18 pares
caso/contexto; los dos reintentos completos del album amplian casos ya corridos,
no son dos modulos nuevos. Dos sondas diagnosticas del QR pasan adicionalmente;
no sumarlas como entregas aprobadas. 27 ejecuciones registradas en total:
22passed/4failed/1timedOut; cinco negativas incluyen una sonda defectuosa.

| Recorrido | Resultado / evidencia |
| --- | --- |
| QR revocado despues de abrir invitado/lector | PC y viewport movil pasan; no checkin/timestamp, portal viejo pierde QR. Lector operador usa contexto separado, no certifica escaner fisico movil. |
| Personal ubicacion nativa dentro/fuera | Dentro persiste y sobrevive recarga; fuera rechaza sin mutar llegada. Coordenadas Chromium simuladas, no GPS fisico. |
| Fotocabina corregida140 | Imagen nativa falsa NO negra dentro del marco; captura almacenada/GET200/bytes exactos. Foto inspeccionada, no impresora/camara fisicas. |
| Recibo de personal142 | Desglose1000 suma exactamente100000centavos; reemplazo de papel guarda nueva URL sin cambiar monto/fecha/estado; 10Oct no se vuelve9Oct. PC y movil, seis ejecuciones. |
| Album141 PNG+WebM | MIME/extensiones y bytes exactos en ZIP, PC/movil. |
| Album141 todos los GET403 | No ZIP vacio anunciado como exito; boton reintentar. Al restaurar solicitudes y tocar ese boton, ZIP con dos archivos exactos, PC/movil. |
| Catering139 enlace Hoja de cocina | Abre por su enlace real, NO por URL directa de rescate,20porcionesadultas. 61.397s colddev; tramo del enlace51.654s: no medir rendimiento Hosting por esa compilacion. |
| Ruta voz sin clave real | HTTP503, no ficha ni nueva reserva/uso diario. Clave dummy; no prueba Google. |
| QR reentrada | Movil pasa; PC falla leyendo un PNG concreto. No cerrar el consumidor con esta mezcla: diagnostico/orden147 abajo. |

Raw:94-aceptacion-desktop.json (11pasadas),94-aceptacion-mobile.json (6pasadas),
94-recuperacion-primer.json (3pasadas/1fallo). Artefactos en94-artifactos e
indice94-resultados.json. 139-143 tienen evidencia nueva de estos criterios;
no convertir esas aprobaciones en area contable/personal/invitados completa.
Logs/adjuntosTXT normalizan SOLO espacios finales para git diff --check;
rawJSON y binarios conservan resultados y bytes sin esa transformacion.

## Tres hallazgos nuevos, no producto corregido

1. **VOZ94-CORTAR P1 / orden146:** iniciar, cortar mientras ficha espera y
   entregar respuesta tarde reabre panel, adquiere microfono y abre socket.
   Control QA, no Google real. Resultado micro1/sockets1/closes0/audio live,
   10.701s; la sonda detiene recursos despues. Consumidor real del widget,
   no solo helper que devuelve detener. Adjunto94-live-final-14-0.json.
2. **VOZ94-REINTENTO P2 / orden146:** tras HTTP503, boton dice Hablar pero
   siguiente toque NO hace otro pedido; tercero SI. Dos reproducciones,
   final14.349s, first1/afterRetry1/afterThirdClick2. Adjunto94-live-final-13-0.json.
3. **QR94-LECTOR P2 / orden147:** original GuardarQR170x170 valido para ZXing
   directo, pero lector real de AK falla NotFoundException/no checkin. Mismo
   PNG/codigo/invitado/lector, solo borde blanco32: checkedIntrue. Control
   23.200s; no atribuirlo a permiso/token ni exigir que toda credencial falle.
   Original preservado qr-reentrada-original.png. Payload de pruebas demo,
   no invitado real. El PNG del producto aun NO esta arreglado por esta QA.

Raw94-live-final.json: dos fallos genuinos. 94-live-primer.json incluye tambien
timeout POR LA SONDA: mock de WebSocket interceptaba NextHMR. Se corrigio para
interceptar solo qa94.invalid y se repitio; no encargar ese timeout al producto.
Raw94-qr-diagnostico.json: original y borde decodifican igual, ampliacion3x NO;
no recomendar aumento indiscriminado. Raw94-qr-lector-control.json compara
ambas entradas del lector. Sus tests positivos son diagnosticos, no cierre.

## Estado publicado y limites que siguen abiertos

Health publico GET200 el2026-10-10T22:19:03.662Z: version publicada
**0af74652ebdf4c813b9eb443c358d51bc24542d7**, NO el SHA ejecutado9a054620.
Firebasetrue es lectura; gemini/googleWorkspace/mailtrue comprueban configuracion,
no entrega real. Instagram/MercadoPagofalse.94-salud-publicada.json preservado.
No usar GitHubActions rojo por facturacion como fallo de la app.

- Orden144 espejo pierde publicacion cuando falla Vision y orden145 Touchpix
  captura negra siguen SIN delta causal en main. No repetir ni duplicar orden.
- 3D historico88 NO aceptado: WebGL existia pero reconciler fallo y quedo foto.
  Sin delta2aac14e2..9a en salon-3d/compat/portal/package; no relanzar mismo
  negativo ni confundir fallback con escena. Esperar entrega nueva y entonces
  canvas/pixels/movimiento/guardado/vista cliente PC+movil en su SHA.
- Video de Vida92: reemplazo/archivo/GETbytes pasan; recarga visual queda
  limitada por URL publica/firma de emulador. Sin delta causal852..9a; no
  convertir falta de firmante del emulador en defecto Hosting. Necesita entorno
  autorizado que realmente entregue URL navegable; no exponer credenciales.
-19presupuestos originales: src/data/presupuestos.json local contiene0. NO
  prueba que faltan en la base real. Mantener limite82 gRPC7, no reintentar
  lectura bloqueada: comparar export autorizado de SOLOLECTURA con originales.
- Proveedores reales: Gmail/recuperacion/correo, WhatsApp/Instagram/TikTok/
  YouTube, Google voz/IA y MercadoPago siguen sin aceptacion externa real.
  Ningun mock/health/comentario sustituye permisos, respuesta y entrega final.
- Hardware:360/camara/espejo/impresora/totem/barra, audio y GPS fisicos requieren
  ensayo final. No ensayados aqui. El dueno lo reserva para despues.
- Build/entrega Hosting del MISMO SHA corresponde a Claude; Codex no lo corrio.
  Una PR QA abierta no significa que esos cambios esten desplegados.

Voz: documentacion oficial de fichas indica v1beta; app defaultv1alpha, version
configurable. Es **riesgo de compatibilidad**, no conexion fallida demostrada.
Modelo gemini-3.8-live figura oficialmente; no declararlo inventado. Referencias:
https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
https://ai.google.dev/api/live
https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live

## Cierre operativo / siguiente paso exacto

94-limpieza.json: borrados2docs y2archivos locales propios restantes (un fixture
de voz quedo antes del try por el timeout de QA),0archivos Storage restantes,
0colecciones preservadas no vacias. SOLO emulador94, no produccion.
94-runtime-detencion.json: seis procesos propios identificados por ancestro,
commandline/fecha detenidos;3300/8085/9195 sin listeners. Runtime cerrado.
La politica local no ejecuta .ps1 por defecto: ejecucion Bypass SOLO del proceso
de limpieza, no cambio permanente de politica/configuracion del sistema.

Gemini: orden146 interfaz de voz y147 exportacion QR; Claude: permisos/costos,
integracion/compilacion. Antes, contrastar tanda local. Conservar144/145.
Revisar SOLO criterios afectados sobre SHA corregido, no otra auditoria de
todo por costumbre. Mantener aceptaciones vigentes y evidencia historica.
No14areaslimpias, no certificado0errores ni promesa de todos los defectos.
