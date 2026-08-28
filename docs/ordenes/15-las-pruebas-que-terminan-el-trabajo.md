# Orden 15 — Las pruebas que terminan el trabajo

**Para Gemini. Escrita el 27 de agosto de 2026.**

> # DEVOLUCIÓN 2 — 27 de agosto de 2026. LEER JUNTO CON LA DEVOLUCIÓN 1.
>
> Entró un commit nuevo en la rama (`compatibilidad multiplataforma de scripts`). **Sigue sin
> fusionarse.** Van las tres cosas, de la más grave a la menos.
>
> ## 1. Lo de la devolución 1 no se tocó
>
> `tests/e2e/internal-route-inventory.spec.ts:51` **sigue usando `context.request.get(route)`**
> y midiendo el HTML crudo. Las veintipico de falsas alarmas siguen ahí. Mientras eso no se
> arregle, la tanda queda en rojo por pantallas que están sanas, y no se puede fusionar.
>
> ## 2. El control de acentos nuevo puede dar VERDE sin revisar nada
>
> En `scripts/check-acentos.mjs`, `getArchivosVersionados()` atrapa cualquier error y
> devuelve una lista vacía. Con la lista vacía el script imprime
> **"Acentos: bien, sin acentos rotos (0 archivos revisados)"** y termina en éxito.
>
> O sea: **si `git ls-files` falla, el control dice que está todo bien.** Es exactamente el
> defecto que acabamos de arreglar en el corredor de pruebas de navegador, que decía "todas
> las pruebas pasaron" con cero pruebas corridas. Y este es **uno de los seis pasos de la
> puerta**: si miente, la puerta se abre sola.
>
> **Arreglo:** si no se pudo leer la lista, o si la lista da cero archivos, **terminar en
> error** diciendo "no se pudo revisar", nunca en verde. Que el paso no pueda pasar sin haber
> mirado.
>
> ## 3. `path-scurry` quedó agregado y no lo usa nadie
>
> Está en las dependencias de producción de `package.json` y **no lo importa ningún archivo**
> del proyecto. Sacalo: cada dependencia que entra es peso que se instala y se actualiza para
> siempre.
>
> ## Lo que SÍ está bien de este commit, y se queda
>
> El motivo del cambio es correcto y hacía falta: **el dueño trabaja en Windows**, y `bash`,
> `npx` y los binarios sueltos no siempre andan ahí.
>
> - **El control de acentos en Node en vez de bash**: bien pensado. Sólo hay que arreglar lo
>   del punto 2. El patrón que busca es igual o un poco más amplio que el del script viejo:
>   comparado, no se pierde nada.
> - **`typecheck` con más memoria** y la puerta llamando a `npm run typecheck` en vez de
>   `npx tsc`: **no debilita el control**, es el mismo con más aire. Bien.
> - **`test:rules` llamando a los binarios por su ruta**: bien, es lo que lo hace andar en
>   Windows.
>
> ## Cómo se cierra
>
> **En la misma propuesta:** el punto 1 (la devolución anterior), el punto 2 y el punto 3.
> Después corré `npm run "publicar?"` y que dé verde. Es la puerta y sin eso no se fusiona.

---



> # DEVOLUCIÓN 1 — 27 de agosto de 2026. LEER ANTES DE SEGUIR.
>
> **La entrega de la rama `feat/orden-15-pruebas-que-terminan-el-trabajo` NO se fusionó.**
> La idea está bien y el recorrido de pantallas es justo lo que se pedía. **El problema es
> dónde mira.**
>
> ## El defecto de fondo: la prueba no abre la pantalla, pide el HTML crudo
>
> En `tests/e2e/internal-route-inventory.spec.ts:51` el recorrido usa
> `context.request.get(route)` y le mide el largo al texto de esa respuesta. Eso **no es la
> pantalla**: es el HTML que llega antes de que la aplicación se dibuje.
>
> Las pantallas internas se dibujan del lado del cliente, así que ese HTML son **69
> caracteres de cáscara, siempre**. Resultado real de la corrida: **veintipico de pantallas
> sanas reportadas como "prácticamente vacías"** —`/admin`, `/alertas`, `/calendario`,
> `/contabilidad`, `/customers`, `/empleados` y siguen—, todas con exactamente los mismos 69
> caracteres. Ninguna está rota.
>
> **Y lo peor no es el ruido: es que las otras comprobaciones quedan ciegas.** Buscar `$NaN`
> o `[object Object]` en un HTML que todavía no tiene contenido **nunca va a encontrar nada**,
> justo en las pantallas donde eso importaría.
>
> Una prueba que grita veinte veces en falso se termina ignorando, y ahí perdemos el control
> entero. Ya pasó en este proyecto: de diez avisos de un ayudante, nueve eran falsa alarma.
>
> **Cómo se arregla:** abrir la pantalla de verdad —`page.goto` y `page.locator('body')
> .innerText()`, como hacen `noche-de-fiesta.spec.ts` y `entretenimientos-a-fondo.spec.ts`—
> y recién ahí medir. Si eso hace la corrida demasiado lenta para 348 pantallas, decilo y lo
> resolvemos: **mejor pocas pantallas miradas de verdad que 348 miradas por arriba.**
>
> ## Segundo: `/club-uruguay` da 11 caracteres y no sé si está rota
>
> `trabajos-completos.spec.ts` falla ahí: esperaba más de 200 caracteres y encontró 11. Es
> una página que arma el servidor y **pide los salones a la base**. En el contenedor de
> prueba **no hay base**, así que no se puede saber desde acá si la página está rota de
> verdad o si sólo se ve vacía por eso.
>
> **Esto lo tenés que resolver vos, que corrés con los accesos de producción:** abrí
> `/club-uruguay` y decí en una línea qué se ve. Si se ve bien, la prueba tiene que esperar a
> que la página termine de cargar antes de medir. Si se ve vacía, **eso es un defecto real en
> una página que vende** y hay que arreglarlo.
>
> ## Lo que sí está bien y no se toca
>
> - **Las cinco comprobaciones nuevas por pantalla** (vacía, basura de programador, plata
>   rota, error de aplicación, redirección a login): son exactamente las que faltaban.
>   **El qué está bien; lo que hay que cambiar es el dónde mira.**
> - Separar la falla y seguir con la siguiente pantalla, en vez de cortar en la primera.
>
> ## Cómo se cierra
>
> **En la misma propuesta.** Y antes de entregar, corré `npm run "publicar?"` y que dé verde:
> es la puerta, y sin eso no se fusiona nada. **Una entrega de pruebas que deja la tanda en
> rojo con fallas inventadas es peor que no entregar nada**, porque el próximo que la vea en
> rojo la va a ignorar.

---



## Por qué existe esta orden

**El dueño lo preguntó dos veces**, y la segunda fue más clara:

> *"¿Hay alguna manera de revisar toda la app con un mecanismo de uso, no sé el término,
> para que no sigan fallando las auditorías? La fotocabina, todo el entretenimiento estaba
> mal después de la auditoría."*

**El término es prueba de punta a punta, y ya existen: 22 archivos en `tests/e2e/`.** El
problema no es que falten. Es **qué comprueban**.

### Los números, medidos el 27 de agosto

| Archivo | Mira un resultado | Sólo comprueba que abrió |
|---|---|---|
| `simulator-budget-journey` | **0** | 11 |
| `prospecto-simulador` | **0** | 5 |
| `muro-subir-foto` | **0** | 3 |
| `la-web-publica-se-ve` | **0** | 4 |
| `entertainment-stations` | 5 | **20** |
| `public-smoke` | 6 | 17 |
| `viaje-invitado` | 7 | 11 |

**El caso que lo resume todo:** `simulator-budget-journey` recorre los cinco pasos, llega a
*"Tu presupuesto está listo"* y se baja el PDF. **Nunca mira el monto.** Si el presupuesto
dijera $1 o $999.999.999, la prueba pasa igual. Es el camino que le da de comer al negocio.

Por eso la fotocabina, el entretenimiento y la web pasaron auditorías estando mal: **todo
confirma que la pantalla ABRE; nada confirma que el resultado esté BIEN.**

## ESTO NO ES PARA PROTEGER EL FUTURO. ES PARA AVERIGUAR QUÉ PASA HOY

**El dueño lo marcó y tiene razón:** *"a pesar de que funcione, lo que hay que solucionar es
lo ya hecho."*

El filtro obligatorio de cada subida **sólo impide que entre basura nueva**. No arregla nada
de lo que ya está. Peor: **hoy mismo pasa en verde con la pantalla de cobro sin ninguna
prueba**, porque un filtro sólo puede exigir lo que alguien escribió, y eso nadie lo escribió.

Entonces el sentido de estas pruebas **no es proteger lo que venga**. Es este:

> **Nadie sabe hoy si la app hace bien las cuentas, si el cobro registra lo que corresponde o
> si el recuerdo sale como debe — porque nada lo comprueba.** Estas son el instrumento para
> averiguarlo.

**Consecuencia práctica, y es la parte que importa:** la primera vez que se corran, **lo que
encuentren van a ser errores de HOY**, de código que ya está fusionado y publicado. Hay que
esperar que aparezcan, y es el objetivo, no un accidente.

- **Cuando una prueba nueva se ponga en rojo, NO la ajustes para que pase.** Ese rojo es el
  hallazgo. **Avisá antes de tocar nada**: puede ser plata que se está calculando mal.
- **Escribí primero la prueba con el resultado que CORRESPONDE**, no con el que la app da hoy.
  Si escribís lo que da hoy, **congelás el error** y la prueba queda inútil — que es
  exactamente lo que ya pasó dos veces esta semana.

## PARTE A — El recorrido de TODA la app, que hoy no mira

**El dueño lo pidió así: *"de toda la app quiero un mecanismo seguro"*, y aclaró algo que es
lo peor de todo: la auditoría dio *"cero errores"*.**

Cero errores, y la fotocabina imprimía sin el fondo, el entretenimiento estaba mal y la web
también. **Un informe que dice "todo bien" cuando no lo está es peor que no tener informe**:
no sólo no encuentra el problema, además convence de que no hay ninguno.

Las trece pruebas de la parte B cubren lo importante, no las 348 pantallas. Esto sí.

**Ya existe y no hay que inventarlo:** `tests/e2e/internal-route-inventory.spec.ts` visita
**más de 180 pantallas internas**, una por una, con sesión iniciada. Y
`public-experience-matrix` hace lo propio con las públicas.

**El problema es que casi no mira.** Hoy marca una pantalla como rota sólo si:

- devuelve error de servidor (`status >= 400`),
- redirige a `/login`,
- o el texto dice `Application error`, `Internal Server Error` o *"no puede cargar los datos
  del panel"*.

**Entonces una pantalla que abre en blanco pasa. Una que muestra `undefined` pasa. Una que
muestra `$NaN` donde va un precio, pasa.** Eso es lo que se cuela después de cada auditoría.

### Qué agregarle al recorrido, y es barato

Por cada una de las 348 pantallas, que **falle** además si:

1. **Está prácticamente vacía.** Menos de ~200 caracteres de texto visible. Una pantalla que
   abre y no dice nada está rota aunque conteste bien.
2. **Muestra basura de programador.** Que aparezca en pantalla `undefined`, `null`, `NaN`,
   `[object Object]`, `Infinity` o `{{` es un error, siempre.
3. **Muestra plata rota.** `$NaN`, `$undefined`, `$ ` seguido de nada, o un precio negativo
   donde no corresponde. **Esta sola justifica el trabajo.**
4. **Tiró un error en el navegador.** Recolectar los errores de consola de cada pantalla y
   fallar si hay alguno que no esté en una lista declarada de excepciones conocidas.
5. **Se desborda en el celular.** Ya existe `mobile-overflow`: que corra sobre **todas** las
   pantallas, no sobre unas pocas.

### Y lo que lo hace SEGURO, no sólo completo

- **Corre solo en cada cambio**, no cuando alguien se acuerda. Si no corre, no sirve.
- **La lista de excepciones sólo se achica.** Igual que el control de puertas abiertas: si
  una pantalla necesita estar en la lista, va con el motivo escrito y con fecha. **Una lista
  que crece es una alfombra donde se barre.**
- **Si el recorrido no puede entrar a una pantalla, eso es una falla**, no un salteo. Hoy
  varias se saltean en silencio.

**Con esto, "todo en verde" pasa a querer decir algo:** ninguna de las 348 pantallas está en
blanco, ninguna muestra basura, ninguna muestra plata rota y ninguna se desborda en el
celular. Eso es el mecanismo seguro.

## PARTE B — UNA prueba por trabajo, que mire el resultado

**No se tocan las pruebas que ya existen.** Se agrega **una** por cada cosa para la que sirve
la app. **Esta lista es finita y cuando esté completa, se terminó.**

Para cada una: hacer el trabajo completo como una persona, y al final **comprobar el dato que
la app produjo** — un texto, un número o una imagen. No que algo sea visible.

### Plata (lo más importante)

0. **EL COBRO. Empezá por acá.** `/pago/mercadopago` no tiene ninguna prueba y es por donde
   entra la plata. Que la pantalla abra con un pago de prueba, muestre **el importe correcto**
   y el nombre de quien paga, y que al volver del cobro **el estado quede registrado**. Sin
   tocar plata real: con los datos de prueba que ya usa el resto de la tanda.
1. **El presupuesto da el número correcto.** Armar uno con datos conocidos —cantidad de
   invitados y servicios fijos— y comprobar **el monto exacto** en pantalla, no que la
   pantalla diga "listo". Que incluya el ajuste anual del 15%, que va siempre.
2. **El PDF del presupuesto trae ese mismo monto**, no sólo que se baje un archivo.
3. **Una factura guardada aparece con su importe** en la lista, y la cuenta cierra.
4. **Un cobro registrado baja el saldo** en la cantidad correcta.

### Entretenimiento (lo que el dueño usa en la fiesta)

5. **La fotocabina produce la tira.** Sacarse la tanda con cámara simulada y comprobar que la
   imagen resultante **tiene el nombre del homenajeado y el fondo de la fiesta**. Hoy ninguna
   prueba se saca la foto.
6. **El muro social muestra la foto subida**, con el autor, no que el botón de subir exista.
7. **El espejo mágico y la plataforma 360 producen su recuerdo**, igual que la fotocabina.
8. **La impresión sale en 10x15** con el contenido correcto.

### El cliente y el invitado

9. **El invitado confirma asistencia y queda registrado** — que su nombre aparezca en la
   lista del evento después.
10. **El portal del cliente muestra sus datos reales**: su fiesta, su saldo, sus invitados.
11. **La invitación digital se ve con el arte y el nombre que se cargaron.**

### La web pública

12. **La portada muestra los textos y precios que corresponden**, y **el pie de página se
    ve** — ya pasó que existía y el visitante no lo veía.
13. **El formulario de contacto deja el prospecto anotado** en el CRM, con su teléfono.

## LO QUE MIDIÓ LA AUDITORÍA DEL 27 DE AGOSTO (verificado a mano)

Tres agentes recorrieron toda la app. **El código está sano**: no aparecieron datos que no
llegan, ni pantallas con plata rota, ni datos inventados. **Lo flojo es la verificación**, y
esto es lo que hay, contado:

**De 225 comprobaciones en las pruebas de navegador, 147 (el 65%) sólo confirman que la
pantalla abrió.** Dos de cada tres no comprueban nada.

### Los agujeros confirmados, en orden de gravedad

1. **`/pago/mercadopago` no tiene NINGUNA prueba de navegador.** La pantalla existe y ningún
   archivo de `tests/e2e/` la toca. **Es por donde entra la plata.** Esto es lo primero.
2. **`/compras` (el carrito) y `/post-fiesta/[fiestaId]`: ninguna prueba.**
3. **Cinco archivos no comprueban nada** más allá de que la pantalla abra:
   `fotos-de-la-app` (cero comprobaciones en todo el archivo), `impresion-a4`,
   `internal-smoke`, `planner-missing-portals` y `senal-mala`.
4. **El presupuesto**: sus dos únicas comprobaciones de resultado son que el PDF **se llame**
   "presupuesto" y que **pese más de 5 KB** (`simulator-budget-journey.spec.ts:104-105`). El
   monto, nunca.
5. **Falso positivo ya descartado, no lo reportes de nuevo:** el panel del invitado **sí**
   está probado, once archivos lo tocan.

### Lo único que apareció fuera de las pruebas, y es menor

`src/app/(app)/settings/tareas-automaticas/page.tsx`: mientras carga no muestra nada, así que
por uno o dos segundos parece que no hay tareas. **Es incómodo, no es un error.** Arreglalo
sólo si estás en ese archivo por otra cosa.

## Cómo saber si una prueba cuenta

- Si termina en **`toBeVisible`**, en **`status() < 400`** o en *"no dice error"* → **sólo
  confirma que abrió. No cuenta.**
- Si termina comprobando **un texto, un número o una imagen que la app produjo** → cuenta.

## Lo que NO se hace

- **No se borran ni se reescriben las pruebas de hoy.** Sirven para detectar pantallas rotas;
  lo que no hacen es confirmar resultados. Se suman las nuevas.
- **No se agregan veinte pruebas por módulo.** Una por trabajo, la que llega hasta el final.
  Una de éstas vale más que veinte que abren pantallas, y son lentas: por eso una sola.
- **No se toca la app para que la prueba pase.** Si la prueba encuentra algo mal, **eso es un
  hallazgo** y se avisa antes de cambiar nada.

## Cómo se comprueba que quedó bien

Las trece están escritas y en verde. Y una comprobación que vale más que todas: **cambiar a
mano el cálculo del presupuesto para que dé un número distinto y ver que la prueba número 1
se ponga en rojo.** Si sigue en verde, esa prueba no sirve.
