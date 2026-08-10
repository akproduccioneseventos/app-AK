# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 10 de agosto de 2026
**Rama:** todo fusionado en `main`. No hay propuestas abiertas.
**Estado:** compila, 1372 pruebas en verde, sin acentos rotos.

## Antes de empezar

Leé `docs/YA-RESUELTO.md` y **anotá ahí todo lo que modifiques, en la misma
propuesta**. Reglas del dueño: **una sola propuesta grande por tanda** (vale
también para las órdenes que se le escriben a otra IA) y **lo que le toca a
Gemini, Claude no lo programa** (Claude sólo escribe plata, cobros, comida y
permisos).

## El tamaño real: 370 pantallas, unas 130 auditadas

## Lo próximo, en orden

1. **Plata en ajustes (CLAUDE).** Está todo verificado y anotado en
   `docs/ordenes/pendiente-todo.md`, bloque E-bis: dos nombres distintos para el
   domicilio del cliente en las plantillas de contrato, marcadores inventados
   que salen impresos, y tres problemas de cupones. **Lo de precios negativos ya
   está arreglado.**
2. **Gemini**: los cinco bloques de `docs/ordenes/pendiente-todo.md`, en **una
   sola propuesta**. Ninguno empezado.
3. **Sin auditar nunca**: `(app)/empresa` (42 pantallas), el resto de
   `(app)/settings` (40), las 25 pantallas de `evento` que no son estaciones,
   los tres portales, `(app)/empleados` (sueldos, es plata), y las sueltas
   (alertas, incidentes, aprobaciones, calendario).

## Ojo con esto, ya pasó

Al fusionar una rama que toque `fotografia` o `catering`, **quedate siempre con
`verifyAccesoPersonalToken`**. Una rama traía la versión vieja y reabría el
agujero del token de proveedor: ningún control lo habría agarrado.
