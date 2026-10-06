# En curso: orden 120 (auditoría 70 de Codex, plata)

**6 de octubre de 2026.** Rama `claude/ponte-al-dia-qtrho3` sobre main `6a2143f` (PR 1257),
más la rama documental de Codex `codex/auditoria-simulador-contable-20261006` (informe 70).

## Qué trae

- **COB10:** anotar/borrar/confirmar/rechazar cobros y aprobar/rechazar el pago informado por el
  cliente piden contabilidad.
- **GAS01-03:** gastos con contabilidad (cargar: contabilidad o insumos; sueldos admin sólo con
  sueldos); gasto con llave = número fijo creado una vez; importes y fechas inválidos rechazados.
- **PLAN01:** el plan se guarda sobre el de ese momento, pide recargar si cambió
  (`versionLeida`), no baja lo cobrado ni borra cuotas con cobro.
- **LEDGER01 y pregunta 36 nueva:** libro, revisión de la ficha, saldo guardado tras cambios del
  cliente y contexto del asistente usan el total cobrable con ajuste anual.
- Orden 117 (Gemini) con el tótem de bienvenida interactivo: escanea el QR, "¡Hola, {nombre}!",
  mesa y video. El tótem no marca la llegada (preguntado al dueño, sin respuesta todavía).
- Prueba: `src/__tests__/auditoria-70-contabilidad.test.ts` (15 en rojo con el código viejo).
- **Revisión de toda la plata y el simulador (pedido del dueño):** presupuestos, catálogo y
  ajustes de precio, pagos a proveedores, ganancias, flujo de caja, avisos de pago y deudores
  piden el perfil; saldos con ajuste antes de firmar y en el asistente. Preguntas 36 y 37 nuevas.
  Prueba `revision-de-plata-quien-toca-que` (21 en rojo con el código viejo).
- **El candado de la plata:** `el-candado-de-la-plata.test.ts` frena la publicación si cualquier
  acción toca plata con sólo sesión. Encontró y se cerró: buscar presupuestos ajenos por celular en
  el simulador, el panel con ventas para el operador, `updatePresupuesto`, estadísticas, históricos,
  costos de la fiesta y avisos de saldo. Jest 3.490 en verde.

## Sigue

- Puerta completa → propuesta → fusión en otro paso con `expectedHeadSha`.
- Codex vuelve a mirar SÓLO la orden 120 sobre el SHA fusionado.
- Gemini: orden 117 y 112 B.1 (AUD01). Programa Gemini, decisión del dueño (6/10).
- Límites de Codex que no son defectos: orden 114 (entorno estable), 19 importados, Mercado
  Pago de prueba, catálogo real.

## Cómo se fusiona (error 30)

- Sin `expectedHeadSha` igual al de `.ak-puerta-verde.json`, no se fusiona.
- No cambiar de rama ni `commit -a` mientras corre la puerta.
