# Orden 374 — Robot, vuelta 19: bajas y borrados a ciegas, respuestas sin números y la lista de compras

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 373 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Los bloques 1, 2, 5 y 6
tocan personal, comida y lo que sale para afuera: Claude los revisa línea por línea.

## Por qué
Vuelta 19 del robot (26/11/2026), con los seis especialistas. Las áreas fueron contratos y personal, catering, los portales
del proveedor y del empleado, el invitado y las estaciones, las redes y el portal del cliente. Claude confirmó cada punto en
el código. Los portales del proveedor y del empleado salieron sin hallazgos nuevos.

## Bloque 1 — No se da de baja a alguien del equipo si la agenda no se pudo leer
`src/app/actions/empleados.ts` ~211-232, `fiestasFuturasConEsteEmpleado`: el `catch` devuelve `[]` y el borrado sigue
(~320 `deleteDataItem`, ~324 `deleteFromStorage` del contrato). Con la base caída, se borra a quien trabaja esta noche
junto con el PDF de su contrato, y responde `success: true`.

Arreglo:
- Si la lectura falla (excepción o `esLecturaFallida` de `src/lib/marca-de-lectura.ts`), `deleteEmpleado` devuelve
  `{ success: false, error: 'No se pudo comprobar si trabaja en una fiesta. Probá de nuevo.' }` y no borra nada.

## Bloque 2 — No se borra un proveedor si los insumos no se pudieron leer
`src/app/actions/proveedores.ts` ~124-163: `getInsumos()` no lanza cuando falla, porque `leerInsumosCrudos`
(`src/lib/insumos/leer-insumos.ts` ~26) usa `readData(INSUMOS_FILE, [])` y devuelve `[]` marcado.

Resultado: el control ve cero insumos y borra el proveedor, y la lista de compras queda sin a quién pedir.

Arreglo:
- `leerInsumosCrudos` conserva la marca de lectura fallida (pregunta 244). Usá `marcarLecturaFallida` sobre la copia del `.map`.
- `deleteProveedorInterno` mira `esLecturaFallida` en las dos lecturas y devuelve el error que ya está escrito
  ("No se pudo comprobar si el proveedor tiene insumos asociados").
- Ojo con la caché de `leerInsumosCrudos`: una lectura fallida **no** se guarda en caché.

## Bloque 3 — El botón "llegó" del personal no queda cargando
`src/app/actions/personal-fiestas.ts` ~44-45: para el perfil `personal` llama a `getEmpleados()`. Esa función lanza "Tu perfil no
tiene acceso a los datos del personal" (`src/app/actions/empleados.ts` ~22-33), porque `personal: []` en
`src/lib/auth/perfiles.ts` ~67.

Para buscar su propia ficha, usá una lectura interna que no pida permisos: por ejemplo, leer la colección y filtrar sólo la
ficha cuyo id o email coincide. Que nunca devuelva otras fichas.

En `src/components/centro/EquipoCheckIn.tsx` ~22-31, `handleLlegada` va con `try/finally` (el `setLoading(null)` en el
`finally`) y muestra un aviso si `res.success` es falso.

## Bloque 4 — El interruptor "Sincronizado" del tótem tiene que hacer algo
`src/components/panels/fiesta--pantallas-totem.tsx` ~452 guarda `syncedWithSocialWall`, y la pantalla
`src/app/evento/totem/[fiestaId]/[totemId]/page.tsx` nunca lo lee: siempre muestra las fotos del muro.

Arreglo: con el interruptor apagado, la pantalla del tótem no carga ni muestra fotos del muro (sólo lo demás que tenga
configurado). No sacar el interruptor: conectarlo.

## Bloque 5 — La respuesta pública a un comentario no se come los números
`src/lib/social-media/clasificador-comentarios.ts` ~41, `sanitizarTextoRespuesta`: la expresión
`/\$?\s*\d+([.,]\d+)?\s*(usd|dólares|pesos|uyu)?/gi` borra **cualquier** número. Por ejemplo, "Atendemos de 9 a 18 hs, más de
7 años" sale "Atendemos de a hs, más de años", y así se publica en Facebook, Instagram y Google.

La regla del dueño es otra: en público, nunca un precio.

Arreglo:
- Sacar sólo los montos: un número con `$`, `U$S`, `USD`, `pesos`, `UYU` o `dólares` pegado, o con separador de miles
  (`16.900`).
- Si al sacar un precio la frase queda rota, no se publica esa respuesta: queda para revisar.
- Las cifras aprobadas ("+7 años", "+200 fiestas") y las horas quedan.
- **La misma expresión está en otros dos lugares, encontrados por el escaneo de la pregunta 250:**
  `src/lib/social-media/adaptar-post-por-red.ts` ~12 (`sanitizarTextoPublicacion`: cada publicación que sale en las redes pierde
  "+200" y "7 años") y `src/lib/social-media/comments-backfill.ts` ~195. Mismo arreglo en los tres.

## Bloque 6 — "No publicar" no se pisa con la tarea de las 12 horas
`src/lib/presencia-digital/publicador.ts` ~739-808: lee `social-posts.json` entero, espera
`enviarPreviewBorradorAlDuenio` y `validarPermisoPromocionalPosteo` (red de por medio) y al final hace `writeData` de la lista
entera con la copia vieja.

Resultado: si el dueño toca "No publicar" mientras corre (`mutateDataItem`, ~60), su cambio se pierde y el borrador sale
publicado.

El mismo patrón está en `procesarPosteosProgramados` (~159-208, y los `writeData` de ~442, ~469, ~491 y ~513).

Arreglo:
- Cada cambio de estado se guarda de a uno con `mutateDataItem`, y **adentro** vuelve a leer el post.
- Si ya está en "No publicar" (o fue borrado), no lo toca.
- Nada de `writeData` de la lista entera después de un `await` de red.

## Bloque 7 — Lista de compras: la docena es 12 unidades, y la pantalla muestra lo que se compra
Tres cosas, en `src/lib/compras/` y `src/components/panels/catering--lista-compras.tsx`:
1. **Docena, media docena, caja/pack/rollo con cantidad.** `normalizarUnidad` (`src/lib/compras/unidades.ts` ~25-33) no
   reconoce "docena", y `convertir` da `null` entre "unidad" y "docena". Por ejemplo, receta "1 unidad de huevo", catálogo
   "$240 la docena": el plato cuesta $240 en vez de $20 (`src/lib/catering/unidades.ts` ~51-58, `comoAntes`).
   - Agregá "docena" = 12 unidades y "media docena" = 6.
   - Para caja/pack/rollo sin cantidad conocida, lo de la orden 357 bloque 1.4: total en `null`, nunca el precio crudo.
2. **La columna de cantidad muestra lo que se compra.** `catering--lista-compras.tsx` ~708 muestra `cantidadNecesaria`, pero
   el costo (~710) es de `cantidadAComprar`. Mostrá las dos: "Necesario 1,20 l · Se compran 2 l". El pedido por WhatsApp ya
   usa `cantidadAComprar`: que la pantalla y el pedido digan lo mismo.
3. **Al juntar dos renglones, un pedido fijo no le saca el stock al otro.** `src/lib/compras/consolidar-compras.ts` ~77-88: la
   unión suma `cantidadNecesaria` y deja el `isOrder` del primero. Por ejemplo, pedido fijo de 40 + receta de 60 con 20 de
   stock da 100 si el fijo entró primero, y 80 si entró segundo. Lo correcto es 80.
   - Llevá por separado la parte de pedido fijo (no descuenta stock) y la de receta (descuenta stock), y sumalas al final.
   - El resultado no puede depender del orden.

## Barrido en toda la app
- Controles de borrado que toman una lectura fallida como "no está en uso" (pregunta 210):
  `grep -rn "catch" src/app/actions | grep -B2 "return \[\]"` en las funciones que se llaman antes de un `deleteDataItem`, y
  en cada `delete*` mirar que la lectura previa revise `esLecturaFallida`.
- Filtros de texto público que sacan de más (pregunta 250): `grep -rn "replace(/.*\\\\d" src/lib/social-media src/lib/presencia-digital src/lib/asistente`.
- Listas enteras escritas después de un `await` de red (pregunta 22): `grep -rn "writeData(POSTS_FILE" src/lib`.
- Uniones de renglones que se quedan con la marca del primero (pregunta 251): `grep -rn "existente.item" src/lib`.
- Interruptores guardados que ninguna pantalla lee (regla 3 de "cuatro reglas"): por cada campo `boolean` de
  `TotemScreenSettings` y vecinos en `src/types/fiesta.ts` ~960-1010, contar quién lo lee fuera del panel.

Plata, comida y permisos: se listan y Claude los revisa.

## Lo que NO hay que hacer
- No cambiar quién puede dar de baja a alguien ni borrar proveedores: sólo que no se borre a ciegas.
- No dejar que el perfil personal vea fichas de otros (bloque 3).
- No publicar nunca un precio en un comentario público (bloque 5).
- No tocar la regla de los borradores a las 12 h ni el permiso de promoción (bloque 6).
- No cambiar las cantidades por invitado ni la regla "se cocina lo contratado" (bloque 7).

## Qué tiene que comprobar la prueba
- `src/__tests__/no-se-borra-a-ciegas.test.ts`:
  - Con `getAllFiestas` lanzando, `deleteEmpleado` de alguien asignado a una fiesta de mañana devuelve error y no borra.
  - Con la lectura de insumos marcada como fallida, `deleteProveedor` devuelve error y no borra.
- `src/__tests__/la-llegada-del-personal-no-se-cuelga.test.ts` (**sin** mockear `getEmpleados`): con perfil personal, marcar su
  propia llegada da `success: true`, y marcar la de otro da error.
- `src/__tests__/la-respuesta-publica-no-se-come-los-numeros.test.ts`:
  - `sanitizarTextoRespuesta("Atendemos de 9 a 18 hs, más de 7 años")` deja los números.
  - "sale $16.900" no deja ningún precio.
  - `sanitizarTextoPublicacion("+200 fiestas en 7 años")` deja los números.
- `src/__tests__/no-publicar-no-se-pisa.test.ts` (base que devuelve **copias**): mientras `procesarBorradores` espera la vista
  previa, se marca el post "No publicar"; al terminar sigue en "No publicar".
- `src/__tests__/la-lista-de-compras-entiende-la-docena.test.ts`:
  - 24 unidades de huevo a $240 la docena cuestan $480.
  - Pedido fijo 40 + receta 60 con stock 20 da 80 en los dos órdenes.
- `tests/e2e/el-totem-respeta-sincronizado.spec.ts`: con `syncedWithSocialWall: false`, la pantalla del tótem no muestra
  fotos del muro.

```comprobar
usa: esLecturaFallida en src/app/actions/empleados.ts
usa: esLecturaFallida en src/app/actions/proveedores.ts
usa: marcarLecturaFallida en src/lib/insumos/leer-insumos.ts
usa: finally en src/components/centro/EquipoCheckIn.tsx
usa: .syncedWithSocialWall en src/app/evento/totem/[fiestaId]/[totemId]/page.tsx
no-usa: .replace(/\$?\s*\d+([.,]\d+)?\s*(usd|dólares|pesos|uyu)?/gi, '') en src/lib/social-media/clasificador-comentarios.ts
no-usa: await writeData(POSTS_FILE, posts, (a, b) => new Date(b.publishDate || b.createdAt).getTime() - new Date(a.publishDate || a.createdAt).getTime()); en src/lib/presencia-digital/publicador.ts
usa: docena en src/lib/compras/unidades.ts
usa: Se compran en src/components/panels/catering--lista-compras.tsx
no-usa: .replace(/\$?\s*\d+([.,]\d+)?\s*(usd|dólares|dolares|pesos|uyu)?/gi, '') en src/lib/social-media/adaptar-post-por-red.ts
prueba: src/__tests__/no-se-borra-a-ciegas.test.ts
prueba: src/__tests__/la-llegada-del-personal-no-se-cuelga.test.ts
prueba: src/__tests__/la-respuesta-publica-no-se-come-los-numeros.test.ts
prueba: src/__tests__/no-publicar-no-se-pisa.test.ts
prueba: src/__tests__/la-lista-de-compras-entiende-la-docena.test.ts
prueba: tests/e2e/el-totem-respeta-sincronizado.spec.ts
```
