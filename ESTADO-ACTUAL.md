# En curso: devolución de la revisión 69 de Codex (órdenes 118 y 119)

**6 de octubre de 2026.** Rama `claude/ponte-al-dia-qtrho3`, sobre main `feb90f4` (PR 1256 ya
fusionada) más la rama documental de Codex `codex/auditoria-final-feb90f4` (informe 69).

## Qué trae

- **118 (Claude):** "el equipo" de una fiesta es quien tiene algún permiso, y el operador sólo si
  está asignado (`src/lib/auth/equipo-de-la-fiesta.ts`). Aplica a leer, listar, historial, guardar
  entero/parcial y bajar documentos. La fiesta del día y el enlace de la invitación salen sin
  clave del portal ni credenciales. El portal no cambia costos/personal/pagos a proveedores.
- **119 (hecha por Claude, era chica):** el día de la fiesta se cuenta en Uruguay
  (`diaDelEvento`, hasta las 6 del día siguiente sigue siendo hoy); el asistente va arriba de
  WhatsApp y su ventana lo tapa al abrirse.
- Pruebas: `frontera-general-de-fiestas`, `el-portal-cuenta-el-dia-en-uruguay`,
  `tests/e2e/portal-fecha-y-botones.spec.ts`. Las dos de Jest se probaron rompiéndolas.

## Sigue

- Puerta completa → propuesta → fusión en otro paso con `expectedHeadSha`.
- Después: Codex vuelve a mirar SÓLO la frontera de fiestas y el portal (órdenes 118 y 119).
- Gemini: orden 117 (video para cada invitado y lo que falta de 105/106) y 112 B.1 (AUD01).
- Límites que señaló Codex y no son defectos: recorrido amplio en entorno estable (orden 114),
  proveedores reales y ensayo en el salón (al final, decisión del dueño).

## Cómo se fusiona (error 30)

- Sin `expectedHeadSha` igual al de `.ak-puerta-verde.json`, no se fusiona.
- No cambiar de rama ni `commit -a` mientras corre la puerta.
