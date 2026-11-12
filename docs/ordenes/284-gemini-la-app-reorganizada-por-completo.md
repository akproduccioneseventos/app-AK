# Orden 284 — La app reorganizada por completo: un mapa, siete casas y cada pantalla en su lugar (12/11/2026)

**Para Gemini.** Va **en la misma entrega que la 283** (y la 282): rama `gemini/orden-283-app-simple`, arrancando de
`claude/app-debug-stabilize-m70e6z` (`git pull`). **Una sola propuesta, sin fusionar.** Esta orden manda sobre el
bloque 2 de la 283 (el menú) donde se contradigan. Repasá `docs/ANTES-DE-ENTREGAR.md` y la habilidad `celular-primero`.

## Qué dijo el dueño

*"La organización de toda la app no me gusta, está todo muy cargado, muy desordenado; parece ordenado pero está
desordenado, no es sencillo utilizarla"*, y después: *"andá más en profundidad… reorganizala por completo para que quede
más fácil de usar"*.

## Lo que midió Claude (para que no lo repitas)

- **238 pantallas internas** en `src/app/(app)/` más ~20 internas fuera de esa carpeta (`/marketing`, `/compras`,
  `/simulador-ak`, `/control-tower/*`, `/secretaria-ak`, `/admin/finanzas`, `/admin/ventas`, `/analytics`…).
- **Cada área se organiza de una manera distinta y nunca la misma dos veces:** el menú (`src/components/main-nav.tsx`,
  41 opciones), el centro "La Empresa" (`src/app/(app)/empresa/page.tsx`, 30 tarjetas en 4 grupos que repiten el menú),
  el centro de ajustes (45 pantallas), y Planificar una fiesta con **cuatro formas de agrupar a la vez** (5 pestañas,
  4 "momentos" en `MOMENTOS_FIESTA` ~línea 177, 8 categorías y los "modos rápidos" `quickModes` ~línea 205). Por eso
  "parece ordenado": cada pantalla está ordenada, pero cada una con su propio orden.
- **Paneles repetidos:** de inicio hay 6 (`/admin`, `/mi-dia`, `/centro-de-control`, `/control-tower`,
  `/secretaria-ak`, `/repaso-diario`); de ventas 4 (`/contabilidad/crm`, `/admin/ventas`, `/contabilidad/comercial-360`,
  `/contabilidad/crm/ciclo-comercial`); de números 4 (`/empresa/dashboard`, `/analytics`, `/admin/finanzas`,
  `/comparativa-ganancias`); de marketing 4 (`/marketing`, `/empresa/marketing`, `/empresa/presencia-digital`,
  `/empresa/redes-sociales`); de asistentes 5 (`/asistente`, `/multiagente`, `/secretaria-ak`, `/centro-de-control`,
  `/admin/asistente-ak`).
- **Una pantalla de verdad que nadie enlaza:** la recepción de invitados en la puerta, `/recepcion/[fiestaId]`.

## La idea, en una línea

**Un solo mapa escrito en un archivo, y todo lo lee de ahí**: el menú, la barra de abajo del celular, la pantalla "Más",
las barras de pestañas de cada casa y el buscador. Así no puede volver a haber cuatro órdenes distintos.

## Reglas (las mismas de la 283, y son duras)

- **No se borra ninguna pantalla ni se cambia ninguna dirección.** Lo repetido **deja de enlazarse** (menú, centros,
  barras); su dirección sigue andando.
- **No cambia lo que hace ninguna pantalla** ni ningún texto que ve el cliente o el invitado. Ni el portal, ni la web
  pública, ni las estaciones.
- **Si una pantalla que deja de enlazarse tiene algo que la elegida no tiene**, no lo muevas: anotalo en la entrega
  (`docs/evidencias/284-lo-que-tenian-las-repetidas.md`, una línea por cosa) y Claude decide.
- Los permisos de cada entrada se respetan igual que hoy (bloque 1).

## Bloque 1 — El mapa: `src/lib/navegacion/mapa.ts`

Un archivo nuevo que exporta `CASAS: Casa[]`. Cada `Casa` tiene `id`, `titulo`, `icono`, `inicio` (la ruta de su
pantalla principal), `permiso` y `pestanas: { titulo, ruta, permiso?, palabras: string[] }[]` (las `palabras` son para el
buscador). Además exporta `NO_SE_ENLAZAN: { ruta, motivo, quedaEn }[]` con las repetidas del bloque 4.

- El `permiso` de cada entrada es **el que ya tiene hoy en `main-nav.tsx`** para esa ruta. Si la ruta no está en el
  menú hoy, lleva el de su casa (por ejemplo, `/empresa/contabilidad/gastos` lleva el de Plata, `PERMISOS.CONTABILIDAD`).
  Mostrar un enlace no da acceso: lo que protege es el servidor, y eso no se toca.
- `main-nav.tsx` arma el menú con `CASAS` (una entrada por casa y "Más"); la barra de abajo del celular (283, bloque 4)
  y la pantalla "Más" (283, bloque 2) también leen de acá.

## Bloque 2 — Las siete casas, cada una con su barra de pestañas

Un componente `src/components/navegacion/barra-de-la-casa.tsx` (`BarraDeLaCasa`, recibe el `id` de la casa) que se pone
**arriba en cada pantalla de la tabla**: título de la casa y sus pestañas, con la activa marcada según la dirección. En
el celular la barra se desplaza de costado **adentro suyo**, nunca la página. Va en un `layout.tsx` por carpeta cuando
la carpeta entera es de la misma casa (por ejemplo `src/app/(app)/invoices/layout.tsx`,
`src/app/(app)/empresa/contabilidad/layout.tsx`, `src/app/(app)/customers/layout.tsx`); donde la carpeta mezcla casas
(como `src/app/(app)/empresa/`), va en cada pantalla.

| Casa | Inicio | Pestañas (en este orden) |
|---|---|---|
| **Inicio** | `/mi-dia` | Hoy `/mi-dia` · Alertas `/alertas` · Para aprobar `/aprobaciones` · Asistente `/asistente` |
| **Fiestas** | `/eventos` | Fiestas `/eventos` · Calendario `/calendario` · Incidentes `/incidentes` · Guías de armado `/playbooks` · Personal en dos fiestas `/recursos-multi-evento` |
| **Vender** | `/contabilidad/crm` | Prospectos `/contabilidad/crm` · Presupuestos `/presupuestos/nuevo` · Clientes `/customers` · Agenda `/contabilidad/crm/agenda` · WhatsApp del día `/contabilidad/crm/outbox` · Simulador `/simulador-ak` |
| **Plata** | `/pagos-rapidos` | Cobrar `/pagos-rapidos` · Cuentas `/empresa/contabilidad` · Facturas `/invoices` · Gastos `/empresa/contabilidad/gastos` · Flujo de caja `/empresa/contabilidad/flujo-caja` · Ganancias `/empresa/contabilidad/reportes` · Por fiesta `/comparativa-ganancias` · Métricas `/empresa/dashboard` |
| **Marketing** | `/marketing` | Resumen `/marketing` · Publicaciones `/empresa/redes-sociales` · Reseñas `/empresa/resenas-google` · Anuncios `/contabilidad/crm/marketing-ads` · Presencia en Google `/empresa/presencia-digital` · Galería `/empresa/galeria` · Portada `/empresa/landing-editor` · Muro general `/empresa/red-social-eventos` |
| **Recursos** | `/empresa` | Comida `/empresa/menus` · Tragos `/empresa/menus/tragos` · Compras `/compras` · Insumos `/empresa/insumos` · Salones `/empresa/salones` · Servicios `/empresa/servicios` · Proveedores `/proveedores` · Personal `/empleados` · Equipos `/empresa/activos-fijos` |
| **Ajustes** | `/settings` | La pantalla con buscador de la 283 (bloques 3 y 7) · Usuarios `/admin/usuarios` |

- Las pantallas de **detalle** (un presupuesto, un cliente, una factura, editar un menú, un salón) muestran la barra de
  su casa con la pestaña madre marcada: `/presupuestos/[id]/*` → Presupuestos; `/customers/[id]*` → Clientes;
  `/invoices/[id]*` → Facturas; `/empresa/menus/*` → Comida (menos `tragos`); `/empresa/salones/*` → Salones;
  `/empresa/insumos/*`, `/empresa/servicios/*`, `/empresa/activos-fijos/*`, `/empleados/*`, `/proveedores/*` → la suya.
- La pestaña "Anuncios" lleva adentro un botón al estudio de anuncios (`/empresa/creador-anuncios`), que ya existe.
- La orden 282 arma la bandeja de comentarios y mensajes: va como pestaña **"Comentarios y mensajes"** de Marketing, en
  segundo lugar, con la ruta que use la 282.

## Bloque 3 — "La Empresa" pasa a ser "Recursos"

`src/app/(app)/empresa/page.tsx` muestra **sólo** las 9 de Recursos. Los grupos VENDER (~línea 53), PLATA (~94) y
MARKETING (~198) salen de ahí porque ya son casas. Los 4 catálogos de Canva (~líneas 263-281) pasan a Marketing →
Resumen, como una tarjeta "Catálogos para mandar". El título de la pantalla dice "Recursos".

## Bloque 4 — Lo repetido deja de enlazarse (la dirección sigue andando)

Va en `NO_SE_ENLAZAN`, con `quedaEn` = la pestaña que lo reemplaza. **Se sacan sus enlaces** del menú, de los centros
(`/admin`, `/empresa`, `/settings`, `/marketing`) y de las tarjetas de otras pantallas. Las que hoy ya sólo redirigen se
dejan como están.

- Inicio: `/admin`, `/centro-de-control` y `/control-tower` **muestran el inicio** (re-exportan `mi-dia`, como dice la
  283 bloque 5); `/secretaria-ak` → Inicio · Hoy.
- `/control-tower/comercial` → Vender · Prospectos; `/control-tower/preparacion` → la pestaña "Preparación previa" de
  cada fiesta; `/control-tower/post-fiesta` → Fiestas; `/control-tower/automatizaciones` → Ajustes · Tareas automáticas.
- Ventas: `/admin/ventas`, `/contabilidad/comercial-360`, `/contabilidad/crm/ciclo-comercial`,
  `/contabilidad/crm/atraccion-fiestas` → Vender · Prospectos.
- Números: `/analytics`, `/admin/finanzas` → Plata · Métricas; `/contabilidad/fiestas-historicas` → Plata · Métricas.
- Marketing: `/empresa/marketing` → Marketing · Resumen.
- Asistentes: `/multiagente` y sus 5 pantallas → un botón **"Qué hace cada asistente"** adentro de Inicio · Asistente
  (`/asistente`); dejan el menú.
- Herramientas que se usan poco y no tienen casa propia van a **"Más" → Herramientas**: Edición de videos
  `/edicion-videos`, Presentación LED `/empresa/presentacion-led/configuracion`, Importar presupuesto
  `/presupuestos/importar`, Carga de fiestas pasadas `/admin/carga-historicos`, Registro de cambios `/auditoria`,
  Demostración de tecnología `/marketing/demo-tecnologia`.

## Bloque 5 — Planificar una fiesta: un solo orden, las 5 pestañas

En `src/app/(app)/fiestas/nueva/page.tsx` quedan **sólo las 5 pestañas** de `PESTANAS_FIESTA`
(`src/lib/fiesta/fiesta-modules.ts:14`). Se dejan de mostrar los "momentos" (`MOMENTOS_FIESTA`), los "modos rápidos"
(`quickModes`), los títulos de categoría y los interruptores "ver todo" (`showAllModules`, ~línea 348) y "ver internos"
(`showInternalModules`, ~349). El buscador por texto (~líneas 478-482) queda.

- Adentro de cada pestaña: primero **lo contratado en esta fiesta** (`isModuleActive`, ~línea 468); después, plegado,
  **"No contratado en esta fiesta (N)"**, que al abrirse muestra el resto igual que hoy (tocarlo lo activa, ~1117).
- La pestaña "La noche" (15 módulos) se parte en dos subtítulos: **"Durante"** (enVivo, centroFiesta, muroSocial,
  zonaDigital, pantallasTotem, playlistPantalla, entretenimiento, redSocial, checkin, readiness, fiestaLista) y
  **"Después"** (fotografia, buzon, postEvento, feedback).
- La tarjeta `centroFiesta` lleva a `/fiestas/<id>/centro` (la misma de la pestaña "La noche" de la barra de la fiesta
  de la 283, bloque 6), no a `/fiestas/nueva/centro`.
- Las 4 pantallas de `fiestas/nueva/*` que hoy no son tarjeta (`orden-de-evento`, `reunion-organizacion`,
  `servicios-contratados`, `asistente`) no cambian: siguen a un toque desde donde están.

## Bloque 6 — La recepción de la puerta se puede encontrar

En el Centro de fiesta (`src/app/(app)/fiestas/[id]/centro/page.tsx`), bloque "Lo que manejás vos" (~línea 57), sumá
**"Recepción en la puerta"** → `/recepcion/<id>`, con el mismo permiso que "Accesos".

## Pruebas

- `src/__tests__/el-mapa-de-la-app-es-uno-solo.test.ts`:
  - toda ruta de `CASAS` existe como `page.tsx`;
  - ninguna ruta está en dos casas;
  - toda ruta de `NO_SE_ENLAZAN` existe, y **ningún archivo de `src/components/main-nav.tsx`, `src/app/(app)/empresa/page.tsx`
    ni `src/app/(app)/settings/page.tsx` la enlaza**;
  - el `permiso` de cada pestaña que hoy está en el menú es el mismo que tenía (compará contra una lista fija escrita en
    la prueba, sacada del `main-nav.tsx` de hoy).
- `src/__tests__/el-menu-lee-del-mapa.test.ts`: con perfil dueño, el menú tiene las 7 casas más "Más"; con perfil
  secretaria no aparece Plata si hoy no le aparece "Panel Contable" (mismo `puede`).
- `tests/e2e/cada-casa-tiene-su-barra.spec.ts`: abrir `/invoices`, `/empresa/contabilidad/gastos`, `/customers`,
  `/empresa/salones` y `/marketing`, y en cada una ver la barra con la pestaña correcta marcada; a 390 px de ancho la página
  no se desplaza de costado (`scrollWidth <= clientWidth`).
- `tests/e2e/planificar-tiene-un-solo-orden.spec.ts`: en `/fiestas/nueva?fiestaId=<fiesta de prueba>` se ven las 5
  pestañas, **no** se ven los textos de los momentos ni de los modos rápidos, y aparece "No contratado en esta fiesta".
  Fiesta de `tests/e2e/helpers/fiesta-de-prueba.ts`.
- Regenerá el mapa (`npm run mapa:generar`) y actualizá `docs/MANUAL-DE-LA-APP.md` (las cinco áreas pasan a ser las siete
  casas).

```comprobar
archivo: src/lib/navegacion/mapa.ts
archivo: src/components/navegacion/barra-de-la-casa.tsx
usa: CASAS en src/components/main-nav.tsx
usa: BarraDeLaCasa en src/app/(app)/invoices/layout.tsx
usa: BarraDeLaCasa en src/app/(app)/empresa/contabilidad/layout.tsx
usa: BarraDeLaCasa en src/app/(app)/customers/layout.tsx
usa: /recepcion/ en src/app/(app)/fiestas/[id]/centro/page.tsx
no-usa: quickModes en src/app/(app)/fiestas/nueva/page.tsx
prueba: src/__tests__/el-mapa-de-la-app-es-uno-solo.test.ts
prueba: src/__tests__/el-menu-lee-del-mapa.test.ts
prueba: tests/e2e/cada-casa-tiene-su-barra.spec.ts
prueba: tests/e2e/planificar-tiene-un-solo-orden.spec.ts
```
