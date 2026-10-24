# 353 - Dos fallos no timeout en Jest

## Revision principal posterior (359) - prevalece sobre inferencias de abajo

La causa de permisos sugerida por el ayudante NO quedo demostrada. El test SI
simula roleadmin. Aunque accion/test son iguales3e/3f, la dependencia REAL
src/lib/asistente/avisar-al-duenio.ts SI cambia de writeData a mutarDocumento;
el mock de generic-json-store de este test solo exporta mutateGenericJsonArray.
Es una incompatibilidad concreta del fixture que debe comprobarse, no un permiso
a quitar el guard. No hubo retest Jest focal:354rechazado por recursos,
Temp347ausente; no afirmar causa unica ni que el caso ya pasa.

BlogJSON SI existe en el arbolGit3f.349 informa ENOENT; no se comprobo cuando
desaparecio de la QA, asi que la frase de abajo "no fue copiado" es una hipotesis
del ayudante y NO un hecho verificado. El corrector no se ejecuto en ese caso.
Conservar este primer informe y su rectificacion; no emitir arreglo de app
basado solo en esas atribuciones. Fuentes/limites consolidados en359.

Alcance: evidencia congelada `docs/evidencias/349-jest-resultados.json` de QA `C:/Users/Usuario/AppData/Local/Temp/ak-qa-347-ZUMKZ8`; contraste de objetos `3f9460185143ef034dcd713e975d2a0af5e20f1a` y `3e45a4ac6b479f89605163168e31b37dc84f2d0f`. Checkout actual `b8b8398761dd7eaa9c0eb070e476e12ab23d1265`, no candidato. Sin ejecucion de pruebas/build/red ni cambios de app. Los otros errores timeout quedan fuera.

## 1. Ajustes del asistente

- Evidencia: `src/__tests__/el-asistente-se-anticipa.test.ts:340` espera `resSettings.success === true`; el resultado capturado es `false`, dentro de `la pantalla /settings/asistente y las acciones del asistente proactivo funcionan`.
- Ruta: la prueba invoca `saveSettingsAsistenteAction` con cuatro preferencias. En el candidato, `src/app/actions/asistente-proactivo.actions.ts`, funcion `saveSettingsAsistenteAction`, exige `requirePermiso(PERMISOS.ADMINISTRACION)` antes de llamar `saveAsistenteSettings`; con permiso denegado retorna `{ success:false, error }`. La ruta es consumida por la pantalla de ajustes `/settings/asistente` (contrato ejercitado por la prueba). El mock/estado de permiso de esta prueba no satisface ese control en el sidecar congelado; el registro no aporta `error` ni identidad/rol del actor para discriminar un problema de setup de una denegacion inesperada.
- Comparacion: el test y la accion no tienen cambios entre 3e y 3f. Es fallo reproducido en la QA de candidata, pero causa funcional no determinada; no atribuir a regresion de 3f ni cambiar el control de permisos sin confirmar actor autorizado y fixture.
- Retest necesario: repetir solo este caso con identidad de administrador configurada por el mecanismo oficial de test, registrar `resSettings.error` y resultado de `requirePermiso`; conservar un control negativo que compruebe rechazo sin permiso. Si el actor ya es admin y la accion aun rechaza, seguir la causa concreta antes de ordenar cambio.

## 2. Articulo de bebidas

- Evidencia: `src/__tests__/el-blog-de-bebidas-no-promete.test.ts:13-14` calcula `path.join(process.cwd(), 'data/blog-posts.json')` y falla con `ENOENT` al leerlo desde `C:/Users/Usuario/AppData/Local/Temp/ak-qa-347-ZUMKZ8/data/blog-posts.json`.
- Ruta/dato: `data/blog-posts.json` existe en el arbol Git de 3f y contiene los datos consumidos por esta prueba; la misma prueba busca el slug `como-calcular-bebida-evento-salto` y pasa esos datos a `corregirPromesasDelBlog` de `src/lib/blog/sin-promesas.ts`. El consumidor de runtime usa `src/data/blog-posts.ts` (`blogPosts`), no la ruta relativa al cwd. En el arbol QA el fixture `data/blog-posts.json` no fue copiado. Test, JSON y helper no difieren entre 3e y 3f; no hay evidencia de fallo de comportamiento del corrector.
- Clasificacion: fallo de preparacion/copia de fixture del sidecar, no fallo funcional demostrado. No ordenar cambio del corrector ni declarar probado el contenido de produccion por este fallo.
- Retest necesario: ejecutar unicamente el caso sobre un sidecar que incluya `data/blog-posts.json` del mismo SHA, o adaptar el harness para conservar ese archivo; verificar que el slug exista y que las aserciones de texto pasen. No hace falta retest de comportamiento antes de resolver el ENOENT.

```comprobar
archivo: src/app/actions/asistente-proactivo.actions.ts
usa: saveSettingsAsistenteAction por el formulario/consumidor de /settings/asistente
prueba: src/__tests__/el-asistente-se-anticipa.test.ts (caso de linea 340; retest focal pendiente)
archivo: data/blog-posts.json
usa: corregirPromesasDelBlog en el caso de prueba; runtime lee src/data/blog-posts.ts
prueba: src/__tests__/el-blog-de-bebidas-no-promete.test.ts (retet focal pendiente con fixture presente)
```
