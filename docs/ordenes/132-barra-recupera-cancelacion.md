# 132. Barra: recuperar la cancelacion cuando se corta la respuesta

**HECHA el 9/10/2026 por Claude (arreglo chico): `handleCancel` y `submitOrder` con catch/finally, prueba `tests/e2e/barra-recupera-cancelacion.spec.ts`. Ver YA-RESUELTO.**

**NO CONTRASTADO CON LA TANDA DE PROGRAMACION EN CURSO.** Al consultar GitHub
solo esta abierta PR 1273, documental. No consta el HEAD de los cambios locales
que Claude/Gemini estan preparando. Contrastar antes de programar; no duplicar
si ya lo corrigieron.

Main contrastado: `1b57abbec5162402cc30269cc276398707b28d55`, fetch 9/10/2026.
Actualizacion al entregar: PR 1273/1274 fusionadas por otra sesion; main final
`eef90bd3874f80df5ec3564dc96fff5e4cb6df0d`. MiniQuiosco y acciones de barra sin
cambios, por lo que el defecto causal permanece. El consumidor incorporo solo
normalizacion WhatsApp y desplazo una linea: montaje actual en 848.
Ejecucion UI: copia aislada compilada `497ee725cb4d8cce6d1c97422fd674cbbe86c051`.
MiniQuiosco, consumidor y acciones de barra no cambiaron entre esos SHAs.
Evidencia: `docs/evidencias/82-pendientes-y-recorridos.md`.

## Gemini - BAR82-CANCEL, P2, defecto reproducido

Archivo real: `src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx`.
`handleCancel`, lineas 117-126; boton conectado en linea 185.
El consumidor `page.tsx` lo importa en 64 y monta en 847.

Reproduccion: invitado con permiso valido y pedido NUEVO real en el emulador
`bar_drink_orders`; abrir Carta de tragos, Cancelar, cortar SOLO esa solicitud.
Las lecturas posteriores siguen habilitadas y el pedido sigue NUEVO. El control
queda disabled con el indicador girando. Sonda estricta falla precisamente en
`toBeEnabled`, no en login, semilla o carga del pedido. Resultado y captura en 82.

Causa: si `cancelBarDrinkOrder` rechaza su promesa, no se alcanza
`setIsCanceling(null)`. No hay catch/finally en ese handler.

Correccion acotada, sin cambiar la regla del negocio:
- Capturar rechazo/transporte y mostrar un aviso comprensible.
- Liberar el indicador SIEMPRE, incluso si falla la recarga posterior.
- No afirmar cancelado si no se recibio confirmacion. Consultar el estado actual
  antes de permitir un nuevo intento cuando el servidor pudo guardar el cambio.
- Conservar identidad del invitado, permisos, stock y la prohibicion de cambiar
  o cancelar un pedido PREPARANDO. No modificar estas reglas ni la contabilidad.

Prueba propuesta PENDIENTE: incorporar/adaptar la sonda de auditoria
`docs/evidencias/82-barra-corte.spec.ts` a
`tests/e2e/barra-recupera-cancelacion.spec.ts`. No existe aun en Git como prueba
de producto. Debe fallar con el codigo actual y pasar con la correccion.
Comprobar tambien corte despues de guardar, reintento sin doble devolucion de
stock y controles correctos en PC/movil. Claude compila y registra SHA/resultado.

## No repetir y no sobreinterpretar

Las cuatro pruebas normales con base emulada PASARON: cancelacion NUEVO
persistida y ausencia de controles en PREPARANDO, PC/movil. Los cuatro fallos
de `barra-72-pedido-propio-y-estado.spec.ts` se debieron a sembrar solo JSON
mientras la pantalla leia Firestore. Adaptar esa semilla si se usan emuladores;
no cambiar el lector de produccion para hacer pasar un test mal preparado.

El mapa del contador YA se amplio en PR 1274. El inventario completo y la sonda
de `82-mapa-cobertura.json` son HISTORICOS de 1b57, no defectos actuales sin
contraste. No crear otra implementacion ni rehacer ordenes 130/131.

```comprobar
archivo: src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx
usa: MiniQuiosco en src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx
prueba: tests/e2e/barra-recupera-cancelacion.spec.ts
```
