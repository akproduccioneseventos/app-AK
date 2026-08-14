# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico y la evidencia larga van a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 13 de agosto de 2026, cierre del día.
**Rama:** todo fusionado en `main` hasta la propuesta 972.
**Estado:** compila, 1572 pruebas en verde, sin acentos rotos.
**Propuestas abiertas:** ninguna.

## Cómo se trabaja (regla del dueño)

Los **ayudantes económicos auditan**, Claude **verifica cada hallazgo leyendo el
código** y decide, **Gemini programa** lo que no es plata, y Claude revisa y
fusiona. Claude escribe código sólo en plata, cobros, comida y permisos.

**Una sola propuesta grande por tanda** — vale también para las órdenes que se le
escriben a Gemini. Y **todo lo que se toca se anota en `docs/YA-RESUELTO.md`**,
en la misma propuesta, con el porqué.

## Lo hecho en esta tanda (13 de agosto, tarde)

- **Un recibo del personal ya pagado no se puede cambiar.** Se podía editar el
  monto y la fecha sin dejar rastro. Cerrado en el servidor y en pantalla.
- **No se guarda un menú sin platos ni un salón sin capacidad.** Los dos
  aparecían después para elegir en un presupuesto.
- Se cerraron las propuestas 968, 970, y las cinco viejas de bloques (914 a 918):
  su contenido ya estaba adentro o era peor que lo que hay hoy.

## Auditado y sano, no lo vuelvas a mirar

Sueldos (no hay doble pago, sólo los ve quien tiene el permiso), los borrados de
empresa (no se puede borrar algo en uso), y las pantallas de la noche salvo tres.

## Lo que falta

- **Gemini**: `docs/ordenes/pantallas-de-la-noche.md`, tres bloques en **una sola
  propuesta**. El importante: **la pantalla de impresión sigue mostrando fotos
  viejas cuando se corta internet** y el operador no se entera.
- **Gemini**: `docs/ordenes/pendiente-todo.md`, bloque A — terminar de pasar los
  colores al tema en el resto de las pantallas.
- **Sin auditar todavía**: el resto de `(app)/settings` y `(app)/empresa` fuera de
  salones, menús y contabilidad.

## Ojo con esto, ya pasó

- Al fusionar una rama que toque `fotografia` o `catering`, **quedate siempre con
  `verifyAccesoPersonalToken`**. Una rama vieja reabría el agujero del token y
  ningún control lo habría agarrado.
- **Una rama hecha sobre una base vieja borra trabajo nuevo sin que se note.**
  Compará siempre contra `main` de hoy, no contra el de cuando se creó.
