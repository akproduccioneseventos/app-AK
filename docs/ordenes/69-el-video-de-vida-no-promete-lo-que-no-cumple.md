# Orden 69 — El video de vida: ni 200 fotos que no entran, ni borrados que mienten

**Para Gemini.** Va **en la misma propuesta** que el resto de la tanda
(`docs/ordenes/TANDA-2026-09-18-que-sigue-para-gemini.md`).

## Por qué

Lo encontró Codex el 18 de septiembre de 2026 y lo verifiqué. Son dos, y las dos le pasan al
operador en plena preparación de una fiesta.

## Bloque 1 — Deja pedir 200 fotos y rechaza desde la 51

En `src/app/(app)/fiestas/nueva/video-vida/page.tsx`, línea ~312, la casilla de cantidad de fotos
permite hasta **200** (`max="200"`), y la pantalla arma esa cantidad de espacios para subir.

Pero el servidor, en `src/app/actions/fiesta/video-vida.actions.ts` línea ~65, rechaza todo lo que
pase de **50**:

```ts
if (isNaN(photoNumber) || photoNumber < 1 || photoNumber > 50) {
  return { success: false, error: 'Número de foto inválido.' };
}
```

**Lo que ve el operador:** configura 120 fotos, sube tranquilo, y **a partir de la 51 todas fallan**
con un error que no explica nada. Puede perder media hora antes de entender qué pasa.

**Qué hacer, y es una decisión que ya tomé yo para que no la adivines:** **el tope real es 50 y se
respeta**. Subir el límite del servidor obligaría a mirar cuánto pesa el almacenamiento, y **nada
que aumente lo que se paga por mes se cambia sin preguntarle al dueño**.

Entonces:

- Poné `max="50"` en la casilla, y que **no deje guardar** un número mayor.
- Si la fiesta ya tiene guardado un número mayor a 50 —porque se configuró antes—, la pantalla lo
  muestra **acotado a 50** y avisa en una línea, en criollo: *"el máximo son 50 fotos"*.
- **El tope no se escribe suelto en dos lugares.** Poné la constante en un archivo común —por
  ejemplo `src/lib/video-vida/tope-de-fotos.ts`— y que la use **la pantalla y el servidor**. Así no
  vuelven a despegarse, que es exactamente lo que pasó acá.

## Bloque 2 — "Fotos eliminadas" aunque no se haya borrado ninguna

En `src/app/actions/fiesta/video-vida.actions.ts`, `deleteAllVideoVidaPhotos` línea ~132:

```ts
await Promise.all(files.map((file) => file.delete().catch(() => { /* ignore */ })));
return { success: true };
```

**Cada borrado que falla se tira a la basura** y la función devuelve éxito igual. La pantalla
muestra "Fotos Eliminadas – todas las fotos han sido borradas del servidor" **y las fotos siguen
ahí**. Y hay algo peor todavía: si la conexión con el almacenamiento no está levantada
(`if (!admin.apps.length) return { success: true }`), **contesta que borró sin haber mirado nada**.

**Qué hacer:**

- Contar cuántas se borraron y cuántas no, y **devolver éxito sólo si no quedó ninguna sin borrar**.
- Si quedaron algunas, devolver el número: la pantalla tiene que decir *"se borraron 18 de 22; 4
  quedaron en el servidor, probá de nuevo"*. **Nada de un error técnico.**
- El caso de "no hay conexión con el almacenamiento" **no es éxito**: es un aviso de que no se pudo
  hacer nada.

## Lo que NO se toca

- **No subas el tope de 50** ni toques nada del almacenamiento: eso se paga por mes.
- El resto de la pantalla del video de vida, que anda.
- La galería y la descarga, que Codex dio por buenas.

## Qué tiene que comprobar la prueba

1. **El tope:** intentar poner 120 en la casilla y comprobar que **no se guarda** y que el aviso
   aparece. Y que con 50 sí se guarda.
2. **El borrado:** haciendo que falle el borrado de una foto, comprobar que **NO** dice "Fotos
   Eliminadas" y que el número que informa es el real.
3. Rompé las dos a propósito y verificá que se pongan en rojo.

```comprobar
archivo: src/lib/video-vida/tope-de-fotos.ts
usa: TOPE_DE_FOTOS en src/app/actions/fiesta/video-vida.actions.ts
prueba: src/__tests__/el-video-de-vida-no-miente.test.ts
```
