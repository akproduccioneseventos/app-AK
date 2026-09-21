# Orden 66 — La carga operativa se sincroniza bien entre dos operadores

**Para Gemini.** **UNA SOLA propuesta con los dos bloques.** Si uno se traba, entregá el otro y
avisá cuál faltó. Va junto con la orden 65: **es la misma pantalla, así que entra todo en la
misma propuesta.**

**Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`**: son quince preguntas.

## Por qué

Lo encontró Codex el 18 de septiembre de 2026 y lo verifiqué yo. **El servidor está bien**: cada
marca se guarda con una transacción que sólo toca ese ítem, así que no se pierde nada. Los dos
problemas están **en la pantalla**, y los dos se ven cuando hay dos personas cargando el camión a
la vez, que es lo normal en una fiesta.

Todo pasa en `src/app/(app)/fiestas/nueva/carga-operativa/page.tsx`, en la función
`mergeRemoteOperationalState` (línea ~140), que decide qué se queda de lo que llega del servidor.

## Bloque 1 — La cantidad que cambió el otro operador no aparece

`mergeRemoteOperationalState` copia del servidor `cargado`, `retornado`, `cargadoPor`,
`retornadoPor` y las fechas… **y deja afuera `cantidad` a propósito**, para no pisar lo que la
persona está escribiendo en ese momento. El efecto es que **la cantidad que cambió el otro
operador no se ve nunca**, ni al recargar la lista.

**Qué hacer:** traer también `cantidad` del servidor, **salvo en el ítem que el usuario tiene el
dedo puesto justo ahora**. Para saber cuál es, guardá en un `useRef` el `id` del ítem que tiene el
foco —se marca en el `onFocus` del `Input` de cantidad, línea ~120, y se limpia en el `onBlur`— y
salteá ese ítem al mezclar. Los demás se actualizan.

**No uses un `setTimeout` ni un "hace tres segundos que no escribe":** eso es adivinar, y con la
señal del salón falla.

## Bloque 2 — Una respuesta que llega tarde revive marcas viejas

Cuando dos marcas salen casi juntas, **la respuesta más vieja puede llegar última**, y al mezclar
pisa la marca nueva con el estado anterior: el ítem vuelve a aparecer sin cargar. Es exactamente
el defecto de la fotocabina del 16 de septiembre —una respuesta atrasada apagando el cartel de
otro— y está anotado en `CLAUDE.md`, error 10.

**Qué hacer:** cada ítem ya trae **`actualizadoAt`** del servidor (lo escribe
`applyCargaOperativaItemPatch`, en `src/app/actions/fiesta/carga-operativa.actions.ts`). En
`mergeRemoteOperationalState`, **aplicá lo que viene del servidor sólo si su `actualizadoAt` es
igual o más nuevo que el que ya tiene el ítem en pantalla**. Si es más viejo, se descarta esa
parte y se deja lo que hay.

**Ojo con el caso de al lado**, que es donde ya nos equivocamos una vez: un ítem que **nunca** se
tocó no tiene `actualizadoAt`. Ese caso se aplica normal, no se descarta.

## Lo que NO se toca

- **El servidor no se toca**: `updateCargaOperativaItemState` ya usa una transacción por ítem y
  está bien.
- **La devolución ya anda**: registra quién la marcó y se conserva al guardar. Codex lo probó.
- El cálculo de conflictos de stock (`checkAssetConflicts`): es de la orden 65.

## Qué tiene que comprobar la prueba

**No alcanza con que el archivo nombre `actualizadoAt`.** Con dos pestañas —o dos contextos del
navegador— sobre la misma fiesta:

1. La pestaña A cambia la cantidad de un ítem; **la pestaña B la ve** después de refrescar la
   lista, sin recargar la página.
2. Mientras B está escribiendo en la cantidad de OTRO ítem, la actualización **no le pisa lo que
   está escribiendo**.
3. Una respuesta atrasada —simulada demorando una de las dos llamadas con `page.route`— **no
   devuelve el ítem a "sin cargar"**.
4. Rompela a propósito sacando la comparación de fecha y verificá que se ponga en rojo. Dejalo
   escrito arriba del archivo.

```comprobar
archivo: src/app/(app)/fiestas/nueva/carga-operativa/page.tsx
usa: actualizadoAt en src/app/(app)/fiestas/nueva/carga-operativa/page.tsx
prueba: tests/e2e/la-carga-operativa-se-sincroniza.spec.ts
```
