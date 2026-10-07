# En curso: órdenes 123, 124 y 125 de Codex, en una tanda

**6 de octubre de 2026.** Rama `claude/ponte-al-dia-qtrho3` sobre main `368988b` (PR 1260).
Trae las ramas documentales de Codex `codex/auditoria-integral-20261006` y
`codex/auditoria-73-20261006` (órdenes 122 a 125, evidencias 71 a 74).

## Qué trae (todo con prueba que da rojo con el código viejo)

- **124 A, CAMPO73-RACE:** sin contabilidad, el guardado general de la fiesta toma la plata de la
  fiesta de ese momento, dentro de `actualizarFiesta`.
- **123:** cambiar trago con el enlace del invitado; el reintento devuelve el pedido sólo a su
  dueño; botones de cancelar/cambiar sólo en "nuevo" (decisión del dueño); plantilla del salón
  con escala.
- **124 B y 125:** Galería HD a la galería de la portada (decisión del dueño); glitter en Eventos;
  foto del toro retirada (no hay foto real del glitter bar: falta que la dé el dueño); WhatsApp
  de Privacidad es un teléfono.

## Sigue

- Puerta completa → propuesta → fusión en otro paso con `expectedHeadSha`.
- **Gemini: RED03 (orden 122, nota de Claude al final)**, y 112 B.1 (AUD01).
- Codex vuelve a mirar plata, barra, web y fiesta sobre el SHA fusionado.
- Gemini: orden 126, foto del glitter bar de internet (decisión del dueño, 7/10).
- Pendiente del dueño: ¿el QR del tótem marca llegada? Hoy no.

## Cómo se fusiona (error 30)

- Sin `expectedHeadSha` igual al de `.ak-puerta-verde.json`, no se fusiona.
- No cambiar de rama ni `commit -a` mientras corre la puerta.
