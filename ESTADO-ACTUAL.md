# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 13 de agosto de 2026, cierre.
**Rama:** todo fusionado en `main`.
**Estado:** compila, 1582 pruebas en verde, sin acentos rotos.
**Propuestas abiertas:** ninguna.

## La aplicación quedó auditada entera

Las 370 pantallas pasaron por auditoría. Lo que falta ahora es **trabajo
pendiente conocido**, no zonas sin mirar.

## Cómo se trabaja (regla del dueño)

Los **ayudantes económicos auditan**, Claude **verifica cada hallazgo leyendo el
código** y decide, **Gemini programa** lo que no es plata, y Claude revisa y
fusiona. Claude escribe código sólo en plata, cobros, comida y permisos.

**Una sola propuesta grande por tanda**, y vale también para las órdenes que se
le escriben a Gemini. **Todo lo que se toca se anota en `docs/YA-RESUELTO.md`**,
en la misma propuesta, con el porqué.

## Las órdenes están ordenadas

Había quince archivos con 2700 líneas, casi todos cumplidos. Ahora hay **una sola
vigente: `docs/ordenes/ahora.md`**, y el resto en `docs/ordenes/hechas/` como
historia. Cuando una orden se termina, se mueve a `hechas/` en la misma
propuesta. Está explicado en `docs/ordenes/LEEME.md`.

## Lo hecho en esta tanda

Recibos pagados que no se pueden cambiar, menús sin platos y salones sin
capacidad que ya no se guardan, la distribución de mesas que era pública y
mostraba los invitados de cualquier fiesta, los datos de la empresa y las cuentas
bancarias que no se pueden dejar vacías, insumos y activos sin negativos, y el
aviso de unidades que no se pueden convertir en las recetas.

## Lo que falta

**Todo lo pendiente está en `docs/ordenes/ahora.md`**, cinco bloques para Gemini
en una sola propuesta. El más importante: **la pantalla de impresión sigue
mostrando fotos viejas cuando se corta internet** y el operador no se entera, en
plena fiesta.

**Para que decida el dueño:** incidentes, aprobaciones y playbooks funcionan pero
no las enlaza nadie. O se conectan al menú o se retiran.

## Ojo con esto, ya pasó

- Al fusionar una rama que toque `fotografia` o `catering`, **quedate siempre con
  `verifyAccesoPersonalToken`**.
- **Una rama hecha sobre una base vieja borra trabajo nuevo sin que se note.**
  Compará contra `main` de hoy, no contra el de cuando se creó.
- Un archivo `'use server'` **sólo puede exportar funciones asíncronas**. Hay una
  prueba que lo controla y ya frenó dos entregas.
