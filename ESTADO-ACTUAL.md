# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 10 de agosto de 2026 (revisión de las seis propuestas de Gemini)
**Rama:** `main`. Quedan abiertas las dos del bloque D: **no fusionar**.
**Estado:** compila, 1378 pruebas en verde, sin acentos rotos.

## Lo último que pasó

Se revisaron las seis propuestas de Gemini (914 a 921) con los siete controles.

**Fusionadas, sanas:** 914 (colores del planificador al tema), 915 (pantallas del
invitado), 916 (impresión y entrega), 918 (ajustes del sistema; agrega un control
que avisa si una plantilla de contrato o de WhatsApp tiene un marcador que el
sistema no sabe completar). Las cuatro chocaban entre sí sólo en
`docs/YA-RESUELTO.md`, que cada una reescribía entera: se resolvió conservando las
notas de todos los lados.

**NO fusionar: 917 y 921 (bloque D).** Ninguna de las dos compila por su cuenta.
921 contiene a 917, así que 917 sobra.

Qué tienen mal, verificado:
1. `src/lib/fiesta-defaults.ts` — se borraron ~22 banderas de módulos por defecto y
   quedó `];` en vez de `};`. Si eso entra, las fiestas nuevas nacen sin muro,
   sin control de entrada, sin 360, sin barra y sin zona digital.
2. `src/app/evento/plataforma-360/[fiestaId]/page.tsx` — una llave de cierre de más,
   y se borraron `selectedDuration` y `voiceEnabled` que el archivo sigue usando en
   diez lugares.

Se intentó rescatarla: restaurando esos dos archivos desde `main` aparecieron
**nueve errores nuevos y distintos** en otros archivos (`QrCode` y `stripUrl` que no
existen, `branding` que no está en el tipo, props equivocadas en el QR del bogue).
O sea: no está dañada, está **sin terminar**. Conviene devolverla a Gemini con la
lista de errores, no remendarla.


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
