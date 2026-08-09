# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión, así que si crece más de 40 líneas deja de servir. Lo histórico va a
`ESTADO-AUDITORIA.md`, que no se lee salvo que haga falta.

Quien cierre una sesión reescribe este archivo. No se acumulan tandas: se pisa.

---

**Última actualización:** 9 de agosto de 2026
**Rama:** `claude/repo-work-guidelines-l4u1tf`, con el último cambio sin fusionar.
**Estado:** compila, 1308 pruebas en verde, sin acentos rotos.

## Antes de empezar: leé los errores ya cometidos

Están en `AGENTS.md`, sección "Errores ya cometidos". Los leen las tres IA.
Y `docs/YA-RESUELTO.md` antes de salir a buscar problemas.

## Cómo se trabaja

Claude audita con los ayudantes económicos, **verifica cada hallazgo leyendo el
código** y deja la orden en `docs/ordenes/`. Gemini programa y sube. Claude
verifica y fusiona. Plata, cobros, comida y permisos los escribe Claude.

## Entretenimiento: TERMINADO

## Planificación — pantallas de plata (Claude): CASI TERMINADO

Fusionadas #892 y #893. Lo resuelto: el saldo del cliente ya no depende de qué
pantalla mires, el contrato del salón guarda de verdad (antes se perdía todo),
el contrato de servicio no pisa ediciones sin preguntar y avisa si quedaron
huecos, el plan de pagos controla que las cuotas cubran el total, borrar un
documento pide confirmación, y costos no acepta importes negativos.

**Sin fusionar todavía:** el personal sin categoría ya no aparece como Catering
en servicios contratados. Está en la rama, esperando la verificación.

## Planificación — el resto: A MEDIAS

De 79 pantallas se auditaron unas 30. Gemini tiene los cuatro bloques de
`docs/ordenes/planificacion-02.md` (invitado, impresos, herramientas internas,
pantallas del salón). Todavía no entregó.

## Lo próximo

- **Gemini**: terminar `planificacion-02.md`. Incluye conectar
  `playlist-pantalla`, que ya se decidió que se conecta y no se retira.
- **Claude**: el módulo comercial (presupuestos, CRM, simulador) y el contable
  (facturas, cobros). Ninguno auditado todavía.
