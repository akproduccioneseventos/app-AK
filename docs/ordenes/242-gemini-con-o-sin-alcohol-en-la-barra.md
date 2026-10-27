# Orden 242 — Elegir "Con alcohol" o "Sin alcohol" al pedir un trago (27/10/2026)

**Para Gemini. Una sola propuesta**, rama nueva desde `main` actualizada (`gemini/orden-242-con-o-sin-alcohol`).
Si un bloque se traba, entregá el resto y avisá cuál faltó. Antes de decir "terminé", pasá
`docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste. Toca stock y menores: el candado de la plata
(`src/__tests__/el-candado-de-la-plata.test.ts`) tiene que seguir en verde.

Pedido del dueño: *"en los tragos que también son sin alcohol debería haber dos botones, para que cuando elijan
el trago puedan poner con alcohol o no"*. Y de su carta: **lo alcohólico es sólo para mayores de 18; a un menor
se le muestra EXCLUSIVAMENTE la versión sin alcohol.**

## Lo que ya está (no se toca)

- La carta definitiva de 12 tragos en `defaultCartaTragosData.items` (`src/lib/fiesta-defaults.ts`), con fotos
  en `public/images/tragos/`. Tipo `Trago` en `src/types/fiesta.ts` (~1050), con:
  - `recetaIngredientes`: versión con alcohol reducido (15 ml). **Es la que hoy descuenta stock.**
  - `soloMayores?: boolean`: true en los 12.
  - `recetaSinAlcohol?: string[]`: texto para mostrar.
  - `nombreSinAlcohol?: string`: en cuatro tragos, que son "Cola con naranja", "Naranjada", "Cola con limón" y
    "Pomelo con limón".
- Las recetas y cantidades **no se cambian**. No se agregan tragos ni insumos inventados.
- `createBarDrinkOrder` (`src/app/actions/fiesta/barra-tecnologica.actions.ts:617`). No le cambies:
  - el tope de pedidos;
  - el control del enlace del invitado (`findAuthorizedGuest`);
  - el reintento por `clientRequestId`;
  - la devolución de botellas pendientes.

## Bloque 1 — los datos de la versión sin alcohol para descontar stock

En `Trago`, agregá `recetaIngredientesSinAlcohol?: RecetaIngrediente[]` (misma forma que `recetaIngredientes`).
Cargalo en los 12 tragos de `fiesta-defaults.ts` **sacando los números del bloque `sin_alcohol` de
`docs/ordenes/242-recetas-fuente.json`**, que es copia del archivo del dueño. Usá las mismas reglas que la
versión con alcohol:

- "Completar hasta 300 ml" vale 300 menos los demás líquidos y menos 100 ml de hielo.
- No se descuentan hielo, azúcar, agua, fruta suelta ni limón.
- Los insumos ya existen en `src/data/insumos.json`. No agregues otros.

## Bloque 2 — el servidor decide, no la pantalla

1. En `CreateBarDrinkOrderInput` (`src/types/barra-tecnologica.ts:111`), agregá `version?: 'con_alcohol' |
   'sin_alcohol'`. Si no viene, es `'sin_alcohol'`: lo seguro.
2. En `createBarDrinkOrder` y en `createBarmanManualOrder` (~789), y también al cambiar un pedido
   (`changeBarDrinkOrder` ~897):
   - Si hay invitado (`invitado`) y su `categoria` no es `'Adulto'` (`'Niño' | 'Adolescente' | 'Niño/Adolescente'`
     de `CategoriaInvitado`, `src/types/fiesta.ts:25`), un pedido `con_alcohol` **se rechaza** con el texto "Este
     trago con alcohol es sólo para mayores de 18. Elegí la versión sin alcohol."
   - Un invitado **sin categoría** se trata como adulto, como hoy. El tótem por nombre sin invitado también.
   - **El stock:**
     - con `sin_alcohol` se descuenta `recetaIngredientesSinAlcohol`;
     - con `con_alcohol`, `recetaIngredientes`;
     - mirá la función de ~295, que recorre `drink.recetaIngredientes`;
     - **la devolución de botellas de un pedido cancelado o cambiado tiene que devolver la misma versión que se
       descontó**: guardá `version` en el `BarDrinkOrder`.
3. El pedido guardado lleva `version` y el nombre que corresponde: con `sin_alcohol` y `nombreSinAlcohol`, se
   muestra ese nombre. Así el barman ve "Naranjada" y no "Destornillador".

## Bloque 3 — los dos botones

En cada pantalla donde se pide o se muestra un trago, al elegirlo aparecen dos botones grandes, **"Con alcohol"**
y **"Sin alcohol"**, con su receta abajo. Las pantallas son:

- `src/app/evento/barra/[fiestaId]/page.tsx` (el tótem);
- `src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx` (el celular del invitado);
- `src/app/evento/barra/[fiestaId]/barman/page.tsx` (el pedido manual);
- `src/components/invitacion/templates/CartaTragosMenu.tsx` (la carta en la invitación, que sólo muestra).

Qué muestra cada botón:

- **"Sin alcohol"** muestra `nombreSinAlcohol`, si existe, con la línea chica "Sabor distinto, sin alcohol".
- **Invitado menor:** sólo aparece "Sin alcohol", ya elegido. No se muestra la receta con alcohol.
- **Pantalla del barman:** el pedido dice en grande **CON ALCOHOL** o **SIN ALCOHOL**, con colores distintos.
- **Carta impresa** (`src/app/(app)/fiestas/nueva/carteleria/page.tsx`): las dos recetas, con la leyenda "Tragos con
  alcohol sólo para mayores de 18 años".

Usá la skill de celular primero, con botones de 48 px como mínimo.

## Bloque 4 — pruebas que miren el resultado

**Jest**, en `src/__tests__/la-barra-no-le-da-alcohol-a-un-menor.test.ts`, con la forma real de los datos:

- (a) Invitado `categoria: 'Adolescente'` pide `con_alcohol`: se rechaza y no se descuenta nada.
- (b) El mismo invitado pide `sin_alcohol` de "Destornillador": se descuenta naranja y **no vodka**, y el pedido
  dice "Naranjada".
- (c) Adulto pide `con_alcohol`: se descuentan 15 ml de vodka.
- (d) Pedido sin `version`: se trata como sin alcohol.
- (e) Cancelar un pedido `sin_alcohol` devuelve la versión sin alcohol, no vodka.
- (f) Cambiar un pedido de un menor a `con_alcohol` se rechaza.
- Rompé a propósito el control de (a) y fijate que la prueba se ponga en rojo.

**Navegador**, en `tests/e2e/la-barra-con-o-sin-alcohol.spec.ts`, cortando y simulando la respuesta del servidor:

- en el tótem, tocar un trago muestra los dos botones;
- "Sin alcohol" en Fernet con Coca muestra "Cola con naranja";
- lo que se manda al servidor lleva `version: 'sin_alcohol'`.

Corré esas solas. Después corré `npx tsc --noEmit`, `npx jest --silent` y `npm run "publicar?:rapido"`, y pegá las
últimas líneas de cada uno.

```comprobar
usa: recetaIngredientesSinAlcohol en src/lib/fiesta-defaults.ts
usa: recetaIngredientesSinAlcohol en src/app/actions/fiesta/barra-tecnologica.actions.ts
usa: version en src/types/barra-tecnologica.ts
usa: Sin alcohol en src/app/evento/barra/[fiestaId]/page.tsx
usa: Sin alcohol en src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx
usa: SIN ALCOHOL en src/app/evento/barra/[fiestaId]/barman/page.tsx
usa: nombreSinAlcohol en src/components/invitacion/templates/CartaTragosMenu.tsx
usa: mayores de 18 en src/app/(app)/fiestas/nueva/carteleria/page.tsx
prueba: src/__tests__/la-barra-no-le-da-alcohol-a-un-menor.test.ts
prueba: tests/e2e/la-barra-con-o-sin-alcohol.spec.ts
```

## Bloque 5 — la Caipirinha no aparece en "Con alcohol" (Codex 717, 27/10/2026)

`getDrinkTags` (`src/lib/barra-tecnologica.ts`) arma las etiquetas leyendo el texto del trago. La Caipirinha no
cae en "Con alcohol", y `visibleDrinks` la saca de esa categoría.

- Con la carta nueva, la etiqueta sale del dato (`soloMayores`, `recetaIngredientes` con alcohol), **no del
  nombre ni de la descripción**.
- Un trago sin datos claros **no** se marca "sin alcohol".
- No borres ni cambies la receta, la foto ni el id para taparlo.

Que el dato llegue entero de la carta maestra a la fiesta, de la fiesta al dato público, y de ahí al tótem y al
portal.

Prueba: la Caipirinha con caña figura en "Con alcohol", y un trago sin alcohol de verdad no pasa a "Con alcohol" por
el nombre. La sonda de Codex está en `docs/evidencias/717-barra-filtro-carta-sonda.cjs`, en la rama
`codex/697-auditoria-automatismos-20261026`.

```comprobar
# Bloque 5
usa: soloMayores en src/lib/barra-tecnologica.ts
```
