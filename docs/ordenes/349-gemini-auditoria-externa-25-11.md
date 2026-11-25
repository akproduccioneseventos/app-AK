# Orden 349 — Lo que encontró la auditoría externa del 25/11 (sin lo de plata)

**Para Gemini. Va en la MISMA propuesta que la 346, 347 y 348 (rama `gemini/orden-346`).** Si un bloque se traba, entregá
el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

## Por qué
El auditor externo recorrió la app publicada el 25/11 (informe "Auditoría app AK 25 nov"). **Lo de plata (hallazgos 3, 4 y
5: precio del Club Uruguay, presupuestos aceptados sin fiesta, cifras del panel contable) es de Claude: no lo toques.** El
simulador de tres pasos (hallazgo 9) y "Ver galería" que volvía a la portada (hallazgo 2) ya vienen en tu entrega de la
343-345: comprobá que sigan andando, no los rehagas.

## Bloque 1 — La presentación LED no muestra pruebas ni cifras inventadas
1. **Un plato sin precio ni servicio no aparece en la LED pública** (hallazgo 1: "PRUEBA Plato sin servicio 23NOV" salía
   primero y "Recomendada"). En `src/app/presentacion-led/page.tsx`, al armar las entradas y los menús, dejá afuera los
   platos sin precio por persona y los que no están publicados. "Recomendada" sólo para un plato con foto y precio.
2. **"Más de 500 familias eligieron AK"** (`src/app/presentacion-led/slides/testimonios-slide.tsx` ~68) es una cifra
   inventada: va **"+200 fiestas"**, como en el resto de la app.

## Bloque 2 — Textos y avisos que no cierran
1. `src/app/simulador-de-presupuesto/page.tsx` ~185: "Mas de 4 horas" → "Más de 4 horas". ~3206: "Elegí tus servicios para
   ver el total" no puede salir en el paso donde todavía no hay servicios para elegir.
2. `src/app/not-found.tsx` ~50: "Esta pagina no existe" → "Esta página no existe".
3. Centro de la fiesta: la fecha sale "Viernes, 25 De Diciembre De 2026" (con "De" en mayúscula): buscá el formateo que pone
   cada palabra en mayúscula y que deje "de" en minúscula. En `src/app/(app)/fiestas/[id]/centro/ahora-en-vivo.tsx`:
   "Faltan 733 h 45 min" → días y horas ("Faltan 30 días y 13 h"), y "Arranca a las 21:00" contra "Comienzo a las 22:00"
   tienen que salir del mismo dato.
4. `src/app/(app)/eventos/page.tsx` ~596: "Volver al Menú Principal" lleva a `/` (la web pública): tiene que llevar a
   `/mi-dia`.
5. **La campana de alertas dice "1" y el Centro de Alertas dice 0** (hallazgo 6): el número de la campana y el del centro
   tienen que salir de la misma lista. Buscá en la barra superior de dónde sale el número.

## Bloque 3 — Botones sin nombre y pestañas iguales
Botones e íconos sin texto ni `aria-label` (hallazgo 13): Activos fijos (~200), Servicios (74), Insumos (44), Menús (27),
Clientes (12). Cada botón de ícono lleva su `aria-label` en castellano ("Editar", "Borrar", "Ver"). Cada pantalla del
panel tiene su propio título de pestaña (`metadata.title` o `document.title`), no todas el mismo.

## Bloque 4 — Las direcciones que da el manual
`/mapa-de-la-app-al-dia` y `/rsvp` dan 404 (hallazgo 14). Si el manual (`docs/MANUAL-DE-LA-APP.md`) nombra una pantalla
que no existe, se corrige el manual con `npm run mapa:generar`; no se crean pantallas nuevas para eso.

## Bloque 5 — El robot aprende las formas nuevas
Sumá a `tests/robot/reglas.ts` dos reglas, con su prueba que las rompe a propósito:
1. **"Nada de PRUEBA en lo público":** en las pantallas públicas (LED, simulador, portada, páginas por tipo) no puede
   aparecer un texto que empiece con "PRUEBA" o "TEST".
2. **"El mismo número en dos lugares":** si la barra superior muestra un contador de alertas, el Centro de Alertas tiene que
   mostrar la misma cantidad.

## Barrido en toda la app
- Platos o servicios sin precio en pantallas públicas: `grep -rn "precioPorPersona\|precio" src/app/presentacion-led
  src/app/simulador-de-presupuesto` y mirar cada lista que se muestra al cliente. Lo encontrado se arregla en esta orden.
- Cifras de clientes o fiestas escritas a mano: `grep -rnE "[0-9]{3,} (familias|fiestas|eventos|clientes)" src --include=*.tsx`.
  Sólo valen "+200" y "+7 años".
- Fechas con cada palabra en mayúscula: `grep -rn "toUpperCase() + .*slice(1)" src --include=*.ts*` en formateos de fecha.

## Lo que NO hay que hacer
- No toques precios, el Club Uruguay, presupuestos, cobros ni el panel contable.
- No borres datos de la base (los "PRUEBA" que quedaron cargados los decide el dueño).

## Qué tiene que comprobar la prueba
- `tests/e2e/la-auditoria-del-25-11.spec.ts`: en la LED pública no aparece un plato sin precio ni la palabra "PRUEBA";
  "Ver galería" en Entradas abre la galería y al cerrarla siguen el nombre, la fecha y los invitados cargados; la LED dice
  "+200" y no "500"; `/eventos` → "Volver" lleva a `/mi-dia`; la página 404 dice "página" con tilde.
- `src/__tests__/el-robot-ve-pruebas-en-lo-publico.test.ts`: con un plato "PRUEBA x" en la LED la regla nueva da rojo.

```comprobar
no-usa: Más de 500 familias en src/app/presentacion-led/slides/testimonios-slide.tsx
no-usa: Mas de 4 horas en src/app/simulador-de-presupuesto/page.tsx
no-usa: Esta pagina no existe en src/app/not-found.tsx
usa: /mi-dia en src/app/(app)/eventos/page.tsx
usa: PRUEBA en tests/robot/reglas.ts
prueba: tests/e2e/la-auditoria-del-25-11.spec.ts
prueba: src/__tests__/el-robot-ve-pruebas-en-lo-publico.test.ts
```
