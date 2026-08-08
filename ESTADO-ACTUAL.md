# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión, así que si crece más de 40 líneas deja de servir. Lo histórico va a
`ESTADO-AUDITORIA.md`, que no se lee salvo que haga falta.

Quien cierre una sesión reescribe este archivo. No se acumulan tandas: se pisa.

---

**Última actualización:** 8 de agosto de 2026
**Rama:** todo fusionado en `main`. No hay propuestas abiertas.
**Estado:** compila, 1306 pruebas en verde, 94 de navegador, sin acentos rotos.

## Antes de empezar: leé los errores ya cometidos

Están en `AGENTS.md`, sección "Errores ya cometidos". Son diez, con el caso real
de cada uno. Los leen las tres IA. Ahorran más tiempo que cualquier otra cosa.

## Cómo se trabaja

Claude audita con los ayudantes económicos, **verifica cada hallazgo leyendo el
código** y deja la orden en `docs/ordenes/`. Gemini programa y sube. Claude
verifica y fusiona. Plata, cobros, comida y permisos los escribe Claude.

**Los controles de las propuestas también se delegan**, y si hay varias se
verifican en paralelo, no una atrás de la otra.

## Entretenimiento: TERMINADO

Cuatro bloques de `docs/ordenes/entretenimiento-02.md`, fusionados y probados.

## Organización: TERMINADO

Cuatro bloques de `docs/ordenes/organizacion-01.md` (#882 a #885), más lo que
hizo Claude por tocar comida, plata y privacidad (#879).

Lo más importante que quedó resuelto: las bebidas ahora llegan a la lista de
compras, el diseño de decoración avisa si el autoguardado falla, los recibos se
autoguardan, el tablero muestra el avance y sugiere el próximo paso, y los
conteos de invitados cuentan personas y no filas.

**Se corrigió una regresión de Gemini antes de fusionar:** había movido la
sincronización con Google antes del guardado, y mandaba los avisos con la lista
vieja de personal.

## Lo próximo, si nadie dice otra cosa

Elegir el próximo módulo. Quedan sin auditar el comercial (presupuestos, CRM,
simulador) y el contable (facturas, cobros, recibos).
