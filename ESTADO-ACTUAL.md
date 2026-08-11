# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 11 de agosto de 2026 (auditoría de las áreas que faltaban)
**Rama:** `main`. **Ninguna propuesta abierta.**
**Estado:** compila, 1384 pruebas en verde, sin acentos rotos.

## Lo último que pasó

**Se terminó de auditar la app.** Ya no quedan áreas sin mirar.

Se fusionaron tres propuestas, todas verificadas con los siete controles:

- **932** (Gemini): la barra descuenta stock de verdad y lo repone al cancelar; los
  recibos del personal guardan quién pagó y cuándo; no se puede borrar un proveedor
  con insumos; WhatsApp normaliza el teléfono; los contratos aceptan los nombres
  viejos de fecha, domicilio, salón y seña.
- **937**: el catálogo de venta presencial no sumaba el menú al total, así que el
  número que veía el cliente estaba por debajo del real; se quedaba en blanco si
  fallaba la carga; la web ofrecía un "Elite" que no se vende y escondía el
  Intermedio; el plan 30/40/30 estaba escrito cinco veces.
- **938**: la orden nueva para Gemini.

**Los once pendientes que estaban anotados ya estaban resueltos.** Se verificaron
uno por uno contra el código: los cerró la 932. El documento venía viejo y mandaba
a repetir trabajo hecho. **Antes de arrancar por una lista vieja, verificá.**

## Antes de empezar

Leé `docs/YA-RESUELTO.md` y **anotá ahí todo lo que modifiques, en la misma
propuesta**. Reglas del dueño: **una sola propuesta grande por tanda** (vale
también para las órdenes que se le escriben a otra IA) y **lo que le toca a
Gemini, Claude no lo programa** (Claude sólo escribe plata, cobros, comida y
permisos).

## El tamaño real: unas 370 pantallas, todas recorridas al menos una vez

Auditadas a fondo en esta última tanda, y **limpias**: configuración (41), las
pantallas de la noche de fiesta que no son estaciones (18).

Con hallazgos, ya entregados a Gemini en `PARA-GEMINI.md`: empresa (42),
empleados y sueldos, y las sueltas del panel (15).

## Lo próximo, en orden

1. **Gemini**: los cuatro bloques de `PARA-GEMINI.md`, en **una sola propuesta**.
   Ninguno empezado. El más importante es el primero: hoy se pueden borrar insumos,
   servicios, menús y bienes que están en uso. El caso del insumo es el peor,
   porque **baja el costo del plato en silencio**.
2. **Dos decisiones del dueño, sin respuesta todavía:**
   - ¿La moderación de la pantalla gigante viene prendida en las fiestas nuevas?
     Hoy viene apagada y lo que sube un invitado sale directo a la pantalla.
   - Los módulos por usuario se asignan pero **no se validan en ningún lado**:
     cualquiera con sesión entra a todo. O se implementa o se saca la pantalla.

## Ya está resuelto, no lo busques de nuevo

- Aviso de pago duplicado del cliente: si toca dos veces por el mismo monto dentro
  de diez minutos, cuenta como uno solo.
- Clave del portal del cliente: por defecto lleva el nombre del cliente, obliga a
  cambiarla la primera vez, y hay recuperación por correo con tope de tres intentos
  por hora.
- Fotos del muro descargables con el enlace: **es a propósito**, decisión del dueño.
- Los centavos en dólares: no aplica, se trabaja sólo en pesos.

## Ojo con esto, ya pasó

Al fusionar una rama que toque `fotografia` o `catering`, **quedate siempre con
`verifyAccesoPersonalToken`**. Una rama traía la versión vieja y reabría el
agujero del token de proveedor: ningún control lo habría agarrado.

Y no fusiones dos propuestas que toquen el mismo archivo sin verificar el
resultado **junto**: la 841 y la 845 protegieron facturas de dos maneras distintas,
encajaron sin protestar, y dejaban la pantalla colgada para siempre al guardar.
