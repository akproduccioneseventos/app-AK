# Auditoria de operacion: tres partes grandes

Fecha: 2026-09-20. Codex revisa; no modifica la aplicacion ni compila.

## Base, alcance y evidencia

- Primera tanda: PR 1209, e43260f068a751b5c6e2cc519db84e595c14c89f. 12 casos: 7 aprobados, 5 fallidos.
- Ampliacion: PR 1210, d2f35915590b9901243d9d7b2f68e1d21713ebd5. 15 casos nuevos: 10 aprobados, 5 fallidos.
- Total: 27 casos, 17 aprobados y 10 fallidos, sobre DOS commits. No es certificacion de un unico commit ni de produccion.
- Uno de los fallos iniciales tiene correccion presente en 1210, no revalidada. Quedan nueve hallazgos para atender/contrastar, no diez ordenes nuevas.
- Se reutilizo el registro anterior; no se repitieron los casos de otros bloques. La lista completa de archivos de 1210 se contrasto para detectar correcciones pendientes. Ambos HEAD seguian iguales al publicar este informe.
- Sondas: extraccion AST de funciones reales y ejecucion con dependencias, estado y respuestas simuladas. No son pruebas completas de React ni E2E.
- Sin datos reales, escrituras en Firebase, llamadas pagas a IA, grabaciones, correos o cambios de produccion. No hubo compilacion ni fusion.
- Repo original local no disponible; se consultaron fuentes puntuales por GitHub. Graphify local no disponible. No se afirma haber usado el grafo.

## Parte 1: fotografia y entregas al cliente

Fuentes: `src/app/(app)/fiestas/nueva/fotografia/page.tsx`, `src/app/actions/fiesta/fotografia.actions.ts`. El consumidor es la propia pantalla de fotografia y su guardado automatico.

### FOTO-01 / P1: renombrar un servicio pierde seguimiento

La conciliacion en `loadData` identifica servicios automaticos por prefijo `sync_`, pero los cruza por nombre. Con el mismo identificador de catalogo y un nombre cambiado, sustituye el registro anterior: desaparece el enlace de entrega y vuelve a Pendiente. Sin cambio de nombre los conserva.

Impacto: el equipo puede perder de vista un album ya entregado por corregir un nombre comercial. Gemini debe conservar identidad y metadatos usando el identificador estable, con compatibilidad para registros antiguos. No borrar automaticamente entregas manuales. Prueba pendiente de integracion: renombrar, recargar y comprobar enlace/estado persistidos.

### FOTO-02 / P1: respuesta de guardado pisa una edicion posterior

El callback `onSave` aplica `setFormData(result.updatedData)`. Si se guarda A y el usuario escribe B mientras espera, la respuesta A repone A. El textarea permite seguir escribiendo. La cola del hook de autoguardado no evita por si sola esa sustitucion local.

Comprobado: perdida del borrador local en la sonda. NO comprobado: perdida definitiva en Firebase. Gemini debe conciliar la respuesta con la revision enviada y preservar cambios posteriores; no rehacer a ciegas el hook compartido. Prueba pendiente: respuesta demorada, editar B, comprobar pantalla y guardado final.

### FOTO-03 / P2: error de carga parece carga interminable

Cuando `loadData` falla, termina isLoading pero formData sigue null. El render usa `isLoading || !formData`, por lo que sigue mostrando sincronizacion. Un aviso temporal no ofrece recuperacion estable.

Gemini: estado de error visible y reintento sin inventar formulario vacio ni pisar datos. Comprobar fallo, reintento exitoso y ausencia de guardados durante el fallo.

Controles positivos: servicio sin renombrar conserva entrega; guardado normal actualiza estado; accion servidor comunica exito real y propaga fallo de guardado.

## Parte 2: itinerario y asistencia IA

Fuentes: `src/app/(app)/fiestas/nueva/itinerario/page.tsx`, `src/app/actions/timeline-ia.actions.ts`, `src/ai/flows/generate-timeline-flow.ts`. Consumidor: `handleGenerateIA` y `loadData` en la pantalla de itinerario.

### ITI-01 / P1: la respuesta IA elimina trabajo hecho mientras esperaba

`handleGenerateIA` reemplaza programa por res.data. Los controles de agregar/editar siguen disponibles mientras genera. La sonda agrega un momento durante la espera y lo pierde al llegar la respuesta.

No cuestiona reemplazar el programa inicial cuando el usuario lo pide; cuestiona perder cambios POSTERIORES al pedido. Gemini debe detectar revision modificada y conservarla o pedir confirmacion. No cambiar el flujo comercial sin aprobacion.

### ITI-02 / P2: acepta horas imposibles de la IA

La accion acepta y devuelve 29:90 como exito. El flujo define esquema, pero parsear JSON no equivale a aplicar su validacion. Una respuesta vacia o una excepcion si se rechazan correctamente.

Gemini: validar la salida real antes de ofrecerla a la pantalla, incluyendo hora y campos necesarios. No convertir silenciosamente 29:90 a otra hora. Pruebas pendientes: limites validos, valores fuera de rango, salida incompleta y conservacion del programa anterior.

### ITI-03 / P2: una lista vaciada se rellena y guarda al abrir

`loadData` trata programa=[] como si nunca se hubiera inicializado: carga defaultPrograma y llama al guardado. La sonda observa un elemento y una escritura sin accion del usuario.

Distinguir primera inicializacion de lista intencionalmente vacia. Confirmar con el dueno la regla de producto; no eliminar las plantillas iniciales por defecto sin esa decision. Prueba pendiente: vaciar, guardar, salir y volver sin que reaparezcan elementos.

Controles positivos: programa existente se respeta sin escritura; generacion normal funciona en la sonda; fallo IA conserva el programa y libera el estado ocupado.

## Parte 3: reuniones, actas inteligentes y microfono

Fuentes: `src/app/actions/fiesta/reuniones.actions.ts`, `src/app/actions/meeting-intelligence.ts`, `src/components/reuniones/MeetingIntelligenceRecorder.tsx`. Consumidor confirmado: `src/app/(app)/fiestas/nueva/reuniones/page.tsx` usa el grabador; su boton llama a startRecording.

### REU-01: reunion eliminada, correccion YA presente

En 1209, `updateReunion` devolvia exito y solicitaba sincronizacion aunque el ID no existiera. PR 1210 incorpora comprobacion existia y evita informar exito/sincronizar en ese caso; agrega `src/__tests__/una-reunion-borrada-no-dice-que-se-guardo.test.ts`.

Estado: correccion presente, NO revalidada. No generar otra implementacion. La sonda anterior no demuestra envio efectivo de correo; solo llamada al sincronizador simulado. El arreglo aun realiza la escritura del array sin cambios antes de comprobar existia: registrar este limite, sin afirmar que toda la operacion desaparecio.

### REU-02 / P1: microfono adquirido no se libera si falla el grabador

En `startRecording`, getUserMedia puede funcionar y el constructor MediaRecorder fallar. El catch avisa, pero no detiene las pistas adquiridas. La sonda conserva stream vivo y cero llamadas a stop. El desmontaje posterior puede limpiarlo, pero no la ruta inmediata de fallo.

Gemini: limpieza de pistas, referencias y temporizadores ante fallo de inicializacion; Claude revisa el limite de privacidad. No se encendio un microfono real. Prueba pendiente de navegador/dispositivo: permiso concedido y codec/inicio fallido, indicador del microfono apagado inmediatamente.

### REU-03 / P2: dos responsables, mismo texto, una tarea perdida

`processReunionIntelligence` construye tareas de cliente y organizador; `mergeTasks` deduplica solo por texto normalizado. Dos tareas Confirmar horario para responsables distintos quedan en una.

Comprobado: una asignacion desaparece en el resultado. Definir identidad con responsable/origen, respetando duplicados reales; confirmar la regla funcional antes de modificarla. Gemini propone; Claude revisa persistencia. Probar ambas asignaciones y repetir el procesamiento sin multiplicarlas.

### REU-04 / P2: procesar acta activa FAQ que estaba oculta

`processReunionIntelligence` fuerza clientPortalSettings.faq.visible=true incluso si estaba false y no se aprendio ninguna pregunta. La sonda demuestra cambio de configuracion, NO exposicion efectiva de contenido a un cliente real.

Claude por visibilidad/permisos: preservar la decision explicita del organizador; separar aprender preguntas de publicarlas. Prueba pendiente: procesar con FAQ oculta, con/sin preguntas nuevas, y comprobar configuracion y portal real.

Controles positivos: actualizacion de reunion existente; fallos de guardado no solicitan sincronizacion; permiso de microfono denegado no deja stream; tareas distintas se conservan; fallo al guardar acta devuelve error y no sincroniza.

## Matriz de casos ejecutados

| Sonda/base | Caso | Resultado |
|---|---|---|
| inicial / 1209 | photo-unchanged | PASS |
| inicial / 1209 | photo-renamed | FAIL FOTO-01 |
| inicial / 1209 | photo-load-fails | FAIL FOTO-03 |
| inicial / 1209 | photo-save-normal | PASS |
| inicial / 1209 | photo-save-late | FAIL FOTO-02 |
| inicial / 1209 | timeline-normal | PASS |
| inicial / 1209 | timeline-failure | PASS |
| inicial / 1209 | timeline-edited | FAIL ITI-01 |
| inicial / 1209 | meeting-existing | PASS |
| inicial / 1209 | meeting-missing | FAIL; correccion presente 1210 |
| inicial / 1209 | meeting-save-fails | PASS |
| inicial / 1209 | meeting-add-save-fails | PASS |
| ampliada / 1210 | ai-normal | PASS |
| ampliada / 1210 | ai-empty | PASS |
| ampliada / 1210 | ai-throws | PASS |
| ampliada / 1210 | ai-bad-hour | FAIL ITI-02 |
| ampliada / 1210 | timeline-existing | PASS |
| ampliada / 1210 | timeline-explicit-empty | FAIL ITI-03 |
| ampliada / 1210 | photo-server-saves | PASS |
| ampliada / 1210 | photo-server-rejects-save | PASS |
| ampliada / 1210 | recorder-normal | PASS |
| ampliada / 1210 | recorder-permission-denied | PASS |
| ampliada / 1210 | recorder-constructor-fails | FAIL REU-02 |
| ampliada / 1210 | intelligence-distinct-tasks | PASS |
| ampliada / 1210 | intelligence-same-task | FAIL REU-03 |
| ampliada / 1210 | intelligence-hidden-faq | FAIL REU-04 |
| ampliada / 1210 | intelligence-save-fails | PASS |

## Reproduccion y limites

Scripts publicados: `docs/evidencias/operacion-sonda.cjs` y `docs/evidencias/operacion-ampliada-sonda.cjs`. Requieren Node y TypeScript (AUDIT_TYPESCRIPT puede indicar su ruta). Uso: node script.cjs carpeta-de-fuentes. No instalar herramientas de auditoria como dependencias de produccion.

Mapa de fuentes inicial, descargadas del SHA 1209: foto.tsx = pagina fotografia; itinerario.tsx = pagina itinerario; reuniones.ts = acciones fiesta/reuniones. Mapa ampliado, SHA 1210: timeline.ts = actions/timeline-ia.actions.ts; recorder.tsx = MeetingIntelligenceRecorder.tsx; meeting.ts = actions/meeting-intelligence.ts; photo-actions.ts = actions/fiesta/fotografia.actions.ts; itinerario.tsx = pagina itinerario. Las rutas completas figuran en cada parte.

No se repitieron las sondas al redactar. Resultados reutilizados de sus ejecuciones originales. Los scripts NO descargan fuentes: prepararlas desde el SHA exacto antes de ejecutar; no mezclar fuentes actuales con estos resultados historicos.

Falta: integracion React, persistencia real controlada, navegador movil/escritorio, permisos reales, microfono/codecs, Google/IA reales y revision visual. Tampoco se verificaron aqui las 19 fiestas reales ni toda la app. No declarar listo para publicar basandose en estos 27 casos.

Continuidad: conservar este bloque en el registro compartido. Terminar primera pasada pendiente antes de volver a probar arreglos, salvo bloqueo prioritario. Claude compila posteriormente y asocia resultado a SHA/entorno. Este informe no inicia automaticamente a Gemini o Claude ni cambia decisiones del dueno.

