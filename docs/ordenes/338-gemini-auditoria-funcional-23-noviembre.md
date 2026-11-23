# Orden 338 — Auditoría funcional del 23/11/2026: la fiesta equivocada, guardados que no quedan y la presentación LED

**Para Gemini. Una sola propuesta, rama nueva `gemini/orden-338` desde la principal recién actualizada, DESPUÉS de la 337.**
Si un bloque se traba, entregá el resto en la misma propuesta y decí cuál faltó. Antes de decir "terminé", leé
`docs/ANTES-DE-ENTREGAR.md`. Resumen del informe: `docs/auditorias/2026-11-23-funcional.md`.

Claude ya ubicó cada caso en el código (archivo y línea abajo). **Igual abrí el archivo antes de tocar**: las líneas son
aproximadas. Plata y permisos (bloques 5 y 6) los revisa Claude línea por línea.

**No tocar:** el 10% de "Descuento Promocional" que arranca puesto en el presupuesto manual (`crear/page.tsx` ~52-54) es
la promoción del dueño: **no se saca**. Sólo se agrega lo del bloque 4.3. Tampoco el reloj ni los regalos del simulador.

## Bloque 1 — Cada pantalla trabaja con la fiesta de la dirección, nunca con "la actual" (H02, H11)
1. **Video de Vida usa la fiesta de muestra:** `src/components/fiestas/panels/video-vida.tsx` ~129 hace
   `await getFiestaActual()`, que elige sola (hoy, la próxima, o `fiesta_muestra_auditor`) sin mirar la dirección. Leer
   `useSearchParams().get('fiestaId')` y `getFiestaById` como ya hace `servicios-contratados.tsx` ~40-54. **Sin `fiestaId`
   no se elige ninguna**: cartel "Abrí esta pantalla desde una fiesta" con botón a `/eventos`. Todo lo que arma la pantalla
   (enlace al cliente ~205, descarga ~230, vista previa ~315, volver ~321) sale de ese id. La orden 337 bloque 4 nombra
   "Video de vida dentro de la fiesta": es esto, se hace una sola vez.
2. **Control en vivo con `undefined`:** `src/components/panels/fiesta--entretenimiento-control.tsx` ~23-24 toma
   `useParams().id`, pero la pantalla vive en `/fiestas/nueva/show?...&fiestaId=` (sin `[id]` en la ruta). Leer
   `params.id ?? searchParams.get('fiestaId')`. Sin id: el mismo cartel, **nunca** un enlace con `undefined`
   (`/evento/impresion/${fiestaId}` ~207, ~190, ~250). Subir el contraste del título.
3. **Mismo caso que encontró el escaneo:** `src/components/panels/portal--videos-invitados.tsx` (`params.id as string`).
   Mirá si se abre en una ruta sin `[id]`; si sí, igual que el punto 2.
4. **Las otras tres solapas de la barra de entretenimiento** (`fiesta--barra-tecnologica.tsx`, `--pantallas-totem.tsx`,
   `--zona-digital.tsx`) se montan igual sin props (`entretenimiento.tsx` ~2733): confirmá que lean el id de la dirección.

## Bloque 2 — Lo que dice "guardado" tiene que quedar guardado (H06, H07)
1. **Carta de tragos:** `src/components/fiestas/panels/carta-tragos.tsx` ~168-182 muestra "¡Guardado!" y al recargar el
   trago personalizado no está. El servidor es `updateCartaTragos` en `src/app/actions/fiesta/fiesta.actions.ts` ~1663:
   lee la fiesta entera fuera del turno y la guarda entera con `saveFiesta`. **Medí primero** (prueba contra el emulador:
   guardar, volver a leer con `getFiestaParaPantalla`, comparar) y recién ahí arreglá la causa; guardá sólo `cartaTragos`
   con `mutarFiesta`/guardado parcial dentro del turno. Que pida el permiso del módulo, no sólo sesión.
2. **"+ Trago Personalizado" agrega antes de confirmar:** ~269-283 mete un "Destornillador" en la lista y abre el diálogo;
   "Cancelar" (~367) sólo cierra. El trago nuevo vive en el diálogo y entra a la lista **sólo** al tocar "Guardar trago".
3. **Lista de carga:** `src/components/fiestas/panels/carga-operativa.tsx` ~390-431 (`persistItemPatch`) y
   `src/app/actions/fiesta/carga-operativa.actions.ts` ~124-181. El `catch` vacío de la transacción (~168) tapa el error
   real y cae a `saveFiesta`. Que el motivo llegue a la pantalla (con el número de error como en el muro). El cartel fijo
   **"Tildes sincronizadas online"** (~1078) pasa a depender del último guardado: "Guardado", "Guardando…" o "No se
   guardó: <motivo>". El contador y la tilde tienen que decir lo mismo que la base después de recargar.

## Bloque 3 — Pantallas que se caen o se vacían (H08, H09, H15)
1. **Alertas de Mi Día revienta:** `src/app/actions/alertas.actions.ts` ~111 pone `fiestaId: ''` a las alertas de
   "Plata y agenda", y `src/components/panels/mi-dia--alertas.tsx` ~365 arma `<SelectItem value={id}>` con esa lista. Usar
   un valor fijo (`'__sin_fiesta__'`) para esas alertas y filtrar vacíos antes del `map`. El escaneo 221 encontró la misma
   forma en `aprobaciones/page.tsx`, `InvitacionConfigPanel.tsx` y `ScreenPlaylistAdmin.tsx`: mirá cada uno.
2. **Clientes "no se pudieron cargar":** `src/app/(app)/customers/page.tsx` ~135 hace `Promise.all([getCustomers(),
   getAllFiestas()])`: si falla la de fiestas, se pierde también la lista de clientes. Cargar las dos por separado; la de
   clientes con `readDataConDetalle` (`src/lib/data-service.ts` ~154) para distinguir "no hay" de "no se pudo leer", y un
   cartel con botón "Reintentar" en vez de la lista vacía.
3. **Biblioteca global del muro:** `src/components/fiestas/panels/muro-social.tsx` ~416-425 y
   `src/app/actions/fiesta/screen-mode.actions.ts` ~421: recorre **todas** las fiestas para juntar medios. Que una fiesta
   rara no tumbe la biblioteca (saltearla y anotarla), y que el aviso diga el motivo además del número.

## Bloque 4 — La presentación LED y el presupuesto manual (H03, H04, H05, H13)
1. **El PDF sale cortado:** `src/app/(app)/presupuestos/[id]/ver/page.tsx` ~309-330 usa `pdf.html(...)` con
   `width: 186` y `windowWidth: 1024` sobre `BudgetDocument` (`src/components/budget/BudgetDocument.tsx` ~248), que no
   tiene ancho fijo. Fijar el ancho del documento al imprimir (por ejemplo 794 px = A4 a 96 ppp) y que `windowWidth`
   coincida, o pasar a html2canvas por página. **La prueba descarga el PDF y lo mira** (bloque comprobar): 1, 5 y 30
   renglones, nombre largo, notas, descuento y regalo, todo dentro de la página y sin páginas vacías. El mismo patrón está en
   `src/app/simulador-ak/page.tsx` ~888-895: arreglalo igual.
2. **"Ver galería" borra la propuesta:** `src/app/presentacion-led/slides/entradas-slide.tsx` ~52-59 (y `regalos-slide.tsx`
   ~69, `menu-adulto-slide.tsx` ~56, `menu-adolescente-slide.tsx` ~52) hacen `window.location.assign('/galeria-led?...')`,
   que `next.config.js` ~362 redirige a `/presentacion-led`. La página (`src/app/presentacion-led/page.tsx`) guarda en
   `sessionStorage` `presentacion_cliente_data`, `presentacion_servicios_seleccionados` y `presentacion_menu_*` (~564-588)
   pero **no los vuelve a leer** al montar (sólo lee `presentacion_entradas_seleccionadas` ~552), ni
   `presentacion_slide_regreso`. Lo más limpio: abrir la galería **adentro** de la presentación (ya existen `galleryOpen` y
   `galleryCategoria` ~180-181) sin salir de la página. Y además, al montar, restaurar lo guardado.
3. **"Plan de Pagos" abre otro borrador:** `handlePlanPagos` (~610-615) manda sólo `cliente` y `fecha`, que
   `presupuestos/nuevo/crear/page.tsx` no lee (no hay `searchParams.get('cliente')`, y `fecha` sólo se aplica con
   `hasPlannerParams`), así que gana el borrador viejo de `sessionStorage` `presupuestoEnProgreso_v3` (~31, ~61-70). Que
   "Plan de Pagos" transfiera **lo mismo** que "Generar Presupuesto Manual" (~589-603: `leadName`, `fecha`, `adultos`,
   `ninos`, `servicios`, `entradas`, `menuId`…). Si hay un borrador guardado **y** llegan datos nuevos, preguntar:
   "Tenés un presupuesto a medio hacer de <nombre>. ¿Seguís con ése o empezás con esta propuesta?". Nunca pisarlo en silencio.
   En el resumen del manual, cuando el descuento promocional está puesto, mostrar la línea "Descuento promocional 10%"
   bien visible (no se saca, se explica).
4. **La fecha aparece un día antes:** `crear/page.tsx` ~299 hace `new Date(fechaParam)` con `AAAA-MM-DD`. Usar
   `parseUruguayDate` de `src/lib/utils.ts` ~56.

## Bloque 5 — Finanzas que dicen cero cuando falló (H10) — plata: lo revisa Claude
1. `src/app/actions/reportes.ts` ~369-370: el `catch` de `getProfitAndLossData` devuelve siempre "Fallo al consolidar el
   reporte contable global." Que devuelva el motivo (sin datos privados) y un número para buscarlo en el registro; si
   falta permiso, que lo diga como tal.
2. `src/components/contabilidad/panels/finanzas.tsx` ~74: `getPresupuestos(true).catch(() => [])` deja el tablero en cero
   sin aviso. Si falla, el tablero muestra "No se pudieron leer los presupuestos" y **ningún número**, nunca un cero.
3. Rentabilidad de la fiesta con catering en cero: `src/app/actions/fiesta/costos.actions.ts` ~57-81 suma catering sólo
   si hay `menuAsignadoId` y el menú existe. Si la fiesta tiene presupuesto con comida y no hay menú asignado, mostrar
   "Catering sin costo cargado: asigná el menú" en vez de un 0 que parece real.
4. **Lista de compras con "gas 6.650 unidades / $6.650.000":** `src/components/panels/catering--lista-compras.tsx`
   ~132-175 multiplica cada ingrediente por invitados en cada receta. Un insumo que es "por evento" (gas, carbón) no se
   multiplica por invitados ni por receta. Confirmá en `src/data/insumos.json` qué campo distingue (si no hay, que el
   insumo lo tenga) y que la prueba arme 22 recetas con gas y dé una cantidad razonable.

## Bloque 6 — Accesos y lo de prueba que se ve en público (H01, H12) — permisos: lo revisa Claude
1. **Mi Mesa arma un enlace con la credencial vacía:** `src/app/evento/mi-mesa/[fiestaId]/page.tsx` ~134-138. Sin
   credencial guardada **no** se arma el enlace al hub: se muestra "Para entrar a la fiesta abrí tu invitación (WhatsApp o
   correo)". No devolver la credencial desde `searchPublicGuestTable` (`src/app/actions/public-guest-portal.ts` ~202).
2. **Lo de prueba se ve en la presentación LED:** el menú de prueba del auditor quedó visible para cualquiera. Los menús y
   servicios del catálogo necesitan estado "borrador / publicado" (o reusar el que exista: buscá `publicado`/`activo` en
   `src/types`) y lo público (presentación LED, simulador) muestra **sólo** lo publicado. Lo nuevo nace en borrador.
3. **Borrar un menú en uso:** `src/app/actions/menus-catering.ts` ~267-288 (`comprobarUso`) frena si un presupuesto o fiesta
   lo usa; el cartel tiene que decir **cuáles** (número de presupuesto y nombre de la fiesta), no "N presupuestos".
4. **Quitar un plato se revierte al recargar:** `menus--catalogo.tsx` ~225-246 y `saveMenuInterno` ~196-244. Mirá la
   memoria intermedia `cachedMenus` (~28) y que `invalidateMenusCache()` se llame con `await` (~201, 240, 255, 260, 298,
   303, 313). Prueba contra el emulador: quitar, volver a leer, el plato no está.

## Bloque 7 — Señales menores del informe
- El literal `{SENIA}` se ve en la presentación LED: `src/app/presentacion-led/slides/cierre-slide.tsx` ~330-336 pinta
  `faq.answer` sin reemplazar; hacer lo mismo que `src/app/public/[eventType]/page.tsx` ~83 con la seña de Ajustes. Ojo
  con `src/__tests__/la-sena-y-los-paquetes-dicen-lo-de-ajustes.test.ts` ~21, que espera el marcador en el catálogo (queda).
- Personal: "Añadir Personal Extra Manual" (`src/components/fiestas/panels/personal.tsx` ~357-366) crea un puesto sin
  persona y dispara la sincronización con Google con correos (`personal.actions.ts` ~116). Un puesto sin persona no manda
  correos.
- Botones de invitados que son sólo un ícono: que tengan texto o `aria-label`. Un nombre de fiesta largo no empuja los
  controles (cortar con `truncate`).

## Barrido en toda la app
- **Pregunta 218 (la fiesta de la dirección):** el escaneo `node scripts/las-formas-que-mienten.mjs --todo` marca
  `video-vida.tsx`, `fiesta--entretenimiento-control.tsx` y `portal--videos-invitados.tsx`: tiene que dar 0.
- **Pregunta 219 (agregar antes de confirmar):** buscar `handleAdd` / `addNew` que hacen `setX([nuevo, ...prev])` y abren un
  diálogo; cada uno entra a la lista sólo al confirmar.
- **Preguntas 220, 221, 222, 223 y 224:** el mismo escaneo, en 0 (carga operativa; los cuatro `SelectItem`; `cierre-slide`;
  `crear/page.tsx`; `mi-mesa`).
- **Pregunta 225 (lo guardado para volver, ¿se lee?):** cada `sessionStorage.setItem('clave'` de `src/` tiene su `getItem`
  con la misma clave; listar los que no y arreglarlos.
- **Pregunta 226 (lo de prueba en lo público):** cada lista que se ve sin sesión (simulador, LED, portada, `/public/*`)
  filtra borradores y fiestas de muestra.

```comprobar
no-usa: await getFiestaActual(); en src/components/fiestas/panels/video-vida.tsx
usa: searchParams en src/components/panels/fiesta--entretenimiento-control.tsx
no-usa: Tildes sincronizadas online en src/components/fiestas/panels/carga-operativa.tsx
no-usa: fiestaId: '' en src/app/actions/alertas.actions.ts
usa: parseUruguayDate en src/app/(app)/presupuestos/nuevo/crear/page.tsx
usa: SENIA en src/app/presentacion-led/slides/cierre-slide.tsx
no-usa: Fallo al consolidar el reporte contable global en src/app/actions/reportes.ts
no-usa: getPresupuestos(true).catch(() => []) en src/components/contabilidad/panels/finanzas.tsx
no-usa: &token=${encodeURIComponent(token)} en src/app/evento/mi-mesa/[fiestaId]/page.tsx
usa: readDataConDetalle en src/app/actions/customers.ts
usa: presentacion_cliente_data en src/app/presentacion-led/page.tsx
usa: leadName en src/app/presentacion-led/page.tsx
archivo: src/components/fiestas/panels/carta-tragos.tsx
archivo: src/app/actions/fiesta/carga-operativa.actions.ts
archivo: src/components/fiestas/panels/muro-social.tsx
archivo: src/app/(app)/presupuestos/[id]/ver/page.tsx
archivo: src/app/simulador-ak/page.tsx
archivo: src/app/actions/fiesta/costos.actions.ts
archivo: src/components/panels/catering--lista-compras.tsx
archivo: src/app/actions/menus-catering.ts
archivo: src/components/panels/menus--catalogo.tsx
archivo: src/components/fiestas/panels/personal.tsx
archivo: src/components/panels/portal--videos-invitados.tsx
prueba: tests/e2e/cada-pantalla-usa-la-fiesta-de-la-direccion.spec.ts
prueba: tests/e2e/la-presentacion-led-no-pierde-la-propuesta.spec.ts
prueba: tests/e2e/el-pdf-del-presupuesto-entra-en-la-hoja.spec.ts
prueba: tests/firebase/carta-tragos-y-carga-se-guardan.test.ts
prueba: tests/firebase/quitar-un-plato-queda.test.ts
prueba: src/__tests__/auditoria-338-plata-y-lo-publico.test.ts
archivo: docs/auditorias/2026-11-23-funcional.md
```
