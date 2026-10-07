# Orden 128 hecha (auditoría 78 de Codex): cuatro fallos de recorridos reales

**7 de octubre de 2026.** Rama `claude/app-debug-stabilize-m70e6z` (PR 1266), sobre main
`09051f8` más la rama documental de Codex `codex/auditoria-78-20261007`.

## Qué trae (todo con prueba que da rojo con el código viejo)

- **A:** el simulador guarda los platos CON MESA BUFET (`agregarVariantesBufet`, usada al mostrar
  y al guardar).
- **B:** el cliente abre su presupuesto con el enlace del PDF sin cuenta del equipo; la pantalla
  distingue "no se pudo cargar" de "este enlace no abre".
- **C:** el portal del cliente cuenta personas con acompañantes, como el centro del equipo.
- **D:** la fecha de la fiesta va en `eventDate`; ya no aparece como cita en el CRM ni en la
  agenda. Registros viejos sin migrar (no se sabe cuáles eran citas).
- Antes, ese mismo día: 1262 (WhatsApp), 1264/1265 (foto del bufet), 1263 (Instagram y
  transacciones repetidas).

## Sigue

- Fotos: decisión del dueño, si no hay foto va una de ejemplo. No se le vuelven a pedir.

- Puerta completa → fusión en otro paso con `expectedHeadSha`.
- Codex vuelve a probar SÓLO lo de la orden 128 sobre el SHA fusionado.
- Gemini: 112 B.1 (AUD01).

## Cómo se fusiona (error 30)

- Sin `expectedHeadSha` igual al de `.ak-puerta-verde.json`, no se fusiona.
- No cambiar de rama ni `commit -a` mientras corre la puerta.
