# Orden 70 — La lista de regalos respeta que el cliente la quiera vacía

**Para Gemini.** Va **en la misma propuesta** que el resto de la tanda
(`docs/ordenes/TANDA-2026-09-18-que-sigue-para-gemini.md`).

## Por qué

Lo encontró Codex el 19 de septiembre de 2026 y lo verifiqué. En
`src/app/(app)/fiestas/nueva/regalos/page.tsx`, línea ~51:

```ts
// If the list is empty, populate with defaults
if (currentGiftList.length === 0) {
  currentGiftList = defaultGiftItems.map(...)
}
```

**La pantalla no distingue "todavía no cargó nada" de "el cliente decidió que no quiere lista".**
Si el operador borra todos los regalos y guarda, al volver a entrar **reaparecen los de ejemplo**,
y el guardado siguiente **los escribe como si el cliente los hubiera elegido**. Los invitados
terminan viendo una lista de regalos inventada por la app.

Es la forma número 3 de las que ya nos costaron caro: **datos de ejemplo tratados como datos
reales.**

## Qué hacer

- **Al cargar, no rellenar nunca.** Si lo guardado está vacío, la lista se muestra vacía.
- En su lugar, cuando está vacía, mostrar el **estado vacío con dos salidas**: un texto corto
  —*"Todavía no hay regalos en la lista"*— y un botón **"Cargar sugerencias"** que agrega
  `defaultGiftItems` **sólo si la persona lo toca**. Eso es lo que separa una sugerencia de una
  invención.
- **El botón no guarda solo**: agrega los ítems a la pantalla y la persona guarda como siempre.
- `defaultGiftItems` **no se borra**: se sigue usando, pero a pedido.

## Lo que NO se toca

- El resto de la pantalla de regalos, que anda.
- La pantalla pública de la invitación donde el invitado ve la lista y marca lo que va a regalar.
- Los textos de la invitación.

## Qué tiene que comprobar la prueba

1. Con la lista guardada **vacía**, abrir la pantalla: **no aparece ningún regalo** y sí aparece
   el estado vacío.
2. Tocar "Cargar sugerencias": **aparecen** los sugeridos.
3. Borrar todo, guardar, salir y volver a entrar: **sigue vacía**. Ésta es la que importa y es la
   que hoy falla.
4. Rompela a propósito —volviendo a rellenar al cargar— y verificá que se ponga en rojo.

```comprobar
archivo: src/app/(app)/fiestas/nueva/regalos/page.tsx
usa: Cargar sugerencias en src/app/(app)/fiestas/nueva/regalos/page.tsx
prueba: tests/e2e/la-lista-de-regalos-queda-como-la-dejaron.spec.ts
```
