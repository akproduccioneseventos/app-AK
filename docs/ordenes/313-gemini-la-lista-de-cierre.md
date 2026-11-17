# Orden 313 — La lista de cierre: la app mira sus pantallas como el auditor (17/11/2026)

Pedido del dueño: *"tienes que darme una solución para poder terminar la app… cada vez encuentro más errores"*. Viene de la
revisión de los informes del auditor externo del 16 y 17/11: los errores que encuentra (cosas que se salen del celular,
texto que no se lee, el mismo dato distinto en dos pantallas) **no los ve ningún control**, porque los controles leen el
código y el auditor abre la app. Esta orden hace que la app los encuentre sola.

**Va PRIMERO**, antes que el resto de la 310, 311 y 312, en la misma propuesta (rama nueva desde `origin/main`).

## Bloque 1 — El recorrido mira, no sólo abre

`tests/e2e/recorrido-de-pantallas.spec.ts` (línea ~100) hoy abre las pantallas a 1280 px y mira que abran. Sumale, por
pantalla y en **tres tamaños (390×844, 820×1180, 1440×1000)**:

1. **Nada se sale del ancho:** `document.documentElement.scrollWidth <= innerWidth + 1`, y ningún botón, campo o título
   con `getBoundingClientRect().right > innerWidth`.
2. **Ningún texto queda palabra por palabra:** un párrafo o título visible de más de 3 palabras con ancho menor a 90 px es
   falla (es lo de las alertas, promos y guías).
3. **El texto se lee:** contraste entre color de texto y fondo efectivo de al menos 3:1 para títulos y 4.5:1 para texto
   (calculado con `getComputedStyle`, subiendo por los padres hasta el primer fondo no transparente).
4. **Sin símbolos rotos** en el texto visible (estrella o comillas mal guardadas, `Ã` seguida de otro símbolo).

Cada falla se anota con pantalla, tamaño y qué elemento.

## Bloque 2 — La lista de cierre y su número

- `scripts/lista-de-cierre.mjs` arma `docs/lista-de-cierre.json`: cada pantalla de `getAllRoutes()` × 3 tamaños, con
  estado `verde` / `rojo` / `sin-mirar`, y la fecha de la última mirada.
- `npm run "cierre?"` imprime **un número**: cuántos casilleros quedan en rojo o sin mirar, y los 10 primeros.
- **La lista no crece por gusto:** sólo se agrega una pantalla nueva de la app. Un hallazgo del auditor que la lista no
  tenía entra como una regla más del bloque 1, no como un casillero suelto.

## Bloque 3 — Que corra entera sin frenar cada publicación

- La puerta sigue mirando sólo las pantallas que toca el cambio (como hoy), pero ahora **en los tres tamaños**, y frena si
  una de esas queda roja.
- `npm run cierre:todo` recorre las 382 en los tres tamaños, de a 4 carriles, y actualiza la lista. Es lo que corre Claude
  para dar el número al dueño.

## Lo que NO hay que hacer

- No esconder con `overflow-hidden` ni achicar letras para que pase: se arregla el diseño.
- No agregar pantallas a una lista de "conocidas" para que el número baje.

## Barrido en toda la app

Hecho por Claude el 17/11: hoy el recorrido abre las 382 pantallas sólo a 1280 px y sólo mira que abran; ninguna prueba
mide contraste ni texto palabra por palabra en toda la app. Las formas del informe (preguntas 157 a 159) ya están barridas
en la orden 312. Esta orden es el control que las mira solo.

## Qué tiene que comprobar la prueba

`src/__tests__/la-lista-de-cierre-ve-lo-que-ve-el-auditor.test.ts` con páginas de muestra en HTML: una con un botón que se
sale a 390 px, una con texto gris claro sobre blanco, una con título palabra por palabra y una con la estrella rota. Las
cuatro tienen que dar **rojo**, y una página prolija, **verde**. Si sacás la regla, la prueba se pone en rojo.

```comprobar
archivo: scripts/lista-de-cierre.mjs
archivo: src/__tests__/la-lista-de-cierre-ve-lo-que-ve-el-auditor.test.ts
usa: scrollWidth en tests/e2e/recorrido-de-pantallas.spec.ts
prueba: src/__tests__/la-lista-de-cierre-ve-lo-que-ve-el-auditor.test.ts
```
