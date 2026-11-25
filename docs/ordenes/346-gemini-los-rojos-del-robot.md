# Orden 346 — Las 12 pantallas que el robot marca en rojo

**Para Gemini. Va en la MISMA propuesta que la 343, 344 y 345 (rama `gemini/orden-343`), al final.** Si se traba, entregá
el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

## Por qué
El 25/11/2026 el robot de la orden 339 corrió por primera vez sobre toda la app. Antes no podía: su base de prueba no tenía
al usuario de la cookie (`users/admin`), cada acción contestaba "Tu sesión se cerró" y daba 81 rojos falsos. Claude sembró
ese usuario en `tests/robot/sembrar.ts` y quedaron **15 rojos**. Tres son del entorno (sin cámara, 127.0.0.1 contra
localhost) y quedan como excepción. **Los otros doce son de la app y son estos.** Para publicar, Claude los anotó en
`docs/robot-excepciones.json` con el motivo "Viejo, lo arregla la orden 346". **Al arreglar cada uno, borrás su línea de
ahí.** Esta orden termina cuando no queda ninguna.

## Lo que marca el robot (pantalla → archivo → qué pasa)
- **Guarda y al recargar no está** (regla `ida-y-vuelta`): el robot cambia un campo, toca Guardar, recarga y el valor no
  volvió.
  - `/asistente` → `src/app/(app)/asistente/page.tsx` (30 líneas: el guardado está en el componente que importa).
  - `/empresa/insumos/[id]/editar` → `src/app/(app)/empresa/insumos/[id]/editar/page.tsx`.
  - `/empresa/salones` → `src/app/(app)/empresa/salones/page.tsx`.
  - `/empresa/salones/[id]/croquis` → `src/app/(app)/empresa/salones/[id]/croquis/page.tsx`.
  - `/empresa/salones/[id]/diseno` → `src/app/(app)/empresa/salones/[id]/diseno/page.tsx`, que reenvía al mismo editor.
  - Mirá primero si la acción devuelve `{ success: false }` y la pantalla no lo lee (pregunta 8 de `COMO-AUDITAR.md`). Si
    no, mirá si guarda en un archivo que la pantalla no lee al cargar (error 18 de `CLAUDE.md`: `FILE_TO_COLLECTION` en
    `src/lib/firebase-sync.ts`).
- **Dice "GUARDADO" con el servidor fallando:** `/empresa/landing-editor` → `src/app/(app)/empresa/landing-editor/page.tsx`.
  El cartel sale solamente si la respuesta dice que se guardó.
- **Si la lectura falla, la pantalla no avisa** (regla `lectura-fallida-no-es-cero`): muestra la lista vacía o ceros como
  si fueran reales.
  - `/customers` → `src/app/(app)/customers/page.tsx`.
  - `/empresa/contabilidad` → `src/app/(app)/empresa/contabilidad/page.tsx`.
  - `/empresa/contabilidad/reportes` → `src/app/(app)/empresa/contabilidad/reportes/page.tsx`.
  - Contabilidad es plata: el aviso es lo único que cambia. **No toques las cuentas.** Claude lo revisa línea por línea.
- **Enlace con la fiesta vacía:** `/evento/actual/mesa` → `src/app/evento/actual/mesa/page.tsx` líneas ~76 y ~128,
  `` `/evento/actual?fiestaId=${fiesta?.id || ''}` ``. Sin fiesta, el botón no se muestra.
- **Mezcla las dos fiestas:** `/evento/inicio` → `src/app/evento/inicio/page.tsx`. Con dos fiestas en la base aparecen los
  nombres de las dos. Si es una pantalla para elegir fiesta a propósito, **es un falso rojo**: anotá el motivo en
  `docs/robot-excepciones.json` empezando con "Falso rojo:". No apagues la regla.
- **No muestra el nombre de la fiesta del invitado:** `/portal-invitado/[fiestaId]/[guestId]` →
  `src/app/portal-invitado/[fiestaId]/[guestId]/page.tsx`.

## Lo que NO hay que hacer
- No toques `tests/robot/reglas.ts` ni el sembrado para que un rojo pase a verde.
- No borres de `docs/robot-excepciones.json` las tres líneas que dicen "Entorno:".
- No cambies textos que ve el cliente fuera de los avisos de error.

## Cómo se prueba
`npm run robot:todo` y, en `test-results/robot/resultados.json`, las doce rutas en verde **sin su línea de excepción**.

## Barrido en toda la app
El robot es el barrido: sus reglas recorren todas las pantallas de `getAllRoutes()`. Estas doce son todo lo que dio rojo.

```comprobar
no-usa: orden 346 en docs/robot-excepciones.json
```
