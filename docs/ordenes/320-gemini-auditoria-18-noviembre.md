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
- **C18-01 (continuación del informe):** el sueldo cargado a mano en Personal entra en la ganancia aunque la fiesta no tenga
  presupuesto ni se haya sincronizado (`calcularGananciaDeEvento` recibe `fiesta.personalAsignado` en todas las pantallas).
- **Mantenimiento:** el gasto automático queda en el día elegido (mediodía de Uruguay), no el día anterior.
- **C18-03 (novedades de las 11:46):** el reporte de ganancias rechaza un período con el inicio después del fin, y el
  título del resumen dice el período que se calculó, no el que está elegido en los filtros.
- **M3:** "Política de Señas" ya lleva a `/settings/budget-display` (vino en tu 1429).
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

## Bloque 5 — Continuación del informe (18/11): fiestas suspendidas, galería y avisos del portal

- **C18-02:** `src/app/recursos-multi-evento/page.tsx` cuenta las fiestas **suspendidas** como próximas y en "Fechas con
  Múltiples Eventos". Excluirlas de próximos, coincidencias y disponibilidad (mismo criterio que usa la lista de fiestas para
  no mostrarlas); un filtro "Ver suspendidas" si hace falta mirarlas. Buscá en `src/` las demás listas de "próximos" y
  conflictos de personal o stock que no filtren suspendidas, y aplicá lo mismo.
- **M1 Galería** (`/empresa/galeria`, pestaña "Por tipo de fiesta"): seis fotos con tipo "General" no aparecen en el grupo
  General (aparecen en "Todas"). Agrupar por el mismo valor normalizado que muestra la etiqueta, y que la suma de los grupos
  dé el total.
- **M2 Estilo de fotos** (`/settings/estilo-fotos`): el "Antes/Después" cambia degradados, no fotos. Poner fotos de ejemplo
  reales (regla del dueño: si no hay foto, va una de ejemplo del tema), el mismo encuadre antes y después.
- **Avisos de pago del portal:** el aviso que informa el cliente desde su portal (`clientPaymentNotifications` de la fiesta,
  `submitClientPayment` en `src/app/actions/fiesta/portal.actions.ts` ~línea 474) sólo se ve en el plan de pagos de esa fiesta.
  Que `/pagos-rapidos` muestre arriba "Pagos informados por clientes" (los `estado: 'pendiente'` de todas las fiestas) con el
  enlace a `/fiestas/nueva/plan-pagos?fiestaId=…`, donde ya se aprueban. **No agregues un botón de aprobar en otro lado:**
  aprobar sigue donde está. Pide el permiso de plata que ya pide Pagos rápidos.

## Bloque 5b — La pantalla en vivo con dos estados vacíos (C18-04, novedades de las 11:46)

`/evento/muro-en-vivo/[fiestaId]`: con el muro apagado, la lista pausada en un turno de Juego y ningún juego activo, se dibujan
a la vez "El muro de fotos está apagado" y "Zona de juegos", uno encima del otro. Que se vea uno solo (prioridad: muro
apagado) o cada uno en su lugar. Probar las cuatro combinaciones: con y sin juego, muro prendido y apagado. Y en el panel
lateral, terminada una trivia, que diga "Finalizado" en vez de dejar la pregunta.

## Bloque 6 — AK Editor (`herramientas/ak-editor/`): que cada botón diga la verdad

Lo probó con material inventado (sin red ni datos reales). Prioridad en este orden:

1. **E20:** "Volver al original" borra también los ajustes que el dueño ya tenía en el `.xmp` (Exposure2012, Contrast2012…).
   Antes de procesar, guardar copia del `.xmp` original; volver al original restaura esa copia, no borra por nombre.
2. **E1:** Video de Vida falla con `'str' object has no attribute 'get'`: `app.py` (~880/893) pasa a `exportar_video_de_vida`
   el diccionario entero de `ordenar_fotos_vida` y no la lista `fotos_ordenadas`.
3. **E2/E3:** el modo automático dice "completado con éxito" aunque Vida o Redes fallen (Redes llama
   `generar_videos_redes(carpeta_origen=…, nombre_evento=…)` con nombres que no existen y el error se traga con `print`).
   Cada paso que falla queda como falla en el resumen; "Se generaron 0 videos" no es éxito.
4. **E4:** el MP4 sale desincronizado: la cámara lenta (`setpts=1.4*PTS`) estira la imagen y no el audio, y un clip mudo
   borra el audio de esa parte. Estirar el audio igual (`atempo`) o cortarlo a la duración, y poner silencio al clip mudo.
5. **E5:** `GET /api/fotos/estado` se rompe al pasar una fecha a JSON y la pantalla queda en "Procesando 1/10" para siempre.
6. **E6:** `cv2` sin importar en `app.py` ~línea 78 (vista comparativa).
7. **E17:** el modo Boda no hace la pantalla partida ni respeta las carpetas `el/`, `ella/`, `juntos/`; la pantalla no le
   pasa el modo a `ordenar_fotos_vida`. Que haga lo que dice o que la opción diga lo que hace.
8. **E18:** foto con orientación EXIF 6 sale girada dos veces. Fijar la versión de OpenCV en `requirements.txt` y rotar una sola vez.
9. **E8 y E9:** validar el nombre del evento (sin `../`, no vacío) y escuchar en `127.0.0.1` (`app.py` ~línea 1877), no en
   `0.0.0.0`: el programa no pide clave.
10. **E7, E11, E12, E13, E19, E21, E23:** archivo roto avisado en Revisión; "Aprender estilo" con ruta vacía no es `ok`; las
    transiciones elegidas se aplican en el MP4; el desplegable ofrece sólo plantillas que existen (y las 11 que existen se
    pueden elegir); el texto de cierre no se corta; con música no se corta la última foto ni el cierre; foto sin fecha va a
    "sin fecha"; el `.zip` temporal se borra.
11. **E15:** el modo automático tiene botón y explicación en la pantalla, o no se ofrece.

Después de tocar el editor: `npm run editor:empaquetar` (el ZIP que se descarga tiene que ser el nuevo).

## Barrido en toda la app

- **Pregunta 180 (A18-05: un respaldo que inventa candidatos o datos de ejemplo cuando falta lo real):** buscar en `src/`
  listas literales usadas como respaldo (`['Mesa 1'`, `'Ejemplo`, `'Invitado 1'`, `|| [` con texto fijo) en acciones que
  eligen, sortean, cobran o mandan algo. Lo que elige o anuncia con datos inventados se cambia por "no hay datos".
- **Pregunta 181 (A18-06: ordenar horas como texto en eventos de noche):** `localeCompare` sobre campos `hora`/`horaInicio`.
- **Pregunta 182 (A18-03: total y detalle de fuentes distintas):** en recibos, estados de cuenta y reportes, cada total
  tiene que salir de la misma lista que el detalle que muestra al lado.
- **Pregunta 187 (C18-01: un costo cargado en una pantalla que la cuenta sólo ve después de "sincronizar"):** buscar en
  `src/` totales guardados (`total…Cost`, `totalPagado`) que se muestren sin recalcular desde el dato. Plata: me lo listás.
- **Pregunta 188 (C18-02: una fiesta suspendida contada como activa):** toda lista de próximos, conflictos o disponibilidad.
- **Pregunta 190 (C18-03: un período, rango o filtro imposible que se calcula igual):** buscar en `src/` las pantallas con
  "desde"/"hasta" o `startDate`/`endDate` que generan o exportan sin comparar las dos fechas.
- **Pregunta 189 (E2/E3: un proceso de varios pasos que dice "listo" si un paso falló):** en el editor y en las tareas
  automáticas de la app (`src/lib/cron`, `src/app/api/cron`).
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
no-usa: "0.0.0.0" en herramientas/ak-editor/app.py
usa: clientPaymentNotifications en src/app/(app)/pagos-rapidos/page.tsx
usa: suspendid en src/app/recursos-multi-evento/page.tsx
```
