# 224 - Gemini: factura ausente no puede quedar cargando (era la 221-claude de Codex; es pantalla, va a Gemini)

NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Verificar antes de programar
que no exista un arreglo privado activo de este mismo estado.

## Fuente y defecto P2 comprobado

Fuente ejecutada:3e45a4ac6b479f89605163168e31b37dc84f2d0f.
PR1353 publica3f9460185143ef034dcd713e975d2a0af5e20f1a conserva identicos
src/app/(app)/invoices/[id]/page.tsx,actions/invoices.ts yactions/settings.ts.
No se acepta toda la candidata por ese contraste.

345 ejecuta ViewInvoicePage real en ReactDOM/jsdom con lecturas controladas:

- ControlPASS: si getInvoiceById sigue pendiente, aparece la carga.
- CriterioFAIL: si termina normalmente devolviendo null y las otras lecturas
  tambien terminaron, el componente sigue mostrando Loader2 indefinidamente.
- Las tres lecturas fueron llamadas una vez; no hubo excepcion ni toast.
  El fallo es la asercion de que ya no debe quedar animate-spin, no un import,
  una espera de captura o un timeout del equipo.1PASS/1FAIL,una causa.

La condicion actual isLoadingInvoice||!invoice||!templateSettings confunde
"todavia leyendo" con "ya termino sin factura". Esto explica un estado real
mal resuelto del componente, pero NO demuestra que el presupuesto/factura de
un cliente real haya desaparecido ni que haya un error en los importes.
La apertura generica previa sin cuerpo, por si sola, no daba esa prueba causal.

## Correccion acotada

- Separar carga, resultado ausente/no disponible y error de lectura.
- Mostrar un estado legible con Volver y Reintentar cuando corresponda.
  Mantener el recorte de permisos: no revelar datos de una factura ajena.
- No cambiar cobros, saldos, cuotas, moneda, redondeos ni reglas de acceso.
- Probar lectura pendiente, null resuelto, rechazo de lectura y factura valida.
  Comprobar que el reintento deja la pantalla utilizable, sin duplicar pagos.
- Usar345-factura-ausente.test.tsx como reproduccion; no borrar su caso fallido
  ni arreglarlo relajando la asercion. La prueba de regresion de la app todavia
  debe crearse/ejecutarse porClaude. No es un arreglo hecho porCodex.

La bateria existente321 sigue siendo834suites/5136PASS en3e.345 es una sonda
nueva y focal, no un cambio del resultado historico ni una aceptacion de3f.

## Ampliación de Claude (barrido de la pregunta 19, 24/10/2026)

La misma forma está en **14 pantallas**. En todas, el spinner se muestra con "cargando **o** no hay dato".
Cuando la lectura termina sin dato, o falla, la pantalla gira para siempre:

- `src/app/(app)/invoices/[id]/page.tsx` ~137: `isLoadingInvoice || !invoice || !templateSettings`; la que encontró Codex.
- `src/app/(app)/fiestas/nueva/carta-tragos/page.tsx` ~276: `isLoading || !fiesta`; el `if (error)` está después del spinner y nunca se alcanza.
- `src/app/(app)/fiestas/nueva/carteleria/page.tsx` ~472: `isLoading || !fiesta`; igual: el `if (error)` queda después.
- `src/app/(app)/fiestas/nueva/menu-mesa/page.tsx` ~160: `isLoading || !fiesta`; igual: el `if (error)` queda después.
- `src/app/(app)/fiestas/nueva/invitados/page.tsx` ~311: `isLoading || !fiesta`; el catch sólo avisa.
- `src/app/(app)/fiestas/nueva/muro-social/page.tsx` ~1101: `isLoading || !fiesta`; el catch sólo avisa.
- `src/app/(app)/fiestas/nueva/en-vivo/page.tsx` ~166: `isLoading || !fiesta`; el catch sólo avisa.
- `src/app/(app)/fiestas/nueva/modulo-invitado/page.tsx` ~177: `isLoading || !fiesta`; el catch sólo avisa.
- `src/app/(app)/fiestas/nueva/pantallas-totem/page.tsx` ~232: `isLoading || !fiesta`; con fiesta null queda girando.
- `src/app/(app)/fiestas/nueva/gestion-documental/page.tsx` ~152: `isLoading || !fiesta`; con fiesta null queda girando.
- `src/app/(app)/settings/contenido-publico/page.tsx` ~198: `loading || !presentacion || !catalogo`; si falla la lectura.
- `src/app/(app)/settings/contratos/clausulas/page.tsx` ~123: `isLoading || !settings`; si falla la lectura.
- `src/app/(app)/settings/whatsapp/page.tsx` ~119: `isLoading || !settings`; si falla la lectura.
- `src/app/(app)/settings/whatsapp-templates/page.tsx` ~122: `isLoading || !templates`; si falla la lectura.

Arreglo igual en las 14, con el orden: (1) `if (cargando)` → spinner; (2) `if (error || !dato)` → cartel en
criollo ("No encontramos esta fiesta" / "No se pudo cargar") con **Volver** y **Reintentar**; (3) la
pantalla. Para las de fiesta hay un componente que ya hace el cartel: `EventSelectionRequired` (lo usa
`invitados/page.tsx` arriba); si no sirve para "no encontrada", armá uno solo y usalo en todas.

Prueba en `src/__tests__/factura-ausente-no-queda-cargando.test.tsx`: la factura con `getInvoiceById` en
null deja de girar y muestra el cartel. Sumá un caso de fiesta con `getFiestaById` en null, para tres
de las pantallas (carta de tragos, invitados y pantallas del tótem).

```comprobar
archivo: src/app/(app)/invoices/[id]/page.tsx
usa: ViewInvoicePage en src/app/(app)/invoices/[id]/page.tsx
no-usa: if (isLoadingInvoice || !invoice || !templateSettings) en src/app/(app)/invoices/[id]/page.tsx
no-usa: if (isLoading || !fiesta) en src/app/(app)/fiestas/nueva/carta-tragos/page.tsx
no-usa: if (isLoading || !fiesta) en src/app/(app)/fiestas/nueva/carteleria/page.tsx
no-usa: if (isLoading || !fiesta) en src/app/(app)/fiestas/nueva/menu-mesa/page.tsx
no-usa: if (isLoading || !fiesta) en src/app/(app)/fiestas/nueva/invitados/page.tsx
no-usa: if (isLoading || !fiesta) en src/app/(app)/fiestas/nueva/muro-social/page.tsx
no-usa: if (isLoading || !fiesta) en src/app/(app)/fiestas/nueva/en-vivo/page.tsx
no-usa: if (isLoading || !fiesta) en src/app/(app)/fiestas/nueva/modulo-invitado/page.tsx
no-usa: if (isLoading || !fiesta) en src/app/(app)/fiestas/nueva/pantallas-totem/page.tsx
no-usa: if (isLoading || !fiesta) en src/app/(app)/fiestas/nueva/gestion-documental/page.tsx
no-usa: if (loading || !presentacion || !catalogo) en src/app/(app)/settings/contenido-publico/page.tsx
no-usa: if (isLoading || !settings) en src/app/(app)/settings/contratos/clausulas/page.tsx
no-usa: if (isLoading || !settings) en src/app/(app)/settings/whatsapp/page.tsx
no-usa: if (isLoading || !templates) en src/app/(app)/settings/whatsapp-templates/page.tsx
prueba: src/__tests__/factura-ausente-no-queda-cargando.test.tsx
```
