# Orden 320 — Auditoría del 18/11/2026 (lo nuevo)

Informe "Auditoría AK - 18 noviembre 2026". Probó sobre la versión principal de la propuesta #1440. Va en la **misma
propuesta** que tus órdenes abiertas (318, 319), al final. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

**Lo que el informe vuelve a marcar y YA ESTÁ PEDIDO (no se repite acá, se hace allá):** N27 empleado (319 bloque 1), F5
precarga del RSVP, F10 contacto al presupuesto, F11 enlace público, O6, O10, O13 (318); N3, N11, N13, N14, N16, N17, N18,
N20, N21, N24, N30, N31, N33, N34 (319).

## Lo que ya arregló Claude (NO rehacer)

- **A18-01:** el plan de pagos (`src/lib/planPagos.ts`) ahora sigue la cláusula 3 del contrato: $10.000 por trimestre, 30% al
  primer tercio, 50% a la mitad y saldo 30 días antes. Antes guardaba $5.000 y 15 días.
- **A18-02:** el anexo del recibo y el editor completan `{{HITO_30}}`, `{{HITO_50}}`, `{{FECHA_SALDO_TOTAL}}` y
  `{{FECHA_FIRMA_TEXTO}}` (`src/lib/contratos/hitos.ts`).
- **A18-03:** el detalle del recibo sale de los mismos cobros que el total (`src/lib/budget/cobros-del-recibo.ts`).
- **N26:** la lista de compras suma el menú asignado aunque la fiesta no tenga presupuesto
  (`catering/lista-compras/page.tsx`); también bebidas y postres, que estaban adentro del mismo bloque.

## Bloque 1 — A18-05: el control remoto del sorteo anuncia un ganador que no estaba en la lista (P1)

`src/app/evento/control-pantalla/[fiestaId]/page.tsx`, `handleSorteo` (~línea 281): toma participantes del muro
(`getMuroParticipantesForSorteo`), si no hay toma autores de fotos y **si tampoco hay, inventa `Mesa 1`…`Mesa 6`**
(~línea 315). Nunca mira la lista que cargó el organizador en `muro-social/page.tsx` (el cuadro "Participantes — uno por
línea"), que vive sólo en la memoria del panel.

1. Al tocar "Transferir a pantalla" en el panel, guardar la lista en la fiesta: campo nuevo
   `socialGallerySettings.sorteoCandidatos?: string[]` (`src/types/fiesta.ts` ~línea 887, junto a `sorteoOnScreen`),
   escrito por `transferSorteoToScreen` (`src/app/actions/fiesta/screen-mode.actions.ts` ~línea 499), que pasa a recibir la
   lista y el premio. Limpiar nombres vacíos y repetidos, tope 500.
2. El control remoto usa `sorteoCandidatos` **primero**. Si no hay lista guardada, **no gira**: cartel "Cargá los
   participantes en el panel del sorteo" y el botón no hace nada. **Se borra el respaldo de `Mesa 1`…`Mesa 6`.**
3. El panel, al abrir, lee `sorteoCandidatos` y vuelve a llenar el cuadro (esto también cierra N31: recargar no pierde la
   lista).
4. El ganador lo elige el servidor de esa lista (en `triggerSorteoWinner` o una acción nueva), no el teléfono: así el panel y
   el control remoto no pueden anunciar a alguien de afuera.

## Bloque 2 — A18-06: el cronograma que cruza la medianoche queda desordenado (P2)

`src/app/(app)/fiestas/nueva/itinerario/page.tsx` ~líneas 340 y 366 ordenan con `a.hora.localeCompare(b.hora)`: Torta 01:00 y
Cierre 04:00 pasan delante de Llegada 18:00. Lo mismo en `orden-de-evento/page.tsx` ~línea 133.

- Función nueva `ordenarPorHoraDelEvento(items, horaInicio)` en `src/lib/fiesta/orden-del-cronograma.ts`: minutos desde el
  inicio, `(min - inicio + 1440) % 1440`. El inicio es `fiesta.configuracion.horaInicio` (`src/types/fiesta.ts` ~línea 154);
  sin hora de inicio, el primer momento cargado.
- Usarla en **todos** los lugares que ordenan el programa: itinerario, orden de evento, vista del cliente en el portal,
  pantalla gigante ("Qué viene ahora") y el PDF. Buscá `localeCompare` con `hora` en `src/` para no dejar ninguno.
- **No tocar** el control de "dos momentos a la misma hora" (~línea 331): anda.

## Bloque 3 — A18-04: el asistente Vendedor no encuentra un prospecto que existe (P2)

`src/lib/multiagent/contexto-negocio.ts` ~línea 63 recorta los prospectos a 12 para el contexto, y no hay herramienta para
buscar. Agregar `buscarProspecto` en `src/lib/assistant/tool-registry.ts` (junto a `crearProspectoTool`, ~línea 185, y en
`TOOL_REGISTRY` ~línea 375): busca por nombre o teléfono sin distinguir mayúsculas ni acentos en **todo** el CRM y devuelve
hasta 10 (nombre, etapa, fecha de la fiesta). **Sólo lee.** Que la vean los perfiles que ya ven el CRM, ni uno más.

## Bloque 4 — Cantidades escritas a mano que no coinciden con la lista

- `src/app/(app)/settings/page.tsx` ~línea 185 y `settings/tareas-automaticas/page.tsx` ~línea 143 dicen "las 4 tareas" y
  la pantalla lista 11. Contar la lista de verdad.
- Conexiones dice 13 y lista 14; agentes dice 5 y muestra 7: buscar esos textos y que salgan de `length`.
- **Mientras el despertador no corra** (`settings/tareas-automaticas`), ninguna tarea dice "Al día": "Sin ejecutar" (esto
  completa N3 de la 319).

## Barrido en toda la app

- **Pregunta 180 (A18-05: un respaldo que inventa candidatos o datos de ejemplo cuando falta lo real):** buscar en `src/`
  listas literales usadas como respaldo (`['Mesa 1'`, `'Ejemplo`, `'Invitado 1'`, `|| [` con texto fijo) en acciones que
  eligen, sortean, cobran o mandan algo. Lo que elige o anuncia con datos inventados se cambia por "no hay datos".
- **Pregunta 181 (A18-06: ordenar horas como texto en eventos de noche):** `localeCompare` sobre campos `hora`/`horaInicio`.
- **Pregunta 182 (A18-03: total y detalle de fuentes distintas):** en recibos, estados de cuenta y reportes, cada total
  tiene que salir de la misma lista que el detalle que muestra al lado.
- Lo de plata, cobros, comida y permisos que encuentres **no lo arregles**: listalo en la propuesta.

## Pruebas que pide

- Sorteo: prueba de Jest que carga A y B, transfiere, y el ganador elegido desde el control remoto es A o B; sin lista, no
  gira. **Que falle si vuelve el respaldo de `Mesa`.**
- Cronograma: 18:00, 20:10, 01:00 y 04:00 quedan en ese orden, en la función y en la pantalla del itinerario.
- Vendedor: con 16 prospectos, `buscarProspecto` encuentra el número 16 por nombre.

```comprobar
archivo: src/lib/fiesta/orden-del-cronograma.ts
usa: ordenarPorHoraDelEvento en src/app/(app)/fiestas/nueva/itinerario/page.tsx
usa: ordenarPorHoraDelEvento en src/app/(app)/fiestas/nueva/orden-de-evento/page.tsx
usa: sorteoCandidatos en src/app/evento/control-pantalla/[fiestaId]/page.tsx
usa: sorteoCandidatos en src/app/(app)/fiestas/nueva/muro-social/page.tsx
usa: sorteoCandidatos en src/app/actions/fiesta/screen-mode.actions.ts
no-usa: 'Mesa 1' en src/app/evento/control-pantalla/[fiestaId]/page.tsx
usa: buscarProspecto en src/lib/assistant/tool-registry.ts
no-usa: las 4 tareas en src/app/(app)/settings/tareas-automaticas/page.tsx
```
