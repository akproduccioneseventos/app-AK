# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión, así que si crece más de 40 líneas deja de servir. Lo histórico va a
`ESTADO-AUDITORIA.md`, que no se lee salvo que haga falta.

Quien cierre una sesión reescribe este archivo. No se acumulan tandas: se pisa.

---

**Última actualización:** 10 de agosto de 2026
**Rama:** todo fusionado en `main`. **No hay propuestas abiertas** de nadie.
**Estado:** compila, 1372 pruebas en verde, sin acentos rotos.

## Antes de empezar

Leé `docs/YA-RESUELTO.md` antes de auditar y **anotá ahí todo lo que modifiques,
en la misma propuesta**. Los errores ya cometidos están en `AGENTS.md`.

Dos reglas del dueño que valen para las tres IA: **propuestas grandes, no muchas
chicas** (cada fusión se paga), y **lo que le toca a Gemini, Claude no lo
programa** (Claude sólo escribe plata, cobros, comida y permisos).

## Terminado

Entretenimiento, organización, las pantallas de plata, comercial, contable,
automatizaciones, accesos de proveedores, y la escala visual con los
componentes compartidos.

**Ojo con esto, ya pasó una vez:** al fusionar los bloques C y D, la rama traía
la versión vieja de `fotografia` y `catering`, que reabría el agujero del token
de proveedor. Ningún control lo habría agarrado. **Al resolver un conflicto en
esas dos pantallas, quedate siempre con `verifyAccesoPersonalToken`.**

## Lo que falta

- **Colores del resto de las pantallas.** Se recorrieron a mano las que ve el
  cliente; de 211 quedan la mayoría. No rompe nada, la app se ve despareja.
- **Gemini**: bloques A y B de `planificacion-02.md` (invitado e impresos, unas
  50 pantallas) y los cuatro de `entretenimiento-03.md`. Ninguno empezado.
- **Sin auditar nunca**: los ajustes del sistema (plantillas de contrato,
  invitación y WhatsApp, catálogo de menús, salones, empleados, proveedores) y
  todo lo que corre durante la fiesta (centro de mando, pantalla en vivo,
  control del salón).

**Lo próximo recomendado: los ajustes del sistema.** Un precio o una plantilla
mal ahí se multiplica por todos los presupuestos y todos los contratos.
