# Devolucion 89 - Corregir el cierre de la captura IA, sin reabrir las mejoras descartadas

26 de septiembre de 2026. Codex audita; Gemini programa interfaz; Claude revisa datos/permisos y compila. Una entrega conjunta, abierta para el dueno; no fusionar automaticamente.

## Base y alcance

Main `b046863c1a6f5235c0f48c36298e25971e214b4a`, PR 1228 y 1229 fusionadas. Al consultar no habia PR abiertas. Se leyo la orden 89 RECORTADA a dos bloques por decision del dueno: IA sin frenar la fila y barra agotada. NO restaurar los doce bloques anteriores, ni agregar servidor/cola pagada.

El registro dice que la original queda en el equipo y que la subida fallida ya no se da por terminada. Eso no se cumple en todos los caminos de la nueva cola. No se rechaza el trabajo entero: el envio al respaldo local existe, pero el estado final sigue anunciando exito incondicional.

Evidencia reproducible: `docs/evidencias/89-touchpix-b046863.cjs` y `docs/evidencias/89-touchpix-b046863-resultados.json`. Extrae `handleCapture` y `procesarTrabajoIA` reales con TypeScript; simula proveedor, subida, IndexedDB, canvas y setters de React. Resultado: 1 caso pasa y 5 no cumplen expectativa, agrupados en T89-01/02/03. NO es E2E ni prueba de equipo fisico. No se instalaron dependencias de produccion ni se compilo.

## T89-01 / P1 - Se anuncia galeria aunque falle subir o guardar

`src/app/evento/touchpix/[fiestaId]/page.tsx`:
- `procesarTrabajoIA` agrega el ID a `subidosRef` ANTES de intentar subir (linea 644).
- La subida fallida reintentable llama a `saveOfflineMedia` (680); un error permanente no lo hace; si falla IndexedDB, el catch lo silencia.
- TODOS los caminos terminan con `estado: 'completado'` y `setAvisoFinalizado` (701-705).
- El consumidor del aviso (1781-1783) dice que la foto esta en la galeria aun cuando no existe alli.

Sonda: red caida + guardado local exitoso -> completado, 1 pendiente local; rechazo permanente -> completado, 0 guardados; red caida + cuota local agotada -> completado, 0 guardados. En los tres se crea el mismo aviso de finalizacion que en el caso correcto.

Gemini: separar procesamiento IA de entrega. Mostrar subido/pendiente local/no guardado/rechazado segun resultado real; no publicar aviso de galeria sin confirmacion. Con moderacion pendiente, tampoco afirmar visibilidad publica. No marcar enviado antes de confirmacion ni impedir reintento por ese Set. Mantener identidad estable para evitar duplicados si el servidor guardo y la respuesta se perdio; Claude valida deduplicacion existente, sin reemplazarla por otro sistema ni relajar permisos.

Si falla guardar local, conservar el resultado en memoria recuperable y ofrecer accion real de descargar/reintentar; avisar que se perdera al cerrar. No silenciar error ni anunciar respaldo que no existe. Si rechazo por permisos/contenido, no saltarse moderacion ni insistir automaticamente sin criterio. Limpiar datos solo despues de entrega confirmada o decision explicita, sin memoria creciente de todas las fotos toda la noche.

## T89-02 / P1 - La original prometida no se conserva antes de la IA

`handleCapture` (500-568) deja `rawImage` en estado React y muestra el original/QR. No guarda Blob en IndexedDB ni invoca persistencia local. `saveOfflineMedia` se usa DESPUES del procesamiento si falla subir, o en el flujo anterior de subida manual. El comentario "la foto ya se guardo local y en la cola" no demuestra guardado.

Sonda: cuatro capturas, cuatro trabajos en memoria, CERO guardados locales antes de llamar al proveedor. Recargar destruye ese estado; la politica aceptada permite perder la transformacion en curso, pero se basaba en conservar la original, que aqui no se conserva.

Gemini y Claude: usar almacenamiento local existente para preservar la original antes de prometer recuperacion. No agregar worker remoto. Diferenciar respaldo local de trabajo listo para subir: no subir automaticamente original y derivada creando dos publicaciones por captura. Mantener una identidad de captura y politica explicita de reemplazo/recuperacion compatible con deduplicacion actual. Limitar capacidad, tratar cuota/denegacion y no borrar otras fiestas. Tras recarga recuperar el original; NO regenerar IA automaticamente ni generar costo sin consentimiento.

Aceptacion: capturar A con proveedor detenido -> recargar -> recuperar original de A en ese equipo; cuota llena -> aviso honesto y descarga posible; volver red -> una sola publicacion segun politica elegida. No aprobar por mock que solo comprueba que se llamo IndexedDB: abrir otra vez y leer el Blob.

## T89-03 / P2 - Capturas distintas comparten el limite de la misma foto

La nueva captura crea `trabajo.id`, pero `procesarTrabajoIA` manda `photoSessionId` del componente (617), no el de ese trabajo. El flujo liberado de IA no pasa por `retake` (que era quien renovaba sesion). `applyTouchpixTheme` en `src/app/actions/touchpix-ai.ts` (405-419) limita a tres generaciones por ese identificador durante 15 minutos.

Sonda: cuatro IDs de captura diferentes mandan cuatro veces el mismo `photoSessionId`. El servidor trata nuevas capturas como intentos de la primera foto; la cuarta puede agotar ese limite aunque sea otro invitado. Esto no requiere subir limites ni retirar el techo general por estacion.

Gemini: capturar identidad y contexto inmutables al crear trabajo (foto, fiesta, invitado/permisos, consentimiento y estilo). Usar identidad propia de captura para el limite por foto; reintentos de esa foto reutilizan identidad. Un cambio de invitado o pantalla no altera trabajos anteriores. No heredar consentimiento de A para B: separar siguiente participante de reintento sin volver a bloquear la fila durante la IA. Claude valida permisos y contadores; no tocar precios ni configuracion del proveedor.

Aceptacion: cuatro capturas distintas se identifican distinto; cuatro reintentos de UNA conservan su limite; dos trabajos simultaneos y un tercero en espera preservan su contexto. Comprobar proveedor simulado y tambien respuesta tardia mientras el siguiente usa la cabina.

## T89-04 - La prueba actual no demuestra lo que dice

`tests/e2e/89-ia-no-frena-la-fila.spec.ts:128` acepta `llamadasUpload >= 1`: dos o mas duplicados pasan. No comprueba resultado en galeria ni guardado local. El caso de error provoca fallo IA, no fallo de subida ni cuota. `waitForTimeout(2000/3000)` no demuestra orden entre eventos; la demora inicial se libera automaticamente a los 8 segundos.

Ampliar la prueba existente, no otra coleccion paralela:
1. Retener respuesta del proveedor con barrera explicita hasta comprobar que B CAPTURO, no solo que se pulso su boton. Liberarla en finally para no colgar la corrida.
2. Contar por identidad de captura y comprobar registro/media de salida, no una suma global >=1.
3. Fallo de subida, rechazo permanente y cuota local: aviso correcto y recuperacion real, no falso exito.
4. Cierre/recarga antes del proveedor y recuperacion de original desde almacenamiento real de navegador.
5. Cuatro fotos distintas/reintentos de misma foto, aislamiento por invitado y maximo dos llamadas activas.
6. Hacer que una regresion del aviso incondicional vuelva rojo el test. La prueba no puede aprobar mirando solamente el mismo cartel erroneo que genera el codigo.

## Barra: conservar, no reconstruir

Diff del bloque Agotado contrastado: ordena cartas, deshabilita agotados y filtra sugerencias. La prueba del quiosco hace 20 sugerencias; la de pantalla tactil comprueba etiqueta/deshabilitado/orden, NO sugerencia aleatoria pese al titulo. Completar esa parte solo si falta evidencia equivalente; incluir carta entera agotada y stock que cambia mientras un dialogo esta abierto, manteniendo validacion autoritativa del servidor.

Se descartaron dos alertas de revision inicial: esta ruta NO requiere `mode=guest` (no existe esa condicion en el archivo actual), y filtrar una lista ya ordenada NO rompe por si solo el orden de agotados. No introducir cambios por esas alertas. No se ejecuto el E2E de barra en esta tanda, por lo que no se certifica su resultado publicado.

## Cierre y limites

### Ampliacion 26/9: simultaneidad y modo operador, sin repetir la sonda anterior

Main sigue en b046863 y no hay una tanda nueva publicada al momento del contraste. Evidencia adicional: `docs/evidencias/89-sesiones-y-barra-b046863.cjs` y `89-sesiones-y-barra-b046863-resultados.json`. Ejecuta callbacks reales, expresion disabled extraida del JSX y acciones de sesion reales, con transaccion/almacenamiento y proveedor simulados. NO React completo, Firestore ni ensayo fisico.

**T89-05 / P1: resultado viejo asociado a la captura nueva.**
La respuesta exitosa de `procesarTrabajoIA` llama a `updateEntertainmentSessionStatus(..., 'done', {mediaUrl: ...})` sin identidad de la captura origen. La accion en `src/app/actions/fiesta/sesion-entretenimiento.ts` valida transiciones y conserva `current.captureId`, pero no compara el trabajo que responde contra la captura vigente. Una transaccion evita escrituras simultaneas incompletas, no evita aplicar un resultado viejo a una sesion nueva.

Reproduccion: A espera al proveedor; el operador usa Reiniciar y luego Iniciar para B, usando `resetEntertainmentSession` y `startEntertainmentSession` reales; B entra en recording; termina A. Observado: `captureId: B`, `status: done`, `mediaUrl: /media-A.jpg`. El resultado A puede guardarse en su galeria, pero NO debe finalizar ni cambiar el medio de B.

Claude: incorporar comparacion atomica de identidad/version de captura en la actualizacion correspondiente y rechazar/ignorar respuestas obsoletas sin perder el recuerdo de A. Gemini: cada trabajo conserva identidad de origen y la envia donde corresponda; actualizar sus consumidores afectados. No basta comparar una variable React en el cliente ni eliminar el aviso al operador. Definir compatibilidad de las otras estaciones que usan la misma accion; buscar referencias antes de cambiar firma. No relajar permisos ni invalidar la nueva sesion para aceptar A.

Aceptacion: A tardia despues de B recording, B processing, reinicio y cambio de estacion; A se conserva donde corresponde y B mantiene su estado/medio. Prueba con limites reales de la transaccion; navegador de operador y display separados. Agregar al test vigente de sesion segura y al E2E de orden 89, no crear otra arquitectura.

**T89-06 / P2: el operador sigue sin poder atender al siguiente.**
En Touchpix `role=operator`, el boton Iniciar captura se deshabilita salvo estados idle/done. La captura nueva cambia a recording y no libera la disponibilidad del equipo hasta que termina IA/subida. Sonda de la expresion real del boton: A esperando proveedor, status recording, disabled true. El invitado puede capturar desde display, pero el modo operador no cumple el mismo objetivo de fila libre.

Gemini y Claude: separar disponibilidad de captura del estado de trabajos IA pendientes usando el modelo existente. Liberar la estacion cuando la captura se termino de guardar, manteniendo limites de dos procesamientos y sus colas; NO solo habilitar el boton mientras todavia se esta capturando. T89-05 debe quedar resuelto a la vez. Reiniciar manualmente no es el flujo normal para cada participante.

Aceptacion: desde operator iniciar A, display captura, A sigue procesando, operator inicia B sin Reiniciar y B captura; cola respeta el limite; fallo A no bloquea B ni marca B como terminado. No usar exclusivamente clicks en display como prueba de operador.

**T89-03, evidencia adicional de contexto, no un encargo duplicado:**
La sonda evalua el callback de un trabajo pendiente con el contexto de un render posterior tras limpiar consentimiento: manda `consentAccepted=false` aunque el trabajo se habia originado con consentimiento. Confirma dependencia del estado vivo en vez de instantanea del trabajo. Falta reproducir esa transicion con React en navegador; no se declara aqui una filtracion de datos ni un envio real sin consentimiento. Incorporar el caso a la correccion ya pedida de identidad/contexto inmutable, distinguiendo revocacion expresa de cambio al siguiente participante.

**Dos controles de barra pasan en la sonda de logica:** stock 0/negativo no entra en sugerencias del MiniQuiosco; la lista mantiene agotados al final incluso al filtrar categoria. Esto no es E2E ni aprobacion de toda la barra. No tocar esa logica por los falsos positivos previamente descartados.

Reproducir primero los hallazgos en la base vigente; si ya se corrigieron en una tanda nueva, vincular evidencia en vez de duplicar. Actualizar orden 89 y YA-RESUELTO con el estado verdadero. Claude ejecuta pruebas focalizadas, luego una compilacion del conjunto congelado; guardar SHA/resultados. No rebajar tests ni permisos para cerrar.

Al consultar, App Hosting para b046863 estaba `in_progress`. Checks de GitHub fallidos no demuestran fallo de codigo: el job Lint/Typecheck/Test/Build no tenia pasos y duro un segundo. No pedir tarjeta ni atribuir una causa sin log. Reutilizar compilacion local verificada de Claude y confirmar por separado el despliegue y smoke de rutas criticas cuando finalice.

Los ensayos con equipos reales no se programan por esta devolucion, respetando el alcance aprobado. Su ausencia sigue siendo un limite para afirmar compatibilidad fisica, no algo que una sonda de codigo pueda certificar. No se promete ausencia absoluta de errores ni se declara toda la app auditada por revisar esta entrega.

Pruebas mencionadas existen, pero no se ejecutaron aqui como E2E. La sonda adjunta SI se ejecuto sobre b046863; los resultados de fallo son evidencia para corregir, no pruebas de aceptacion verdes.

```comprobar
archivo: src/app/evento/touchpix/[fiestaId]/page.tsx
usa: procesarTrabajoIA en src/app/evento/touchpix/[fiestaId]/page.tsx
prueba: tests/e2e/89-ia-no-frena-la-fila.spec.ts
archivo: src/app/actions/touchpix-ai.ts
usa: applyTouchpixTheme en src/app/evento/touchpix/[fiestaId]/page.tsx
prueba: tests/e2e/89-ia-no-frena-la-fila.spec.ts
archivo: src/app/evento/barra/[fiestaId]/page.tsx
usa: handleRandomDrink en src/app/evento/barra/[fiestaId]/page.tsx
prueba: tests/e2e/89-la-barra-no-ofrece-lo-agotado.spec.ts
archivo: src/app/actions/fiesta/sesion-entretenimiento.ts
usa: updateEntertainmentSessionStatus en src/app/evento/touchpix/[fiestaId]/page.tsx
prueba: src/__tests__/entretenimiento-sesion-segura.test.ts
```
