# Orden 72 — Tres barridos con las preguntas nuevas del 20 de septiembre de 2026

**Para Gemini. UNA SOLA PROPUESTA con los tres bloques.** Si un bloque se traba, entregá
igual los otros dos en la misma propuesta y decí cuál faltó y por qué.

Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste.

**Lo que NO tocás en ningún bloque:** plata, cobros, comida, permisos y quién ve qué. Si un
hallazgo cae ahí, **lo listás en la propuesta y seguís**; lo arregla Claude.
Concretamente, no tocar: `src/lib/readiness-score.ts`, `src/lib/compras/`,
`src/app/actions/payment-plans.ts`, `src/app/actions/facturas*`, `src/app/actions/insumos.ts`,
`src/app/actions/menus-catering.ts`, `src/middleware.ts`, `src/lib/auth/`.

---

## Bloque 1 — Pantallas que se quedan cargando para siempre

**De dónde sale:** el 20 de septiembre se encontró que la lista de regalos, cuando le falta
la fiesta en la dirección, salía de la carga **sin apagar la rueda**: giraba para siempre y no
decía nada. Codex reportó lo mismo en números de mesa ("queda cargando indefinidamente si falla
la consulta"). Ya está arreglado en `src/app/(app)/fiestas/nueva/regalos/page.tsx` — **miralo
como modelo, no lo toques**.

**Búsqueda mecánica:** en `src/app/**/page.tsx` y `src/components/**`, buscar los archivos que
tengan `setIsLoading(true)` o `useState(true)` para cargar, y revisar **cada camino de salida**
de la función que carga:

- un `return` temprano antes del `setIsLoading(false)`,
- un `catch` que no apaga la carga,
- una carga sin `finally`.

**Cuenta como hallazgo** un camino de salida que deja la pantalla cargando. **No cuenta** una
carga que termina siempre en `finally`.

**Cómo se arregla:** apagar la carga en ese camino **y** mostrar en pantalla, en criollo, qué
pasó y qué hacer (como en regalos: "entrá desde la fiesta"). Nunca dejarla en blanco.

```comprobar
archivo: src/app/(app)/fiestas/nueva/regalos/page.tsx
usa: setIsLoading(false) en src/app/(app)/fiestas/nueva/regalos/page.tsx
prueba: src/__tests__/ninguna-pantalla-se-queda-cargando.test.ts
```

La prueba nueva tiene que **listar los archivos que quedan mal y fallar con sus nombres**, no
comprobar que exista una palabra. Probala rompiéndola: volvé a sacar un `setIsLoading(false)`
de una pantalla ya arreglada y mirá que se ponga en rojo.

---

## Bloque 2 — Los `as any` que LEEN un campo

**De dónde sale:** el indicador de preparación leía `fiesta.planPago` (sin "s") detrás de un
`as any`. Ese campo no existe: la cuenta daba cero desde siempre y la fiesta figuraba lista con
el cliente debiendo. El revisor de tipos no dice nada cuando hay `as any`.

**Búsqueda mecánica:** en `src/`, todas las apariciones de `as any)` seguidas de un punto y un
nombre de campo — por ejemplo `(fiesta as any).loQueSea`, `(data as any).loQueSea`.

Para cada una: **¿ese campo existe en el tipo de al lado?** ¿Alguien lo escribe alguna vez
(`grep` del nombre en todo `src/`)?

- **Hallazgo:** el campo no aparece en ningún tipo **y** nadie lo escribe. Esa lectura da
  siempre vacío.
- **No es hallazgo:** el campo existe con otro nombre en el tipo, o se escribe en algún lado.

**Cómo se arregla:** apuntar al campo de verdad y **sacar el `as any`**, para que el revisor de
tipos lo cuide de ahora en más. Si el campo no existe en ningún lado, el código que depende de
él está muerto: decilo en la propuesta, no lo inventes.

```comprobar
archivo: src/__tests__/ningun-as-any-lee-un-campo-que-no-existe.test.ts
usa: as any en src/__tests__/ningun-as-any-lee-un-campo-que-no-existe.test.ts
prueba: src/__tests__/ningun-as-any-lee-un-campo-que-no-existe.test.ts
```

---

## Bloque 3 — Claves de agrupación a las que les falta una parte

**De dónde sale:** la lista de compras juntaba los renglones por nombre y proveedor, sin la
unidad: 200 g y 2 kg se sumaban como "202". Ya está arreglado en `src/lib/compras/unidades.ts`
— **miralo como modelo, no lo toques.**

**Búsqueda mecánica:** en `src/`, las claves armadas a mano para agrupar y sumar: líneas con
`` const key = ` `` o `${...}-${...}` usadas como índice de un objeto que después hace `+=`.

Para cada una, la pregunta: **¿la clave incluye todo lo que hace distintos a dos renglones?**
Unidad de medida, moneda, impuesto, fecha, fiesta. Si falta una, el total miente.

- **Hallazgo:** dos cosas que no son iguales caen en la misma clave y se suman.
- **No es hallazgo:** una clave que agrupa cosas que sí son lo mismo.

**Lo de comida y plata se lista y no se toca.** Los totales de invitados, mesas, tareas,
fotos, mensajes y equipos sí son tuyos.

```comprobar
archivo: src/lib/compras/unidades.ts
usa: claveDeConsolidado en src/app/(app)/fiestas/nueva/resumen-planificacion/page.tsx
prueba: src/__tests__/las-claves-de-agrupacion-no-mienten.test.ts
```

---

## Lo que tiene que comprobar cada prueba

Ninguna de las tres pruebas puede dar verde con la función apagada. La pregunta antes de
escribir cada línea: *¿esto daría verde igual si el arreglo no estuviera?* Si la respuesta es
sí, está mal escrita.
