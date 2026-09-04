# Orden 44 — La pantalla queda en blanco cuando se llega por un redireccionamiento

**Para Gemini. Es un DEFECTO, no una función nueva. Una sola propuesta con los dos bloques.**

**Antes de empezar:** `git fetch origin && git checkout -b feat/orden-44 origin/main`.

---

## Bloque 1 — El error de React al llegar por un redireccionamiento

**Está medido, no supuesto.** Con la app compilada de verdad (`npm run build` y `next start`), y
con la cookie de sesión de las pruebas:

| Cómo se entra | Qué pasa |
|---|---|
| `/evento/actual` (redirige a `/`) | **Error de React #310**, pantalla en blanco |
| `/` abierta directo | **Anda perfecto** |
| `/prospectos` (redirige a `/login`) | **Error de React #310** |
| `/invitado/<fiesta>/<invitado>` (redirige a `/portal-invitado/...`) | **Error de React #310** |
| `/contabilidad/crm` abierta directo | **Anda perfecto** |

**La misma pantalla anda si se abre directo y se rompe si se llega redirigido.** Eso es lo que
hay que arreglar, y es una sola causa: **algún componente llama a un hook de React de forma
condicional**, y al llegar redirigido la primera pintada y la segunda no coinciden.

**El rastro del navegador apunta a un `useMemo`**, en el paquete compartido, justo después de
"Error cargando ajustes del asistente".

**Dónde buscar, en este orden:**

1. Los componentes que están en `src/app/layout.tsx` y por lo tanto viven en TODAS las pantallas:
   `AsistenteVirtual` (`src/components/public/AsistenteVirtual.tsx`), `GoogleAnalytics`,
   `MetaPixel`, `DeploymentRecovery`, `Toaster`. **Ya los miré y sus hooks están todos antes del
   `return null`**, así que probablemente no sean ellos: empezá por lo que estos importan.
2. Cualquier componente que llame a `useMemo`, `useState` o `useEffect` **adentro de un `if`,
   adentro de un `for`, o después de un `return` temprano**.
3. Un componente **declarado adentro de otro componente** (`function X()` o `const X = () =>` que
   devuelve JSX, escrito dentro del cuerpo de otro). React lo trata como un componente nuevo en
   cada pintada y pierde los hooks.

**Cómo reproducirlo sin adivinar** (es lo que hice yo, tardó dos minutos):

```
npm run build
AK_USE_LOCAL_JSON_ONLY=true AK_SESSION_SECRET=playwright-session-secret-with-enough-entropy npx next start -p 3210
```

y abrir `http://localhost:3210/evento/actual` con la consola del navegador abierta. **Compilá para
producción; en modo desarrollo el error sale con el nombre del componente adentro**, que es
justamente lo que necesitás para encontrarlo en un minuto.

## Bloque 2 — La pantalla de decoración tira un error del 3D

`/fiestas/nueva/decoracion` tira, **abierta directo y sin redireccionamiento**:

```
Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')
```

Es un choque entre la versión de React de la app (18.3.1) y lo que espera la biblioteca 3D
(`@react-three/fiber` 8.17, `@react-three/drei` 9.115, importadas en las líneas 30 y 31 de
`src/app/(app)/fiestas/nueva/decoracion/page.tsx`).

**Lo más probable y lo que hay que probar primero:** cargar la escena 3D **sólo cuando el usuario
toca el botón "Vista 3D"**, con `next/dynamic` y `ssr: false`. Hoy se importa siempre, aunque
nadie abra la vista 3D, y eso rompe la pantalla entera para todos.

**No cambies la versión de React ni la de Next.** Si el único arreglo posible fuera ese, no lo
hagas: avisá y entregá el resto.

**Y ojo, que está relacionado con la orden 42:** ahí se pide que los muebles se dibujen dentro de
la escena en vez del bloque oculto. **Esto se arregla primero**, o la vista 3D no abre.

---

## Cómo se comprueba que está hecho

```comprobar
usa: next/dynamic en src/app/(app)/fiestas/nueva/decoracion/page.tsx
prueba: tests/e2e/las-pantallas-no-quedan-en-blanco-al-redirigir.spec.ts
```

**La prueba tiene que mirar el resultado**, y es fácil de escribir porque el defecto es
reproducible: abrir `/evento/actual`, `/prospectos` y `/invitado/<fiesta>/<invitado>` **cada una
en una pestaña nueva**, y comprobar que **ninguna tira un error de React en la consola** y que
todas muestran un título visible.

**Escribila primero y mirá que falle.** Hoy tiene que fallar en las tres.
