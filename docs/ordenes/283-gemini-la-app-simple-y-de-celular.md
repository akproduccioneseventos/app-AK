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

## Pruebas

- `src/__tests__/el-menu-es-corto.test.ts`: con perfil dueño el menú lateral tiene como mucho 13 entradas; todas las
  direcciones que salieron del menú siguen existiendo (`src/app/(app)/...`) y aparecen en la pantalla "Más" o en Ajustes.
- `tests/e2e/la-app-anda-en-el-celular.spec.ts`: a 390 px, en las 10 pantallas del bloque 4, el documento no es más ancho
  que la pantalla (`scrollWidth <= clientWidth`), la barra de abajo se ve con sus 5 íconos, y hay un solo botón flotante.
- `tests/e2e/ajustes-tiene-buscador.spec.ts`: escribir "seña" en el buscador de Ajustes deja visible la sección de la seña
  y esconde las otras.
- Regenerá el mapa (`npm run mapa:generar`): la prueba `mapa-de-la-app-al-dia` lo exige.

```comprobar
archivo: src/app/(app)/mas/page.tsx
prueba: src/__tests__/el-menu-es-corto.test.ts
prueba: tests/e2e/la-app-anda-en-el-celular.spec.ts
prueba: tests/e2e/ajustes-tiene-buscador.spec.ts
```
