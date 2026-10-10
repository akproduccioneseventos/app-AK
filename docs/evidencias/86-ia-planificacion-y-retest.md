# Auditoria 86: IA real, planificacion y aceptar el delta 83

9/10/2026. Fuente compilada y ejecutada:
`main` `1b61295ab977fd6f204ffdab0f190edbd0f0ed6b` (PR 1278).
Tanda abierta contrastada PR 1277, HEAD previo `db355db361f52360c66da022fa0327bd24429bd3`;
solo evidencia/documentacion propia. Producto incorporado desde main, no programado
por Codex. Trabajo de otras IA no subido: NO CONTRASTADO CON LA TANDA.
Resultado: PARCIAL, con seis fallos de IA y uno del portal; no app sin errores.

## Entorno Y Evidencia

- TEMP `ak-entorno-aislado-PHvcfo`, HTTP127.0.0.1:3300, secretos ficticios,
  proyecto demo-ak-producciones, Firestore8085/Storage9195. Guardas del launcher
  y de las sondas; sin .env real, proveedor IA dummy ni cuentas externas reales.
- Build aislado completo aprobo compilacion, lint/tipos y 302 paginas; warnings
  no fatales anotados en `86-build.log`. Se reutilizo ese build para los recorridos.
  Seeder inicial fallo por MI variable AK_ENTORNO_SALIDA omitida; corregida en
  harness, semilla aprobo. No diagnosticarlo como error de despliegue de la app.
- Voz/dictado instrumentados, no microfono/audio fisico. MediaRecorder real con
  camara simulada en estaciones; Storage SDK real contra emulador.
- JSON local primero; admin updateDataPartial prohibe ese modo por diseno.
  Planificacion se repitio contra Firestore demo, sin cambiar producto/permisos.
  Lectura de respaldo JSON y escritura emulada: NO aceptacion Firestore produccion.
- Sondas, resultados y capturas `86-*`; fixtures unicos, limpiados despues de
  cada caso. Chat ficticio queda SOLO en TEMP como evidencia, nunca en produccion.
  Agentes cerrados; servidor/emuladores/Java propios cerrados al terminar.
- JSON/raw, sondas, capturas y contextos viajan a GitHub. Traces ZIP y videos
  de intentos fallidos quedan SOLO locales para no agregar unos350MB al repo.
  Las referencias raw a esos archivos no implican disponibilidad remota.
- check:acentos aprobo2559archivos. diff --check de documentos/sondas/manuales
  propios aprobo; raw/logs conservan whitespace original y main trae espacios
  previos en una suite. No reescribir evidencia ni codigo de otra IA por eso.

## Aprobado: No Repetir Sin Cambio Relevante

| Alcance | Resultado ejecutado y limite |
|---|---|
| Arreglos 83 | Cuatro E2E aprobaron: nombre del firmante visible; boton Imprimir sigue tras constancia; 360 y Bogue guardan/entregan video con URL200, MIME y bytes iguales al Storage. `86-retest-83-resultados.json`. No se verifico contenido final del contrato en papel. Los videos temporales fueron limpiados por la siguiente corrida antes de copiarlos: conservar aserciones, NO afirmar archivo de video 86 entregado. |
| Regresiones 83 | 13 casos de tres suites aprobaron, `86-unidades-resultados.json`; controles unitarios, no equivalentes a pruebas fisicas. |
| Controles IA previos | 31 casos de seis suites aprobaron, `86-ia-controles-resultados.json`: voz, dinero, sesion de cliente, seguridad de acciones, scope de chat y fallback. Proveedor controlado. |
| Widget PC/movil | Dos E2E aprobaron: dictado envia una vez, respuesta de respaldo real se lee con voz instrumentada, chat conserva dos mensajes al recargar, microfono denegado avisa sin reenviar. Raw desktop/mobile, sonda y capturas. No voz Gemini real ni conversacion bidireccional nativa. |
| Tareas | UI crea tarea, cambia completada y recarga; archivo leido conserva ID/estado. Caso aprobado en `86-plan-firestore-resultados.json`. No volver a correrlo por el timeout independiente del itinerario. |
| Itinerario | UI guarda 21:37/visibleParaCliente, editor recarga; contexto cliente separado sin cookie de equipo ve ese mismo momento/hora. Un caso aprobado, `86-itinerario-consumidor-resultados.json`. |

Total de esta tanda: 44 controles unitarios existentes y ocho E2E aprobados.
Reintentos no cuentan como nuevos recorridos. Ninguna area entera se marca limpia.

## Hallazgos Confirmados

| ID / responsable | Reproduccion y efecto | Orden |
|---|---|---|
| IA86-TAREAS P1 / Gemini | Dos altas reales simultaneas dicen success; filesystem final conserva solo B. Orquestacion real/almacen real, efectos externos controlados. | 135 |
| IA86-VOZ P2 / Gemini | Stop no invalida fetch pendiente; su respuesta crea/reproduce audio. Una solicitud nueva tampoco invalida la antigua. Dos aserciones del reproductor real con fetch/audio controlados. Botones silencio/cierre comprobados en fuente, no UI E2E. | 135 |
| IA86-PERMISOS P1 / Claude | Sesion personal, sin ADMINISTRACION, puede invocar toggle y llegar a guardar configuracion global. Require-session/perfiles reales, efectos sustituidos. | 135 |
| IA86-PUBLICIDAD P2 / Gemini + Claude | Boton individual ofrece agente configurado, accion real devuelve Agente no reconocido: falta case del sexto agente. | 135 |
| IA86-INTERVALO P2 / Gemini | Ejecutor automatico corre vigilante otra vez a los 60s aunque intervalo sea 15min; scheduler real/fecha y datos controlados. | 135 |
| IA86-EXITO P1 / Gemini | Alta fallida devuelve action.create_task; texto advierte fallo, contrato sigue indicando accion. Widget consume ese tipo como toast de exito. Orquestacion ejecutada; consecuencia UI inferida del consumidor verificado. | 135 |
| PORTAL86-ENTREGA P1 / Claude | Servicio oficial existe, cliente autentica pero fotos-video dice que no hay servicios. Mapper descarta servicios, conserva notasGenerales. E2E falla buscando el nombre; enlace/PDF no alcanzado. | 136 |

Fuentes/simbolos/consumidores comprobados sobre main1b, no rutas supuestas.
Siete aserciones fallidas prueban seis defectos IA; portal tiene una asercion aparte.
Son nuevos consumidores, no orden para reimplementar los patrones ya corregidos.

Friccion FR86-PRESENTACION (P2, Gemini): captura movil muestra URL tecnica larga
fuera de la burbuja. Fallback de multiagent-flow agrega error.message al texto.
Proveedor dummy fallaba intencionalmente; NO fallo probado de Gemini produccion.
Orden 135 pide aviso claro, diagnostico separado y texto contenido; no maquillar
el modo respaldo como resultado normal. Asercion visual de retest pendiente.

## Errores De Mi Prueba, No De La App

- Alta de tareas: primer timeout5s bajo carga; siguiente mock devolvia boolean
  donde correspondia predicado. Corregidos; prueba final ejecuta escritura real
  y falla por perdida de A. Raw de los tres intentos conservado.
- Widget inicial: mock de speechSynthesis sin constructor Utterance coherente;
  respuesta visible pero instrumentacion no capturaba voz. Probe corregido,
  PC/movil aprobaron; NO informe de voz rota por ese intento.
- Planificacion JSON: escritura partial explicitamente deshabilitada; no pedir
  cambiar esa proteccion para aprobar QA. Repetida con emulador demo.
- Itinerario: fixture demo tenia simplicityMode=true; portal oculta itinerario
  deliberadamente. Editor/persistencia habian pasado; selector espero120s y
  cleanup dio contexto cerrado. Fixture habilitado, retry SOLO ese caso aprobo.
  No defectos nuevos por ausencia deliberada ni por limpieza del navegador.

## Mejoras Propuestas, No Implementadas

Reutilizar chat/memoria/cron/seis agentes existentes. Mostrar trabajo autonomo
con objetivo, alcance, proxima corrida, cancelacion y resultado persistido;
estado terminado exige leer resultado final. Reintento estable y limitado;
memoria con origen/fecha/aprobacion, no entrenamiento magico del modelo.
Autonomia de nuevas acciones pendiente de aprobacion expresa del dueno.
No ejecutar pagos, publicaciones, mensajes ni cambiar permisos automaticamente.
Orden 135 distingue TTS de Gemini Live y enlaza documentacion oficial.

## No Probado

Audio Gemini pagado, microfono real, agente multipaso externo, cuotas reales,
Meta/WhatsApp/Gmail, cron de produccion, 19 presupuestos originales, hardware y
todas las pantallas/perfiles. No se ejecutaron publicaciones ni acciones reales.
Controles rojos de GitHub billing excluidos. No merge ni certificado 0 errores.
La prueba negativa debe pasar DESPUES del arreglo; hoy es evidencia del defecto.
