# 94 — Tótem, pantalla gigante y estaciones: a la par de Instawall y un paso arriba

**Para:** Gemini.
**Escrita por:** Claude, el 28 de septiembre de 2026.
**Pedido del dueño:** *"yo quiero todo y más, y todo funcionando sin errores"*. Quiere reemplazar la
plataforma paga que usa hoy (tipo Instawall) y usar esto **el fin de semana que viene**.

## Cómo se entrega

- **UNA SOLA propuesta con los seis bloques.** Si un bloque se traba, entregá el resto igual, en la
  misma propuesta, y avisá cuál faltó.
- **Arrancá desde la versión principal de ahora** (después de la PR que trae
  `src/lib/entertainment/vigencia-del-afiche.ts`). No uses una rama vieja.
- Antes de decir "terminé", pasá por **`docs/ANTES-DE-ENTREGAR.md`** sobre lo que tocaste.
- Tipos en cero, `npx jest` en verde, `npm run check:acentos` limpio y `npm run "publicar?"` en verde.
- Anotá cada bloque en `docs/YA-RESUELTO.md`, con qué se hizo y **por qué**.
- Sumá una línea por cada función nueva al bloque `rubro Pantalla gigante` de
  `docs/COMPARACION-CON-EL-RUBRO.md`, y al de la estación que corresponda.

## Lo que NO se toca

- **Los permisos del QR** (`access=`, `getEntertainmentLaunchToken`, `getPermisoDelAfiche`,
  `src/lib/auth/entertainment-token.ts`). Son de Claude y ya están resueltos.
- La moderación actual (`esAprobadoParaMostrar` en `src/lib/social-fiesta/visibilidad.ts`) y el
  filtro de IA (`src/lib/social-fiesta/content-safety-ai.ts`). Funcionan.
- Los textos que ya ve el invitado o el cliente. Sólo se agregan textos nuevos.
- **Nada de Instagram por hashtag.** Pide autorización de Meta; queda para después.

---

## Bloque 1 — Que el operador pueda elegir lo que las estaciones ya saben hacer

**Lo roto:** estos ajustes están en `EntertainmentStationRuntimeConfig`
(`src/lib/entertainment/station-config.ts`, líneas ~55-75). Se leen y se acotan en
`getEntertainmentStationConfig` (~185-205), y las estaciones los usan. Pero **no hay ningún
control en ningún panel para cambiarlos**, así que siempre quedan en el valor de fábrica. La lista
del rubro los da como hechos. Eso es una promesa que la app no cumple.

**Dónde:** el panel `src/app/(app)/fiestas/nueva/entretenimiento/page.tsx`, en el mismo grupo de
"Cuenta regresiva" (~línea 1590). Usá `updateStation(activeStationId, {...})`, como hacen los
campos de al lado. Cada control aparece **sólo en la estación que lo usa**:

| Campo | Estación | Control | Rango (el de `station-config.ts`) |
|---|---|---|---|
| `fotosPorTanda` | fotocabina | número | 1 a 4, por defecto 3 |
| `copiasImpresion` | fotocabina | número | 1 a 10, por defecto 1 |
| `tamanoPapel` | fotocabina | lista | `10x15`, `5x15`, `13x18` |
| `disenoImpresion` | fotocabina | lista | `una`, `dos`, `tira` |
| `velocidadRecuerdo` | fotocabina | lista | `normal`, `lenta`, `boomerang` |
| `enableBeautyFilter` | fotocabina, espejos, touchpix | interruptor | — |
| `enableChromaKey` | fotocabina | interruptor | — |
| `recorteSinTela` | fotocabina | interruptor, con el texto "fondo sin tela verde" | — |
| `vueltas360` | plataforma360 | número | 1 a 10, por defecto 2 |
| `cuadrosDelLoop` | bogue | número | 5 a 60, por defecto 15 |
| `orientation` | bogue, fotocabina | lista | `vertical`, `horizontal`, `cuadrada` |

- **No agregues un control para `segundosCuentaRegresiva`.** Ya existe `countdownSeconds` y son lo
  mismo. Dos controles para un solo dato confunden.
- **Ojo:** en `src/app/evento/fotocabina/[fiestaId]/page.tsx`, ~línea 1248, la pantalla del operador
  hace `fiesta.station.velocidadRecuerdo = vel`. Eso cambia el valor sólo en esa pestaña y se pierde
  al recargar. Dejalo como está: es la elección rápida en el salón. Lo del panel es el valor con el
  que arranca la estación.
- Los tres campos que **se editan y nadie lee** (`operatorName`, `deviceName`, `location`) sirven
  para el puntaje de preparación del panel. **No los saques.**

**La prueba** (`src/__tests__/los-ajustes-del-panel-llegan-a-la-estacion.test.ts`) **tiene que comprobar** que un valor guardado desde el panel llega igual a
`getEntertainmentStationConfig(...)`: guardás `cuadrosDelLoop: 30` y la estación recibe 30, no 15.
Tiene que ponerse en rojo si el panel no manda el campo.

## Bloque 2 — El muro se configura como en Instawall

Todo en `SocialGallerySettings` (`src/types/fiesta.ts`, ~línea 804). Se edita en el panel del equipo
`src/app/(app)/fiestas/nueva/muro-social/page.tsx` y se lee en
`src/app/evento/muro-en-vivo/[fiestaId]/page.tsx`.

1. **Fondo del muro.** Hoy `fondoMuro` se lee (~línea 284) de `station.fondoMuro` o de
   `socialGallerySettings.fondoMuro`, pero **no se edita en ningún lado**.
   - Agregá `fondoMuro?: string` al tipo `SocialGallerySettings`.
   - Poné en el panel un selector con vista previa de `FONDOS_MURO` (~línea 52).
   - **Sumá al menos 12 fondos más** a `FONDOS_MURO`, pensados por tipo de fiesta: boda, 15 años,
     cumpleaños infantil y corporativo. Sólo degradados y dibujos hechos con CSS; nada de imágenes
     pesadas.
2. **Fondo propio.** Campo nuevo `fondoMuroImagenUrl?: string`. Se sube igual que la portada, que ya
   se sube en ese panel (~línea 402, `mobileControlCoverUrl` con `uploadScreenMediaAsset`). Si está
   cargado, **tapa al fondo elegido**, con un oscurecido encima para que las fotos se lean.
3. **Cómo se ve.**
   - `currentLayout` ya existe (`'slideshow' | 'masonry'`), pero sólo se cambia desde el portal del
     cliente (`src/app/portal-cliente/[id]/muro-social/page.tsx:608`). Llevalo también al panel del
     equipo.
   - Campo nuevo `tamanoFotosMosaico?: 'chica' | 'mediana' | 'grande'` que cambie cuántas columnas usa
     `MasonryLayout` (~línea 1998; hoy es fijo `grid-cols-2 lg:grid-cols-3` y 6 fotos). Chica: 4
     columnas y 12 fotos. Mediana: 3 columnas y 6 fotos. Grande: 2 columnas y 4 fotos.
4. **Segundos por foto.** Campo nuevo `segundosPorFoto?: number`, de 3 a 30, por defecto 6.
   Reemplaza a `SLIDESHOW_DURATION_MS` (~línea 1729) en `SlideshowLayout` (~línea 1799). Los
   tiempos especiales de video (35 s) y ranking (8 s) quedan como están.
5. **La portada mientras no hay fotos ya existe** (`mobileControlCoverUrl` → `EmptyWallState`,
   ~línea 605). Ojo: en la línea ~710 hay un segundo `<EmptyWallState>` **sin** `coverImageUrl`.
   Pasale la portada también ahí.

**La prueba de navegador** (`tests/e2e/el-muro-se-configura.spec.ts`) **tiene que comprobar el resultado en pantalla, no el nombre del campo:**
- con `fondoMuroImagenUrl` cargado, el fondo de la pantalla es esa imagen (estilo calculado);
- con `segundosPorFoto: 3`, la foto cambia antes de los 6 segundos;
- con `tamanoFotosMosaico: 'chica'` se ven más fotos que con `'grande'`.

## Bloque 3 — Imprimir las fotos que suben los invitados, con límite y marco

**Ya existe la estación de impresión:** `src/app/evento/impresion/[fiestaId]/page.tsx`. Tiene cola,
impresión automática y confirmación de que salió. Es lo que hacen los tótems que imprimen. **No la
rehagas.** Falta esto:

1. **Límite por invitado.** Campo nuevo `maxImpresionesPorPersona?: number` en
   `SocialGallerySettings` (0 = sin límite, por defecto 2). Se cuenta por `post.guestId` y, si no
   hay, por `post.authorName`. Poné la cuenta en una función pura nueva,
   `src/lib/social-fiesta/limite-de-impresion.ts`, con esta forma:
   `puedeImprimir(post, impresos: SocialGalleryPost[], limite: number): boolean`. La cola la usa para
   saltear lo que pasó el límite y lo muestra como "llegó a su límite".
2. **Marco de impresión.** Al imprimir, la foto sale con el nombre del evento, la fecha y el logo
   (`templateSettings?.logoUrl` o `companyInfo?.logoUrl`, como el muro en la línea ~380), en una
   franja abajo. Interruptor nuevo `marcoEnImpresion?: boolean`, por defecto `true`.
3. **Que se llegue.** Agregá un botón "Estación de impresión" en el panel de tótems
   `src/app/(app)/fiestas/nueva/pantallas-totem/page.tsx` y en el tablero
   `src/app/(app)/fiestas/[id]/entretenimiento/control/page.tsx`.

**La prueba** (`src/__tests__/el-limite-de-impresion-por-invitado.test.ts`) usa `puedeImprimir` con dos invitados: uno llega al límite y el otro no. Si se saca el
límite, tiene que ponerse en rojo.

## Bloque 4 — El tótem no se queda en un error si arranca sin internet

En `src/app/evento/totem/[fiestaId]/[totemId]/page.tsx`, `loadData` (~línea 83). Si la **primera**
carga falla, hoy queda en `loadError` (~línea 221) con un cartel fijo. Hacé esto:
- reintentar solo cada 5 segundos;
- mientras tanto, mostrar "Esperando conexión, se reintenta solo";
- cuando conecta, arrancar normal.

Si ya había cargado y se corta, que siga mostrando lo último que tenía. Hoy ya lo hace; no lo
rompas.

**La prueba** (`tests/e2e/el-totem-arranca-sin-internet.spec.ts`) corta la red en la primera carga, la vuelve a dar y comprueba que el tótem termina
mostrando su título.

## Bloque 5 — "Y más": copiar la configuración de otra fiesta

Es lo que hacen dslrBooth y LumaBooth. Es lo que más trabajo le ahorra al equipo: no rearmar todo
en cada fiesta.

- En el panel `src/app/(app)/fiestas/nueva/entretenimiento/page.tsx`, botón "Copiar de otra
  fiesta". Muestra la lista de fiestas y al elegir una copia:
  - `others.entretenimiento.modules` (**sin** `media` ni `checklist` hecho);
  - de `socialGallerySettings`, sólo los campos de diseño: `fondoMuro`, `fondoMuroImagenUrl`,
    `currentLayout`, `tamanoFotosMosaico`, `segundosPorFoto`, `accentColor`, `ledMarquee*`,
    `marketingTicker*`, `totemScreens` (**sin** `qrUrl`), `maxImpresionesPorPersona` y
    `marcoEnImpresion`.
- **Nunca se copian** fotos, posts, invitados, ganadores de sorteos, momentos, `activeGame` ni nada
  con datos de personas.
- Pide confirmar antes de pisar lo que ya hay.
- Poné la elección de campos en una función pura, `src/lib/entertainment/copiar-configuracion.ts`,
  con la forma `copiarConfiguracion(origen, destino)`, que devuelva lo que se guarda.

**La prueba** (`src/__tests__/copiar-configuracion-no-copia-personas.test.ts`) usa esa función pura y comprueba dos cosas: que el diseño pasa, y que **ningún** dato de
personas pasa (sembrá posts, ganadores y `activeGame` en la fiesta de origen y comprobá que no
aparecen).

## Bloque 6 — La lista del rubro dice la verdad

En `docs/COMPARACION-CON-EL-RUBRO.md`, sumá las líneas de todo lo nuevo:
- **fondo propio del muro**, **segundos por foto**, **tamaño del mosaico** y **copiar de otra
  fiesta**, en el bloque de Pantalla gigante;
- **límite de impresión por invitado** y **marco de impresión**, también en Pantalla gigante;
- **ajustes editables**, en Fotocabina.

Cada línea con su `usa:` apuntando a la **pantalla que lo usa**.

```comprobar
usa: cuadrosDelLoop en src/app/(app)/fiestas/nueva/entretenimiento/page.tsx
usa: vueltas360 en src/app/(app)/fiestas/nueva/entretenimiento/page.tsx
usa: tamanoPapel en src/app/(app)/fiestas/nueva/entretenimiento/page.tsx
usa: recorteSinTela en src/app/(app)/fiestas/nueva/entretenimiento/page.tsx
usa: fondoMuroImagenUrl en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
usa: segundosPorFoto en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
usa: tamanoFotosMosaico en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
usa: fondoMuro en src/app/(app)/fiestas/nueva/muro-social/page.tsx
archivo: src/lib/social-fiesta/limite-de-impresion.ts
usa: puedeImprimir en src/app/evento/impresion/[fiestaId]/page.tsx
usa: marcoEnImpresion en src/app/evento/impresion/[fiestaId]/page.tsx
usa: /evento/impresion/ en src/app/(app)/fiestas/nueva/pantallas-totem/page.tsx
usa: Esperando conexión en src/app/evento/totem/[fiestaId]/[totemId]/page.tsx
archivo: src/lib/entertainment/copiar-configuracion.ts
usa: copiarConfiguracion en src/app/(app)/fiestas/nueva/entretenimiento/page.tsx
prueba: src/__tests__/los-ajustes-del-panel-llegan-a-la-estacion.test.ts
prueba: tests/e2e/el-muro-se-configura.spec.ts
prueba: src/__tests__/el-limite-de-impresion-por-invitado.test.ts
prueba: tests/e2e/el-totem-arranca-sin-internet.spec.ts
prueba: src/__tests__/copiar-configuracion-no-copia-personas.test.ts
```
