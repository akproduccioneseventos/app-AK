# Orden 16 — Que todo lo que existe funcione

**Para Gemini. UNA SOLA PROPUESTA con todos los bloques.** Si un bloque se traba,
entregá el resto igual, en la misma propuesta, avisando cuál faltó.

---

## Por qué existe esta orden

El dueño lo dijo así: *"lo más difícil es auditar la app de tal manera que quede
reparada y todo funcionar y que todo lo que exista funcione"*.

Las auditorías anteriores fallaron todas por el mismo motivo: **preguntaban si el
código estaba escrito, no si hacía algo.** La fotocabina compilaba, tenía las
pruebas en verde, y en la fiesta no andaba.

Ahora hay un control que mide eso. Se corre así:

```
npm run lo-que-se-dijo:todo
```

Devuelve la lista completa y actualizada. **Trabajá contra esa lista, no contra
esta hoja**, porque la lista se mueve a medida que se repara.

Hoy marca 301 cosas, de tres clases:

| Clase | Cuántas | Qué significa |
|---|---|---|
| Nadie lo llama | 30 | Está escrito y ninguna pantalla lo usa. En pantalla no pasa nada. |
| Pantalla sin prueba de resultado | 209 | Alguna prueba la abre, ninguna mira que muestre lo que promete. |
| Acción sin prueba de resultado | 62 | Nadie comprobó nunca que haga lo que dice. |

---

## Lo que NO entra en esta orden

**Plata, cobros, comida y permisos los hace Claude.** No los toques. Son:

`fiesta/pagos.actions.ts`, `payment-plans.ts`, `financial-integrity.ts`,
`fiesta/costos.actions.ts`, `comparativa-ganancias.ts`, `admin-reset.ts`,
`social-admin.ts`, `simple-auth.ts`, `fiesta/catering.actions.ts`,
`fiesta/bebidas.actions.ts`, `fiesta/reposteria.actions.ts`, y las pantallas de
`contabilidad`, `presupuestos`, `pagos`, `admin` y `settings/ajuste-precios`.

---

## Bloque 1 — Lo que nadie llama: engancharlo o borrarlo

Por cada uno de los 30, decidí **una** de dos cosas y hacela:

- **Engancharlo**, si el dueño lo pidió alguna vez y falta la puerta para llegar.
  Entonces agregá también la prueba que comprueba que se ve el resultado.
- **Borrarlo**, si nadie lo pidió nunca. Código muerto que parece vivo es peor que
  no tenerlo: la próxima auditoría lo cuenta como una función que existe.

**Escribí en la propuesta cuál elegiste para cada uno y por qué**, en una línea.

Tres que **ya se verificaron a mano y son reales**, para que no pierdas el viaje:

- `src/components/invitados/InvitadoQR.tsx`
- `src/components/social-wall/QrFlyerGenerator.tsx`
- `src/lib/server-cache.ts` — una capa entera de memoria rapida (`cacheGet`, `cacheSet`,
  `cacheInvalidate`, `cacheInvalidatePrefix`, `cachedFetch`) que **no usa ningun archivo**.
  Aparece nombrada una sola vez, y es dentro de un comentario. Decidi si engancharla donde
  haga falta o borrarla, pero no la dejes como esta.

## Bloque 2 — Las pantallas del cliente y del invitado, con prueba de resultado

Empezá por las que ve gente de afuera, en este orden:

1. `/evento/**` (todo lo que toca el invitado en la fiesta)
2. `/portal-cliente/**` y `/portal/**`
3. `/pago/**`
4. Las páginas de venta públicas

**Qué es una prueba de resultado y qué no:**

```
MAL   await expect(page.locator('h1')).toBeVisible();
BIEN  await expect(page.locator('h1')).toHaveText('Mi fiesta');
BIEN  await expect(page.getByTestId('total')).toHaveText('$ 45.000');
BIEN  expect(await filas.count()).toBeGreaterThan(0);
```

La regla: **si la pantalla se dibujara vacía y la prueba igual pasara, no sirve.**

**No escribas pruebas para que el control se calle.** Una prueba que no
comprobaría nada real es peor que ninguna: tapa el agujero sin cerrarlo.

## Bloque 2 bis — La fotocabina: la personalizacion que no llega a la pantalla

Verificado a mano el 28 de agosto de 2026. **La fotocabina anda y toma sola el fondo, el
color, el nombre del agasajado y la fecha de la invitacion digital de la fiesta** —eso esta
bien y no se toca—. Pero hay dos cosas escritas que no hacen nada:

### 1. Las "plantillas" de estacion no las mira nadie

En `src/app/(app)/fiestas/nueva/entretenimiento/page.tsx` cada estacion guarda una
plantilla con ocho ajustes: `filterPreset`, `backgroundStyle`, `animationStyle`,
`printLayout`, `qualityPreset`, `overlayName`, `accentColor` y `musicTrack`.

**La pantalla de la fotocabina lee UNO solo: `accentColor`.** Los otros siete se guardan y
no los usa nadie. Contado con `grep` sobre
`src/app/evento/fotocabina/[fiestaId]/page.tsx`: cero apariciones de cada uno.

Elegi una de dos y hacela:

- **Que funcionen**, empezando por los tres que se notan: el filtro de color, el estilo de
  fondo y la animacion del disparo. Con prueba que compruebe el resultado.
- **Sacarlos**, si no se van a usar. Una plantilla que no cambia nada es peor que no
  tenerla: la proxima auditoria la cuenta como una funcion que existe.

### 2. Los marcos se pueden limitar por codigo pero no hay donde armar la lista

La fotocabina filtra los marcos por `station.marcosHabilitados`, pero **ninguna pantalla
deja armar esa lista**. Hoy salen todos los marcos siempre. Falta el control en la pantalla
de configurar entretenimiento.

Esto importa para el negocio: en una fiesta de quince no queres que aparezca el marco de
casamiento.

## Bloque 3 — Las acciones que quedan

Las 62 menos las de la lista de arriba. Una prueba por acción que compruebe **lo
que queda guardado**, no que la función no explote.

## Bloque 4 — Dejar el control en verde para lo nuevo

Al terminar, `npm run "publicar?"` tiene que pasar los siete pasos. El paso nuevo
se llama **"Lo que se dijo es lo que es"** y frena si algo de lo que agregaste no
se usa o no tiene prueba de resultado.

---

## Cómo se entrega

- **Una sola propuesta.** Cada fusión se paga.
- **La documentación viaja adentro**: anotá en `docs/YA-RESUELTO.md` qué reparaste
  y qué borraste, y actualizá `docs/MANUAL-DE-LA-APP.md` si sacaste algo.
- Antes de subir, corré `npm run "publicar?"`. Si no pasa, no subas.
