# Dos pantallas que faltan: cambio de comida y pasar prospecto a cliente

**Para:** Gemini (Antigravity)
**Escrita:** 18 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta de cambios con los dos bloques adentro.** No una por bloque:
cada fusión dispara un despliegue y eso se paga. Si un bloque se traba, entregá el
resto igual, en la misma propuesta, y avisá cuál faltó y por qué.

**Arrancá desde la versión principal de ahora**, no desde una rama vieja. Las dos
últimas entregas llegaron hechas sobre una base vieja y una traía adentro la
anterior entera: habría borrado tres correcciones sin que se notara.

Antes de tocar nada, leé `docs/YA-RESUELTO.md` y `docs/QUE-HAY-EN-LA-APP.md`.

## Lo que YA ESTÁ HECHO — no lo rehagas

Se revisaron seis componentes que nadie mostraba. Cuatro ya están resueltos:

- El asistente de ventas **funciona** (`src/components/public/AsistenteVirtual.tsx`).
  Había un archivo muerto con nombre parecido; se borró.
- La sección "por qué AK" **ya se enchufó** a la portada.
- `ConfigFormItem` **se borró**.
- `CommercialJourneySection` **queda como está a propósito**: necesita saber de
  dónde vino el visitante y ese dato no existe cuando la página se arma.

Quedan los dos de abajo, que son pantallas que faltan de verdad.

---

# BLOQUE 1 — Que el cliente pueda pedir cambiar la cantidad de comida

**Esto es lo más útil de los dos.** Hoy, si al cliente le confirman diez invitados
más, tiene que llamar por teléfono.

## Lo que ya existe (verificado, no lo rehagas)

- Las acciones del servidor están hechas y andan:
  `submitCateringChangeRequest`, `resolveCateringChangeRequest` y
  `getCateringChangeRequests`, en
  `src/app/actions/fiesta/catering-change.actions.ts`.
- Hay un componente empezado, `src/components/portal/CateringSimulator.tsx`, que
  **no se muestra en ningún lado**. Sirve de base, pero **hay que corregirle una
  cosa antes** (ver abajo).

## Qué falta

1. **La pantalla del cliente**, dentro del portal del cliente: que vea cuántos
   adultos y chicos tiene contratados, pueda pedir otra cantidad, escriba el motivo
   y mande el pedido. Que vea el estado de lo que ya pidió (esperando, aceptado,
   rechazado).
2. **La pantalla del equipo**, para aceptar o rechazar cada pedido. Hoy los pedidos
   se guardarían y nadie los vería nunca.

## LO QUE NO PODÉS HACER, Y NO ES OPINABLE

> **No muestres un precio estimado del cambio.**

El componente que está empezado calcula el menú de los chicos al 70% del de
adultos, un número escrito a mano que **no sale de cómo la aplicación cotiza de
verdad**. Si lo dejás, el cliente ve un precio en pantalla y después le llega otro
en la factura. Eso es lo peor que puede pasar en una venta.

**Sacá ese cálculo.** La pantalla pide el cambio y dice: *"Te vamos a pasar el
presupuesto actualizado."* El número lo hace el equipo con las cuentas reales, al
aceptar el pedido.

Si te parece que el precio en pantalla hace falta igual, **no lo inventes: dejalo
anotado y avisá.** Eso lo decide Claude, que es quien toca plata y comida.

---

# BLOQUE 2 — Pasar un prospecto a cliente, desde el CRM

Hoy **no se puede**: cuando un prospecto cierra, alguien tiene que cargarlo otra
vez a mano como cliente, con los mismos datos. Se carga dos veces lo mismo y a
veces queda distinto.

## Lo que ya existe

`src/components/crm/ConvertToClientDialog.tsx`, un cuadro de diálogo terminado que
**nadie muestra** y que espera un `onSubmit` que no existe.

## Qué falta

1. **La acción del servidor** que crea el cliente a partir del prospecto: se lleva
   nombre, teléfono, correo y lo que haya, y deja el prospecto marcado como
   convertido con el identificador del cliente nuevo, para no perder de dónde vino.
2. **El botón** que abre ese cuadro, en la ficha del prospecto.
3. **Que no se pueda convertir dos veces.** Si el prospecto ya tiene cliente, el
   botón dice "Ya es cliente" y lleva a su ficha.
4. **Que no se dupliquen clientes.** Si ya existe un cliente con ese teléfono,
   avisar y ofrecer enlazarlo en vez de crear otro.

**Ojo:** la acción es del equipo, no pública. Tiene que pedir sesión con
`requireAppSession()` en la primera línea, como el resto.

---

## Los cuatro controles, antes de entregar

1. `npm run check:acentos` — sin acentos rotos.
2. `npx tsc --noEmit` — cero errores.
3. `npx jest --silent` — todas en verde.
4. `npm run build` — tiene que terminar bien.

**El build es obligatorio, no un extra.** Ya pasó que el revisor de tipos pasaba y
el build fallaba, y la aplicación estuvo seis días sin poder publicarse.

**Que las pruebas llamen al código de verdad.** Ya pasó tres veces que una prueba
armaba una lista adentro y la filtraba ahí mismo: la entrega venía "en verde" sin
haber probado nada.

## Cuando termines

Anotá en `docs/YA-RESUELTO.md` qué hiciste y actualizá `docs/QUE-HAY-EN-LA-APP.md`:
las dos cosas figuran hoy como que faltan. **Va en la misma propuesta**, no aparte.
