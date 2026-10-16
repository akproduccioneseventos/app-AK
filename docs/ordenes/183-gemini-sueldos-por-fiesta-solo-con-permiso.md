# PARA GEMINI - Orden 183 (PLATA, prioridad): la fiesta le llega a cada perfil sólo con la plata que puede ver

**Va en la MISMA propuesta que las órdenes 178 a 181.** Es plata y quién ve qué: Claude la revisa línea
por línea. Salió del barrido de las preguntas 65 y 68 (16/10/2026), confirmado por Claude.

## El defecto

Los perfiles están en `src/lib/auth/perfiles.ts` (~50-60): la **secretaria** "no ve sueldos ni
ganancias"; el **operador** "nada de plata". Las pantallas propias lo cumplen (`getEmpleados`,
`getPlanDePagos`, `recibos-personal`), **pero la fiesta viaja entera** a todo el equipo: `requireEquipo`
en `src/app/actions/fiesta/fiesta.actions.ts` (~113-117) sólo recorta para quien **no** es del equipo
(`recortarFiestaParaAfuera`, `src/lib/fiesta/recortar-para-afuera.ts`). Así llegan, verificado:

| Campo de la fiesta (`src/types/fiesta.ts`) | Permiso para verlo | Lo recibe sin tenerlo | Pantalla que lo muestra |
|---|---|---|---|
| `personalAsignado[].eventSalary` (~182) | `SUELDOS` | secretaria, operador | `personal/recibos/page.tsx` ~116, ~238 |
| `gestionCostos` (~1599: costos, ingresos, margen) | `GANANCIAS` | secretaria, operador | `gestion-costos-rentabilidad/page.tsx` ~224, ~238, ~292 |
| `pagosProveedores` (~1613) | `CONTABILIDAD` | operador | `gestion-costos-rentabilidad/page.tsx` ~367 |
| `planDePagos` (~1618) | `CONTABILIDAD` | operador | `post-evento/page.tsx` ~187, ~246 |
| `clientPaymentNotifications` (~1620) | `CONTABILIDAD` | operador | `plan-pagos/page.tsx` ~381-410 |
| `contratoDatos` (~1589: seña, saldo) | `CONTABILIDAD` | operador | `gestion-documental/contrato-servicio/page.tsx` ~159-237 |
| `estadosCompra[].pagado/montoPagado` (~1615) | `CONTABILIDAD` | operador | — |

(Todas las pantallas bajo `src/app/(app)/fiestas/nueva/`.)

**Queda como está, por decisión del dueño:** el total del presupuesto (`configuracion.presupuestoEstimado`
y los importes de los pedidos del cliente, `montoAdicional`): los organizadores ven totales a propósito
(`nivelDePresupuestos`, nivel "operativo", en `src/app/actions/presupuestos.ts` ~84).

## El arreglo

1. **Al leer:** función nueva `recortarFiestaPorPerfil(fiesta, usuario)` en
   `src/lib/fiesta/recortar-para-afuera.ts` (al lado de la que ya existe):
   - sin `SUELDOS`: `personalAsignado` sin `eventSalary` (lo demás de cada asignación queda);
   - sin `GANANCIAS`: sin `gestionCostos`;
   - sin `CONTABILIDAD`: sin `pagosProveedores`, `planDePagos`, `clientPaymentNotifications`,
     `contratoDatos`, y `estadosCompra` sin `pagado`/`montoPagado`.
   En `requireEquipo`, para el equipo devolvé `recortarFiestaPorPerfil(f, usuario)` en vez de `f`. Que
   alcance a **todas** las lecturas que usan `requireEquipo` y a `getFiestaById` (~391).
   Las acciones del servidor que calculan costos, reportes o cobros y **leen la base directamente** no cambian.
2. **Al guardar:** los campos de `CONTABILIDAD` ya se conservan si el que guarda no tiene ese permiso
   (`CAMPOS_DE_PLATA_Y_CONTRATO`, ~129-161): **verificá** que esa lista cubra todo lo de arriba. Agregá lo
   mismo para `eventSalary` (sin `SUELDOS`: se conserva el guardado de cada `empleadoId` y no se acepta uno
   nuevo) y para `gestionCostos` (sin `GANANCIAS`: se conserva el guardado). **Si no, la secretaria borra
   sueldos y costos con sólo guardar la fiesta** (pregunta 68).
3. **Escribir costos:** `updateGestionCostos` (`src/app/actions/fiesta/costos.actions.ts` ~19) hoy acepta
   `CONTABILIDAD`, `INSUMOS` u `ORGANIZACION`: el operador puede cambiar el margen. Que la **acción pública**
   pida `GANANCIAS`. Los que la llaman desde el servidor (`costos.actions.ts` ~196 y ~216,
   `decoracion.actions.ts` ~176, que sincronizan solos) usan una versión interna sin el chequeo de pantalla,
   así siguen andando para quien arma la fiesta.
4. **Pantallas:** las de la tabla, sin el permiso, muestran un cartel ("Esta parte la ve quien tiene
   permiso de …") en lugar de montos o ceros. La pantalla de recibos, sin `SUELDOS`, igual.
5. **No toques** el portal del personal (`getAccesoPersonalPortalView`), los totales de presupuesto que ven
   los organizadores, ni los permisos de cada perfil. Nombrá lo nuevo en el candado de la plata
   (`src/__tests__/el-candado-de-la-plata.test.ts`) si corresponde.

## Bloque 2 - Lo mismo en presupuestos y en el panel (barrido de presupuestos, confirmado por Claude)

- `sinCobros` (`src/app/actions/presupuestos.ts` ~89-91) le saca a los organizadores sólo `pagosCliente`;
  les siguen llegando **`senia` y `saldo`** (los escribe el cobro del contrato, que es de contabilidad).
  Sacalos también. El total del presupuesto queda (decisión del dueño).
- `getDashboardKpiData` (`src/app/actions/dashboard.ts` ~186-195) arma el aviso **"Saldo pendiente: Faltan
  X UYU"** también para quien no tiene contabilidad, y como sus presupuestos vienen sin cobros, **el
  monto sale mal** (dice que falta todo aunque ya esté cobrado). Ese aviso va sólo si `veLaPlata` (~100).
- **Borrar presupuestos y facturas mira el rol viejo**: `deletePresupuesto` (~594) y `deleteInvoiceInner`
  (`src/app/actions/invoices.ts` ~580) piden `role === 'admin'`. Un usuario creado con perfil "dueño" y rol
  viejo distinto no puede, y uno con rol "admin" pero perfil "secretaria" sí. Cambialo por
  `puede(auth.user, PERMISOS.ADMINISTRACION)` (perfil nuevo, `src/lib/auth/perfiles.ts`). Buscá otros
  `role === 'admin'` en `src/app/actions/` y hacé lo mismo, avisando cuáles eran.

## Pruebas (datos de la forma real, pregunta 37; base de mentira que devuelve copia, regla 11)

`src/__tests__/la-fiesta-llega-con-la-plata-de-cada-perfil.test.ts`:
1. Secretaria lee: sin `eventSalary` ni `gestionCostos`; con `planDePagos` (tiene contabilidad).
2. Operador asignado lee: sin ninguno de los campos de la tabla; con invitados, menú y cronograma.
3. Dueño lee: todo.
4. **Secretaria guarda** la fiesta como se la dio la lectura: `eventSalary` y `gestionCostos` guardados
   siguen iguales; si manda un `eventSalary` distinto, no se acepta.
5. **Operador guarda**: `planDePagos`, `contratoDatos` y `pagosProveedores` siguen iguales.
6. Operador llama `updateGestionCostos`: rechazado. La sincronización automática del menú sigue actualizando costos.
7. Operador lee presupuestos: sin `senia`, `saldo` ni `pagosCliente`; con el total. Y su panel no trae avisos de "Saldo pendiente".
8. Un usuario con perfil `dueno` (rol viejo `user`) puede borrar un presupuesto sin contrato; uno con rol `admin` y perfil `secretaria`, no.

```comprobar
usa: recortarFiestaPorPerfil en src/app/actions/fiesta/fiesta.actions.ts
usa: PERMISOS.GANANCIAS en src/app/actions/fiesta/costos.actions.ts
no-usa: role !== 'admin' en src/app/actions/presupuestos.ts
no-usa: role !== 'admin' en src/app/actions/invoices.ts
usa: PERMISOS.SUELDOS en src/app/(app)/fiestas/nueva/personal/recibos/page.tsx
prueba: src/__tests__/la-fiesta-llega-con-la-plata-de-cada-perfil.test.ts
```
