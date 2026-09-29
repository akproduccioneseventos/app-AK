# Recuento de auditoria Astra y separacion del tramo Luna

Fecha: 29/09/2026. Documento de conciliacion, no certificacion ni nueva orden de programacion.
Codex revisa; Gemini programa interfaz; Claude lleva dinero, comida, permisos e integridad y compila. El dueno fusiona.

## 1. Modelo: lo que demuestra el historial

Se consultaron los eventos `turn_context` del historial LOCAL de este mismo chat
`019e700c-57bc-7020-8947-5973a24f14f6`. Son metadatos del modelo seleccionado para
el agente principal, no una identificacion independiente del proveedor ni del modelo
de cada subagente. Una fecha escrita dentro de un informe no identifica su autor.

| Tramo observado (hora de Uruguay, UTC-3) | Modelo del principal |
| --- | --- |
| Desde 07/09/2026 13:44:27 hasta el cambio del 28/09 | gpt-6-astra |
| Desde 28/09/2026 16:38:14 hasta el cambio del 29/09 | gpt-6-luna |
| Desde 29/09/2026 07:52:29 | gpt-6-astra |

El tramo Luna contiene 21 eventos de contexto, pero SOLO 12 turn_id distintos.
Se corrige expresamente la primera comunicacion que los conto como 21 turnos.
Antes del 7/9 hubo gpt-5.5, gpt-5.6-terra y gpt-5.6-sol: su trabajo no se atribuye a Astra.
Algunas auditorias dirigidas por Astra incorporan agentes economicos; la evidencia 49
lo declara. No se afirma que cada lectura o linea haya sido realizada por Astra.

## 2. Fuentes y vigencia

- Checkout documental local observado: `c383f0181f6a20d2573ca58e3bb4225a4f61cbcb`,
  rama `codex/entorno-windows-94`. Conserva documentos historicos, no el main actual.
- Ultimo main identificado por GitHub CLI en esta conciliacion:
  `62dcb2cb4df718a81c3654028199e49628367d8c`.
- Las lecturas posteriores de ESTADO-ACTUAL y YA-RESUELTO de ese SHA fallaron por
  conexion a api.github.com. El conector tambien fallo al leer el indice remoto.
  Por eso este documento NO afirma que los defectos historicos sigan en ese main.
- Se leyeron informes de `.audit-deliveries/conjunto`, evidencias 49, 92, 93, 94,
  evaluacion 1234, matriz 81 y secciones de `docs/YA-RESUELTO.md` conservadas localmente.
- Se reutilizo el registro ya consultado de evidencias 95-113. Las conclusiones de
  ese tramo quedan separadas de la evidencia Astra; no se reejecutaron sus pruebas.
- La matriz 45 declara evaluador Gemini. Sus aprobaciones no son pruebas de Astra.

## 3. Recuento por area del periodo dirigido por Astra

Una fila agrupa revisiones, no representa una auditoria integral aprobada del modulo.
"Corregido en registro" significa que otra entrega lo declara; "sonda" es una
prueba aislada con dependencias simuladas, no navegador ni Firestore real.

| Area revisada | Trabajo registrado / evidencia | Ultimo alcance que se puede conservar |
| --- | --- | --- |
| Contabilidad, cuotas, facturas y cobros | Evidencia 49: cinco defectos, siete aserciones fallidas; falsos exitos, espejo de pago, cobros concurrentes, dashboard vacio y permisos | Hallazgos reproducidos en base 8c5eb6e; arreglos posteriores registrados. Falta conciliar sus pruebas con el candidato actual |
| Errores de guardado en toda la app | Orden 49 y registro de llamadas que ignoran success:false; seguimiento de persistencia y avisos | Metodo y correcciones registrados. Un control estructural no demuestra todos los consumidores |
| Web, galeria y origen comercial | Orden 50: borradores expuestos y perdida de UTM; confirmacion posterior en YA-RESUELTO | Arreglos registrados; no equivale a clasificacion visual de todas las fotos |
| Publicidad y marketing | Presupuestos de Meta inventados o ausentes; recorrido configuracion-consumidor, orden 47 y registro del 9/9 | Reglas y correcciones registradas; intercambio real con Meta pendiente de evidencia |
| Estetica y movimiento | Orden 46 y contraste de pruebas de animacion/visibilidad | No existe aprobacion visual completa PC/movil/totem por Astra; errores de las propias pruebas quedaron documentados |
| Entrada y sesion | Orden 53; regreso a fiesta, Google, recuperacion y carga de pantallas | Correcciones historicas; falta recorrido actual con cuentas/roles aislados |
| Planificacion y autoguardado | Orden 51; modulos que se pisan y confirmaciones de persistencia | Auditoria y arreglos registrados; no volver a ordenar los ya presentes |
| Decoracion, propuestas y salon 3D | Ordenes 52/55, entregas 1206, 74/75/77 y contraste de objetos/consumidor | Correcciones y puerta de Claude registradas; no nueva validacion integral 3D por Codex |
| Avisos y preferencias | Orden 56 y contraste 1206 | Revision del guardado/consumidor; conservacion de evidencia puntual |
| Velocidad de portada | Orden 57: esperas antes de dibujar y prueba que no media resultado | Diagnostico y arreglo registrados; faltan medidas comparables de uso actual |
| Portal cliente y permisos | Orden 54; guardado, secretos y controles del portal | Correcciones registradas; aislamiento actual necesita contextos de navegador separados |
| Fotocabina, Touchpix, espejo y colas | Orden 48, ENT03 y ordenes 81/89-93; captura lenta, siguiente persona, offline y confirmacion de entrega | Revisiones y correcciones por etapas. En PR1234 habia mejoras presentes; no ensayo fisico completo ni nueva corrida E2E total |
| Respaldos y restauracion | RESPALDOS-2026-09-16 y REVALIDACION-2026-09-17: copia/restore parciales y permisos; 9 PASS/1 FAIL en ese corte | Residual luego registrado como corregido; falta validar restauracion completa aislada del candidato |
| Reportes, Gmail, YouTube y TikTok | REPORTES-CONEXIONES y CONTRASTE-1209: fecha final/UTC, doble invitacion, bytes del video y estado Publicado prematuro | Correcciones registradas; falta operacion real autorizada con cada proveedor habilitado |
| Encuesta post-fiesta | PF01-03: espera infinita, datos invalidos y concurrencia; revalidacion posterior | PF02 distribuido pasa en sonda 512eca7. No certifica toda la encuesta publicada |
| Activos, carga y devoluciones | LOG01-04: renombrado, stock agregado, retornos y respuestas atrasadas | LOG01 pasa en 512eca7; LOG04 pasa en funcion candidata PR1225. No prueba fisica del inventario |
| Insumos, menus y compras | Insumos: propagacion de costo y errores parciales; CTRL04/05: unidades y cero adultos | Casos de insumos pasan en 2c652dd; compras/comida requieren conciliacion actual y Claude |
| Video de vida y ZIP | VID01/02 pasan seis casos; VID03 detecta ZIP parcial/vacio sin aviso | Registro posterior dice corregido por orden87; falta evidencia de descarga real actual, no volver a llamarlo abierto sin contraste |
| Incidentes | INC01: comentario y resolucion entre dos servidores | Sonda distribuida pasa en 512eca7; no prueba de Firestore productivo |
| Regalos, reservas y guias de armado | REG01/02, GUI01/02: lista vacia intencional, reserva y documentos/tareas | Cinco casos regalos y dos documentos pasan en 834fc98. GUI01 antiguo no sirve para declarar regresion nueva |
| Musica, fotografia, itinerario y reuniones | IMPRESOS-MESAS, OPERACION-TRES-PARTES y ordenes 68/72/73 | Reproducciones puntuales y correcciones registradas; faltan recorridos actuales de guardado/recarga y entrega |
| Preparacion del evento y buzon | CTRL01-06: deudas, vencimientos, catering vacio, compras y falso sincronizado | Informes y correcciones registrados; no equivale a readiness global validado |
| Personal y proveedores | EQU01 cobrado incluye pendiente; EQU02 actualizaciones simultaneas | Hallazgos reproducidos y correcciones registradas. Proveedor en varias fiestas esta permitido |
| Calendario y enlaces | CAL01-06 y NAV01-03: reuniones, fechas civiles/nocturnas, fechas invalidas y destinos | Siete controles de calendario pasan en 2f41322; no repetir sin cambios relevantes |
| Invitados y barra | INV01 fuga de datos; BAR01-03 stock, reintento y reemplazo; CAT01-03 fotos/salones | RSVP propio, cola y reemplazo pasan casos; BAR01 transaccional pasa en 512eca7. QR por nombre es decision del dueno, no defecto |
| Superficie y lanzamiento | Inventario 25/9 y matrices 81/92; evaluacion 1234 del 27/9 | 360 paginas, 43 rutas, 155 modulos de acciones, 87 archivos E2E inventariados. No son pruebas aprobadas. Despliegue 5e384c6 confirmado entonces, no del main de hoy |
| Recorrido publico inicial del 28/9 | Comienzo de evidencia94: blog/Club y demo de barra (mocktail acaba mostrado como Mojito) | Documento mixto: sus ampliaciones posteriores pertenecen al tramo Luna. No atribuir todo 94 a un solo modelo |

No sumar PASS de diferentes versiones ni contar pruebas repetidas como cobertura nueva.
El inventario de 5559 declaraciones JSX y 875 exports tampoco cuenta botones probados.

## 4. Conclusiones del tramo Luna: fuera de la aprobacion Astra

Se conserva el historial para poder comprobarlo. No se borra evidencia ni se revierte
codigo por el modelo usado. Las siguientes conclusiones NO se aceptan como validacion
de Astra sin revisar su evidencia y contrastar la version actual.

| Registro / asunto | Tratamiento en este recuento |
| --- | --- |
| 94, ampliacion de cliente/invitado/barra | Observaciones puntuales pendientes de revalidar; sesion compartida NO demuestra aislamiento por rol |
| 94-95, navegacion/galeria/tecnologia/Club/blog | Conservar capturas/resultados si existen. Revalidar metadatos, imagenes, carrusel y parametros contra tanda y despliegue; no certificar la galeria entera |
| Contadores en cero, total inicial $0 y copy comercial | Hipotesis/criterio UX. Comprobar hidratacion/animacion y decisiones comerciales antes de pedir cambios |
| 96-99, automatizaciones de marketing | Analisis estatico de PR1240 vieja: idempotencia, plantillas, respuestas y consumidores. Contrastar con correcciones de Gemini; no ordenar otra implementacion |
| 100, token de invitado en Analytics | Prioridad alta de revalidacion por permisos/datos. La gravedad potencial no autoriza afirmar una filtracion observada |
| 101-109, recordatorios, check-in, mantenimiento, reunion, impresos, catering y QR | Separar lo ya devuelto por Claude, lo previo a esa PR y lo nuevo. 106 se solapa con el problema de cero adultos ya auditado: no contarlo dos veces |
| 110, checks GitHub rojos | RETIRADO como hallazgo funcional. El dueno confirma bloqueo de facturacion; la verificacion de Claude es la referencia |
| 111, persistencia de chats/memoria | Riesgo estatico pendiente de sonda y contraste con almacenamiento/candidato. No incidente confirmado |
| 112, completar tarea por coincidencia parcial | Riesgo estatico pendiente de prueba de ambiguedad y contraste. No tarea real modificada |
| 113, limites de solicitudes IA | Observacion de endurecimiento pendiente de revisar limites globales/infraestructura. Se retira su uso como defecto P2 confirmado o bloqueo obligatorio de publicacion |
| Fallos del entorno, push y pruebas sin salida | No cuentan como defectos de la app |

Los resultados 129 CRM/agenda/planificacion, 15 alertas/equipos y 14 mural mas dos
recorridos fueron informados por Claude/equipo. Se conservan como evidencia externa;
no son pruebas de Luna ni de Astra y no deben repetirse solo por este cambio de modelo.
Falta enlazar SHA/resultados antes de atribuirlos al candidato. Los tres skips del
mural tienen motivos informados; no son tres defectos abiertos.

## 5. Que falta realmente para el cierre

1. **Conciliar la version actual:** recuperar el registro vigente del SHA 62dcb2c y
   de la tanda abierta; identificar cuales casos historicos conservan mismo codigo,
   consumidor y configuracion. Hoy no se pudo completar por conexion.
2. **Revalidar el tramo Luna con prioridad:** primero datos/permisos (100/102), luego
   dinero/catering/persistencia (103/106/111), despues comportamiento (94-109/112).
   Reutilizar lo ya solucionado; 110 fuera y 113 como oportunidad no bloqueante.
3. **Completar recorridos por rol:** organizador, cliente e invitado en sesiones
   separadas, guardar y recargar, dos eventos distintos, denegacion de acceso cruzado.
   La lectura de codigo o el encabezado de una pantalla no cierra este bloque.
4. **Venta completa:** simulador comun e IA por separado, varios presupuestos mismo
   telefono, paquete/menu/regalos/extras, proyeccion anual aparte, precio por persona,
   pantalla igual a PDF, descarga legible y sincronizacion con CRM/cita.
5. **Dinero y los 19 historicos:** conciliar importes, estados y vinculos con evidencia
   de Claude sobre datos de prueba y lectura autorizada de los historicos. No hay
   prueba en este recuento de que se revisaron individualmente los 19 originales.
6. **Entretenimiento conectado:** captura, resultado, entrega y siguiente invitado;
   cortes/reconexion, dos dispositivos, mural/moderacion, barra/cola/stock. Separar
   pruebas de software del ensayo fisico final con camara, 360, impresora y totem.
7. **Integraciones habilitadas:** intercambio real controlado, token vencido/revocado,
   fallos y deduplicacion. Variables presentes o una pantalla de ajustes no prueban
   Gmail, WhatsApp, Instagram, TikTok, YouTube o Mercado Pago.
8. **Estetica y rendimiento:** revision visual actual PC/movil/totem de los recorridos
   externos, fotos/menu correctos, textos, errores/carga/vacio, movimiento y movimiento
   reducido; mediciones repetibles. No hay certificado estetico de toda la app.
9. **Cobertura y salida:** enlazar cada entrada del inventario con evidencia o exclusion
   motivada; Claude aporta compilacion/pruebas del candidato y se comprueba ese mismo
   despliegue. No se repiten todas las pruebas por cada nota documental.

Estas son faltas de demostracion/cierre; NO nueve defectos confirmados ni nueve
modulos que necesariamente esten rotos. No se conoce un numero honesto de errores
restantes ni un porcentaje de app aprobada con los documentos disponibles.

## 6. Resultado de esta tarea

Recuento documental y separacion de procedencia realizados. No se programo la app,
no se ejecuto build, no se fusionaron PR ni se hicieron pruebas sobre datos reales.
El nombre Astra en un informe tampoco sustituye pruebas de comportamiento.
La revision actual conserva evidencia anterior util y retira aprobaciones no respaldadas;
no declara la app lista ni exige rehacer todo lo existente.

Entrega remota: pendiente de registrar el resultado real de publicacion/verificacion.
