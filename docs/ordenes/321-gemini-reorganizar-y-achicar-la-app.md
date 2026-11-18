# Orden 321 — Reorganizar y achicar la app (pedido del dueño, 18/11/2026)

Palabras del dueño: *"casi 400 páginas me parece muchísimo"*, *"cuanto más sencilla mejor"*, *"reducir sin perder las
funcionalidades ni la excelencia"*, y que el día a día quede en módulos generales: **Ventas y Marketing (con WhatsApp),
Empresa y Personal, Contable, Organización de fiestas**. El dueño todavía no usa la app: no hay costumbres que respetar. La
decisión de qué se junta la tomó Claude; vos la ejecutás. Va **después** de las órdenes 318 a 320, en la misma propuesta.
Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

## La medida (hoy 382 páginas)

- 382 `page.tsx` en `src/app`: 118 públicas (portal, evento, invitación, landings) y 264 del equipo.
- **41 sólo redirigen** a otra dirección. 9 no las abre nadie. 20 sólo se llegan desde "Más".
- **Meta: 180 o menos** (el dueño, 18/11: *"se puede bajar hasta menos de 200"*), sin perder ninguna función: lo que se junta pasa a ser una pestaña o una sección de otra pantalla,
  no se borra lo que hace. Contá antes y después (`find src/app -name page.tsx | wc -l`) y poné los dos números en la
  propuesta.

**Reglas:**
- **Las direcciones viejas siguen andando.** Cada página que se va queda como redirección en `next.config` (`redirects()`),
  **no** como un archivo `page.tsx` que redirige. Así sale el archivo y la dirección sigue viva, incluidos los QR impresos.
- **Nada de plata cambia de lógica.** En cobros, facturas, presupuestos y sueldos sólo se mueve dónde se llega; si para
  juntar dos pantallas hay que tocar cómo guardan, **no lo hagas**: anotalo en la propuesta y lo resuelve Claude.
- **Las pantallas públicas de la noche (`/evento/*`) no se tocan** salvo lo que dice el bloque 6. Se usan con QR.

## Bloque 1 — Las 41 redirecciones salen de `src/app` (−41)

Todo `page.tsx` de menos de 30 líneas que sólo hace `redirect(...)` (lista: `grep -l "redirect(" $(find src/app -name
page.tsx)` y mirá el largo) pasa a `next.config` y se borra el archivo. Ejemplos: `fiestas/[id]/show-control`,
`centro-de-mando`, `comando-total`, `centro-experiencia`, `fiestas/nueva/mission-control`, `centro-total`, `centro`,
`fiesta-lista`, `accesos-personal`, `logistica`, `playlist-pantalla`, `invitados/numeros-mesa`, `(app)/contabilidad`,
`empresa/crm`, `presupuestos`, `presupuestos/[id]/editar`, `presentacion`, `empresa/todos-los-servicios/[id]/editar`,
`empresa/insumos/editar/[id]`, `empresa/personal/[empleadoId]/historial`, `empresa/empleados/reporte`,
`configuracion/backup-final`, `marketing/checklist`, `marketing/plantillas`, `empresa/redes-sociales/ia-marketing`,
`repaso-diario`. Las dos "Deprecated" sin redirección (`empresa/servicios/[...slugs]`, `empresa/activos-fijos/editar/[id]`)
también: redirigen a su lista.

## Bloque 2 — El menú: seis áreas (`src/lib/navegacion/mapa.ts`, arreglo `CASAS` ~línea 33)

Hoy son 7 casas más "Más" (30 enlaces sueltos en `src/app/(app)/mas/page.tsx`). Quedan **seis**, y "Más" desaparece (sus
enlaces van a la casa que corresponde o a Ajustes → Sistema):

1. **Hoy** (`/mi-dia`): Mi día, Alertas, Para aprobar, Asistente.
2. **Ventas y Marketing**: Prospectos (CRM con su agenda), Presupuestos, Clientes, **WhatsApp** (bandeja de salida y
   conversaciones: `contabilidad/crm/outbox` + `settings/whatsapp-business/conversations` en una pantalla con dos pestañas),
   Redes y presencia (presencia digital, redes sociales, reseñas, publicidad), Galería y web (galería, editor de portada).
3. **Fiestas** (organización): Fiestas, Calendario, Incidentes, Guías de armado, Personal en dos fiestas.
4. **Plata** (contable): Cobrar, Facturas, Gastos, Flujo de caja, Ganancias (reportes + comparativa + rentabilidad de
   `admin/finanzas`, como pestañas de una sola pantalla), Poner al día.
5. **Empresa y Personal**: Personal (empleados, recibos, accesos del personal), Comida (menús, tragos, insumos, compras),
   Salones, Servicios y paquetes, Proveedores, Equipos.
6. **Ajustes**: ver bloque 4.

`/empresa/presencia-digital` aparece dos veces en el menú de hoy: una sola.

## Bloque 3 — Lo repetido se junta (cada par queda en UNA pantalla)

- **"Qué hacer hoy"**: `mi-dia`, `control-tower` (y sus 4 subpáginas), `centro-de-control`, `empresa/dashboard` y `admin`
  → **Mi día**. Lo que suma cada uno entra como sección de Mi día; lo de ganancias del tablero ejecutivo va a Plata →
  Ganancias. Las demás pasan a redirección.
- **Asistente**: `asistente`, `secretaria-ak` y los 6 de `multiagente/*` → **una** pantalla "Asistente" con el chat y las
  pestañas Equipo, Memoria y Acciones. Los chats `multiagente/contable` y `multiagente/fiestas` son el mismo chat con otro
  agente: un selector de agente.
- **Simuladores públicos**: `simulador-ak` usa la misma acción que `simulador-de-presupuesto` → `simulador-ak` redirige a
  `simulador-de-presupuesto`. **No cambies textos, reloj ni regalos del simulador** (decisiones comerciales del dueño).
- **Editar un presupuesto**: hay dos editores, `presupuestos/[id]/edit` y `presupuestos/nuevo/crear?editId=`. **Esto toca
  plata:** compará cómo guarda cada uno y **no juntes nada**; escribí en la propuesta qué hace distinto cada uno y Claude
  decide cuál queda.
- **Rentabilidad**: `admin/finanzas`, `comparativa-ganancias` y `empresa/contabilidad/reportes` → pestañas de Plata →
  Ganancias. Sólo se mueven; la cuenta es la misma (`calcularGananciaDeEvento`).
- **Respaldo**: `settings/backup` y `settings/backup-final` → una pantalla.

## Bloque 4 — Ajustes: de 45 páginas a 7 secciones

Una sola pantalla `/settings` con siete secciones (cada sección, pestañas adentro):

- **Empresa**: `company`, `datos`, `account`, `contenido-publico`, `estilo-fotos`, `biblioteca-visual-ak`.
- **Ventas**: `budget-display` (señas y reserva), `promos`, `cupones`, `ajuste-precios`, `catalogo-servicios`.
- **Contratos y plantillas**: `contratos`, `contratos/clausulas`, `templates` y sus 5 (`layouts`, `contrato`, `reuniones`,
  `carga-operativa`, `invitaciones`), `task-templates`.
- **WhatsApp, redes y Google**: `whatsapp`, `whatsapp-business`, `whatsapp-templates`, `social-connections`,
  `google-workspace`, `sincronizaciones`.
- **Asistente y automático**: `ai-assistant`, `asistente`, `asistentes-contextuales`, `agentes-autonomos`,
  `tareas-automaticas`.
- **Equipo**: `admin/usuarios`, `accesos-personal`, `notifications`.
- **Sistema**: respaldo, `instalar-app`, `videos-de-ayuda`, `feedback`, `feature-flags`.

**Salen (redirigen a `/settings`)**: `cierre-global-producto`, `lanzamiento-cto`, `cierre-operativo-final` y
`mapa-tecnologico-ak`. Son listas de control del armado de la app, no funciones del negocio. Antes de sacarlas buscá quién
las llama; si una tarea automática las usa, dejá esa parte en "Sistema".

## Bloque 5 — La fiesta: de 83 a unas 35, en las 5 pestañas que ya existen

Las pestañas están en `src/lib/fiesta/fiesta-modules.ts` (`PESTANAS_FIESTA` ~línea 14, `MAPA_MODULO_A_PESTANA` ~línea 42) y
el catálogo de 47 módulos en `src/app/(app)/fiestas/nueva/page.tsx` ~líneas 79-143.

- **Un solo centro**: `fiestas/[id]/centro` es el centro de la fiesta. `ak-100`, `cierre-mundial`,
  `experiencia-tecnologica-ak`, `nueva/readiness` y `nueva/zona-digital` son vistas de "qué falta" y "qué tecnología tiene"
  → una sección dentro del centro, y redirección.
- **Un solo resumen**: `resumen-planificacion`, `resumen-imprimible` y `orden-de-evento` → "Resumen de la fiesta", con botón
  de imprimir.
- **Un solo costo**: `planner-costo-fiesta` → dentro de `gestion-costos-rentabilidad` (sólo mover la vista; la cuenta no se
  toca).
- **Una sola reunión**: `reunion-organizacion` → pestaña de `reuniones`.
- **Un solo cronograma**: `fiestas/[id]/timeline` (sin enlaces, guarda lo mismo que lee el itinerario) → redirección a
  `itinerario`.
- **La papelería sale** (el dueño, 18/11: *"la edición de los menús, ninguno quedó bien; la papelería no va a funcionar"*):
  `carteleria`, `menu-mesa`, `numeros-mesa` y `carta-tragos` (editores de impresos de mesa y de la carta de tragos de 15x10)
  pasan a redirección al planificador y salen del catálogo. **En su lugar, el menú digital** (bloque 7).
- **Lo del invitado en una**: `modulo-invitado`, `pagina-web`, `social-fiesta-pro` (y su `cierre-final`) → "Invitados en
  línea".
- **Portal del cliente**: `portal-cliente/experiencia-mundial` y `portal-cliente/cierre-final` → secciones de
  `portal-cliente`.
- **Sin enlaces, salen**: `fiestas/revisar`, `fiestas/[id]` raíz (redirige al centro).
- **El catálogo del planificador muestra sólo lo del día a día** en cada pestaña: invitados, check-in, diseño del salón,
  comida y compras, alergias, personal, cronograma, plan de pagos, proveedores, contrato y documentos, carga, en vivo,
  música, fotos, decoración, muro y juegos, buzón, regalos. Lo demás queda abajo en "Más herramientas", plegado.

## Bloque 6 — Lo que no funciona, encontrado al revisar

- **Buzón, marco de video:** `src/app/(app)/fiestas/nueva/buzon/page.tsx` ~línea 287 dice "Plantilla y marco de video
  guardados", pero `updateBuzonFrameTemplate` (`src/app/actions/buzon.ts` ~línea 413) sólo guarda `customText` y nunca
  `videoFrameTemplate`. El marco elegido no le llega al invitado (`src/app/evento/buzon/[fiestaId]/page.tsx` ~545, 680,
  1669). Que lo guarde, con su prueba de ida y vuelta contra la base (`tests/firebase/`).
- **Post-evento**: `referidoPor` y `referidosGenerados` (`post-evento/page.tsx` ~121-162) los escribe y no los lee nadie. O
  los muestra el CRM en la ficha del cliente, o salen.

## Bloque 7 — Menú digital en vez de papel, y la presentación de ventas en un solo lugar

- **Menú de la noche en el teléfono del invitado.** En la app del invitado (`src/app/evento/hub/[fiestaId]/page.tsx`, la
  misma a la que lleva el QR de la mesa) una sección "Menú de la noche" que se arma sola con el menú asignado a la fiesta
  (`fiesta.menuAsignadoId` → platos) y la carta de tragos de la barra (lo que ya muestra `/evento/barra/[fiestaId]`). Las
  dietas especiales del invitado (`condicionesDelInvitado` en `src/lib/catering/condiciones-del-invitado.ts`) se marcan en
  su plato. **Sin precios.** Si el plato no tiene descripción, una frase corta escrita por la IA una vez y guardada en el
  plato (no en cada visita). Sin menú asignado, la sección no aparece.
- **"Buscá tu mesa"** (`/evento/mi-mesa/[fiestaId]`) queda: es el reemplazo digital de la papelería de mesas. Que el hub la
  muestre al lado del menú.
- **La presentación de ventas en un solo lugar:** `presentacion-led` queda como la única. `catalogo`, `catalogo/[tipo]`,
  `galeria-led`, `presentacion-led/portafolio` (y `portafolio/fiesta/[id]`), `tecnologia` y `marketing/demo-tecnologia` eran
  guías y catálogos para armar esa presentación: lo que tengan que la presentación no tenga, pasa adentro como sección; las
  direcciones redirigen a `presentacion-led`. Antes, recorré la presentación de punta a punta (datos, menú, servicios,
  regalos, cierre, "Generar presupuesto manual") y anotá en la propuesta si algo no anda.
- **Lo manual que ya hace la IA:** al juntar pantallas, si una es un formulario para escribir a mano algo que la app ya
  genera sola (textos de marketing, guiones, plantillas de posteos), queda la automática y la manual sale. Listá en la
  propuesta cuáles sacaste.

## Qué tiene que comprobar la prueba

- `src/__tests__/ningun-enlace-lleva-a-una-pagina-que-no-existe.test.ts` en verde (cada enlace a una página que se fue
  tiene que llevar a su redirección o a la pantalla nueva).
- `npm run mapa:generar` y `src/__tests__/mapa-de-la-app-al-dia.test.ts` en verde.
- Una prueba nueva que cuente los `page.tsx` y falle si pasan de 180, y otra que recorra las direcciones viejas de los
  bloques 1, 3, 4 y 5 y mire que cada una termina en la pantalla nueva (no en 404).
- Las pruebas de navegador de las pantallas que se juntan, en los tres tamaños.
- Actualizá `docs/MANUAL-DE-LA-APP.md` (el porqué de cada junta) y `docs/QUE-HAY-EN-LA-APP.md`.

```comprobar
archivo: src/__tests__/la-app-no-pasa-de-180-pantallas.test.ts
usa: menuAsignadoId en src/app/evento/hub/[fiestaId]/page.tsx
usa: redirects en next.config.js
no-usa: '/mas' en src/lib/navegacion/mapa.ts
usa: videoFrameTemplate en src/app/actions/buzon.ts
prueba: src/__tests__/las-direcciones-viejas-siguen-andando.test.ts
```
