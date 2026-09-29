# Multiagente: una coincidencia parcial puede completar una tarea equivocada

Fecha: 2026-09-29
SHA de main: `975118a8d2f22868f9cdffc1fa6d8c245ba75fd0`

## P2 — La acción `complete_task` acepta la primera coincidencia parcial

En `sendPersistentMultiAgentMessage` (`src/app/actions/multiagent.ts`), el selector busca `t.texto.toLowerCase().includes(data.texto.toLowerCase())` y deja de recorrer la lista al encontrar la primera. La tarea puede cambiar a completada sin que el identificador de tarea coincida de forma única.

Caso reproducible por el algoritmo: si hay tareas `Confirmar menú` y `Confirmar salón`, y la acción de IA devuelve `texto: "confirmar"`, se completa la primera de la lista, aunque no sea la que el usuario quiso indicar. No es una reproducción dinámica contra la app; es una consecuencia directa de la condición y del `break`.

### Cobertura existente y hueco

`src/__tests__/el-secretario-hace-tres-cosas-mas.test.ts` prueba que se conserva el resto de tareas y que, si no hay ID ni texto, no se elige la primera. El caso positivo usa la palabra parcial `luces`, que solo coincide con una tarea. No hay prueba para dos coincidencias parciales posibles.

### Recomendación

Preferir ID de tarea proveniente de la lista real del evento. Si el modelo entrega texto, normalizar y exigir coincidencia única; si hay cero o más de una, no modificar datos y pedir que el usuario elija. Añadir una prueba con dos tareas que comparten el fragmento y comprobar que ninguna se marca.

### Estado de verificación

Análisis estático del consumidor y lectura de la prueba en SHA `975118a8d2f22868f9cdffc1fa6d8c245ba75fd0`. Codex no ejecutó la prueba ni escribió en datos reales. Fuera de la PR #1243 que Gemini está trabajando.
