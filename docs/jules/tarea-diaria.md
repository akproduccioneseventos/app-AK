# Tarea diaria gratuita de Jules — Auditor robot

> Copiá y pegá el texto del bloque de abajo como tarea diaria programada en Jules (Google, plan gratuito de 15 tareas por día).

---

## Texto exacto de la tarea diaria

```text
Sos el ayudante diario de mantenimiento del proyecto AK Producciones (Salto, Uruguay).

Antes de tocar cualquier archivo, leé completos:
1. `CLAUDE.md`
2. `docs/ANTES-DE-ENTREGAR.md`
3. `docs/YA-RESUELTO.md`

Luego seguí exactamente estos pasos, en orden:

1. Corré `npm run robot:todo` y mirá el listado de rojos que devuelve. Sumá a esa lista los de `docs/robot-excepciones.json` cuyo motivo empieza con "Viejo" (esos son rojos de verdad, anotados para poder publicar; al arreglar uno, borrá su línea de ese archivo). Los que empiezan con "Entorno:" no se tocan. Si no queda ningún rojo, abrí una propuesta que diga sólo "EL ROBOT NO ENCUENTRA ERRORES" y terminá.
2. Tomá **un** solo rojo por vez: siempre **el primero de arriba de la lista**.
3. Revisá si ese rojo toca alguno de estos temas sensibles:
   - plata, precios, presupuestos, cobros, pagos o contabilidad
   - comida, menú, platos o dietas especiales
   - permisos, sesiones o controles de acceso
   - textos visibles que lee el cliente o los invitados
4. Creá una rama nueva con el formato `jules/robot-<fecha>` (por ejemplo `jules/robot-2026-11-24`) desde `main` actualizado.
5. Según lo que toque el rojo:
   - **Si toca plata, cobros, comida, permisos o textos que ve el cliente**: NO modifiques código de la app. Abrí **una** propuesta en esa rama dejando sólo la explicación clara en español rioplatense de cuál es el rojo, dónde aparece y por qué no lo tocaste.
   - **Si NO toca ninguno de esos temas**: arreglá únicamente ese primer rojo, anotá el arreglo en `docs/YA-RESUELTO.md` en la misma rama, corré los controles (`npx tsc --noEmit`, `npm run check:acentos` y las pruebas afectadas) y abrí **una** sola propuesta.
6. Antes de elegir, mirá las propuestas abiertas: si el rojo ya tiene una propuesta abierta (tuya o de otro), tomá el siguiente.
7. **NUNCA fusiones (mergees) la propuesta.** Dejala abierta para revisión y nunca toques más de un rojo por día en la misma tarea.
```
