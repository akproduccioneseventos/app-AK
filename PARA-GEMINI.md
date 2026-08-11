# Orden de trabajo para Gemini

Ultima revision: 11 de agosto de 2026.

**Todo lo anterior de este archivo esta cerrado.** Los once pendientes que estaban
anotados se verificaron uno por uno contra el codigo de hoy y ya estaban resueltos
por la propuesta 932. No hay que volver a mirarlos.

Lo que sigue son hallazgos NUEVOS, de areas que nunca se habian auditado. Cada uno
esta verificado abriendo el archivo: no son sospechas.

---

## COMO SE ENTREGA (leer antes de empezar)

**UNA SOLA PROPUESTA DE CAMBIO con todos los bloques.** No una por bloque. Cada
fusion dispara un despliegue y eso se paga.

Si un bloque se traba, **entregar el resto igual, en la misma propuesta**, y avisar
en la descripcion cual quedo afuera y por que.

Antes de entregar, que pasen los cuatro controles:

- `npx tsc --noEmit` en cero
- `npm run check:acentos` sin roturas
- `npx jest` en verde
- Y que la propuesta este hecha sobre la version principal **de hoy**, no sobre una
  vieja

---

## BLOQUE 1 — Se pueden borrar cosas que estan en uso (lo mas importante)

Hay una proteccion que ya existe y funciona bien: **no se puede borrar un proveedor
que tiene insumos asociados**. Esta en `src/app/actions/proveedores.ts`, en
`deleteProveedor`: busca los insumos que lo referencian y, si hay, no borra y avisa
cuantos son.

Ese mismo cuidado **falta en otros cuatro lugares**, y todos dejan datos rotos:

| Que se borra | Donde | Que queda roto |
|---|---|---|
| Insumo | `src/app/actions/insumos.ts:137` | Las recetas de menu que lo usaban quedan apuntando a un ingrediente que no existe. El costo del plato se recalcula sin el y **sale mas barato de lo que es**, sin que nadie se entere. |
| Servicio | `src/app/actions/servicios-empresa.ts:102` | Los presupuestos que lo tienen cargado quedan con un servicio fantasma y el total deja de cuadrar. |
| Menu | `src/app/actions/menus-catering.ts:200` | El presupuesto pierde la lista de platos que se le habia mostrado al cliente. |
| Activo fijo | `src/app/actions/activos-fijos.ts:88` | La lista de carga del evento queda pidiendo algo que ya no existe. |

**Que hacer:** repetir en los cuatro el patron que ya esta escrito en
`deleteProveedor`. Antes de borrar, buscar quien lo usa; si hay uso, no borrar y
devolver un mensaje que diga **cuantos** lo usan, para que la persona entienda por
que no se puede.

Cuidado con esto: el costo del plato es lo mas delicado de los cuatro, porque el
error no se ve. Un presupuesto roto se nota; un plato que salio mas barato porque
le falta un ingrediente, no.

---

## BLOQUE 2 — Los sueldos del equipo se pueden leer desde afuera

La pantalla `/personal/[empleadoId]` muestra, para un empleado, todas las fiestas
en las que trabajo **con el sueldo de cada una**.

La pantalla en si esta protegida: sin sesion, el sistema manda al login. **El
problema es la funcion que trae los datos.** En
`src/app/actions/google-workspace.ts:347`, `getEmployeeWorkspacePortal` no comprueba
absolutamente nada: ni sesion, ni permiso, ni token. Y esas funciones se pueden
invocar directamente desde afuera, sin pasar por ninguna pantalla.

O sea: quien conozca el identificador de un empleado se entera de cuanto cobra, y
de cuanto cobra en cada fiesta.

**Que hacer:** exigir el permiso de sueldos (`PERMISOS.SUELDOS`), igual que ya hace
`updatePersonal` en `src/app/actions/fiesta/personal.actions.ts:18`.

Si esa pantalla estaba pensada para que el propio empleado vea sus fechas y sus
pagos desde su celular sin cuenta, **entonces no alcanza con pedir sesion**: hay que
darle al empleado un enlace con token firmado, como ya se hace con los presupuestos
compartidos y con los accesos de proveedores. En ese caso, avisar y no improvisar:
es una decision del dueno.

---

## BLOQUE 3 — Las aprobaciones no dicen quien aprobo

En `src/app/(app)/aprobaciones/page.tsx:157` y `:179`, al aprobar o rechazar un
cambio se manda el usuario escrito a mano:

```
aprobarCambio(id, 'admin')
rechazarCambio(id, motivo, 'admin')
```

Lo mismo en `src/app/(app)/playbooks/page.tsx:56` al aplicar un playbook.

Resultado: **todo queda firmado como "admin", sin importar quien lo hizo.** Si
manana hay una discusion sobre quien autorizo un cambio, no hay registro. Una
pantalla de aprobaciones que no guarda quien aprobo no sirve para lo unico que
tiene que servir.

**Que hacer:** tomar la identidad de la sesion en el servidor, no de lo que mande la
pantalla. El patron ya esta escrito en `src/app/actions/recibos-personal.ts:79`,
donde se guarda `pagadoPor` con el correo del usuario de la sesion. Que la accion
del servidor resuelva quien es; la pantalla no deberia poder decidirlo.

---

## BLOQUE 4 — Cosas chicas pero que se ven

**4.1. Moneda equivocada en aprobaciones.** En
`src/app/(app)/aprobaciones/page.tsx:19` los importes se formatean como **pesos
argentinos** (`es-AR` / `ARS`). El negocio trabaja solo en pesos uruguayos. Un
cambio de diez mil pesos se muestra como si fuera plata de otro pais.

**4.2. Se puede guardar un sueldo negativo.** En la pantalla de personal de una
fiesta (`src/app/(app)/fiestas/nueva/personal/page.tsx:612`) el campo del monto no
tiene minimo, y el servidor tampoco lo valida
(`src/app/actions/fiesta/personal.actions.ts`). Un error de tipeo deja guardado un
sueldo en negativo, que despues aparece en los recibos como si el empleado le
pagara a la empresa. Poner minimo cero en la pantalla y validarlo tambien en el
servidor, que es donde vale.

**4.3. Fechas con formato de otro pais.** Cuatro pantallas usan `es-AR` o `es-ES`
para mostrar fechas: `auditoria/page.tsx:19`, `incidentes/page.tsx:19`,
`eventos/page.tsx:38` y `pagos-rapidos/page.tsx:46`.

**Antes de tocar esto, verificar si el problema es real:** el riesgo no es el
formato sino el dia corrido. Si la fecha viene sin hora (`2026-08-11`), convertirla
con `new Date()` la toma como medianoche universal y en Uruguay muestra **el dia
anterior**. Ya paso en este proyecto y hay ayudantes hechos para eso en
`src/lib/public-experience/event-date.ts` (`parseEventDate`, `formatEventDate`).
Comprobar en cada una de las cuatro si la fecha trae hora o no, y usar esos
ayudantes solo donde haga falta. Si la fecha ya viene con hora completa, dejarla
como esta y decirlo.

---

## LO QUE NO HAY QUE TOCAR (decisiones tomadas del dueno)

No reportar esto como errores, son decisiones:

- El ajuste anual del 15% va **siempre**.
- El descuento del 50% del Salon Club Uruguay y el del presupuesto son marketing.
- La lista de compras usa los invitados **del presupuesto**, no los confirmados: el
  dueno cocina lo que se contrato, y para sumar gente el sistema tiene su forma de
  hacerlo y el presupuesto aumenta.
- Las fotos del muro se bajan con el enlace directo **a proposito**.
- Se trabaja **solo en pesos uruguayos**.
- Los controles rojos de GitHub son por facturacion: no se investigan. Lo que vale
  es lo que se verifica localmente.

---

## PENDIENTE DE DECISION DEL DUENO (no avanzar sin respuesta)

1. **Moderacion de la pantalla gigante en fiestas nuevas.** Hoy viene apagada: lo
   que sube un invitado sale directo a la pantalla grande. Falta decidir si viene
   prendida por defecto.

2. **Los modulos por usuario no se validan.** La pantalla de usuarios permite
   asignar modulos (crm, presupuestos, clientes) a cada persona, pero ninguna accion
   del servidor los consulta: cualquiera con sesion entra a todo igual. Hay que
   decidir entre implementar la validacion o sacar la pantalla, porque hoy da una
   sensacion de control que no existe.

3. **Aviso de pago duplicado.** El cliente puede informar el mismo pago dos veces si
   hace doble clic. El dueno ya decidio: **tiene que llegar una sola vez.** Falta
   hacerlo.

---

## AREAS YA AUDITADAS: NO REPETIR

Estas se revisaron a fondo y estan sanas. Volver a mirarlas es tiempo perdido:

- **Configuracion** (`(app)/settings`, 41 pantallas): todas las acciones peligrosas
  piden confirmacion explicita y verifican administrador en el servidor.
- **La noche de la fiesta** (`evento/`, 18 pantallas que no son estaciones): manejo
  de error en castellano, cuentan personas y no filas, aislan bien los datos por
  evento.
- **Estaciones de entretenimiento** (fotocabina, bogue, espejo, plataforma 360,
  buzon, totem).
- **Portal del cliente y del invitado**, incluido el saldo con ajuste anual, el
  cambio obligatorio de clave y la recuperacion por correo.
- **Facturas, presupuestos y cupones**, incluida la proteccion contra guardados
  simultaneos.
- **Barra tecnologica**: stock real por insumo, en transaccion, con reposicion al
  cancelar.
- **Control de entrada**: cuenta personas, avisa cuando se corta la senal.
- **Catalogo de venta presencial**: el total ya incluye el menu.
