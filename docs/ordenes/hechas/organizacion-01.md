# Orden de trabajo — Organización 01

**Para:** Gemini (Antigravity)
**Escribe:** Claude (auditoría y verificación)
**Fecha:** 8 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

El módulo de organización son 18 pantallas: invitados, mesas, escáner de entrada,
alergias, música, itinerario, tareas, catering, lista de compras, decoración,
personal, recibos, logística, proveedores, carga operativa, portal del cliente y
portal del invitado, más el tablero central que las agrupa.

**Todo lo que sigue está verificado leyendo el código.** No hay nada reportado de
oído: cada punto tiene archivo y línea.

---

## Cómo se trabaja esta orden

**Cuatro propuestas completas, no veinte chiquitas.** Cada bloque es una propuesta
entera: se hace completo, se prueba completo y se sube una sola vez. Dentro de un
bloque hacé todo lo que dice, no lo partas. Lo que sí importa: **no mezcles dos
bloques en la misma propuesta.**

Orden: **A primero** (ahí está lo que hace perder trabajo y plata). Después B, C y
D en el orden que quieras.

### Antes de subir, siempre

Corré los cuatro y que pasen los cuatro. **Si alguno falla, no subas.**

```
npx tsc --noEmit
npx jest --silent
npm run check:acentos
npm run build
```

El `build` va en la lista porque estuvo roto seis días sin que nadie lo notara:
el revisor de tipos pasaba y el build no. No alcanza con las pruebas.

Guardá todo en **UTF-8**. Y cuidado con las **comillas invertidas**: en la tanda
anterior tu herramienta las borró tres veces seguidas y rompió el proyecto. Si
`npx tsc --noEmit` marca errores raros de sintaxis, es eso.

### La mirada, que son tres preguntas y no una

Regla del dueño: no alcanza con arreglar. Cada cosa que toques, miralas juntas:

1. **¿Qué está roto?**
2. **¿Cómo se usa mejor?** Pasos de más, datos que se cargan dos veces, cosas que
   el sistema ya sabe y podría completar solo.
3. **¿Cómo se ve mejor?** Es un producto que se le muestra al cliente y compite
   con plataformas pagas. Lo feo también hace perder ventas.

---

# BLOQUE A — Que no se pierda trabajo ni plata

**Propuesta completa. Es la más importante de la orden.**

## A.1 — Las bebidas nunca llegan a la lista de compras

`src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx:158-177`

**Verificado:** la lista de compras **nunca lee las bebidas de la fiesta**. Busqué
`bebidas` en todo el archivo: no aparece una sola vez. Lo único que procesa es la
barra de tragos, y la busca en `defaultBebidasData` (`src/lib/fiesta-defaults.ts:148`),
donde `barra_tragos` tiene `items: []`. Vacío.

**Qué pasa:** el equipo carga refrescos, vinos, cervezas, cafetería, cóctel de
bienvenida y la barra en la pantalla de catering. Se guardan bien. Y en la lista
de compras **no aparece ninguna**. Se va a comprar sin nada de bebidas.

**Qué hay que hacer:** leer `fiestaData.bebidas.categorias` y volcar a la lista de
compras los ítems de todas las categorías activadas, con la misma lógica de
cantidad por persona y redondeo hacia arriba que ya usa el resto de la pantalla
(el redondeo hacia arriba ya está bien resuelto en la línea 249: no lo toques).

**Cuidado:** que sincronizar dos veces no duplique. La consolidación por nombre y
proveedor de las líneas 199-226 ya funciona; apoyate en ella.

## A.2 — El autoguardado del diseño de decoración falla en silencio

`src/app/(app)/fiestas/nueva/decoracion/page.tsx:658-666`

**Verificado:** el canvas se guarda solo cada 2 segundos con `silent = true`. En
el `catch`, el aviso está adentro de un `if (!silent)`. Es decir: **cuando falla
el guardado automático, no se muestra absolutamente nada.**

**Qué pasa:** el equipo diseña el salón entero, la pantalla dice "Guardando…",
falla la conexión, y se pierde todo el trabajo sin un solo aviso. Se enteran al
recargar.

**Qué hay que hacer:** que el guardado automático, cuando falla, muestre un aviso
**discreto y permanente** (no un cartel que tape la pantalla): algo como "No se
pudo guardar — reintentando", visible hasta que un guardado salga bien. Y que
reintente solo.

## A.3 — Borrar una foto del moodboard puede no borrar nada

`src/app/(app)/fiestas/nueva/decoracion/page.tsx:342-346`

**Verificado:** `handleDeleteMoodboardPhoto` sólo actúa si `res.success`. **No hay
`else`.** Si falla, no pasa nada: ni aviso, ni recarga.

**Qué hay que hacer:** avisar cuando falla, y decir qué hacer. Mientras estés ahí,
`handleAddMoodboardPhoto` (líneas 335-341) muestra un error sin descripción cuando
`res.error` viene vacío: poné un texto por defecto que se entienda.

## A.4 — Los recibos del personal se pierden al recargar

`src/app/(app)/fiestas/nueva/personal/recibos/page.tsx:346-384`

**Verificado:** los sueldos se editan en la pantalla y sólo se persisten al tocar
"Guardar cambios". La pantalla de personal, del mismo módulo, **sí** tiene
guardado automático. Son dos comportamientos distintos para lo mismo.

**Qué pasa:** el equipo ajusta diez sueldos, recarga sin pensar, y pierde todo.
Esto es plata.

**Qué hay que hacer:** o guardado automático como en personal, o —si preferís
mantener el guardado manual— un aviso claro al salir con cambios sin guardar. Lo
importante es que las dos pantallas se comporten igual y que no se pierda plata
por recargar.

## A.5 — El aviso de doble asignación se pierde en silencio

`src/app/(app)/fiestas/nueva/personal/page.tsx:262-272`

**Verificado:** la comprobación de si un empleado ya está en otra fiesta el mismo
día termina en `.catch(() => undefined)`. Si la consulta falla, **no se avisa
nada** y el equipo puede anotar a alguien en dos fiestas a la vez.

**Qué hay que hacer:** si la comprobación no se pudo hacer, decirlo: "No pudimos
verificar si ya está anotado ese día". Es distinto de "está libre", y el equipo
tiene que saber la diferencia.

## A.6 — La sincronización con Google puede no ocurrir nunca

`src/app/actions/fiesta/personal.actions.ts:15-20`

**Verificado:** después de guardar el personal se dispara la sincronización con
Google Workspace (que manda los correos al equipo, `sendEmails: true`) sin
esperarla, y su error termina en un `console.warn`. La pantalla dice "Guardado"
igual.

**Qué pasa:** se asigna a un mozo, el sistema dice que salió bien, y el correo
avisándole que trabaja esa noche **nunca se envía**. Nadie se entera.

**Qué hay que hacer:** no la conviertas en bloqueante — está bien que guardar no
dependa de un servicio externo. Lo que falta es dejar registro de que falló y
mostrarlo donde el equipo lo vea, por ejemplo en la misma pantalla de personal:
"El aviso al equipo no salió. Reintentar." Con un botón que reintente.

## A.7 — Pruebas

Que quede cubierto: la lista de compras con bebidas cargadas las incluye; una
categoría desactivada no aparece; sincronizar dos veces no duplica.

---

# BLOQUE B — Que el tablero diga cuánto falta

**Propuesta completa.** Acá se mezclan las tres miradas: es práctico y además es
lo primero que se ve.

`src/app/(app)/fiestas/nueva/page.tsx`

**Lo que pasa hoy, verificado:**

- El avance general está en una etiqueta chica al costado (líneas 289-291), del
  mismo tamaño que el resto. Nadie la registra.
- Cada tarjeta de módulo dice sólo "Activo" o "Inactivo" (líneas 607-620). **No
  dice cuánto está completo.** Hay que entrar a cada una para saberlo.
- Cuando no hay alertas, dice "No hay bloqueos críticos. Podés continuar con la
  preparación habitual" (líneas 277-330). No dice **qué** conviene hacer ahora.

**Qué hay que hacer:**

1. Que el avance general se vea como lo que es: la métrica principal de la fiesta.
   Una barra de verdad, no una etiqueta.
2. Una barra chica de avance en cada tarjeta de módulo, para ver de un vistazo
   dónde falta trabajo.
3. Reemplazar "no hay bloqueos" por el **próximo paso sugerido**: el módulo más
   atrasado, con un botón que lleve directo. El que abre el tablero tiene que
   saber qué hacer sin pensar.

**Criterio:** con la fiesta a medio organizar, alguien que nunca la vio tiene que
entender en cinco segundos cuánto falta y por dónde seguir.

---

# BLOQUE C — Que se use más cómodo

**Propuesta completa.** Nada de esto está roto: todo funciona y todo hace perder
tiempo.

## C.1 — Buscador en la lista de empleados

`src/app/(app)/fiestas/nueva/personal/page.tsx:491-505` — el selector muestra
todos los empleados capacitados, sin buscador. Con ochenta empleados hay que
bajar scrolleando. El catálogo de logística (línea 626) sí tiene buscador: copiá
ese patrón.

## C.2 — Dos botones de sincronización que se duplican entre sí

`src/app/(app)/fiestas/nueva/carga-operativa/page.tsx:831 y 887` — "Sincronizar
Inteligente" y "Regenerar desde Activos" sólo agregan. Si se usan los dos, la
lista queda duplicada, y no hay forma de reemplazarla: hay que borrar a mano.

**Qué hacer:** que sincronizar **reemplace** lo que vino de esa fuente en vez de
acumular, conservando lo que el equipo agregó a mano. Y que antes de rehacer la
lista avise qué va a pasar.

## C.3 — Las tareas de los proveedores se cortan sin avisar

`src/app/(app)/fiestas/nueva/proveedores-portal/page.tsx:191` — cada línea se
recorta a 180 caracteres con `.slice(0, 180)`, en silencio. El proveedor recibe
la instrucción cortada a la mitad.

**Qué hacer:** mostrar el límite mientras se escribe y avisar al llegar. Si el
límite no tiene motivo técnico, subilo.

## C.4 — El itinerario permite horarios que se pisan

`src/app/(app)/fiestas/nueva/itinerario/page.tsx:231-247` — sólo se valida que
haya título. Se pueden cargar dos momentos a la misma hora, o uno que termine
antes de empezar, sin ningún aviso.

**Qué hacer:** avisar cuando dos momentos se superponen. **Avisar, no bloquear:**
a veces dos cosas pasan de verdad al mismo tiempo.

## C.5 — Configurar el portal del invitado a ciegas

`src/app/(app)/fiestas/nueva/modulo-invitado/page.tsx:254-274` — hay nueve
interruptores y ninguna forma de ver cómo queda. Hay que guardar, salir, mirar y
volver.

**Qué hacer:** una vista previa al costado que se actualice al tocar cada
interruptor. Con eso se acierta a la primera.

---

# BLOQUE D — Que se vea mejor y se entienda

**Propuesta completa.** Es lo que ve el cliente.

## D.1 — Pantallas vacías que no dicen qué hacer

- `personal/recibos/page.tsx:480-484`: sin personal asignado dice "No hay personal
  asignado a este evento para generar recibos" y nada más. Falta el botón para ir
  a asignarlo.
- `decoracion/pdf/page.tsx:88-214`: sin decoración cargada sale una hoja casi en
  blanco, sin explicar que falta completarla.

**Qué hacer:** toda pantalla vacía dice tres cosas: qué falta, por qué, y un botón
para resolverlo.

## D.2 — Mensajes que no explican nada

- `modulo-invitado/page.tsx:162-163`: el `catch` descarta el error y muestra sólo
  "Error al guardar". El de carga (línea 141) sí incluye el detalle: hacé lo mismo.
- `proveedores-portal/page.tsx:115-116,230`: "No se pudo abrir el portal" tanto si
  todavía no hay proveedores cargados (normal) como si falló la base (error). Son
  dos situaciones distintas y tienen que decirse distinto.
- `portal-cliente/page.tsx:139-154`: muestra "Error de red" ante cualquier fallo,
  aunque haya sido de permisos.

**Regla para los textos:** en criollo, decir qué pasó y qué hacer. Nada de jerga.

## D.3 — El color se ve cambiado aunque no se haya guardado

`src/app/(app)/fiestas/nueva/menu-mesa/page.tsx:79-91,127-137` — los colores se
actualizan en pantalla al tocarlos, y si después falla el guardado el cambio
queda visible igual. El equipo cree que quedó guardado.

**Qué hacer:** si el guardado falla, volver atrás lo que se ve y decirlo.

## D.4 — Preview de colores del portal del invitado

`modulo-invitado/page.tsx:289-312` — los colores se eligen en cuadraditos de 10
píxeles, sin ver cómo queda. Mostrá un mini-anticipo (encabezado y un botón) que
se actualice en vivo. Si hacés C.5, esto entra ahí.

## D.5 — Revisar en el celular

El equipo usa esto en el salón, con el teléfono en la mano. Recorré las 18
pantallas en pantalla chica y corregí lo que se desborde o se corte: sobre todo
las tablas de invitados, recibos y lista de compras.

---

## Lo que NO hay que tocar

- **Ya está arreglado, no lo rehagas:** el conteo de celíacos y del reporte de
  alergias (ahora cuenta personas y no filas), el precio que se cargaba como
  cantidad en la lista de carga, y las notas internas que salían en el PDF del
  itinerario.
- La cantidad de invitados del catering sale del presupuesto: **es una decisión
  del dueño, no un error.**
- El redondeo hacia arriba de las cantidades está bien: evita quedarse corto.
- El ajuste anual del 15% y los descuentos de marketing son decisiones tomadas.
- Los controles rojos de GitHub son por facturación de la cuenta. No los
  investigues: vale lo que se verifica localmente.

## Cuando termines cada bloque

Avisá el número de la propuesta. Se verifica y se fusiona, o vuelve con el motivo
en una línea.
