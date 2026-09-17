# Post-fiesta: encuestas y resenas

Auditoria nueva, 17/9/2026. Main da6c566fbefdf82efec484f7fc9830db6ab5c4de. Diffs de PR1209 b4c6929, 1207 29943cd, 1206 129c1988, 1202 6622427 y 1197 f0ac2027 no modifican feedback.ts, su formulario ni resenas-seguimiento.ts. No se reabre la tanda de Gemini ni se cambia codigo productivo. Codex revisa; Claude compila.

## Alcance y evidencia

Sonda docs/evidencias/postfiesta-sonda.cjs, ejecutada con Node24/TS5.9.3 sobre funciones reales extraidas por AST. 2 controles PASS y 3 casos FAIL. Lecturas, escrituras, limitador y proveedores simulados; sin datos reales, WhatsApp, encuesta publicada, navegador ni build. No certifica todo post-fiesta: no se reviso aun el cierre financiero, entrega de album/video o toda la torre de control.

Se consulto el historial: el pedido automatico de resena y el enlace configurable YA EXISTEN. No volver a pedirlos. El enlace de Google se ofrece sin filtrar por nota; conservar ese comportamiento.

## PF01 - P1: un error deja al cliente esperando indefinidamente

Consumidor: handleSubmit en src/app/feedback/[fiestaId]/page.tsx. Hace setIsSubmitting(true), await saveFeedback y luego libera estado, sin catch/finally. saveFeedback puede lanzar por limitador, lectura o escritura.

Sonda: rechazo sintetico de saveFeedback -> busy=true, submitted=false, ningun aviso y excepcion propagada. Control normal -> submitted=true y busy=false. Como el boton usa disabled=isSubmitting, no queda disponible para reintentar en ese estado. Es evidencia del callback, no prueba visual React.

Gemini: manejar rechazo con aviso comprensible, conservar el texto ingresado y liberar estado en finally; distinguir envio rechazado de resultado incierto para no duplicar respuestas. Probar fallo de red, limite alcanzado y error del servidor, ademas del exito.

## PF02 - P1: respuestas simultaneas pueden perderse

saveFeedback en src/app/actions/feedback.ts lee feedback.json entero, agrega una respuesta y escribe el arreglo completo. Dos llamadas concurrentes parten de la misma copia; la ultima sobrescribe la anterior. Sonda con dos clientes sinteticos: queda solo B; control secuencial conserva A y B.

La sonda simula writeData como reemplazo. Se contrasto el escritor productivo: src/lib/firebase-sync.ts mapea feedback.json a feedback; syncToFirestore elimina documentos ausentes del arreglo entrante dentro de la transaccion y despues escribe los presentes. Por eso una transaccion del escritor NO recupera la respuesta que faltaba en el snapshot leido antes. No se ejecuto Firestore real.

Ademas los IDs fb_Date.now() pueden colisionar en el mismo milisegundo: senal estatica, no caso de colision medido por separado. Claude valida integridad/persistencia; Gemini implementa parte no sensible segun reparto. Usar creacion atomica de respuesta con identificador unico/idempotencia, no sustituir toda la coleccion. Probar dos envios y dos instancias; no basta mutex local.

## PF03 - P2: el navegador puede introducir datos internos y notas invalidas

saveFeedback construye newFeedback con ...submission. Omit de TypeScript no valida datos en runtime. No limita npsScore a 0-10, estrellas a 1-5 ni descarta googleReviewRequested, que es un estado del sistema.

Sonda con npsScore=99 y googleReviewRequested=true, envio automatico desactivado: success=true y ambos valores se guardan. No hubo envio real que justificara esa marca. Corrompe indicadores y puede afectar la decision posterior de solicitar resena.

Claude: validar entrada en servidor, aceptar solo campos publicos y derivar metadatos internamente; comprobar evento admisible sin convertir la encuesta publica en login obligatorio sin aprobacion. Probar nota invalida, propiedades internas, limites de texto y evento inexistente. No atribuir autenticidad de cliente a un nombre escrito en formulario publico.

## Mejoras humanas propuestas, no implementadas

- La interfaz muestra la etiqueta interna Detractor al cliente que da una nota baja. Proponer respuestas neutrales que no lo clasifiquen ni condicionen su opinion. La escala y sus colores tambien merecen prueba de experiencia, no una aprobacion solo por CSS.
- El campo de mejoras es obligatorio. Evaluar con el dueno permitir dejarlo vacio: una familia satisfecha no deberia tener que inventar una critica para enviar. Es cambio de funcionamiento y requiere aprobacion.
- El agradecimiento promete contacto ante insatisfaccion. Confirmar que se crea un pendiente con responsable y plazo; en saveFeedback revisado no se vio esa accion, pero no se declara ausente de toda la app sin rastrear automatizaciones.

## Cierre pendiente

Agregar pruebas que fallen al romper las funciones reales y recorrido de navegador con fiesta aislada. Reusar controles correctos. No se pide rehacer solicitud de resenas ni integrar otra plataforma. Estas observaciones se suman al diagnostico; no inician otra IA ni autorizan merge.

