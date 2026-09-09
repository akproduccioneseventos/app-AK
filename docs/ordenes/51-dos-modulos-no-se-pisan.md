# 51 - Que dos módulos no se pisen al guardar

**Para Gemini.** Fecha: 9 de septiembre de 2026. Hallazgo de Codex (PLAN-03), verificado.

## Qué pasa

Cada módulo de la fiesta —tareas, menú, personal, itinerario, decoración— hace lo mismo:
**lee la fiesta entera, cambia lo suyo y guarda el objeto completo**. Si dos se guardan casi al
mismo tiempo, el segundo escribe encima con la copia que leyó antes y **el cambio del primero
desaparece sin ningún aviso**: las dos pantallas dicen "guardado".

Ya se vio de verdad: al marcar un pedido de compras, el recordatorio de pagarle al proveedor se
creaba y se borraba solo. **Ese caso concreto ya está cerrado** (`catering.actions.ts`), pero el
patrón sigue en los demás módulos.

## Lo que hay que hacer

**Guardar sólo el pedazo que cambió, no la fiesta entera.** Ya existe la herramienta:
`updateFiestaPartial` en `src/app/actions/fiesta/fiesta.actions.ts` (línea ~173) escribe una
actualización parcial en vez de pisar el objeto completo.

Módulos a pasar, en este orden:

1. `src/app/actions/fiesta/tareas.actions.ts` — `updateFiestaData` guarda `{...data, tareas}`.
   Tiene que guardar **sólo** `{ tareas }`.
2. `src/app/actions/fiesta/personal.actions.ts` y `reuniones.actions.ts` — mismo patrón.
3. `src/app/actions/fiesta/decoracion.actions.ts` — guarda `{...currentData, decoracion}`;
   tiene que guardar sólo `{ decoracion }`.
4. `src/app/actions/fiesta/catering.actions.ts` — **NO se toca la parte de los estados de compra
   y las tareas de pago**: eso ya se arregló el 9 de septiembre y tiene su prueba. Sí el resto.

**Lo que NO hay que hacer:** poner un candado global sobre la fiesta. Eso serializa todo el
planificador y deja la app lenta para el equipo entero. Y **no cambiar los permisos del portal
del cliente** al tocar decoración.

## Qué tiene que comprobar la prueba

No alcanza con que guarde. La prueba tiene que **reproducir el pisón**: dos guardados al mismo
tiempo sobre la misma fiesta, uno cambiando las tareas y el otro el menú, y comprobar que
**los dos cambios quedan**. Está escrito el ejemplo de cómo se hace en
`src/__tests__/dos-cobros-a-la-vez-no-se-pisan.test.ts`: el guardado tarda a propósito, para
que se pisen si el arreglo no está.

```comprobar
usa: updateFiestaPartial en src/app/actions/fiesta/tareas.actions.ts
prueba: src/__tests__/dos-modulos-de-la-fiesta-no-se-pisan.test.ts
```
