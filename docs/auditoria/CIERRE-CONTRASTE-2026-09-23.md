# Contraste de cierre - 23 de septiembre de 2026

## Version y alcance
Main comprobado: 2f413228cf97dce5cef6f6bb818c504ec66cef74. Codex solo audita: no modifico la app, no compilo ni fusiono. Esta entrega sustituye el estado residual de la orden 80, no las decisiones del dueno.
32 ejecuciones de sondas aisladas: 28 PASS y 4 FAIL. Incluyen controles repetidos entre suites; NO son 32 recorridos distintos ni un porcentaje de cobertura de la app. Funciones reales extraidas por AST; persistencia, autenticacion y servicios simulados. No Firebase real.

## Correcciones revalidadas
- Calendario: fecha civil, noche uruguaya, dato corrupto, no mover fiesta al arrastrar reunion, cambio de fecha con servidor UTC/Uruguay y rechazo de fecha imposible: 7 PASS.
- Barra: recupera stock cuando falla el respaldo (false o excepcion), alta normal/pausada y conserva pedido anterior si falla reemplazo.
- RSVP nuevo: devuelve invitado propio sin updatedFiesta, datos internos ni clave del portal cliente. QR por nombre permanece aprobado por el dueno; no se reabre INV02.
- Fotos y salones: concurrencia en una misma instancia pasa. Borrado del ultimo elemento pasa contra syncToFirestore simulado.

## Residuales comprobados: Claude, sin rehacer lo anterior
1. BAR02: descontarStock conserva una promesa rechazada en stockPromiseChain. En fallback sin Firestore, un primer fallo temporal impide que el segundo pedido siquiera intente leer/escribir. Resultado: firstFailed=true, secondFailed=true, reads=1, writes=1. Revisar tambien reponerStock que comparte cadena. Recuperar la cola para la siguiente operacion sin ocultar el error de la actual.
2. BAR01 parcial: si falla guardar pedido y tambien reponerStock, stock queda 9 en vez de 10 sin pedido. Ahora hay logger.error: NO sigue siendo silencioso en servidor. Falta demostrar recuperacion durable/idempotente o reconciliacion visible para operador. No exigir escritura inmediata con almacenamiento caido; exigir deteccion y recuperacion posterior sin doble consumo.
3. CAT01/CAT02 parciales: dos instancias con mutexes propios y almacen compartido siguen perdiendo escrituras. Fotos: 1 alta conservada de 2. Salones: ambas operaciones anuncian exito, capacidades finales [10,21] en vez de [11,21]. apphosting.yaml permite maxInstances:4. La sonda demuestra el intercalado posible, no incidencia observada en Firebase real. Mutex local resuelve solo una instancia; usar mutacion individual transaccional/versionada o proteccion distribuida. No resolver bajando capacidad del servidor sin evaluar impacto.

## Evidencia ejecutable
Desde la raiz del repo, teniendo TypeScript disponible y los scripts historicos en la misma carpeta:
- node docs/evidencias/revalidacion-2f41322.cjs . : 10 PASS / 1 FAIL.
- node docs/evidencias/revalidacion-catalogos-2f41322.cjs . : 18 PASS / 1 FAIL.
- node docs/evidencias/revalidacion-instancias-2f41322.cjs . : 0 PASS / 2 FAIL.
AUDIT_TYPESCRIPT puede apuntar a TypeScript instalado fuera de produccion. Los wrappers reutilizan revalidacion-659d696.cjs y barra-invitados-catalogos-sonda.cjs. Exit 0 no certifica exito: leer passed/fail del JSON.
Convertir estos casos en pruebas integradas de la correccion y registrar SHA/comando/resultado. No dar por validada una integracion por esta simulacion.

## Recorrido publico observado, separado del codigo
Version desplegada no identificada: no atribuirle el SHA anterior. En navegador estrecho:
- Inicio, acceso al simulador y validaciones de datos obligatorios observados.
- Club Uruguay abre. Enlace de blog desde pie vuelve a seccion correcta de inicio.
- Listado y articulo de blog abren; articulo muestra contenido y enlaces comerciales.
- No se enviaron consultas, crearon presupuestos reales ni contactaron clientes.
- Un articulo adicional produjo ERR_BLOCKED_BY_CLIENT: limitacion de este navegador, NO defecto confirmado de la app.
No es aprobacion visual desktop/movil completa, ni prueba del PDF, sesion interna, CRM, hardware o integraciones.

## Otros pendientes del registro de Claude
- PR1214 secretario/salon3D: seis E2E reportados fallidos en DEVOLUCION-74-75-77-seis-pruebas-no-pasan.md. Evidencia de Claude, no nueva ejecucion por Codex. Gemini corrige; Claude repite y compila conjunto.
- Memoria: no aumentar. Decision del dueno; diagnosticar caidas si ocurren, no tratarlo como cambio obligatorio.
- Ensayo real con fotocabina, 360 y barra; roles e integraciones externas requieren evidencia de entorno real de prueba.

## Dictamen
NO certificado de lanzamiento total. Se han cerrado casos concretos y quedan residuales reproducidos adicionales a los tres puntos mencionados por Claude. No declarar que toda la app esta probada: el inventario de 360 paginas nunca equivalio a 360 recorridos. Reutilizar evidencia vigente; solo revalidar lo modificado o dependencias afectadas.
