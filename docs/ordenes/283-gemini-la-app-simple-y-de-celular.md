# Orden 283 — La app interna, simple y hecha para el celular (12/11/2026)

**Para Gemini.** Arrancá de `claude/app-debug-stabilize-m70e6z` (`git pull`), rama nueva `gemini/orden-283-app-simple`,
**después de la 282**. **Una sola entrega, sin fusionar.** Repasá `docs/ANTES-DE-ENTREGAR.md` y la habilidad
`celular-primero` (`.claude/skills/celular-primero`).

## Qué dijo el dueño

*"La veo muy recargada y no se adapta mucho al celular; hay dos paneles generales, después la configuración que tiene
todo. Es realmente un embole."* Usa la app desde el teléfono.

**Lo medido por Claude:** el menú (`src/components/main-nav.tsx`) tiene **41 opciones**. Hay **dos inicios** que compiten:
"Centro de Control" (`/centro-de-control`) y "Mi Día" (`src/app/(app)/mi-dia/page.tsx`). "Configuración" tiene **10
opciones** sueltas en el menú. En el celular flotan **tres botones** a la vez (volver/cuadrícula, el robot del agente y
el de la página), que tapan contenido (se ve en las capturas del dueño).

## Reglas de esta orden

- **No se borra ninguna pantalla ni se cambia ninguna dirección** (hay enlaces y QR guardados). Se reordena qué se ve y
  desde dónde se llega. Lo que sale del menú queda a un toque desde la pantalla que le corresponde.
- **No cambia lo que hace ninguna pantalla**, sólo dónde está y cómo se ve en el teléfono.
- Los permisos de cada opción (`permiso:` en el menú) se respetan igual.

## Bloque 1 — Un solo inicio

- "Mi Día" pasa a ser **el inicio**: lo de hoy (fiestas, cobros, pendientes, avisos) arriba, y el agente/asistente del
  Centro de Control como un botón "Hablar con AK" dentro de esa misma pantalla.
- `/centro-de-control` sigue existiendo y abre lo mismo (o queda como pestaña "Control" adentro del inicio). En el menú
  aparece **una sola** entrada: "Inicio".

## Bloque 2 — Menú corto: 5 grupos y ~12 opciones

Para el dueño, el menú queda así (los nombres en criollo):

- **Inicio**
- **Fiestas**: Eventos, Calendario, Muro social.
- **Vender**: Prospectos, Presupuestos, Clientes.
- **Plata**: Pagos rápidos, Panel contable.
- **Más**: una pantalla de tarjetas grandes (`src/app/(app)/mas/page.tsx`) con todo lo demás agrupado: Recursos (menús,
  compras, salones, catálogo, proveedores, empleados), Marketing (marketing y redes, WhatsApp del día, presentación LED),
  Herramientas (incidentes, guías de armado, alergias, portal de proveedores, personal en dos fiestas, edición de videos,
  simulador IA, facturas, cambios a aprobar, métricas) y **Ajustes**.

Cada perfil ve sólo lo suyo (la secretaria, el operador y el personal, menos opciones), como hoy.

## Bloque 3 — Ajustes en una sola pantalla

Las 10 opciones de Configuración dejan el menú. `/settings` pasa a ser **una sola pantalla con secciones** y un
**buscador arriba** ("¿qué querés cambiar?"): Empresa y presupuesto, Seña y promociones, WhatsApp y conexiones, Tareas
automáticas, Contrato, Asistente IA, Seguridad y usuarios, Estilo de fotos. Lo técnico (Laboratorio experimental, Mapa
tecnológico) va al final, plegado, bajo "Avanzado".

## Bloque 4 — En el celular

- **Barra fija abajo** con 5 íconos (Inicio, Fiestas, Vender, Plata, Más) **sólo en pantallas chicas**; el panel lateral
  queda para la computadora.
- **Un solo botón flotante**: el del asistente. Los de volver/cuadrícula se van (para volver está la barra y el botón del
  teléfono).
- En las 10 pantallas que más usa el dueño (inicio, eventos, una fiesta, calendario, prospectos, presupuestos, clientes,
  pagos rápidos, panel contable, ajustes): **sin desplazamiento de costado a 390 px**, tablas que pasan a tarjetas en el
  celular, botones de al menos 44 px de alto y textos que no se cortan.

## Ampliación del 12/11/2026 — lo que midió Claude después (el dueño: *"parece ordenado pero está desordenado"*)

### Bloque 5 — Hay TRES inicios, no dos: al entrar se abre `/admin`

- Después de ingresar, la app abre **`/admin`** ("Menú Principal", `src/app/(app)/admin/page.tsx`, con "Herramientas
  rápidas", "Prioridades" y "Directorio de Módulos"): lo decide `sanitizeAppRedirect` en `src/lib/auth/redirect.ts:2`.
  Además están `/mi-dia` y `/centro-de-control`. **Tres paneles generales.**
- **Qué se hace:** el inicio del bloque 1 es el único. `sanitizeAppRedirect` sin destino devuelve **`/mi-dia`**.
  `/admin` y `/centro-de-control` muestran **lo mismo** que el inicio (re-exportan la pantalla, como hace
  `src/app/(app)/fiestas/[id]/page.tsx` con `centro`). De `/admin` se llevan al inicio sólo dos cosas: las
  "Prioridades" (arriba, con lo de hoy) y 4 atajos grandes: Nuevo presupuesto (`/presupuestos/nuevo/crear`), Registrar
  pago (`/pagos-rapidos`), WhatsApp del día (`/contabilidad/crm/outbox`) y Nueva fiesta. El "Directorio de Módulos" y los
  gráficos de evolución **no** van al inicio: van a "Más" (bloque 2) y a "Métricas" (`/empresa/dashboard`).
- El título de la barra de arriba (`src/components/app-shell.tsx:36`, hoy "Menú Principal") dice "Inicio".

### Bloque 6 — Una fiesta tiene DOS pantallas que no se conocen

- **"Planificar"** (`/fiestas/nueva?fiestaId=…`, `src/app/(app)/fiestas/nueva/page.tsx`) tiene las 5 pestañas de
  `PESTANAS_FIESTA` (`src/lib/fiesta/fiesta-modules.ts:14`) con **51 tarjetas** en total. **"Centro de fiesta"**
  (`/fiestas/[id]/centro`) es la noche, con 17 a 25 botones sueltos. **Centro no tiene ningún enlace a Planificar**
  (sólo "Volver a eventos", línea ~191), y la lista de eventos (`src/app/(app)/eventos/page.tsx:723`) lleva sólo a
  Planificar.
- **Qué se hace:** un componente nuevo `src/components/fiesta/barra-de-la-fiesta.tsx` (`BarraDeLaFiesta`, recibe
  `fiestaId`, `nombre` y `pestanaActiva`) que se pone **arriba en las dos pantallas**: el nombre de la fiesta y las 5
  pestañas de `PESTANAS_FIESTA`. Las cuatro primeras van a `/fiestas/nueva?fiestaId=<id>&pestana=<id-de-pestaña>` (la
  pantalla ya lee `pestana` en la línea ~350); **"La noche" va a `/fiestas/<id>/centro`**. En el celular, las pestañas se
  desplazan de costado **dentro de la barra** (no la página) y la activa queda a la vista.
- En `nueva/page.tsx`, dentro de cada pestaña, las tarjetas pasan a **renglones compactos** en el celular (ícono, título
  y la descripción en una línea, 44 px de alto como mínimo). El orden y lo que hace cada tarjeta no cambian.
- En `centro/page.tsx`, los tres bloques de herramientas ("Lo que manejás vos", "En las pantallas del salón",
  "Estaciones para los invitados", líneas ~57-95) quedan **plegados** debajo de lo de la noche (gente, equipo,
  pendientes), con su título y la cantidad ("Estaciones para los invitados · 4"). Se abre con un toque.

### Bloque 7 — Ajustes: son 45 pantallas, no 10

- `src/app/(app)/settings/` tiene **45 pantallas**; el menú muestra 10 y el resto sólo se alcanza desde el
  centro de ajustes (`settings/page.tsx`, tarjetas en las líneas 66-315), donde **"Cuentas Sociales" está dos veces**
  (líneas 192 y 225). Hay dos pantallas de asistente (`settings/ai-assistant` y `settings/asistente`) y cuatro de WhatsApp
  (`settings/whatsapp`, `settings/whatsapp-business`, `settings/whatsapp-business/conversations`,
  `settings/whatsapp-templates`).
- **Qué se hace, sobre el bloque 3:** las secciones del buscador cubren las 45, cada una con su enlace. Asistente IA es
  **una sección** con las dos pantallas adentro (enlaces "Cómo contesta" → `ai-assistant` y "Voz y avisos" →
  `asistente`). WhatsApp es **una sección** con sus cuatro enlaces. Se saca la tarjeta repetida de la línea 225. A
  "Avanzado" (plegado) van: `lanzamiento-cto`, `cierre-global-producto`, `cierre-operativo-final`, `backup-final`,
  `mapa-tecnologico-ak`, `feature-flags`, `biblioteca-visual-ak`, `asistentes-contextuales` y `datos`.
- El buscador busca por el título **y** por palabras de lo que hay adentro (una lista de palabras por sección escrita a
  mano en la misma pantalla: "seña" encuentra Seña y promociones, que vive en `budget-display`; "número" encuentra
  WhatsApp).

### Bloque 8 — Lo que NO se toca

- Ninguna dirección se borra (las cuatro que redirigen a `centro` —`centro-de-mando`, `centro-experiencia`,
  `comando-total`, `show-control`— quedan como están: hay QR y enlaces guardados).
- Nada de lo que hace cada pantalla cambia: sólo dónde está y cómo se llega. Ni un texto que ve el cliente o el invitado.
- Lo que sale en el portal del cliente, la web pública y las estaciones no se toca en esta orden.

## Pruebas

- `src/__tests__/el-menu-es-corto.test.ts`: con perfil dueño el menú lateral tiene como mucho 13 entradas; todas las
  direcciones que salieron del menú siguen existiendo (`src/app/(app)/...`) y aparecen en la pantalla "Más" o en Ajustes.
- `tests/e2e/la-app-anda-en-el-celular.spec.ts`: a 390 px, en las 10 pantallas del bloque 4, el documento no es más ancho
  que la pantalla (`scrollWidth <= clientWidth`), la barra de abajo se ve con sus 5 íconos, y hay un solo botón flotante.
- `tests/e2e/ajustes-tiene-buscador.spec.ts`: escribir "seña" en el buscador de Ajustes deja visible la sección de la seña
  y esconde las otras.
- `src/__tests__/un-solo-inicio.test.ts`: `sanitizeAppRedirect(null)` devuelve `/mi-dia`; `src/app/(app)/admin/page.tsx`
  y `src/app/(app)/centro-de-control/page.tsx` re-exportan la pantalla del inicio.
- `tests/e2e/la-fiesta-tiene-una-sola-barra.spec.ts`: en `/fiestas/<id>/centro` se ven las 5 pestañas y tocar
  "Contrato y pagos" abre `/fiestas/nueva?fiestaId=<id>&pestana=contrato-y-pagos`; desde ahí tocar "La noche" vuelve a
  `centro`. Usá la fiesta de prueba de `tests/e2e/helpers/fiesta-de-prueba.ts`.
- En `ajustes-tiene-buscador.spec.ts`, sumá: "número" deja visible la sección WhatsApp, y la palabra "Cuentas Sociales"
  aparece una sola vez.
- Regenerá el mapa (`npm run mapa:generar`): la prueba `mapa-de-la-app-al-dia` lo exige.

```comprobar
archivo: src/app/(app)/mas/page.tsx
prueba: src/__tests__/el-menu-es-corto.test.ts
prueba: tests/e2e/la-app-anda-en-el-celular.spec.ts
prueba: tests/e2e/ajustes-tiene-buscador.spec.ts
usa: /mi-dia en src/lib/auth/redirect.ts
archivo: src/components/fiesta/barra-de-la-fiesta.tsx
usa: BarraDeLaFiesta en src/app/(app)/fiestas/[id]/centro/page.tsx
usa: BarraDeLaFiesta en src/app/(app)/fiestas/nueva/page.tsx
prueba: src/__tests__/un-solo-inicio.test.ts
prueba: tests/e2e/la-fiesta-tiene-una-sola-barra.spec.ts
```
