# PARA GEMINI - Orden 183 (PLATA, prioridad): lo que cobra cada persona por fiesta sólo lo ve quien tiene permiso de sueldos

**Va en la MISMA propuesta que las órdenes 178 a 181.** Es plata y quién ve qué: Claude la revisa línea
por línea. Lo encontró el barrido de la pregunta 65 (16/10/2026) y lo confirmó Claude.

## El defecto

La regla de la app es que los sueldos los ve sólo quien tiene `PERMISOS.SUELDOS` (el dueño): así lo
cuidan `getEmpleados` (`src/app/actions/empleados.ts` ~33), `recibos-personal.ts` (~55, ~140) y
`fiesta/personal.actions.ts` (~20). Pero **la fiesta viaja entera a todo el equipo**:
`requireEquipo` en `src/app/actions/fiesta/fiesta.actions.ts` (~113-117) devuelve la fiesta sin tocar a
quien es del equipo (`quienEsElEquipo`, `src/lib/auth/equipo-de-la-fiesta.ts` ~38: cualquier perfil con
algún permiso que no sea operador, y el operador en sus fiestas). Adentro va
`personalAsignado[].eventSalary`: **lo que cobra cada persona en esa fiesta**. Con eso:
- la **secretaria** (sin `SUELDOS`) lo ve, y la pantalla
  `src/app/(app)/fiestas/nueva/personal/recibos/page.tsx` (~116, ~238) le arma los recibos con los montos;
- un **operador** asignado a una fiesta recibe lo que cobra cada compañero.

## El arreglo

1. **Al leer:** en `fiesta.actions.ts`, junto a `requireEquipo`, una función
   `sinSueldosSiNoCorresponde(fiesta, usuario)` que, si `!puede(usuario, PERMISOS.SUELDOS)`, devuelve la
   fiesta con `personalAsignado` sin `eventSalary` (el resto de cada asignación queda: empleado, rol,
   asistencia, llegada). Aplicala en **todas** las lecturas que pasan por `requireEquipo`
   (`getFiestaById`, `getAllFiestas` / `leerFiestasCrudas` y las que listes al buscar `requireEquipo(`
   en ese archivo). Las acciones del servidor que calculan costos o reportes y **leen la base
   directamente** no cambian.
2. **Al guardar (lo más importante, pregunta 38 de `docs/COMO-AUDITAR.md`):** quien no ve sueldos
   manda la fiesta sin `eventSalary`. `saveFiesta` (~284) y `updateFiestaPartial` (~340) tienen que
   **conservar** el `eventSalary` guardado de cada `empleadoId` cuando el que guarda no tiene `SUELDOS`,
   y no aceptar uno nuevo de él. Si no, la secretaria borra los sueldos con sólo guardar la fiesta.
3. **La pantalla de recibos** (`personal/recibos/page.tsx`): si el usuario no tiene `SUELDOS`, mostrar
   "Los recibos de sueldo los arma quien tiene permiso de sueldos" y no dibujar montos.
4. **No toques** el portal del personal (`getAccesoPersonalPortalView`, ya protegido), el cálculo de
   costos (`costos.actions.ts`), los reportes de ganancia, ni los permisos de cada perfil.
5. Nombrá esto en `src/__tests__/el-candado-de-la-plata.test.ts` si aplica (ver `CLAUDE.md`, "El candado de la plata").

## Pruebas (con datos de la forma real, pregunta 37)

`src/__tests__/los-sueldos-por-fiesta-solo-con-permiso.test.ts`:
1. Secretaria lee la fiesta: ninguna asignación trae `eventSalary`; el dueño sí lo ve.
2. Operador asignado lee su fiesta: sin `eventSalary` de nadie.
3. **Secretaria guarda la fiesta** (con `personalAsignado` sin montos, como se lo dio la lectura): los
   `eventSalary` guardados siguen iguales. Y si manda un `eventSalary` cambiado, no se acepta.
4. El dueño cambia un `eventSalary`: se guarda.
La base de mentira **devuelve una copia** en cada lectura (regla 11 de `CLAUDE.md`).

```comprobar
usa: sinSueldosSiNoCorresponde en src/app/actions/fiesta/fiesta.actions.ts
usa: PERMISOS.SUELDOS en src/app/(app)/fiestas/nueva/personal/recibos/page.tsx
prueba: PENDIENTE src/__tests__/los-sueldos-por-fiesta-solo-con-permiso.test.ts
```
