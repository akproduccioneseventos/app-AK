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

## Pocas propuestas y grandes, no muchas chicas

### La regla vale TAMBIÉN para lo que se le pide a las otras IA

**El dueño lo tuvo que repetir el 10 de agosto de 2026, porque ya se falló dos
veces.** No alcanza con que Claude junte sus propios cambios: **las órdenes de
trabajo que se escriben para Gemini también tienen que pedir UNA sola
propuesta.**

Lo que salió mal: se escribió una orden con cinco bloques y arriba decía "una
propuesta por bloque grande". Eso son cinco fusiones y cinco despliegues cuando
alcanzaba con uno. Escribir la regla en `CLAUDE.md` y después pedir lo contrario
en la orden es lo mismo que no tenerla.

**Antes de mandar cualquier orden, releer la parte de cómo se entrega y
confirmar que diga "una sola propuesta con todos los bloques".** Y decirle qué
hacer si un bloque se traba: entregar el resto igual, en la misma propuesta,
avisando cuál faltó.

**Orden del dueño, 9 de agosto de 2026.** Cada fusión dispara un despliegue y eso
se paga. Así que **se junta el trabajo de la tanda en una sola propuesta** y se
fusiona una vez, al final.

Qué significa en la práctica:

- **No se abre una propuesta por hallazgo.** Se arregla todo lo de la tanda, se
  corre la verificación una vez sobre el conjunto y recién ahí se fusiona.
- **La documentación viaja con el código.** Anotar en `docs/YA-RESUELTO.md` no
  justifica una propuesta aparte: va en la misma.
- **Un cambio de documentación solo no se fusiona solo.** Se deja commiteado en
  la rama y se junta con el próximo trabajo.
- **Sí se separa** cuando algo es urgente y no puede esperar a la tanda, o
  cuando mezclarlo haría imposible entender qué rompió qué.

Ojo con lo que ya costó caro: **cuanto más grande la propuesta, más importa
correr los cuatro controles sobre el conjunto entero antes de fusionar**, no
sobre cada pedazo por separado. Dos arreglos que pasan sueltos pueden romper
juntos; ya pasó con el archivo de facturas.

## Lo que programa Gemini NO lo programa Claude

**Orden del dueño, 9 de agosto de 2026.** Cuando una tarea le toca a Gemini, se
le deja la orden escrita en `docs/ordenes/` y **no se programa acá**. Escribir el
código igual gasta el doble: lo paga el dueño dos veces y Gemini se queda sin
trabajo.

El reparto, sin vueltas:

- **Claude escribe código sólo en:** plata, cobros, comida, permisos y quién ve
  qué. Ahí no se delega, aunque sea chico.
- **Todo lo demás lo programa Gemini**, incluido entretenimiento, pantallas del
  invitado, impresos y herramientas internas. Claude audita, verifica, decide y
  escribe la orden.
- **Excepción única:** un arreglo de una línea que aparece mientras se verifica
  una propuesta. Eso se corrige en el momento y se sigue.

Ya pasó al revés: se programó la fotocabina entera (tanda de tres fotos,
impresión, guía en pantalla) cuando era trabajo de Gemini. Salió bien pero costó
lo que no había que gastar.

**Antes de escribir código, la pregunta es siempre: ¿esto es plata, cobros,
comida o permisos? Si la respuesta es no, va a una orden.**

### Claude dirige. Y una orden se escribe MASTICADA, no en general

**Orden del dueño, 27 de agosto de 2026.** Palabras suyas: *"vos sos el jefe"*, y *"debés
decirle a Gemini qué programar, dejá escrito eso"*. **Vale para todos los chats.**

El reparto no es "Claude mira y Gemini decide". Es al revés: **Claude investiga, prueba,
decide qué se hace y deja el camino escrito. Gemini ejecuta.**

Qué significa en la práctica, y es lo que cambia todo:

- **La orden lleva los nombres exactos.** Archivo, función, línea aproximada y el nombre del
  campo. No *"tomá el fondo de la invitación"*, sino *"`fiesta.invitacionDigital?.cabecera?.imagenFondoUrl`,
  en `src/types/fiesta.ts` línea ~589"*. **La investigación la hace Claude una vez; Gemini no
  la repite ni la adivina.**
- **Con el orden de respaldo resuelto.** Si el dato puede estar en tres lugares, se dice cuál
  mirar primero y por qué. Eso no lo puede decidir quien no vio el código entero.
- **Diciendo qué NO tocar.** Lo que ya anda se nombra explícitamente para que no lo rehaga.
- **Y qué tiene que comprobar la prueba**, no sólo que haya una. Ya pasó dos veces en un día
  que una entrega trajera una prueba que daba falsa confianza: una exigía lo contrario de lo
  pedido, otra pasaba en verde con el mismo video repetido cuatro veces.

**Por qué esta regla existe:** las entregas que fallaron el 27 de agosto no fallaron por
falta de capacidad. Fallaron por **arrancar de una versión vieja**, **adivinar dónde estaba
un dato** y **suponer que un control estaba del otro lado**. Las tres se evitan con una orden
masticada.

**Y el corolario:** si Claude no puede escribir la orden con ese nivel de detalle, es porque
todavía no investigó lo suficiente. **Ahí falta trabajo de Claude, no de Gemini.**

## LA APP ES AUTOMATICA Y CON INTELIGENCIA ARTIFICIAL AL MAXIMO

**Definicion del dueño, 23 de agosto de 2026.** No es un pedido suelto: es lo que
distingue a esta app de una planilla. Palabras suyas:

> *"Mi app se caracteriza por ser automatica y con IA al maximo."*
> *"Todo lo que pueda ser automatico seria bueno; si no, es igual que hacerlo
> manual."*

**Como se aplica, sin preguntar cada vez:**

1. **Ante dos caminos, se elige el automatico.** Aunque cueste mas trabajo
   programarlo. El trabajo se hace una vez; lo manual se paga todos los dias.
2. **Antes de dar una pantalla por terminada, la pregunta es: ¿esto lo puede hacer
   la app sola?** Si la respuesta es si y no se hizo, no esta terminada.
3. **"Copiá y pegá" no es una entrega.** Si algo queda manual, hay que decirlo en
   pantalla y dejarlo **a un toque**: el texto copiado, el archivo bajado y la otra
   aplicacion abierta. La diferencia entre eso y "copiá esto" es la diferencia
   entre que lo use y que no lo use.
4. **Nada espera a que alguien se acuerde.** Si algo tiene que pasar a cierta hora
   o cada tanto, lo dispara el despertador, no una persona.
5. **Si una tarea la puede hacer un agente, la hace un agente**, y avisa lo que
   hizo.

**Las cuatro cosas que NO se automatizan, y no se discuten:**

- **Mandar mensajes a clientes o prospectos.** Se preparan; los manda una persona.
- **Cobrar**, marcar como pagado o emitir una factura.
- **Cerrar un presupuesto** o darlo por aceptado.
- **Tocar permisos** o quien ve que.

La linea es: **automatico para mirar, detectar, preparar y avisar. Mano humana
para lo que sale para afuera o toca plata.**

**Y el limite del gasto:** si automatizar algo obliga a pagar un servicio por mes,
**se deja preparado y se pregunta antes de contratar**. Sigue vigente: nada que
aumente lo que se paga por mes se cambia sin avisar.


## NO SE CAMBIA LO QUE YA FUNCIONA

**Orden del dueño, 23 de agosto de 2026.** Palabras suyas:

> *"No quiero que se cambien cosas que ya funcionaban."*

**Pasó dos veces en un dia, y las dos por lo mismo:** una auditoria de venta dijo
"esto seria mejor asi" sobre algo que andaba, y se mando a cambiar sin preguntarle.
Se cambiaron dos textos que ve el cliente (la promesa de respuesta y el boton de
precio) y **se saco el reloj del simulador**, que el dueño tenia puesto a proposito
para que la gente se comunique. Hubo que volver todo atras.

**La regla, sin vueltas:**

1. **Una auditoria PROPONE. No manda.** Que un analisis diga que algo se puede
   mejorar no lo convierte en trabajo a hacer.
2. **Si una pantalla, un texto o una funcion YA ANDA, no se cambia sin que el dueño
   lo pida.** Aunque parezca mejorable. Aunque tres ayudantes coincidan.
3. **Lo unico que se arregla sin preguntar es lo que esta ROTO de verdad**: algo
   que falla en una fiesta, una cuenta que da mal, plata que se mueve mal, alguien
   que ve lo que no le corresponde, o una promesa que la app no cumple.
4. **Las mejoras sobre lo que funciona se le CUENTAN al dueño y el decide.** Se
   listan en una linea cada una, con que cambiaria para el negocio. **No se meten
   en una orden hasta que el diga que si.**
5. **Ojo especial con los textos que ve el cliente y con las decisiones de
   marketing.** Un descuento, una promesa, un cartel de urgencia o un boton pueden
   parecer mejorables y ser una decision comercial pensada. **Esos no se tocan
   nunca sin permiso.**

**La pregunta antes de mandar cualquier cambio a una orden:** ¿esto esta roto, o a
mi me parece que estaria mejor de otra manera? **Si es lo segundo, va a la lista de
propuestas, no a la orden.**


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

### PARAR Y PREGUNTAR (orden del dueño, 17 de agosto de 2026)

**Cuando te trabás, PARÁS Y PREGUNTÁS.** No seguís probando. El dueño lo pidió
después de una sesión de tres horas donde el tiempo se fue en esperar
compilaciones y reparar entregas rotas.

Trabado quiere decir: algo falló dos veces, o llevás más de quince minutos en el
mismo punto, o hay que elegir entre dos caminos y ninguno es obvio.

En esos casos, **dos líneas al dueño y esperás**. Nada de "una prueba más".

**Y dos cosas que se hacen siempre, sin excepción:**

- **El modelo principal NO corre compilaciones ni pruebas.** Van a los ayudantes
  económicos desde el primer minuto, en paralelo. Esperar un build sentado es la
  forma más cara de perder el tiempo.
- **Una entrega que no compila se devuelve enseguida**, con el detalle de qué
  está mal. No se repara, salvo que sea una línea. Reparar el trabajo de otra IA
  lo paga el dueño dos veces.

### Cuando un ayudante dice "no compila", mirá el error antes de creerle

**Costó una hora el 20 de agosto de 2026.** Tres informes seguidos dijeron que la
rama no compilaba. La rama estaba perfecta: **los ayudantes corren con un tope de
memoria más chico** y la compilación se ahogaba antes de terminar.

Dos señales de que es el entorno y no el código, y ninguna necesita leer el código:

- El error habla de **memoria** (`heap out of memory`) o de un archivo dentro de
  `.next/`. Eso es el entorno.
- **Varias compilaciones a la vez en la misma carpeta se matan entre ellas.** Antes
  de creer un informe, `ps aux | grep "next build"`: si hay más de una, el
  resultado no vale.

Ya está arreglado en `scripts/build-next-with-memory.mjs`: si el entorno trae un
tope más chico del necesario, lo sube solo. Pero la costumbre queda: **un error de
compilación que no nombra un archivo del código no es un error del código.**

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

## Antes de inventariar: `docs/QUE-HAY-EN-LA-APP.md`

**Orden del dueño, 12 de agosto de 2026.** Cuando él pregunta "¿esto está?",
auditar de nuevo cada vez cuesta tiempo y plata. El inventario de lo que existe
—inteligencia artificial, redes sociales, marketing, posicionamiento en Google—
queda escrito ahí, con el estado de cada cosa: anda, está a medias o no está.

- **Se lee antes de salir a inventariar.** Si el dato está ahí, se responde de ahí,
  sin mandar agentes a buscar de nuevo.
- **Se actualiza en la misma propuesta que toca el código.** Si se modifica algo que
  figura en la lista, se corrige la línea. Un inventario desactualizado es peor que
  no tenerlo.
- Si aparece un área nueva que no está inventariada, se agrega.

## LA APP ESTÁ TERMINADA. No auditar por auditar.

**Orden del dueño, 15 de agosto de 2026, y es la regla que manda sobre todas las
demás.** Venía pasando esto: cada tanda mandaba ayudantes a buscar problemas, los
ayudantes siempre encontraban algo —siempre encuentran algo si los mandás— y la
app nunca terminaba. El dueño lo dijo así: *"siempre quedan cosas, siempre
encontrás un error nuevo, es un camino sin salida"*. Tenía razón.

**Terminada quiere decir esto, y ya se cumple:**

- Cero errores conocidos sin resolver.
- Compila, todas las pruebas en verde, sin acentos rotos.
- Plata, cobros, comida y permisos auditados sin hallazgos.
- Las pantallas del cliente y del invitado, sin nada roto.

### Qué está prohibido a partir de ahora

- **No se lanzan auditorías generales "a ver qué aparece".** Ni de rutina, ni al
  abrir una sesión, ni "para ponerse al día".
- **No se reporta como pendiente** algo que funciona y se ve bien. Un color
  escrito a mano en una pantalla que anda **no es un error**.
- **No se abre trabajo por gusto propio.** Si el dueño no lo pidió y no está
  roto, no existe.

### Qué sí se hace

- **Lo que el dueño pide.** Eso es todo.
- **Lo que se rompe de verdad**: algo que falla en una fiesta real, una cuenta
  que da mal, plata que se mueve mal, alguien que ve lo que no tiene que ver.
- **Verificar una entrega antes de fusionarla.** Eso no es auditar: es controlar
  lo que entra.

Si aparece la duda "¿no habrá algo más para revisar?", la respuesta es **no**.
Está terminada. Lo que falte lo va a decir el dueño o lo va a mostrar una fiesta.

## Cómo se audita: `docs/COMO-AUDITAR.md`

**Orden del dueño, 20 de agosto de 2026.** El método viejo falló: la app estaba
declarada terminada y en un día aparecieron seis cosas rotas, todas con la misma
forma —escritas, compilando, con pruebas en verde, **y sin producir nada**—.
Cuatro tareas automáticas no las disparaba nadie.

> **La pregunta vieja era "¿está escrito?". La nueva es "¿pasó de verdad?".**

Las cuatro preguntas, todas mecánicas y todas para los ayudantes económicos:

1. **¿Dejó rastro?** Cuándo pasó por última vez cada cosa automática. "Nunca" es
   una falla.
2. **¿Alguien lo llama?** Contar quién importa cada componente, acción y pantalla.
   Cero es un hallazgo.
3. **¿Necesita algo que no está?** Y sobre todo: si falta, ¿avisa o **simula datos
   como si fueran reales**? Lo segundo es lo más grave.
4. **¿Lo que dice la pantalla existe en el código?** Una promesa sin nadie que la
   cumpla es una mentira al cliente.

El detalle, con el porqué de cada una, está en `docs/COMO-AUDITAR.md`. **Se lee
antes de auditar.**

## El manual de la app: `docs/MANUAL-DE-LA-APP.md`

Es el manual completo: qué tiene la aplicación, cómo funciona y **por qué** cada cosa
está decidida así. Un solo archivo con dos capas: arriba el mapa en criollo, que es lo
que lee la asistente que vive adentro de la app; abajo el índice técnico, que es lo que
leen las IA que programan. Van juntos a propósito: dos manuales separados se despegan
en un mes y el que queda viejo hace más daño que no tener ninguno.

**Se actualiza con CADA modificación, en la misma propuesta que toca el código.** La
lista de pantallas y el menú **no se escriben a mano**: los regenera `npm run
mapa:generar`. El porqué de cada decisión sí se escribe a mano, y es lo único que
ninguna máquina puede deducir.

El candado es `src/__tests__/mapa-de-la-app-al-dia.test.ts`: vuelve a armar el mapa y
lo compara con el guardado. Si alguien agrega una pantalla y no lo regenera, **se pone
en rojo y ese cambio no entra**. También controla que cada opción del menú lleve a una
pantalla que exista y que la asistente no pueda mandar a nadie a una pantalla inventada.

## Antes de auditar: `docs/YA-RESUELTO.md`

Lista de lo que ya está arreglado y de las decisiones tomadas. **Se lee antes de
salir a buscar problemas**, y se incluye en el prompt de cada ayudante que audita.
Si un hallazgo figura ahí, es falso positivo.

### Anotar SIEMPRE, no sólo cuando parece importante

**Orden del dueño, 9 de agosto de 2026: cada vez que se modifica algo, se
anota en `docs/YA-RESUELTO.md`, en la misma propuesta.** No es "si te parece"
ni "si el cambio es grande". Es siempre, sin excepción, y sin que haga falta
pedirlo.

Vale igual para las tres cosas que se hacen:

- **Un arreglo** → qué estaba mal y qué se hizo, en una frase, en criollo.
- **Una mejora o algo nuevo** → cómo funciona ahora y **por qué se eligió así**.
  Ese porqué es lo que evita que otro lo "arregle" al revés el mes que viene.
- **Un falso positivo verificado** → que quedó descartado y el motivo. Si no se
  anota, la próxima auditoría lo vuelve a reportar y se gasta el viaje de nuevo.

Una propuesta que toca código y no toca esa lista está incompleta. Si no queda
anotado, la próxima auditoría lo vuelve a encontrar y alguien lo "arregla" de
nuevo, a veces peor. Ya pasó.

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
- **El servidor se queda dormido, y está bien así (20 de agosto de 2026).** En
  `apphosting.yaml`, `minInstances: 0` y `memoryMiB: 512` **no se tocan**: dejarlo
  siempre despierto se paga todos los meses y el dueño dijo que no. Si una auditoría
  lo marca como problema de velocidad, es falso positivo. La app en sí no es lenta
  (cada pantalla contesta entre 5 y 25 milésimas) y las páginas de venta salen
  armadas de antes, así que el prospecto que llega desde Google no espera.
- **Anotarse en directorios gratis: descartado (21 de agosto de 2026).** El dueño lo
  sacó de su lista. No volver a proponerlo ni listarlo como pendiente.
- **La reseña se pide desde la aplicación, también al invitado.** A todos por igual,
  sin premio y sin pedir una cantidad de estrellas. Es un botón que no molesta, y si
  no hay enlace cargado no aparece.
- **Nada que aumente lo que cobra Firebase se cambia sin preguntar.** Vale para
  memoria, instancias mínimas, CPU y cualquier cosa que se pague por mes.
- **El WhatsApp del dueño es su número personal (20 de agosto de 2026).** El bot
  **contesta únicamente a quien llega tocando un anuncio o una publicación de la
  empresa** —eso lo avisa Meta en el mensaje, no se adivina—. A la familia, a los
  proveedores y a los amigos **no les contesta nadie**: el mensaje lo lee una
  persona cuando puede. La app **prepara** los mensajes
  —recordatorios de cuota, seguimiento de prospectos— y los deja en la bandeja de
  salida; **el mensaje sale cuando una persona lo toca**, desde su propio WhatsApp.
  Escribirle a clientes y prospectos está bien; contestarle a cualquiera que
  escriba, no. **La línea es: preparar sí, mandar no.**
- **El reloj del simulador VA, y es decisión suya (23 de agosto de 2026, precisado el
  27).** El contador que aparece después de generar el presupuesto está ahí **a propósito**.
  Se sacó una vez por pedido de una auditoría de venta y el dueño lo mandó poner de nuevo.
  **No se vuelve a sacar ni se reporta como problema.**

  **Pero para qué sirve NO es congelar la tarifa**, y eso se entendió mal hasta el 27 de
  agosto. Está para que la gente **acceda a la promoción** —el descuento y los regalos—
  mientras corre. Palabras suyas: *"el reloj es lo que ayuda a que accedan a promoción de
  descuento 10% y regalos"*. Es una oferta con fecha, no una tarifa congelada. El texto
  decía "tu presupuesto queda reservado" y se corrigió: ahora habla de la promoción.

- **NADA DE PROMESAS EN LA WEB, Y MENOS CONGELAR PRECIO (27 de agosto de 2026).** Palabras
  suyas: *"en la web hay promesas como 24 horas, congelar precio; esas cosas no las quiero.
  Promesas no, y menos congelar precio: yo trabajo con ajuste."*

  Se sacaron: *"te contactamos en menos de 24 horas"*, los carteles de *"Respuesta en 24
  hs"*, *"congelá precios en cuotas fijas"* y *"hablá por WhatsApp para congelar la
  tarifa"*.

  La regla que queda, y vale para todo texto nuevo que vea un cliente: **no se promete un
  plazo de respuesta ni un precio sostenido en el tiempo.** El ajuste anual del 15% va
  siempre —eso ya estaba decidido— y **congelar un precio lo contradice**. Sí se puede
  decir por dónde se contesta (*"te contestamos por WhatsApp"*) y qué da una promoción
  vigente. **Reservar la fecha con una seña sí se puede decir**: eso es real y no es un
  precio congelado.
- **La llave de cobros no se cambia (20 de agosto de 2026).** Estuvo escrita
  dentro de un archivo y se le propuso dos veces generar una nueva. **Decidió que
  no: se queda con la última que cargó.** No se le vuelve a plantear. El archivo
  ya está fuera del repositorio y hay una prueba que impide que vuelva a entrar;
  eso es lo que sí queda.

## Cuatro reglas nuevas, y cada una salio de algo que paso el 28 de agosto de 2026

No son ideas: son las cuatro formas en que la app engano a todo el mundo en un solo dia.

### 1. Un control nuevo se prueba FALLANDO, no pasando

**Paso tres veces en el dia.** El control de acentos daba verde con cero archivos
revisados. El corredor de pruebas de navegador decia "todas pasaron" con cero pruebas
corridas. Y el trinquete —escrito ese mismo dia— dijo que la deuda no habia crecido
despues de agregarle a proposito un archivo muerto.

**Los tres pasaban la prueba de "correrlo y ver que da verde". Los tres estaban rotos.**

**La regla: a todo control nuevo hay que romperlo a proposito y ver que frene.** Un control
que solo se probo cuando estaba todo bien no se sabe si sirve. Y la prueba de que frena se
deja escrita, no se hace de memoria.

### 2. Una pantalla vive en UN solo lugar

Se encontro la carga de fotos del Video de Vida **copiada texto por texto en dos
direcciones distintas**, una de ellas colgada donde no corresponde. Nadie lo noto porque
las dos andaban.

**La regla: antes de crear una pantalla, buscar si ya existe.** Dos copias de lo mismo se
despegan en un mes y la que queda vieja hace mas dano que no tenerla. Si hay que llegar
desde dos lados, es un enlace a la misma pantalla, no una copia.

### 3. Todo lo que se puede editar tiene que leerlo alguien

Habia un ajuste —el nombre del marco— con su casilla para escribirlo, y **ninguna pantalla
lo lee**. El operador lo cambia, guarda, y no pasa nada. De los nueve ajustes de plantilla,
siete no los mira nadie.

**La regla: un control en pantalla que no cambia nada es peor que no tenerlo**, porque el
que lo usa cree que hizo algo. O se engancha, o se saca.

### 4. Una prueba no puede crear lo que despues comprueba

Llego una entrega con una prueba que, **si el valor no existia, lo creaba ella misma** y
despues comprobaba que existiera. Pasa siempre, con la app rota o sana.

**La regla: si sacando la app entera la prueba igual pasa, esa prueba no prueba nada.** Y
comprobar de que **tipo** es algo tampoco alcanza: que sea "un objeto" o "una funcion" no
dice que haga lo que promete.

## LA PUERTA: sin `npm run "publicar?"` en verde, no se fusiona

**Desde el 28 de agosto de 2026 la puerta tiene SIETE pasos, no seis.** El nuevo se
llama **"Lo que se dijo es lo que es"** y es el unico que pregunta algo distinto: los
otros seis preguntan si algo **se rompe**; este pregunta si lo nuevo **HACE lo que dice
hacer**. Frena tres cosas: codigo que no llama nadie, una pantalla o accion sin una
prueba que mire el **resultado**, y una prueba nueva donde todas las comprobaciones son
"se ve".

Es la forma exacta que tuvieron todas las fallas que las auditorias no vieron: escritas,
compilando, en verde, y sin hacer nada.

- **Frena solo lo que cambia**, a proposito. Si frenara por lo viejo no se podria subir
  nada y terminaria desactivado.
- **Para lo viejo:** `npm run lo-que-se-dijo:todo` informa sin frenar.
- **Nunca escribir una prueba para que el control se calle.** Una prueba que no
  comprobaria nada real tapa el agujero sin cerrarlo, y es peor que ninguna.

**Orden del dueño, 27 de agosto de 2026.** Sus palabras: *"quiero que inventes un mecanismo
de auditoría que deje mi app en cero errores en código y en funcionamiento; todo debe marchar
para poder publicar."*

**Por qué existe:** una auditoría dio *"cero errores"* mientras la fotocabina imprimía sin
fondo, el entretenimiento estaba mal y la web también. El problema no era el informe: era que
**ningún control podía frenar la publicación**. Se fusionaba y se publicaba pase lo que pase.
Un control que no frena no es un control, es una sugerencia.

**Un informe es una opinión. Esto es un hecho.**

- **`npm run "publicar?"`** corre todo y contesta **una sola cosa**: se puede publicar, o no
  se puede y por qué, en criollo. Termina con código distinto de cero cuando no se puede, así
  que **cualquier cosa que lo llame puede frenar sola**.
- **`npm run "publicar?:rapido"`** saltea la prueba de navegador. Sirve mientras se trabaja,
  **no alcanza para publicar**.

### Las reglas, y son duras

1. **No se fusiona nada sin `publicar?` completo en verde.** Ni una corrección de una línea.
   Ni documentación, si el árbol tiene código sin verificar.
2. **Los pasos van del más barato al más caro y se corta en la primera falla.** Si los
   acentos están rotos, no tiene sentido esperar la compilación —que tarda ocho minutos— para
   enterarse.
3. **No se saltea un paso para que dé verde.** Si un control molesta, se arregla lo que
   marca; no se lo saca. Sacarlo es exactamente cómo se llegó a "cero errores" con la app
   rota.
4. **Lo que le falta hoy se le suma adentro, no al lado**: el recorrido de las 348 pantallas
   mirando de verdad, y las trece pruebas que terminan el trabajo
   (`docs/ordenes/15-las-pruebas-que-terminan-el-trabajo.md`). **Cuando estén, entran acá.**

**Reemplaza a `/sano` como control de publicación.** `/sano` sigue sirviendo para mirar el
estado mientras se trabaja; **el que decide si se publica es éste**, porque devuelve un
resultado y no una opinión.

## Cómo se verifica que la app está sana

El orden que funciona, y que ya detectó fallas reales:

1. `npx tsc --noEmit` — cero errores.
2. `npx jest --silent` — todas en verde.
3. `npm run build` — tiene que terminar bien.
4. `npm run check:acentos` — sin acentos rotos.
5. `npm run test:rules` — la seguridad de la base.
6. **`npm run test:e2e` — las pruebas de navegador.** Es el único control que ve
   lo que ve el usuario, y **estuvo escrito y sin correr durante meses**. Todo lo
   que se nos escapó —el píxel que no existía, los carteles que decían
   "conectado" sin estarlo, las tareas que no corrían— es de la clase que **sólo
   se ve abriendo la aplicación**.

### Por qué nadie las corría, y cómo se corren ahora

Eran 596 pruebas y **la tanda entera no terminaba nunca**, por dos motivos que ya
están arreglados:

- **Arrancaba en modo lento**, recompilando cada pantalla al visitarla. Ahora
  `npm run test:e2e` usa la versión compilada. El modo lento quedó como
  `test:e2e:lento`, para depurar.
- **El navegador que espera Playwright puede no coincidir** con el instalado. Se
  ubica con `find /opt/pw-browsers -maxdepth 3 -name chrome` y se pasa en
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. **Nunca `playwright install`.**

### Las dos trampas que dan fallas inventadas

1. **Un servidor de prueba viejo ocupando el puerto 3100.** Da `EADDRINUSE` y las
   pruebas corren contra una versión anterior. Pasó: una falla que parecía que el
   prospecto no podía cerrar la compra, y era eso. **Antes de creerle a una falla,
   reiniciar el servidor y repetir sólo esa prueba.**
2. **Correr la tanda mientras algo más compila.** Se borran los archivos entre
   ellas.

### Lo que la corrida deja escrito y NO se commitea

Al correr, la app escribe datos: el contador de gasto de inteligencia artificial,
el historial de redes del día, y **un prospecto de prueba en la lista de
contactos**. Están ignorados, pero **mirá `git status` antes de subir**: si aparece
un dato que no escribiste vos, es de la corrida.

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
- **`/vende`** — mira una pantalla, un texto o algo nuevo con ojo de vendedor.
  **Toda la app vende**, no sólo el módulo comercial: se usa antes de dar por
  terminada cualquier pantalla que vea un cliente o un invitado.
- **`/aca-quede`** — reescribe la hoja de traspaso al cerrar la sesión.
- **Ayudantes económicos ya definidos**, con las reglas del proyecto adentro (no
  hay que explicárselas cada vez): `ak-buscador` para ubicar dónde vive algo,
  `ak-auditor` para revisar un área, `ak-inventario` para listas y conteos. Los
  tres son de sólo lectura y arrancan por el mapa del código.
- En las sesiones web, el navegador de pruebas se ubica solo al arrancar: no hace
  falta buscarlo a mano.
