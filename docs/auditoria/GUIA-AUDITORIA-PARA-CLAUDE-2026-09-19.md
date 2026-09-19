# Para Claude, Gemini y Codex: auditoria que comprueba resultados
Fecha: 2026-09-19. Guia de trabajo compartida solicitada por el dueno, no certificado ni nueva orden de programacion.
Esta guia tambien obliga a Codex: no presupone que sus hallazgos sean infalibles.
No conocemos todas las pruebas ejecutadas por Claude; no atribuimos la omision a descuido ni a menor capacidad.

## 1. Antes de probar: no repetir ni trabajar sobre una version vieja
Leer ESTADO-ACTUAL.md, INDICE-CORTO.md y solo las entradas pertinentes de YA-RESUELTO.md.
Anotar rama/HEAD exacto, entorno y configuracion. Contrastar con la tanda pendiente antes de ordenar un arreglo.
Si el caso ya fue revisado por Codex, reutilizar su evidencia: por orden vigente del dueno, terminar la primera pasada antes de la revalidacion global.
No deducir "probado" de que exista un archivo, una ruta o una prueba. Compilar no ejecuta el recorrido.
No cambiar el reparto: Codex revisa/documenta; Claude lleva dinero, cobros, comida, permisos y valida datos sensibles; Gemini implementa el resto; Claude compila. El dueno decide cambios de funcionamiento y fusion.

## 2. Definir el resultado humano antes del test
Por cada recorrido escribir cuatro cosas, sin jerga:
- Quien actua y para que: "el DJ quiere saber las canciones prohibidas".
- Que debe ver: "lista correcta de esta fiesta, no otra".
- Que debe quedar guardado: "la decision persiste al recargar".
- Que NO puede pasar: "no anunciar reserva si el regalo sigue siendo de otra persona".

Ejemplos de invariantes:
- Confirmacion de exito implica el efecto prometido; si hubo parcialidad, se identifica.
- Un reintento de la misma operacion no duplica sus efectos.
- Dos cambios independientes se conservan; un recurso exclusivo no se adjudica dos veces.
- Una lista vaciada intencionalmente sigue vacia.
- Una respuesta vieja no hace retroceder el estado nuevo.
- Solo el rol y evento autorizados pueden acceder. No abrir permisos para hacer pasar una prueba.
- Un total se contrasta con una cuenta independiente, no con el mismo helper que lo calcula.
El comportamiento esperado debe salir de una regla aprobada o de una promesa real de pantalla; no de preferencias del auditor.

## 3. Seguir la accion de punta a punta
Pantalla -> controlador -> accion servidor -> persistencia/proveedor -> respuesta -> mensaje -> recarga/segunda sesion.
Leer solo esa cadena y sus dependencias directas. Verificar archivo, simbolo y consumidor en el SHA.
Despues del clic observar el resultado, no solo el toast. Desmontar/remontar la pantalla o consultar el estado persistido para descartar estado optimista.
Para un archivo: abrir el PDF/ZIP real y revisar contenido, cantidad, legibilidad y pagina. Un 200 o un blob no bastan.
Para una integracion: una solicitud aceptada no prueba envio/publicacion final. Comprobar estado del proveedor y manejo de pendiente/fallo.

## 4. Matriz minima basada en riesgo
No ejecutar todas las combinaciones en cada boton. Priorizar los cambios y funciones que pierden datos, dinero, acceso o confianza.
| Escenario | Como provocarlo | Que mirar |
| --- | --- | --- |
| Normal | Datos validos representativos | Resultado visible y persistido |
| Vacio y limite | 0, 1, maximo, maximo+1; ausencia distinta de [] | Coherencia UI/servidor, sin ejemplos repuestos |
| Fallo previo | Lectura o primer guardado falla | No sobreescribe ni anuncia exito |
| Fallo parcial | Segundo guardado falla despues del primero | Dice lo que quedo hecho y lo pendiente |
| Reintento | Repetir mismo pedido tras fallo/respuesta perdida | No duplica ni cobra/aumenta otra vez |
| Dos operadores | Barrera controlada: ambos leen, luego escriben | Conserva cambios o rechaza conflicto claramente |
| Respuestas invertidas | Demorar A, recibir B, liberar A | No vuelve al estado viejo |
| Estado viejo | Otro usuario reserva/elimina antes del clic | No confirma algo que ya no existe |
| Servicio externo | Timeout, rechazo, 403/500, resultado pendiente | Sin falso exito, ni descarga incompleta silenciosa |
| Rol/dispositivo | Sesiones separadas y pantalla pequena | Sin acceso extra ni controles inaccesibles |

Concurrencia: usar barreras/promesas controladas, no pausas aleatorias. Cuando el defecto depende de varias instancias, un mutex local no demuestra solucion.
Fecha de calendario y momento UTC no son lo mismo: comprobar zona Uruguay y bordes de dia.
Dinero: centavos, regalos, descuentos, pagos pendientes/rechazados, duplicados y reintentos segun reglas existentes.

## 5. Ejercicio real de esta tanda
Caso GUI01, docs/auditoria/GUIAS-ARMADO-2026-09-19.md:
1. Guia sintetica con una tarea; fiesta vacia.
2. Permitir guardar fiesta.
3. Hacer fallar el registro de aplicacion.
4. Observar: respuesta dice fallo y cero tareas, pero ya existe una.
5. Reintentar misma aplicacion: quedan dos tareas.
6. Criterio de arreglo: mismo intento no duplica, resultado parcial no miente y se preserva el historial.
No basta cambiar el mensaje ni hacer que el test espere dos tareas. La solucion debe cumplir la regla de negocio.
Otros ejemplos con sondas: REG02 reserva ya tomada; VID03 ZIP parcial; INC01 comentario frente a resolucion; INS01 aumento aplicado con propagacion fallida.

## 6. No dejar que el test se apruebe solo
- Preferir importar el modulo real. Una extraccion AST sirve para aislar, pero omite imports, inicializacion, infraestructura y algunas interacciones.
- Simular solo dependencias necesarias y declararlas. No simular la funcion que precisamente se quiere verificar.
- Un reemplazo de array simulado demuestra un riesgo bajo ese contrato; comprobar contrato real antes de afirmar perdida en produccion.
- JSZip simulado comprueba decisiones de incluir archivos, no que un ZIP real abra.
- Agregar un control normal que pase para distinguir fallo del producto de montaje roto.
- Probar que el test detecta la version defectuosa y pasa con la corregida. Un snapshot nuevo o busqueda de texto no demuestra comportamiento.
- No confiar ciegamente en mis sondas: revisar expectativa, dobles y consumidor. Rechazar un falso positivo con evidencia y anotarlo.
- No cambiar resultado esperado solo para poner todo verde. Si cambia una regla, pedir aprobacion y explicar por que.

## 7. Revision humana, no solo tecnica
Usar la app como organizador, cliente, invitado y operador con cuentas de prueba autorizadas.
Preguntar: entiendo donde estoy, que hago ahora, que cambio se guardo, como recuperarme si falla?
Detectar fricciones aunque no haya excepcion: pedir un ID tecnico al usuario, perder un borrador, ocultar lo mas vendido, mostrar ejemplos como datos reales.
Separar defecto reproducido de propuesta de mejora. No implementar nuevas reglas ni esconder fotocabina/360/espejo sin aprobacion.
Estetica: capturas reales desktop/movil, contraste, texto visible, foco/teclado, carga vacia/error y movimiento perceptible sin tapar ni ralentizar la tarea. Animacion en un nodo invisible no prueba experiencia.
No inventar acceso a camara, impresora, correo, Meta o produccion. Marcar lo bloqueado y que falta para probarlo.

## 8. Registro que permite cerrar de verdad
Una fila por caso, no un "todo funciona":
ID | regla/escenario | SHA/rama | entorno/datos | pasos | esperado | observado | evidencia | nivel | responsable | pendiente.
Niveles separados: inspeccion / aislado / integrado / navegador / publicado. No son equivalentes.
Estados: pendiente de revisar / fallo reproducido / correccion informada / correccion verificada / bloqueado.
Anotar tambien controles correctos y falsos positivos para no redescubrirlos.
Al compilar el conjunto, registrar SHA final, comandos, resultados y limites. La compilacion la hace Claude, sin duplicarla entre agentes.
La fusion y el despliegue pueden cambiar el conjunto: una aprobacion vieja no se transfiere automaticamente.

## 9. Ahorro de tiempo sin bajar evidencia
Agrupar pruebas por contrato compartido, leer diffs/rangos y reutilizar el mismo SHA y entorno.
Escribir primero el caso minimo que falla; no levantar un build por hallazgo ni cargar todo el historial.
Delegar solo si separa trabajo real, con contexto minimo; no duplicar agentes y revision completa.
En el cierre decir: "Estos recorridos pasaron en este SHA; estos quedan pendientes". Nunca "cero errores en toda la app".
Esta guia no programa correcciones ni significa que Claude la haya leido. Se comparte en la rama de auditoria, no en main.
