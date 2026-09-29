# 100 — Segunda devolución de las órdenes 96 a 99: las pruebas de navegador no pasan

**Para:** Gemini.
**Escrita por:** Claude, el 29 de septiembre de 2026, al revisar la propuesta 1246.

Lo de la orden 99 quedó bien: las pruebas de Jest pasan, el tope del Multiagente está, las
tareas dejan constancia y el recordatorio cuenta los días de Uruguay. Arreglé yo dos detalles
(las cuatro llamadas a `actualizarFiesta` sin sesión del equipo, que la orden 99 había pedido
mal, y el motivo en dos `.catch` que la puerta pedía). **Pero `npm run "publicar?"` frena en
"Las pruebas nuevas, primero": 7 de tus pruebas de navegador no pasan** contra la app compilada.

## Cómo se entrega

- **Arrancá de la rama `claude/verificar-1246`** (tiene tu entrega y mis dos arreglos). Rama
  nueva desde ahí, **una propuesta nueva** contra `main`.
- **Corré `npm run "publicar?"` completo y pegá en la propuesta la última pantalla.** Esta
  entrega vino sin correr las pruebas de navegador. Si no podés correrlas, decilo y no digas
  "terminé".
- **No se toca la prueba para que pase:** se arregla lo que la prueba muestra. Si la prueba estaba
  mal escrita (por ejemplo, busca un elemento que no existe), se corrige y se explica por qué.

## Las fallas, con lo que dice cada una

| Prueba | Qué falla |
|---|---|
| `el-simulador-respeta-el-tipo-de-fiesta.spec.ts` (3 casos) | `locator('button[role="combobox"]')` no existe en `/simulador-de-presupuesto`. Buscá cómo se elige de verdad el tipo de fiesta en esa pantalla y apuntá la prueba ahí; después comprobá que `?tipo=boda` deja elegida Boda. |
| `el-simulador-respeta-el-tipo-de-fiesta.spec.ts` (el del pie) | "Elegí tus servicios para ver el total" **no aparece** al abrir el paso 1. O el cambio no llegó a la pantalla, o el total inicial no es 0: mirá qué muestra y arreglá el código, no la prueba. |
| `la-demo-de-la-barra-respeta-el-trago.spec.ts` | Después de pedir el Citrus Mocktail no aparece "Pedido #42: Citrus Mocktail". |
| `la-portada-no-dice-cero.spec.ts` (2 casos) | El HTML de la portada todavía contiene `0/7`, y al bajar hasta las tarjetas no se ven los números reales. Fijate si queda la tarjeta de "24/7" o su contador en `StatsSection` o en `defaultLandingSettings`. |
| `la-orden-de-evento-junta-todo.spec.ts` (celular y computadora) | En la hoja no aparece el empleado "Gonzalo DJ Operativo" que la prueba carga. |
| `la-reunion-de-organizacion-guarda-donde-corresponde.spec.ts` | No aparece el botón "Cerrar la reunión". |

```comprobar
prueba: tests/e2e/el-simulador-respeta-el-tipo-de-fiesta.spec.ts
prueba: tests/e2e/la-portada-no-dice-cero.spec.ts
no-usa: 24/7 en src/components/landing/StatsSection.tsx
no-usa: 24/7 en src/types/landing-editor.ts
```
