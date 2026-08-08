## ANTES DE AUDITAR: leé `docs/YA-RESUELTO.md`

En este proyecto trabajan varias IA en paralelo, en cuentas distintas. Sin esa
lista pasa esto: una auditoría nueva "encuentra" un problema que ya se arregló,
alguien lo vuelve a tocar, y a veces lo deja peor. Ya paso: dos propuestas
protegieron el mismo archivo de maneras distintas y al fusionarse dejaron la
pantalla colgada para siempre.

**Si algo que vas a reportar figura ahí, es falso positivo.** Y cuando arregles
algo nuevo, **agregalo a esa lista en la misma propuesta**.

## Traspaso entre chats (obligatorio, vale para Codex, Gemini y Claude)

Este proyecto se programa entre tres IA sobre el mismo repositorio. Para no
arrancar cada chat de cero y no pisarse entre ramas:

1. **Al empezar cualquier sesión, leer `ESTADO-ACTUAL.md`.** Es corto a propósito
   (máximo 40 líneas): dice en qué se está trabajando, en qué rama, qué quedó a
   medias y qué sigue. Se lee entero, siempre.
2. **Al terminar una tanda, reescribirlo.** Se pisa, no se acumula. Una sesión
   que cierra sin dejar el traspaso obliga a la siguiente a redescubrir todo.
3. `ESTADO-AUDITORIA.md` es el histórico largo. Se abre sólo para buscar algo
   viejo, nunca de rutina: leerlo entero es caro.
4. Cada tarea va en una rama nueva desde `main` actualizado. Nunca dos IA en la
   misma rama, y nunca subir a una rama cuya propuesta ya fue cerrada o fusionada.
5. Después de fusionar varias propuestas que tocan los mismos archivos, correr la
   verificación completa de nuevo antes de dar nada por sano.

## Errores ya cometidos (valen para Codex, Gemini y Claude)

Lista corta de cosas que salieron mal **de verdad** en este proyecto. Cada una
costó tiempo, plata o una propuesta entera a la basura. Releerla antes de una
tanda grande.

### 1. Acentos rotos: 902 de una sola vez

Una propuesta reescribió 45 archivos con la codificación equivocada. Además de
verse mal en pantalla (`MenÃº`, `PresentaciÃ³n`), **rompe comparaciones de texto
en silencio**: el código que buscaba la palabra `niño` dejó de encontrarla y los
platos de chicos pasaron a contarse como de adultos.

**Guardá siempre en UTF-8** y corré `npm run check:acentos` antes de subir. Si
salta, no subas.

### 2. Comillas invertidas borradas

En tres propuestas seguidas, la herramienta de edición se comió las comillas
invertidas de los textos armados (`` `texto ${variable}` ``). El proyecto no
compilaba, y en un caso se llevó puesta también la variable de adentro: la trivia
perdió el color verde/rojo de las respuestas sin que se notara en el diff.

**Si `npx tsc --noEmit` marca errores raros de sintaxis, es esto.**

### 3. El revisor de tipos NO es el build

`npx tsc --noEmit` pasaba y `npm run build` fallaba. La aplicación estuvo **seis
días sin poder publicarse** y nadie lo vio.

**Los cuatro controles antes de subir, siempre:**

```
npx tsc --noEmit
npx jest --silent
npm run check:acentos
npm run build
```

### 4. Contar filas en vez de personas

Un invitado puede venir con acompañantes (`partySize`). Contar `.length` de una
lista de invitados cuenta **filas de tabla, no gente**. Ya pasó tres veces: el
cartel de la puerta, la cuenta de celíacos y el reporte al catering. Una familia
de cinco celíacos figuraba como **un** plato especial.

**Cada vez que cuentes invitados, preguntate si querés filas o personas.** Casi
siempre son personas.

### 5. Guardar y avisar en el orden equivocado

Una propuesta movió la sincronización con Google **antes** del guardado. Como esa
sincronización vuelve a leer los datos de la base, mandaba los avisos con la
asignación **vieja**: el mozo nuevo no se enteraba de que trabajaba y al que
habían sacado le llegaba el correo igual.

**Primero se guarda, después se avisa.** Siempre.

### 6. Pantallas que dicen que algo salió bien cuando falló

El patrón se repitió copiado en cuatro estaciones: al fallar la subida, la
pantalla igual mostraba "listo, escaneá tu recuerdo" con una rueda girando para
siempre. La gente se iba de la fiesta creyendo que tenía su foto.

**Si un `catch` no le muestra nada al usuario, está mal.** Y ninguna pantalla
puede afirmar que algo se guardó si no se guardó.

### 7. Perder trabajo al cambiar de rama

`git stash -u` seguido de `git checkout -- .` borró trabajo sin confirmar. Y
`git checkout <rama> -- <archivo>` **pisa** una edición del árbol de trabajo en
vez de traerla.

**Confirmá los cambios antes de cambiar de rama.**

### 8. Programar algo que ya existía

Una orden de trabajo pidió construir el álbum del portal del cliente, que la
aplicación ya tenía. Se perdió el viaje entero.

**Antes de programar una tarea, verificá que no esté hecha.** Un `graphify query`
y una mirada al archivo alcanzan.

### 9. Afirmar que algo falta por una búsqueda mal hecha

Se reportó que una pantalla no tenía guardado automático. Sí lo tenía: la
búsqueda fue `autoSave` y la función se llamaba `handleAutoSaveSalary`. La
diferencia era una mayúscula.

**Buscá sin distinguir mayúsculas antes de decir que algo no está.**

### 10. Propuestas gigantes

Una propuesta de 45 archivos no la puede revisar nadie, y terminó cerrada sin
fusionar aunque adentro tenía cosas buenas. **Una tarea o un bloque por
propuesta.** Si una parte viene mal, no puede bloquear a las otras.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## AK expert skills

All Codex chats working on this project must use the AK expert skills when available.

Required skill routing:
- Use `ak-expertos-produccion` for AK Producciones product work: programming, PR review, launch readiness, marketing, sales, simulator, client/invited experiences, entertainment modules, accounting, payments, budgets, and business-quality finishing.
- Use only the expert reference needed for the task: programming, finalizacion/publicacion, marketing, ventas/simulador, experiencia clientes/invitados, or contable/negocio.
- Use `ak-codebase-navigator` for code navigation, architecture questions, PR fixes, audits, and token-efficient investigation.

Required working order for code tasks:
1. Load the relevant AK expert reference.
2. Use Graphify for the first scoped map of the module or bug.
3. Use Serena symbol/reference tools when available.
4. Use `rg` for exact text searches.
5. Read only focused file ranges.
6. Edit only the necessary files.
7. Validate with the best available tests/checks.
8. Run `graphify update .` after meaningful code changes.

These skills are local Codex production tools. They must not be imported into application runtime code, added as app dependencies, or exposed to clients, guests, or Firebase.

## Herramientas Locales de Programación (Codex)

Todos los agentes y chats de este proyecto deben utilizar las siguientes herramientas de trabajo configuradas en el entorno local para agilizar el desarrollo sin complicar el código ni el despliegue de la app:
- **Graphify**: Genera un mapa general de toda la aplicación y analiza relaciones entre archivos.
- **Serena**: Búsqueda inteligente por funciones, componentes y referencias cruzadas.
- **Repomix**: Mide qué archivos consumen más tokens para evitar procesar archivos gigantes de forma innecesaria.

Estas herramientas son de uso local exclusivo para el análisis del código. No deben agregarse al `package.json`, no deben cambiar el comportamiento del sitio web, no deben desplegarse a Firebase y son invisibles para los clientes e invitados.

## Shared quality commands

These commands are the same for Codex, Gemini, Copilot, Claude, and human contributors:

- `npm run quality:quick`: lint and TypeScript checks for normal edits.
- `npm run quality:full`: quick checks and Jest without external emulators.
- `npm run quality:security`: Firestore security rules through the local emulator.
- `npm run test:e2e`: Chromium smoke tests for desktop and mobile.
- `npm run quality:all`: full validation including browser tests.
- `npm run audit:dead-code`: advisory Knip report; do not delete reported code without verifying dynamic Next.js and Firebase usage.

Rules:
- Add or update Playwright coverage when changing a critical public workflow.
- Add or update Firebase Rules tests when changing `firestore.rules`.
- Do not make Knip findings a blocking CI check until the existing baseline has been reviewed.
- Keep test tools in devDependencies; they must not be imported by production application code.

## Directivas de Comunicación y Calidad para IAs

- **Perfil del Usuario (No Programador)**: El usuario **no es programador**. Todos los planes de implementación, explicaciones y respuestas deben estar redactados en un lenguaje sumamente sencillo, directo, claro y libre de tecnicismos complejos de bajo nivel.
- **Prohibido Alucinar**: Queda estrictamente prohibido alucinar o inventar código, variables, APIs, archivos, rutas o dependencias que no existan. Si no tenés certeza absoluta sobre algo, debés investigarlo en el código o consultarlo. Todo lo programado debe ser 100% real y funcional.
- **Uso Obligatorio de Graphify**: Antes de iniciar cualquier tarea o responder sobre la arquitectura del código, debés usar `graphify` para mapear el codebase y entender perfectamente las relaciones entre archivos para evitar roturas.
- **Verificación de PR Abierta (OBLIGATORIO)**: Antes de empezar una tarea, crear una rama o subir commits, es obligatorio verificar en GitHub qué Pull Requests están abiertas y sus estados. Si la PR de la rama actual ya fue cerrada, archivada o fusionada, **está estrictamente prohibido seguir subiendo cambios a esa rama**. En su lugar, debés sincronizarte localmente con `main` actualizado, crear una rama nueva y limpia, y generar una nueva PR abierta para la tarea actual, asegurando así un despliegue limpio sin mezclar código viejo.
- **Fusionar PRs (regla actualizada el 6 de agosto de 2026)**: el dueño autorizó a fusionar directamente, sin esperar que lo haga él a mano. **Pero sólo después de pasar todos los controles**: compila sin errores de tipos, las pruebas pasan, no hay acentos rotos (`npm run check:acentos`), no choca con las otras propuestas abiertas al fusionarlas juntas, y no hay cambios sospechosos en plata, cobros o permisos de acceso. Si algo de eso falla, no se fusiona: se le explica al dueño en criollo qué pasa. Después de fusionar, correr la verificación completa de nuevo sobre `main`.
- **Honestidad Absoluta (0 Humo)**: El título y la descripción de las PRs y de los commits deben describir **únicamente los cambios reales y precisos** que hiciste. No prometas mejoras estéticas, rediseños premium ni optimizaciones que no estén implementadas concretamente. Cero promesas que no sean reales.
## Direccion multiagente obligatoria

Aplicar en todos los chats y tareas, salvo que el usuario pida expresamente otra cosa:

1. El modelo principal actua como director: define alcance, arquitectura, riesgos y criterio final.
2. Delegar por defecto las tareas separables y de bajo riesgo a `gpt-5.6-luna` con razonamiento `low`.
3. Usar agentes economicos para busquedas, lectura de diffs, inventarios, UX repetitiva, copy,
   pruebas focalizadas y revision visual. Ejecutarlos en paralelo cuando sus archivos no se solapen.
4. El modelo principal conserva autenticacion, seguridad, dinero, contabilidad, datos, Firebase,
   despliegue, conflictos, decisiones de merge y aprobacion final de PR.
5. No repetir localmente el trabajo delegado. Revisar solo el resultado, los archivos cambiados y
   los hallazgos P0/P1 antes de integrarlos.
6. Cerrar los agentes al terminar para no ocupar cupos. Reutilizar evidencia asociada al mismo SHA.
7. Si multiagente no esta disponible, seguir el flujo de bajo consumo sin inventar resultados.
8. La delegacion ahorra tiempo y tokens, pero nunca reemplaza la validacion final del modelo principal.
