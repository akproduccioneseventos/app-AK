# Orden 21 — El recorrido de TODAS las pantallas, y auditar con el método fuerte

**Para Gemini. Escrita el 31 de agosto de 2026.**

> **Idea del dueño, textual:** *"hay que completar la auditación y agregar más mecanismos"*, y
> sobre vos: *"quizás él puede auditar también con tu método"*.
>
> **Sí. Eso es exactamente esta orden.** Hasta ahora auditabas leyendo código. **De acá en
> adelante auditás abriendo la pantalla en el navegador**, que es el único método que encontró
> algo este año.

## Por qué existe, y es importante que lo entiendas

De las **353 pantallas** de la app, **hoy hay 8 auditadas de verdad**. Las otras 340 están
miradas leyendo código, que es el método con el que se dijo *"cero errores"* mientras el
consentimiento del invitado no se pedía, las estaciones no arrancaban y la fotocabina salía en
negro.

**Todo lo que falló este año tenía la misma forma: escrito, compilando, con las pruebas en
verde, y sin hacer nada.** Leyendo código eso no se ve. Abriendo la pantalla, sí.

**La lista de lo auditado y con qué método está en `docs/LO-AUDITADO.md`. Leela primero:** tiene
los seis niveles y dice qué se hizo con cada pantalla. **El piso para decir "auditado" es el
nivel 4.**

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA.** Antes de darla por terminada: `npm run "publicar?"` completo en verde y
lo anotado en `docs/YA-RESUELTO.md`.

---

## EL MAPA, YA CONTADO — no lo cuentes de nuevo

Contado dos veces el 31 de agosto de 2026 (un ayudante y a mano, y dio igual): **353 pantallas**.

| Grupo | Cuántas | Qué necesitan para abrirse |
|---|---|---|
| **A — Públicas** | 39 | Nada. Se abren y listo |
| **B — Del invitado, con dato en la dirección** | 48 | El `fiestaId` de la fiesta de prueba, y `access=` en las de estación |
| **C — Del equipo, sin dato** | 216 | La cookie `ak_session` |
| **D — Del equipo, con dato** | 50 | La cookie **más** un id válido (fiesta, presupuesto, empleado, factura) |

**El grupo C es el más grande y el menos mirado: 216 pantallas del equipo.** Ahí está
`/fiestas/nueva/...` entera (más de 140 pantallas de armado de fiesta) y `/settings/...` (más de
40). **Arrancá por ese grupo**, que es donde más hay para encontrar.

**El grupo D es el más difícil** porque necesita ids de verdad: presupuestos, facturas,
empleados. Para esos, **creá los datos de prueba que hagan falta** con los ayudantes que ya hay
en `tests/e2e/helpers/`. **Si para alguno no hay forma, decilo en el informe**; no lo saltees
callado.


---

## BLOQUE 1 — El recorrido: una prueba que abre TODAS las pantallas

Armá `tests/e2e/el-recorrido-de-todas-las-pantallas.spec.ts`.

**Qué hace:** arma la lista de pantallas **sola, leyendo `src/app/`** —no a mano, porque una
lista escrita a mano queda vieja en una semana— y abre cada una en el navegador.

**Por cada pantalla comprueba estas cinco cosas, que son las que ya encontraron fallas reales:**

1. **Que dibuje algo.** Si el texto de la pantalla tiene menos de 40 letras, no dibujó.
2. **Que no se rompa por dentro** (`pageerror` en cero).
3. **Que no le muestre texto técnico a nadie**: `undefined`, `firestore`, `is not a valid`,
   `Algo salió mal`, `NaN`, `[object Object]`.
4. **Que tenga al menos un botón o un enlace**, salvo las que son sólo para mirar (el muro, el
   tótem). Una pantalla sin nada que tocar y sin nada que mirar está muerta.
5. **Que no tarde más de 15 segundos** en dibujar.

**Los cuatro grupos de pantallas, que necesitan cosas distintas para abrirse:**

- **Públicas**: se abren y listo.
- **Del invitado** (`/evento/...`): necesitan `access=`. El modo de armarlo está en
  `tests/e2e/helpers/fiesta-de-prueba.ts`, función `crearPermisoDeEstacion`.
- **Del equipo** (`src/app/(app)/...`, `/empresa/...`): necesitan la cookie `ak_session`. El
  modo está en `crearCookieDeSesion`, mismo archivo.
- **Con dato en la dirección** (`[id]`, `[fiestaId]`, `[totemId]`): usá la fiesta de prueba que
  arma `crearFiestaDeEstaNoche`. **Si a una le falta el dato, NO la saltees en silencio: que
  aparezca en el informe como "no se pudo abrir y por qué".**

**Dos trampas que ya nos costaron caro, y que la prueba tiene que evitar:**

- **Una pantalla que contesta "no está habilitada" NO es una falla**: es la app avisando bien.
  Pero **tampoco cuenta como auditada**. Va en una lista aparte: "no se pudo probar".
- **El Espejo Mágico tiene tres modos** y abre en el de firma si no se le dice cuál. El modo se
  pide con `?mode=foto`, **con `mode`, no con `modo`**. Ya nos hizo perder tres corridas.

**Que deje escrito un informe** en `test-results/recorrido/informe.md`: cuántas pasaron, cuántas
fallaron y cuáles no se pudieron probar, con el motivo de cada una.

**Esto NO va adentro de `publicar?` todavía**, porque va a tardar mucho. Se corre con
`npm run recorrido`.

---

## BLOQUE 2 — Foto de pantalla de todas, para mirarlas con ojos humanos

El mismo recorrido, guardando una imagen de cada pantalla en `test-results/recorrido/`, con el
nombre de la dirección.

**Por qué:** el buzón blanco que encandila en un salón a oscuras **no lo encontró ninguna
prueba**: se vio mirando la foto. Hay cosas que sólo ve una persona.

---

## BLOQUE 3 — Que la lista de lo auditado se llene SOLA

`docs/LO-AUDITADO.md` se llena hoy a mano y por eso se va a desactualizar.

Hacé `npm run auditado` que:

1. Lea el informe del recorrido.
2. **Escriba en `docs/LO-AUDITADO.md` una línea por pantalla**, con el método (nivel 4 si sólo
   se abrió, nivel 5 si además hay una prueba que le comprueba el resultado) y la fecha.
3. **Respete las líneas que ya están escritas a mano con un método más fuerte.** Una pantalla
   auditada en nivel 5 o 6 **no puede bajar a 4** porque el recorrido la abrió. **El método más
   fuerte gana siempre.**
4. Termine diciendo el número: **"X de 353 pantallas auditadas con método 4 o más"**.

---

## BLOQUE 4 — Que el número se vea en la puerta

Que `npm run "publicar?"`, al terminar bien, **agregue una línea al final**:

    Auditadas de verdad: 8 de 353 pantallas (2%).

**No frena nada**: es sólo para que el número esté a la vista y no se olvide. Un número que no
se ve, no se mejora.

---

## BLOQUE 5 — Y ahora auditá vos, con el método fuerte

Corré el recorrido y **arreglá lo que aparezca**, con estas reglas:

- **Una pantalla que no dibuja, que se rompe por dentro o que muestra texto técnico: arreglala.**
  Eso es una falla de verdad.
- **Una pantalla que se ve fea pero anda: NO la toques.** Anotala en una línea al final de tu
  reporte y decidí el dueño. **Está prohibido cambiar lo que ya funciona.**
- **Si encontrás algo de plata, cobros, comida o permisos: NO lo toques.** Avisá y lo hace
  Claude.

**Entregá el informe aunque no llegues a arreglar todo.** Saber cuáles están rotas ya vale, y es
más de lo que tenemos hoy.

---

## LO QUE NO SE TOCA

- **Las 8 pantallas ya auditadas en nivel 4 o más** (están en `docs/LO-AUDITADO.md`): andan y
  están probadas. No las rehagas.
- **`consentRequired` y `moderationMode`**, y todo lo de plata, cobros y comida: **los hace
  Claude.**
- **Nada que se pague por mes** sin preguntar.
- **No inventes una prueba para que un control se calle.** Una prueba que pasaría igual con la
  app rota es peor que ninguna.
