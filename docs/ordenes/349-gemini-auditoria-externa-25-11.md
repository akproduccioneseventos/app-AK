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
   inventada: va la cifra contada del bloque 6.

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

## Bloque 6 — "+200 fiestas" y "8 años" que se cuentan solos (decisión del dueño, 25/11/2026)
Palabras suyas: *"tengo 200 fiestas realizadas y vamos a cumplir 8 años… que se vaya haciendo un conteo: cada vez que
ingrese una fiesta es 201, y pasa el tiempo y va a ser 9 años; ponemos como fecha de inicio 8 de agosto"*.
1. Archivo nuevo `src/lib/marketing/cifras-de-ak.ts` con `FECHA_DE_INICIO = '2018-08-08'`, `FIESTAS_BASE = 200` y:
   - `aniosDeAK(hoy)`: años cumplidos desde el 8/8/2018 en hora de Uruguay (hoy da 8; el 8/8/2027 da 9).
   - `fiestasRealizadas(fiestas, hoy)`: 200 + las fiestas con fecha **desde el 1/1/2027** que ya pasaron, sin contar la de
     muestra del auditor ni las canceladas o archivadas.
   - Una acción pública de lectura que devuelve las dos cifras (sin nombres ni datos de fiestas).
2. **Todos** los lugares que hoy escriben "+7 años", "7 años", "+200" o "200 fiestas" a mano pasan a usar esas cifras:
   `src/components/landing/StatsSection.tsx`, `src/components/public/HeroSection.tsx`, `src/app/experiencia/page.tsx`,
   `src/data/presentacion.ts`, `src/data/event-catalogs/shared.ts`, `src/lib/marketing/plantillas-base.ts`,
   `src/types/landing-editor.ts` (valor por omisión), la LED (`testimonios-slide.tsx`), las páginas por tipo de la 347 y
   `public/llms.txt` (ahí, texto fijo "+200 fiestas y 8 años", que se actualiza a mano una vez por año). El DJ sigue
   diciendo "DJ profesional con +200 fiestas realizadas" usando la misma cifra.
3. Si el dueño escribió otra cifra a mano en el editor de la portada, se respeta la suya.

## Bloque 7 — Segunda auditoría externa del 25/11 (sin plata)
1. **Hora del respaldo** (Ajustes → Sistema → Backup): el título sale en hora de Greenwich ("10:06" cuando eran las 7:06).
   Una sola hora, la de Uruguay.
2. **Pantallas en blanco mientras cargan** (Pagos rápidos, estado de cuenta, editar servicio, Personal → Reporte, Fiestas,
   Backup, Reportes → Comparativa): un "Cargando…" visible hasta que llegan los datos.
3. **"Para hacer hoy" sugiere escribir a un número inventado** (59899000000, "Prueba Test"): las sugerencias dejan afuera
   los registros que empiezan con "PRUEBA" o "Prueba Test" y los números que no son celulares reales.
4. **Tareas automáticas dice "0 tareas, el despertador todavía no corrió"** mientras Hoy muestra avisos del Vigilante, el
   Cobrador y el Perseguidor: las dos pantallas leen el mismo registro de corridas.
5. **El pie muestra "Martin, Contabilidad" o "Bruno, Responsable de fiesta" según la pantalla**, con la misma sesión: si
   es un rótulo del módulo, que no parezca una persona; si no, que muestre el usuario de la sesión.

## Bloque 8 — Tercera auditoría externa del 25/11 (celular y asistente)
1. **Tablas cortadas en el celular** (`/empleados`, `/empleados?tab=reporte`, `/admin/usuarios`): en menos de 640 px cada
   persona va como tarjeta (nombre, cédula, teléfono, roles), no como tabla.
2. **Botones chicos**: Ajustes → Contratos → Cláusulas, Plantillas → Carga operativa, Poner al día y Contenido público: todo
   botón o enlace tocable mide 40 px o más de alto en celular.
3. **`/simulador-ak` en celular**: el botón de enviar se sale por la derecha y el campo de texto no se ve. La fila
   micrófono + campo + enviar entra en 360 px, con el campo ocupando el resto.
4. **El botón flotante del asistente tapa contenido**: que no tape la última fila (espacio abajo de las listas o más arriba
   de la barra inferior) y que se pueda achicar.
5. **Pestañas con deslizamiento** (Plata, CRM): sombra o flecha en el borde cuando hay más pestañas a la derecha.
6. **El asistente general dice "AGENTE DE ESTA FIESTA"** sin fiesta abierta: en la charla general va "Encargado general".
7. **Panel del asistente cortado en escritorio** (título "Encargado Gen…", botones desde "pp completa"): con margen y
   entero dentro de la pantalla. En celular el encabezado no queda detrás de la franja del auditor.
8. **El asistente general no encuentra a una clienta que está en Presupuestos** (Blanca Albernaz): cuando la pregunta
   nombra a alguien, busca por nombre en presupuestos y clientes (sin mayúsculas ni tildes) antes de decir que no está.
   Los importes los toma de la misma función que el panel contable (Claude te dice cuál); no los calcula él.
9. **"Cuotas vencidas: ninguna"** con fiestas pasadas sin cobrar: el asistente dice aparte "fiestas ya hechas con saldo
   pendiente" con su cantidad.

Prueba: `tests/e2e/la-tercera-auditoria-del-25-11.spec.ts` a 390 px: en `/simulador-ak` el botón enviar queda dentro de la
pantalla y el campo se ve; en `/empleados` se ve el teléfono de una persona sin deslizar.

## Barrido en toda la app
- Tablas anchas en celular: `grep -rln "<table\\|<Table" src/app` y mirar cuáles no tienen versión tarjeta.
- Platos o servicios sin precio en pantallas públicas: `grep -rn "precioPorPersona\|precio" src/app/presentacion-led
  src/app/simulador-de-presupuesto` y mirar cada lista que se muestra al cliente. Lo encontrado se arregla en esta orden.
- Cifras de clientes o fiestas escritas a mano: `grep -rnE "[0-9]{3,} (familias|fiestas|eventos|clientes)" src --include=*.tsx`.
  Sólo valen las cifras de `cifras-de-ak.ts`.
- Fechas con cada palabra en mayúscula: `grep -rn "toUpperCase() + .*slice(1)" src --include=*.ts*` en formateos de fecha.

## Lo que NO hay que hacer
- No toques precios, el Club Uruguay, presupuestos, cobros ni el panel contable.
- No borres datos de la base (los "PRUEBA" que quedaron cargados los decide el dueño).

## Qué tiene que comprobar la prueba
- `tests/e2e/la-auditoria-del-25-11.spec.ts`: en la LED pública no aparece un plato sin precio ni la palabra "PRUEBA";
  "Ver galería" en Entradas abre la galería y al cerrarla siguen el nombre, la fecha y los invitados cargados; la LED dice
  "+200" y no "500"; `/eventos` → "Volver" lleva a `/mi-dia`; la página 404 dice "página" con tilde.
- `src/__tests__/las-cifras-de-ak-se-cuentan-solas.test.ts`: el 25/11/2026 da 8 años y el 8/8/2027 da 9; con 3 fiestas
  de 2027 ya pasadas da 203; la de muestra y una cancelada no cuentan; ninguna pantalla pública escribe "+7 años" a mano.
- `src/__tests__/el-robot-ve-pruebas-en-lo-publico.test.ts`: con un plato "PRUEBA x" en la LED la regla nueva da rojo.

```comprobar
archivo: src/lib/marketing/cifras-de-ak.ts
usa: 2018-08-08 en src/lib/marketing/cifras-de-ak.ts
usa: cifras-de-ak en src/components/landing/StatsSection.tsx
usa: cifras-de-ak en src/app/presentacion-led/slides/testimonios-slide.tsx
no-usa: +7 años en src/components/landing/StatsSection.tsx
prueba: src/__tests__/las-cifras-de-ak-se-cuentan-solas.test.ts
no-usa: Más de 500 familias en src/app/presentacion-led/slides/testimonios-slide.tsx
no-usa: Mas de 4 horas en src/app/simulador-de-presupuesto/page.tsx
no-usa: Esta pagina no existe en src/app/not-found.tsx
usa: /mi-dia en src/app/(app)/eventos/page.tsx
usa: PRUEBA en tests/robot/reglas.ts
prueba: tests/e2e/la-auditoria-del-25-11.spec.ts
prueba: src/__tests__/el-robot-ve-pruebas-en-lo-publico.test.ts
prueba: tests/e2e/la-tercera-auditoria-del-25-11.spec.ts
usa: Encargado general en src/components/multiagent/multiagent-widget.tsx
```
