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

## Dónde estás corriendo (fijate primero, cambia los comandos)

Este proyecto se trabaja desde dos lugares distintos. **Averiguá cuál es antes de
correr nada**; confundirlos hace perder intentos.

- **Máquina del dueño: Windows con PowerShell.** Es donde él trabaja. Ahí `&&` da
  error de sintaxis: separar con `;` o comandos independientes. Ahí sí existe el
  comando `gh` de GitHub.
- **Claude Code en la web: Linux con bash.** Contenedor efímero, se arma solo al
  arrancar. Ahí `&&` funciona normal, **no existe `gh`** (las operaciones de
  GitHub van por las herramientas del entorno) y todo lo que no se sube a la rama
  se pierde al cerrar.

Si el entorno dice que la plataforma es `linux`, estás en el segundo caso.

## Fusionar propuestas: sí, cuando pasan los controles

**El dueño cambió esta regla el 6 de agosto de 2026.** Antes estaba prohibido
fusionar; ahora se fusiona directo, sin esperar que lo haga él. Si algún documento
viejo dice "prohibido fusionar", manda esto.

Condición: **una propuesta se fusiona sólo después de pasar todos los controles**,
nunca porque parezca bien a simple vista. Antes de fusionar hay que verificar, con
la habilidad `revisar-pr`:

- Compila (revisor de tipos en cero) y las pruebas pasan.
- Sin acentos rotos (`npm run check:acentos`).
- No choca con las otras propuestas abiertas, probando fusionarlas juntas.
- Nada raro en plata, cobros, permisos ni quién puede ver qué.

Si algo de eso falla, **no se fusiona**: se le cuenta al dueño en criollo qué pasa
y qué vería el usuario en pantalla si se fusionara igual.

Después de fusionar, volver a correr la verificación completa sobre la versión
principal. Dos propuestas que pasan por separado pueden romper juntas: ya pasó con
el archivo de facturas, que quedó protegido dos veces y dejaba la pantalla colgada
al guardar.

## Propuesta rota: repararla o rehacerla (decidís vos)

**El dueño lo autorizó el 6 de agosto de 2026.** Cuando una propuesta abierta
llega rota, no hay que elegir entre fusionarla así o tirarla. Hay tres caminos y
el criterio es tuyo:

1. **Repararla**, si el daño es mecánico y reversible: acentos rotos, un cierre de
   llave que falta, un archivo mal guardado. Se arregla y se fusiona.
2. **Sacarle lo bueno y rehacerla**, si el daño es de fondo: código a medio
   escribir que nunca compiló, pantallas que usan datos que no existen, o cambios
   que deshacen trabajo más nuevo que ya está en la versión principal. Se rescata
   lo que sirve, se hace de nuevo limpio en una rama nueva, y la vieja se cierra.
3. **Dejarla y avisar**, sólo si lo que trae no se entiende o toca plata y
   permisos de una forma que conviene consultar.

Al cerrar una propuesta que no sirve: **se cierra y listo**. Nada de informes
largos explicando por qué. Una línea al dueño alcanza.

Regla práctica para elegir: si después de arreglar lo mecánico **siguen apareciendo
errores nuevos y distintos**, no es una propuesta dañada, es una propuesta sin
terminar. Ahí conviene rehacerla y no seguir remendando.

Y no te olvides: una propuesta hecha sobre una versión principal vieja puede
**borrar** trabajo más reciente sin que se note. Comparala siempre contra la
versión principal de ahora, no contra la que tenía cuando se creó.

## Flujo de Git y propuestas de cambio

- **Flujo de Git & GitHub CLI (`gh`, sólo en la máquina del dueño)**:
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

**Regla fija, pedida por el dueño: delegar SIEMPRE en los ayudantes económicos.**
No es "cuando convenga": es el modo de trabajo por defecto en toda tarea. El
modelo principal **dirige y decide**; el trabajo de buscar, leer, contar,
inventariar, correr verificaciones y esperar resultados va a los agentes baratos.
Si el modelo principal se pone a leer archivos que podía delegar, está gastando
plata al pedo.

Ya están configurados y listos para usar (no hay que explicarles las reglas):
`ak-buscador` para ubicar dónde vive algo, `ak-auditor` para revisar un área,
`ak-inventario` para listas y conteos. Los tres son de sólo lectura.

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

## Un módulo se termina, no se deja a medias

**Regla del dueño, 7 de agosto de 2026.** Cuando se trabaja un módulo, se deja
**pronto**. No se para hasta terminarlo. Nada de entregar la mitad y dejar el
resto anotado para después: eso convierte cada módulo en una deuda que nadie
salda.

Qué significa en la práctica:

- Si aparecen cosas nuevas mientras se trabaja, se hacen dentro de la misma
  tanda, no se posponen.
- Si algo queda sin hacer de verdad, se dice **cuál** y **por qué**, en una
  línea, y es la excepción, no la costumbre.
- Terminado quiere decir: compila, pruebas en verde, sin acentos rotos, y
  probado en un navegador de verdad si toca pantallas que usan cámara,
  micrófono o pantalla completa.

## No alcanza con arreglar: hay que mejorar

**Regla del dueño, 8 de agosto de 2026.** Cada vez que se trabaja algo, la
mirada no es sólo "¿qué está roto?". Es también **"¿cómo se usa mejor?"** y
**"¿cómo se ve mejor?"**. Las tres cosas juntas, siempre, sin que haga falta
pedirlo.

Qué mirar además de los errores:

- **Más práctico.** Pasos de más para hacer algo simple, datos que el equipo
  tiene que cargar dos veces, cosas que el sistema ya sabe y podría completar
  solo, pantallas que obligan a ir y volver. Si algo se puede hacer en un toque
  en vez de cuatro, se hace en uno.
- **Más lindo.** Es un producto que se le muestra al cliente y compite con
  plataformas pagas: espaciados desprolijos, textos cortados, tablas que se
  desbordan en el celular, pantallas vacías sin gracia, botones sin jerarquía.
  Lo feo también hace perder ventas.
- **Que se entienda.** Mensajes en criollo y no en jerga, carteles que digan qué
  hacer y no sólo qué pasó, pantallas vacías que expliquen el próximo paso.

Al auditar, pedirle a los ayudantes las tres listas: qué está roto, qué es
incómodo de usar y qué se ve mal. Al reportar, separarlas igual.

## Errores ya cometidos (no repetirlos)

Lista corta de cosas que salieron mal de verdad. Se relee antes de una tanda
grande; cada una costó tiempo o plata.

### 1. Verificar propuestas a mano en vez de delegarlo

Correr el revisor de tipos, las pruebas y el build es **apretar un botón y
esperar**: va a los ayudantes económicos, siempre. El modelo principal se queda
con leer el cambio y decidir.

Y si hay varias propuestas para revisar, **se verifican en paralelo**, no una
atrás de la otra. Cuatro builds seguidos son veinte minutos de reloj al pedo.

Lo que sí hace el modelo principal: mirar el cambio con criterio. En una tanda
real eso encontró que la sincronización con Google se había movido **antes** del
guardado, y mandaba los avisos con la lista vieja de personal. Un ayudante barato
no lo agarraba.

### 2. Perder ediciones al cambiar de rama

Pasó dos veces en una misma sesión:

- `git stash -u` seguido de `git checkout -- .` borró trabajo sin commitear.
- `git checkout <otra-rama> -- <archivo>` **pisó** una edición que estaba en el
  árbol de trabajo, porque trae la versión commiteada de esa rama.

**Regla: commitear antes de cambiar de rama.** Nunca usar `git checkout <ref> --
<archivo>` esperando llevarse una edición sin commitear: hace lo contrario.

### 3. Pedir algo que ya estaba hecho

Una orden de trabajo pidió construir el álbum del portal del cliente, que la
aplicación ya tenía. Gemini perdió el viaje entero.

**Antes de escribir una tarea en una orden, verificar que no exista.** Un
`graphify query` y una mirada al archivo alcanzan.

### 4. Declarar que algo falta por una búsqueda mal hecha

Se reportó que los recibos no tenían guardado automático. Sí lo tenían: la
búsqueda fue `autoSave` y la función se llamaba `handleAutoSaveSalary`. La
diferencia era una mayúscula.

**Buscar sin distinguir mayúsculas antes de afirmar que algo no está.**

### 5. Confiar en el revisor de tipos como si fuera el build

`npx tsc --noEmit` pasaba y `npm run build` fallaba. La aplicación estuvo seis
días sin poder publicarse y nadie lo vio. **El build es control obligatorio**, no
un extra.

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

## Continuidad entre chats (leer esto primero, siempre)

El dueño no tiene que contar de nuevo en qué se estaba trabajando cada vez que
abre un chat. Para eso hay dos archivos, y se usan distinto:

- **`ESTADO-ACTUAL.md`** — la hoja de traspaso. Corta (máximo 40 líneas) y se
  **pisa**, no se acumula. Dice en qué se está trabajando, en qué rama, qué quedó
  a medias y qué sigue. **Se lee entera al empezar cualquier sesión.** En las
  sesiones web se imprime sola al arrancar.
- **`ESTADO-AUDITORIA.md`** — el histórico completo. Es largo y caro de leer: se
  abre sólo cuando hace falta buscar algo viejo, nunca de rutina.

Al terminar una tanda, reescribir `ESTADO-ACTUAL.md` con el comando `/aca-quede`.
Una sesión que cierra sin dejar el traspaso hace que la siguiente arranque a
ciegas y gaste el doble.

## Se programa entre tres: Codex, Gemini y Claude

El dueño trabaja con las tres a la vez sobre el mismo repositorio. De ahí salen
las reglas que más importan:

- **Nunca dos tareas en la misma rama.** Cada una arranca desde la versión
  principal actualizada, con rama nueva y nombre descriptivo.
- **Antes de empezar, mirar qué propuestas de cambio están abiertas.** Si la de
  la rama actual ya se cerró o fusionó, está prohibido seguir subiendo ahí:
  rama nueva y propuesta nueva.
- **Después de fusionar varias propuestas que tocan los mismos archivos, correr
  la verificación completa de nuevo.** Ya pasó: dos propuestas protegieron el
  archivo de facturas de maneras distintas, al fusionarse quedaron las dos
  aplicadas encima y la pantalla quedaba colgada al guardar una factura.
- **La hoja de traspaso es de las tres**, no de una sola. Lo mismo vale para las
  reglas compartidas de `AGENTS.md`.
- Ninguna IA fusiona propuestas por su cuenta: se dejan abiertas para el dueño.

## Atajos ya configurados (usarlos, no rehacerlos)

- **`/sano`** — corre los cinco controles de salud en el orden correcto y avisa
  el resultado en criollo. No hace falta recordar la secuencia.
- **`/aca-quede`** — reescribe la hoja de traspaso al cerrar la sesión.
- **Ayudantes económicos ya definidos**, con las reglas del proyecto adentro (no
  hay que explicárselas cada vez): `ak-buscador` para ubicar dónde vive algo,
  `ak-auditor` para revisar un área, `ak-inventario` para listas y conteos. Los
  tres son de sólo lectura y arrancan por el mapa del código.
- En las sesiones web, el navegador de pruebas se ubica solo al arrancar: no hace
  falta buscarlo a mano.
