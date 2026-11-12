# Orden 288 — Informe integral del auditor (parte 1 de 2): marketing, editor, tareas, contabilidad y pantallas (12/11/2026)

**Para Gemini.** Va **en la misma entrega que las 284 a 287** (tu rama `gemini/ordenes-282-283-entrega-completa`, después
de `git merge origin/main`). **Una sola propuesta, sin fusionar.** Si un bloque se traba, entregá el resto y avisá cuál.
Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 93.

Lo de la parte 2 del informe (la auditoría base de 16 hallazgos) ya está en las órdenes 285 y 286: no lo repitas.

## Lo que NO se toca

- Las frases comerciales del generador de marketing ("en 1 minuto", "Salón propio", "quedan pocas fechas"): son decisión
  del dueño y se le consultan aparte. **No las cambies.**
- El 15%, la seña, la multa del 30%, el reloj, la firma como constancia y el envío humano de mensajes.

## Barrido en toda la app (Claude, 12/11/2026)

Cada forma del informe se buscó en todo `src/` y en `herramientas/` antes de escribir esta orden; lo confirmado está en los
bloques. Descartado al mirar el código: `[URGENTE_7_DIAS]` no está en el código (es un dato cargado), la categoría
"General" de la galería sí aparece (se llama "Sin clasificar"), el calendario no tiene chips "O."/"E." en esta versión,
y el texto "Un auditor no puede crear usuarios" ya lo arregló Claude (`listUsers`).

## Bloque 1 — "Crear publicación" propone la hora tres horas adelantada, y editar la corre otras tres (P1)

`src/components/social-media/NewPostDialog.tsx` ~75 y ~98: `new Date().toISOString().substring(0, 16)` (hora de
Greenwich) como valor del campo de fecha y hora local; al editar, la hora guardada también se muestra en Greenwich y al
guardar (~164) se lee como local: **cada edición la corre tres horas**. Usá una función `aFechaHoraLocal(date)` que arme
`AAAA-MM-DDTHH:mm` con la hora de Uruguay (en `src/lib/fechas/`), para el valor nuevo y para el de edición.

## Bloque 2 — Los textos del generador de marketing salen sin terminar (P1)

En `src/app/marketing/page.tsx`:
- `LINK_SIMULADOR: '/simulador-de-presupuesto'` (~418): fuera de la app no es una dirección. Usá `SITE_URL` de
  `src/lib/seo/paginas-publicas.ts:19` + la ruta.
- Las plantillas de "Cerrar venta" usan `[NOMBRE]`, `[MES/AÑO]` y `[FECHA]` (~139, ~151, ~163), y `renderVariables` (~74)
  sólo reemplaza `{{CLAVE}}`: pasalas a `{{NOMBRE}}`, `{{FECHA}}`. Y `[X] años` (~97) → "+7 años".
- Antes de copiar o preparar el texto: si quedó algún `[...]` o `{{...}}` sin reemplazar, mostrar "Borrador incompleto:
  falta <campo>" y no habilitar "Copiar".
- Estilos: "Boho" y "Urbano" (y "Neón"/"Princesa" en Mostrar y Cerrar) caen sin avisar al texto "Elegante"
  (`getBaseTemplate` ~168). Mostrá sólo los estilos que tienen texto propio para ese objetivo.

## Bloque 3 — Las 26 miniaturas de la galería del equipo no cargan (P2)

`src/app/(app)/empresa/galeria/page.tsx` ~111: `sanitizeHttpUrl` hace `new URL(url)` sin base y descarta las rutas
relativas (`/media/...`), así que `src` queda vacío (~574 y ~1064). Aceptá las rutas que empiezan con `/` (mismo sitio)
además de `http(s)`, y seguí rechazando `javascript:` y otros esquemas. La sección "Sin clasificar" pasa a llamarse
"General", como la llama el servidor (`src/app/actions/galeria.ts` ~156).

## Bloque 4 — AK Editor: Wfolio decía "subido" sin subir, y el programa que se baja está viejo (P1)

- `herramientas/ak-editor/wfolio.py` ~477-525: `_subir_con_playwright` abre `wfolio.com/my/disk`, comprueba el login y
  **devuelve éxito sin subir nada**; `subir_a_wfolio` (~528-672) marca cada foto como 'subido'. Hacé la subida de verdad
  (elegir carpeta, subir el archivo, esperar que aparezca en la lista) y marcar 'subido' **sólo después de ver el archivo
  en la carpeta remota** (nombre y tamaño). Si no se puede comprobar: 'pendiente' con el motivo. El mensaje final dice
  cuántas se comprobaron, no cuántas se intentaron.
- `app.py` ~657-662 tiene 6 pestañas; **Video de Vida, Redes y Wfolio no tienen entrada**. Sumá las tres pestañas usando
  los módulos que ya existen (`video_de_vida.py`, `redes.py`, `wfolio.py`).
- `public/descargas/ak-editor.zip` está viejo: le faltan `fotos.py`, `wfolio.py` y `WFOLIO.md`, y `app.py` es la versión
  sin Fotos. Volvé a armarlo con `npm run editor:empaquetar` y sumá en `scripts/empaquetar-ak-editor.mjs` una comparación
  al final: cada archivo de la carpeta (menos `.venv`, `pruebas/`, `__pycache__`) tiene que estar en el ZIP con el mismo
  contenido; si no, el script falla.
- La página `/edicion-videos` dice qué trae el programa: una lista Disponible / En prueba de cada modo (Edición, Fotos,
  Video de Vida, Redes, Wfolio) y la versión del ZIP.

## Bloque 5 — Tareas automáticas: la pantalla no dice por qué una tarea falla (P2)

`/settings/tareas-automaticas` no muestra `ultimoFallo` (sólo lo muestra la pantalla del blog,
`src/app/(app)/settings/contenido-publico/page.tsx` ~499). Las 6 tareas que "nunca corrieron" sí están en el despachador
(`src/lib/automatico/al-entrar-a-la-app.ts`, `MAPA_CRON_IDS`) y fallan por su propia razón (por ejemplo, el blog sin la
IA, Google sin páginas pedidas). Mostrá por tarea: última corrida buena, último intento, motivo del último fallo, y
**"No disponible: falta <conexión>"** cuando depende de algo no conectado (el resumen de la mañana por WhatsApp sin número:
`src/lib/asistente/resumen-manana-whatsapp.ts` ~40-46 contra `src/app/actions/conexiones-estado.actions.ts` ~186).

## Bloque 6 — Contabilidad: lo que el número dice y lo que es (P2)

- `src/app/(app)/empresa/contabilidad/page.tsx` ~136: "Ventas Totales — Suma de todas las facturas generadas" suma también
  presupuestos aceptados sin facturar (`src/lib/commercial-flow/ledger-service.ts` ~255). Texto: "Facturas + presupuestos
  aceptados", como en `/admin` (~283).
- Flujo de caja (`src/app/actions/dashboard.ts` ~351, 6 meses desde el actual): la pantalla dice "Próximos 6 meses (de
  <mes> a <mes>)".
- `src/app/(app)/empresa/dashboard/page.tsx` ~10 cuenta 59 fiestas porque `leerFiestasCrudas`
  (`src/lib/fiesta/leer-fiestas.ts` ~84) no junta las copias importadas `fiesta_doc_*` y `fiesta_verified_*`. Usá
  `dedupeImportedEventCopies` (`src/lib/events/event-ordering.ts` ~14), que ya usa `/eventos`, en el dashboard y en todo
  conteo de fiestas de los paneles. **No se borra ningún registro.**

## Bloque 7 — Portal, invitación, catálogo y borrados (P2)

- Confirmar asistencia (`src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx` ~508-525): "Siguiente" y
  "Confirmar" están en el mismo lugar y `handleSubmit` (~164) no se cuida de dos toques. Sumá la guarda `isSubmitting` al
  principio de `handleSubmit` y que "Confirmar" aparezca deshabilitado un instante (400 ms) al llegar al último paso.
- Portal del cliente (`src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx` ~1239): la tarjeta "Menú" lleva a
  `#portal-organizacion`, que no existe en la fase "financiera" (`src/lib/client-portal/access-phases.ts` ~42). En esa
  fase la tarjeta no muestra flecha ni se puede tocar, y dice "Disponible cuando arranque la organización".
- FAQ del catálogo (`src/data/event-catalogs/shared.ts` ~78): dice "penalidad del 30% sobre el valor señado", y el
  contrato y la app calculan **30% del presupuesto vigente**. El texto pasa a decir lo del contrato.
- El índice del catálogo (`src/app/catalogo/page.tsx` ~58) dice "6 pasos" y la presentación tiene 9 pantallas: que diga
  "3 paquetes" y el número de pantallas de la presentación, o sacá los pasos.
- `/settings/datos` (~278-293): "Eliminar todas las fiestas" con un solo "Sí, eliminar". Que pida escribir **ELIMINAR**,
  como `/eventos` (~485).
- `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx` ~1583: "Subi" → "Subí".

## Bloque 8 — Celular: las cuatro pantallas que se salen de la pantalla (P2)

El auditor midió a 390 px: `settings/whatsapp` (594), `empresa/landing-editor` (501), `empresa/contabilidad/gastos` (405),
`settings/templates` (399). Candidatos: `landing-editor` ~734 (`grid-cols-3` sin `min-w-0`) y ~475 (8 pestañas en
`grid-cols-3`), `settings/templates` ~72 (`CardHeader flex-row` sin `min-w-0`), `settings/whatsapp` ~441 (`grid-cols-2`
sin variante). Medilo en el navegador y arreglalo en cada pantalla (no con `overflow-x: hidden` general, ver orden 287).

## Pruebas

- `src/__tests__/la-hora-de-la-publicacion-es-la-de-uruguay.test.ts`: con `TZ=America/Montevideo` y "ahora" 12:38,
  `aFechaHoraLocal` da `…T12:38`; y una publicación guardada a las 21:00 se muestra 21:00 al editar.
- `src/__tests__/el-texto-de-marketing-sale-completo.test.ts`: todas las plantillas de `BASE_TEMPLATES` renderizadas con
  datos de ejemplo no tienen `[` mayúscula `]` ni `{{`, y el enlace empieza con `https://akproducciones.uy`.
- `herramientas/ak-editor/pruebas/test_wfolio_no_dice_subido_sin_ver.py`: con el servidor simulado que **no** muestra el
  archivo en la carpeta, el estado queda 'pendiente' y el mensaje no dice "completó".
- `src/__tests__/el-editor-que-se-baja-es-el-de-ahora.test.ts`: cada archivo de `herramientas/ak-editor/` (salvo los
  excluidos) está en el ZIP con el mismo contenido.
- `src/__tests__/el-panel-no-cuenta-fiestas-dos-veces.test.ts`: con una `fiesta_doc_X` y una `fiesta_verified_X` del mismo
  nombre y fecha, el conteo del dashboard da 1.
- `tests/e2e/cuatro-pantallas-entran-en-el-celular.spec.ts`: a 390 px, las cuatro pantallas del bloque 8 tienen
  `scrollWidth <= clientWidth`.

```comprobar
no-usa: toISOString().substring(0, 16) en src/components/social-media/NewPostDialog.tsx
usa: SITE_URL en src/app/marketing/page.tsx
no-usa: [NOMBRE] en src/app/marketing/page.tsx
no-usa: [X] años en src/app/marketing/page.tsx
usa: dedupeImportedEventCopies en src/app/(app)/empresa/dashboard/page.tsx
usa: ultimoFallo en src/app/(app)/settings/tareas-automaticas/page.tsx
usa: ELIMINAR en src/app/(app)/settings/datos/page.tsx
no-usa: sobre el valor señado en src/data/event-catalogs/shared.ts
prueba: src/__tests__/la-hora-de-la-publicacion-es-la-de-uruguay.test.ts
prueba: src/__tests__/el-texto-de-marketing-sale-completo.test.ts
prueba: herramientas/ak-editor/pruebas/test_wfolio_no_dice_subido_sin_ver.py
prueba: src/__tests__/el-editor-que-se-baja-es-el-de-ahora.test.ts
prueba: src/__tests__/el-panel-no-cuenta-fiestas-dos-veces.test.ts
prueba: tests/e2e/cuatro-pantallas-entran-en-el-celular.spec.ts
```
