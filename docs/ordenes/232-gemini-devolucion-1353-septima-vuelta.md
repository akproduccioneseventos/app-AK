# Orden 232 — Devolución de la propuesta 1353 (séptima vuelta, 26/10/2026)

**Para Gemini. Una sola propuesta: seguí en la 1353**, rama `gemini/ordenes-180-195`. Primero traé y fusioná
`claude/app-debug-stabilize-m70e6z` y la rama de Codex `codex/653-correcciones-20261025` (propuesta 1363: sus
arreglos de permisos y video se quedan). Si un bloque se traba, entregá el resto y avisá cuál faltó.

## Qué está bien y no se toca

Se revisó el conjunto `a3ecd0089` (tu `2b17bebfd` con los arreglos de Codex). Compila, no tiene acentos rotos, y la
orden 228 quedó bien:

- el PIN del cliente vuelve a funcionar;
- `getFiestaParaPantalla` pide sesión;
- `clientPortalSettings` sólo le llega al cliente.

`requireAdminSession` y `requirePermiso` ahora rechazan un perfil explícito inválido: **eso queda**.

## Bloque 1 — una prueba de Jest usa un perfil que no existe

`src/__tests__/portal-entregas-y-agentes-86.test.ts` (~77), caso "el administrador sí": la sesión tiene
`perfil: 'administrador'`, que no es un perfil válido, y el control nuevo la rechaza bien. Cambiá ese perfil por
`'dueno'`. **No toques `requirePermiso`.**

## Bloque 2 — "Lo que se dijo es lo que es"

- `src/app/(app)/fiestas/nueva/logistica/page.tsx` y `src/app/(app)/fiestas/nueva/reuniones/imprimir/page.tsx`: las
  tocaste y no tienen ninguna prueba. Sumalas a `tests/e2e/las-pantallas-no-quedan-cargando.spec.ts`, con el título
  de cada pantalla comprobado con `toHaveText`.
- `src/components/presupuestos/paso-4-resumen.tsx`: `Paso4Resumen` no lo usa nadie. Si reemplaza a otro resumen,
  enganchalo donde va; si no, borralo.

## Bloque 3 — catorce pruebas de navegador en rojo (escritorio y celular)

Corridas con `npm run test:e2e:production`, sobre pruebas que trae tu propuesta:

- `los-enlaces-del-invitado-llevan-quien-es`: no aparece el enlace de confirmación con `guestId=inv_prueba_0`.
- `la-fotocabina-ofrece-filtros`: no aparece la fila "Filtros".
- `la-app-ordenada`: no se ven las 5 pestañas de la ficha ni `?pestana=noche`.
- `iphone-ve-como-instalar`: no se ve la guía "Agregar a inicio en Safari".
- `el-centro-de-redes-tiene-cinco-solapas`: no se ven las 5 solapas, y `/empresa/redes-sociales` no lleva a
  Publicaciones.

Por cada una, abrí la pantalla con la fiesta de prueba (`tests/e2e/helpers/fiesta-de-prueba.ts`) y mirá qué muestra
de verdad:

- Si la pantalla está bien y la prueba busca otra cosa, corregí la prueba con el texto real.
- Si la función no aparece, eso es lo que hay que arreglar en la pantalla.

**No las saltees ni les subas el tiempo.**

## Cómo se entrega

Corré solas las pruebas de navegador de arriba, después `npx jest --silent` completo y `npm run "publicar?:rapido"`.
Pegá en la propuesta las últimas líneas de cada uno.

```comprobar
usa: perfil: 'dueno' en src/__tests__/portal-entregas-y-agentes-86.test.ts
usa: /fiestas/nueva/logistica en tests/e2e/las-pantallas-no-quedan-cargando.spec.ts
usa: /fiestas/nueva/reuniones/imprimir en tests/e2e/las-pantallas-no-quedan-cargando.spec.ts
prueba: tests/e2e/la-app-ordenada.spec.ts
prueba: tests/e2e/el-centro-de-redes-tiene-cinco-solapas.spec.ts
```
