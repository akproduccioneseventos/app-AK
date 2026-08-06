## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Install (once per environment; `uv` is already present):

```
uv tool install graphifyy
```

That provides the `graphify` command used below. Without it every lookup falls
back to raw grep, which is slower and burns far more context.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- Follow the shared quality commands and testing rules in `AGENTS.md`.

## Entorno de Ejecución (Windows PowerShell & GitHub PRs)

- **Sistema Operativo**: Windows con **PowerShell** (NO es Linux/Bash).
- **Prohibido el uso de `&&`**: En PowerShell `&&` produce error de sintaxis (`El token '&&' no es un separador de instrucciones válido`). Usar `;` o comandos independientes.
- **Flujo de Git & GitHub CLI (`gh`)**:
  - **Sincronización antes de trabajar**: Ejecutar `git fetch origin main ; git checkout main ; git reset --hard origin/main` para asegurar base limpia.
  - **Ramas independientes**: Crear SIEMPRE una rama nueva (`git checkout -b fix/nombre-descriptivo`) para cada tarea. NUNCA trabajar sobre ramas con PRs ya mergeadas.
  - **Crear PR (Sin Automerge)**: Subir la rama (`git push origin fix/nombre-descriptivo`) e invocar `gh pr create --title "..." --body "..." --base main`. Dejar la PR abierta para revisión manual del usuario.

## Atajos del entorno (ahorran tiempo y contexto)

Verificado en este contenedor; releer antes de pelear con las herramientas:

- **Pruebas de navegador**: usar `npm run test:e2e:production`. El `webServer` por
  defecto levanta `next dev`, que recompila cada ruta al visitarla (1-2 minutos
  por corrida) y a veces se queda sin memoria. La versión compilada responde al
  instante.
- **Chromium**: la versión que espera Playwright puede no coincidir con la
  instalada. El binario disponible se ubica con
  `find /opt/pw-browsers -maxdepth 3 -name chrome` y se pasa por
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Nunca ejecutar `playwright install`.
- **Sesión interna en pruebas**: las rutas del staff piden cookie `ak_session`
  firmada con `AK_SESSION_SECRET`. El valor de prueba está en `playwright.config.ts`
  y el patrón para generarla, en `tests/e2e/internal-smoke.spec.ts`. Ojo: el
  middleware sólo comprueba que la cookie exista; la firma la valida `AuthGuard`
  en el cliente, así que un secreto mal configurado se manifiesta como una
  redirección a `/login` recién después de cargar la página.
- **Datos locales**: con `AK_USE_LOCAL_JSON_ONLY=true` sólo hay fiestas
  históricas (`src/data/fiestas-historicas.json`). Las fiestas activas viven en
  la base, así que las pantallas por `[id]` muestran su estado de "no encontrada".

## Delegación de trabajo (preferencia del dueño del proyecto)

Ahorrar tokens siempre. El modelo principal actúa como **director**, no como peón:

- Delegá las tareas mecánicas y de sólo lectura a agentes con modelos económicos
  (`model: haiku`): auditorías, inventarios, conteos, búsquedas amplias, verificación
  de enlaces, lectura de archivos largos para extraer datos.
- Lanzalos en paralelo y en segundo plano (`run_in_background: true`) cuando no
  dependan entre sí.
- El modelo principal se reserva para: decidir qué se toca y qué no, editar código,
  resolver ambigüedad, evaluar riesgo de regresión y redactar el reporte final.
- Pedile a cada agente hechos verificables con `archivo:línea`, y que NO modifique
  archivos salvo que se le indique explícitamente.
- Incluí en cada prompt de agente la regla de graphify: orientarse con
  `graphify query` antes de leer archivos.

### VERIFICAR lo que reporta el agente antes de tocar nada

**Los agentes baratos se equivocan seguido, y con seguridad.** En una tanda real,
de diez hallazgos reportados **nueve eran falsa alarma**: el agente afirmaba que en
pantalla iba a aparecer la palabra "undefined", cuando en React un valor vacío no
muestra nada. Aplicar eso sin mirar habría tocado nueve archivos al pedo.

Antes de corregir cualquier cosa que reporte un agente, abrí el archivo en la línea
que indica y confirmá con tus propios ojos que el problema existe. Si no se
confirma, decilo en el reporte: "de los diez avisos, nueve eran falsa alarma".

El reparto correcto es: los agentes **buscan y leen** (que es lo que consume), el
modelo principal **confirma y corrige** (que es lo que decide).

### El dueño NO es programador

Regla principal: **resolver, no delegar en el usuario.**

- No le pidas que corra comandos, aplique parches, edite archivos ni configure nada.
  Si algo hay que hacer, hacelo vos. Si de verdad no se puede, decí en una linea qué
  está bloqueado y por qué, sin instrucciones técnicas.
- Escribí siempre en castellano rioplatense simple. Nada de jerga sin traducir:
  no "hydration", "cascada CSS", "rate limit", "specificity", "blob SHA".
  Decí qué le pasa AL USUARIO en pantalla y qué cambia para su negocio.
- Nada de bloques de comandos ni rutas de archivo en la respuesta salvo que los pida.
- Antes de mandar una respuesta, releerla y sacar todo lo que él no podría entender.

### No hablar de credenciales

El dueño ya decidió: los accesos se usan en produccion y los revoca el mismo
cuando termina. NO mencionar tokens, claves, permisos ni facturacion de GitHub
en las respuestas. Tampoco recordarle que los borre. Usar lo que haya y seguir.

### Presupuesto de tokens

El dueño trabaja con plan Pro y necesita que el consumo rinda. Administrar siempre:

- Leer sólo los rangos de línea necesarios, no archivos enteros.
- No re-leer un archivo ya editado para verificarlo: si `Edit` no falló, el cambio se aplicó.
- Agrupar comandos de shell independientes en una sola llamada.
- Filtrar la salida de comandos largos (`| tail -15`) en vez de volcarla completa.
- Respuestas al usuario: directas y sin relleno.

### PARAR ANTE UN MURO (regla dura)

Pasó una vez: hora y media y todos los tokens del día quemados persiguiendo un
problema que no existía. **No puede volver a pasar.** Ante cualquiera de estas
señales, PARAR EN EL ACTO y avisar en dos líneas. No investigar, no reintentar,
no "una prueba más":

1. **GitHub rechaza escribir.** Si `git push` o abrir la propuesta de cambios da
   403, no hay segundo camino que probar: ninguno funciona. Avisar y dar el
   enlace de comparación para que la abra él con un clic. Fin.
2. **La misma prueba falla dos veces seguidas.** No hay tercer intento
   "arreglando" algo distinto. Parar y contar qué falla.
3. **Falla algo que antes andaba y no se tocó.** Casi siempre es el servidor de
   prueba sirviendo una versión vieja, no la app. Primero reiniciar el servidor;
   si igual falla, parar. Nunca leer código buscando un defecto antes de
   descartar esto.
4. **Más de 20 minutos en un solo problema.** Parar y contar el estado.

Además: **nunca recompilar mientras corre una prueba de navegador** (produce
fallas falsas), y **nunca correr una sola prueba con filtro por nombre** en un
archivo donde las pruebas dependen entre sí (da fallas inventadas).

Regla de fondo: es mejor entregar nueve cosas y decir "la décima está trabada"
que gastar todo el día en la décima.

## Decisiones del dueño ya tomadas (NO volver a preguntar)

Cerradas. Si un análisis las marca como problema, es un falso positivo:

- **El ajuste anual del 15% va siempre.** El descuento del 50% del Salón Club
  Uruguay y el descuento ficticio del presupuesto son decisiones de marketing
  suyas: no se tocan.
- **Se cocina lo que se contrató.** La lista de compras usa la cantidad de
  invitados del presupuesto, no la de confirmados. Si vienen más, el sistema
  permite agregar invitados y el presupuesto sube. Está bien así.
- **Las fotos del muro se descargan con el enlace directo, a propósito.** Quiere
  que cualquiera que tenga el enlace pueda bajarlas.
- **Se trabaja sólo en pesos uruguayos.** Las diferencias de redondeo en dólares
  no aplican.
- **Los controles rojos de GitHub son por facturación bloqueada.** No investigarlos
  ni reportarlos. Lo que vale es lo que se verifica localmente.

## Cómo se verifica que la app está sana

El orden que funciona, y que ya detectó fallas reales:

1. `npx tsc --noEmit` — cero errores.
2. `npx jest --silent` — todas en verde.
3. `npm run build` — tiene que terminar bien.
4. Servidor compilado en el puerto 3100 y después las pruebas de navegador.
   Nunca al revés, y nunca recompilar mientras corren.
5. `npm run test:rules` para la seguridad de la base.

**Después de fusionar varias propuestas que tocan los mismos archivos, correr esto
de nuevo.** Pasó de verdad: dos propuestas protegieron el archivo de facturas de
maneras distintas, al fusionarse quedaron las dos aplicadas encima, y además de no
compilar habría dejado la pantalla colgada para siempre al guardar una factura.

## Estado de la auditoría

`ESTADO-AUDITORIA.md` lleva la cuenta de lo hecho y lo pendiente. Leerlo antes de
empezar, y actualizarlo al terminar una tanda.
