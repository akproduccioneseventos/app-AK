# Orden 75 — El cliente ve su salón en 3D, y la escena se arma sola

**Para Gemini. UNA SOLA PROPUESTA con los tres bloques.** Si un bloque se traba, entregá los
otros igual y decí cuál faltó.

Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste.

**De dónde sale:** el dueño lo pidió el 20 de septiembre de 2026. Sus palabras: *"para el
cliente es un sueño ver antes"*. La investigación ya está hecha; abajo van los nombres exactos.

**Lo que YA existe y NO se rehace:**

- El salón en 3D de verdad: `src/components/salon-3d/SalonScene.tsx`, con sus piezas en
  `src/components/salon-3d/elements/` (mesas, pista, escenario, iluminación, objetos de deco).
  Recibe todo por la propiedad `decoracion`.
- `src/components/salon-3d/SalonSceneAislada.tsx`, que es el envoltorio que ya se usa.
- Las dos pantallas del equipo que lo muestran: el configurador de la reunión de cierre
  (`src/app/(app)/empresa/configurador-reunion/page.tsx:424`) y el croquis del salón
  (`src/app/(app)/empresa/salones/[id]/croquis/page.tsx:429`). **No se tocan.**
- La captura en foto que hoy le llega al cliente: `handleCapture3D` en
  `src/app/(app)/fiestas/nueva/invitados/layout/page.tsx:522`, guarda
  `decoracion.salonPreview3dUrl`. **Esa foto se queda**: es el respaldo para cuando el 3D no
  pueda dibujarse.

**Lo que NO tocás:** plata, cobros, comida, permisos y quién ve qué.
`src/lib/client-portal/public-fiesta.ts` decide **qué ve el cliente**, así que el cambio de
ese archivo lo hago yo: en el bloque 1 lo dejás pedido y sigo yo. Tampoco se toca
`apphosting.yaml` ni nada que aumente lo que se paga por mes.

---

## Bloque 1 — El cliente abre el 3D en su portal y lo gira con el dedo

**Hoy:** el portal muestra **una foto** del 3D
(`src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx:1404`, la imagen
`fiesta.decoracion.salonPreview3dUrl`). El cliente la ve y no la puede girar.

**Qué se hace:** en ese mismo lugar, **mostrar el salón en 3D de verdad**, con
`<SalonSceneAislada><SalonScene decoracion={...} /></SalonSceneAislada>`, cargado con
`dynamic(..., { ssr: false })` como ya se hace en las dos pantallas del equipo.

**El dato que necesita la escena** es el plano de la fiesta, que vive en:

- `fiesta.decoracion.salonElements` — las mesas y los objetos, con `x`, `y`, `width`,
  `height`, `rotation`, `category` y `name`.
- `fiesta.decoracion.pixelsPerMeter` — la escala.

**Ese dato hoy NO viaja al portal.** `mapFiestaToClientPortal`
(`src/lib/client-portal/public-fiesta.ts:110`) manda la decoración recortada y **no manda el
plano**. Dejá escrito en la propuesta que lo necesitás y **lo agrego yo**, porque ese archivo
decide qué ve el cliente. Mientras tanto, programá la pantalla contra esos dos campos.

**Y esto es obligatorio, no opcional:**

- **Sólo esos dos campos.** Nunca las notas internas del equipo
  (`notasParaElEquipo`, costos, proveedores). Ya pasó una vez que algo interno se le publicó al
  cliente.
- **En el celular tiene que andar.** Es donde lo va a mirar. Leé la habilidad
  `celular-primero`: alto fijo, sin desbordes, y un dedo alcanza para girar.
- **Si el 3D no puede dibujarse** —celular viejo, sin aceleración— **se muestra la foto de
  siempre** (`salonPreview3dUrl`). Nunca un cuadro vacío ni un cartel de error técnico.
- **Si todavía no hay plano armado**, el cartel que ya existe
  (`PortalEmptyState`, línea 1413) se queda como está.

```comprobar
archivo: src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx
usa: SalonScene en src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx
prueba: tests/e2e/el-cliente-gira-su-salon-en-3d.spec.ts
```

---

## Bloque 2 — La escena se arma sola con lo que el cliente contrató

**Hoy** el plano se dibuja a mano en la pantalla del layout. Si el presupuesto tiene pista LED,
arco y centros de mesa, **nadie los pone solos**.

**Qué se hace:** un botón en la pantalla del layout
(`src/app/(app)/fiestas/nueva/invitados/layout/page.tsx`) que **arma la primera versión sola**:

- Las **mesas**, según la cantidad de invitados confirmados, con la misma cuenta que ya usa
  `autoAssignTables` (se llama en la línea ~570 de esa misma pantalla). **No inventes otra
  cuenta de mesas**: usá `contarMesas` de `src/lib/mesas/contar-mesas.ts`, que se hizo para que
  todas las pantallas cuenten igual.
- La **pista**, el **escenario** y los **objetos de decoración** que correspondan a lo
  contratado. Para saber qué contrató, mirá `fiesta.modulosContratados` y los renglones del
  presupuesto; para reconocerlos por nombre ya existe `itemMatchesKeywords` en
  `src/app/actions/fiesta/fiesta.actions.ts` (~línea 262). **Reusala, no escribas otra.**

**Es una propuesta, no una imposición:** deja el plano armado y el equipo lo acomoda. **Nunca
pisa un plano que ya tiene cosas**: si `decoracion.salonElements` no está vacío, el botón
pregunta antes.

```comprobar
archivo: src/app/(app)/fiestas/nueva/invitados/layout/page.tsx
usa: contarMesas en src/app/(app)/fiestas/nueva/invitados/layout/page.tsx
prueba: src/__tests__/el-salon-se-arma-solo-con-lo-contratado.test.ts
```

---

## Bloque 3 — Más piezas, para que se parezca al salón de verdad

**Hoy** las piezas en 3D son: mesa, pista de baile, escenario, iluminación y un objeto genérico
de decoración (`src/components/salon-3d/elements/`), más el arco (`Arco3D` en `SalonScene.tsx`).

**Qué se agrega**, y son las que aparecen en las fiestas de AK: **barra**, **sector de sillones
o living**, **mesa de la torta**, **photo-opportunity / backdrop**, y **pantalla LED**.

**Cómo se enganchan, y es lo que decide que aparezcan:** `SalonElement`, en
`SalonScene.tsx:44`, elige la pieza mirando `element.category` y `element.name` en minúsculas
(líneas 71-72). Ahí se agregan los casos nuevos. **Y tienen que existir también como opción en
la pantalla del layout**, si no nadie las puede poner.

**Ojo con lo que ya costó caro:** una pieza que se agrega al 3D y no se puede elegir en la
pantalla del layout **es una pieza que no ve nadie**. Van las dos mitades o no va.

```comprobar
archivo: src/components/salon-3d/SalonScene.tsx
usa: barra en src/app/(app)/fiestas/nueva/invitados/layout/page.tsx
prueba: src/__tests__/la-vista-3d-pone-cada-mueble-en-su-lugar.test.ts
```

---

## Lo que tiene que comprobar la prueba

La prueba de navegador del bloque 1 **tiene que mirar el resultado en la pantalla del cliente**,
no que el nombre aparezca en el código:

- Que al abrir el portal con una fiesta que tiene plano, **aparece el salón en 3D** (el dibujo,
  no la foto).
- Que **girándolo cambia lo que se ve**.
- Que con una fiesta **sin plano** aparece el cartel de siempre y **no** un cuadro roto.

La sesión y la fiesta de prueba se arman con `tests/e2e/helpers/fiesta-de-prueba.ts`; el portal
del cliente se abre con su clave (`clientPortalSettings.accessKey`), como ya hacen las pruebas
del portal que están en `tests/e2e/`.

**La pregunta antes de dar cada línea por buena:** *¿esto daría verde con la función apagada?*
Si la respuesta es sí, está mal escrita.
