# Orden 127: la foto debe corresponder al plato que el cliente elige

**NO CONTRASTADO CON LA TANDA DE COMIDA QUE EL DUENO DICE QUE ESTA EN CURSO.**
No conocemos su HEAD no publicado. Antes de programar, contrastar esta orden
con esa entrega: conservar lo ya corregido y validar solamente lo pendiente.

## Fuente y responsables

7/10/2026. App inspeccionada: main `9bb955ac6af65a314f3ac62975020b37c9edaaf3`.
PR abierta observada: #1262, `claude/numeros-de-contacto-reales`, HEAD
`f6f91e9d24eeb6bb9dfd5d06430019e81835cc95`. Las fuentes y assets de catering,
sus dos consumidores y la accion de menus no cambian en esa PR. La correccion
CONTACT75 ya esta PRESENTE en esa entrega; no reimplementarla. Eso no demuestra
que esta otra orden este contrastada con la tanda de comida no publicada.

**Claude: comida, datos y permisos.** Gemini solamente si Claude necesita UI;
Claude compila el conjunto. Codex deja evidencia, no programa la app. Integrar
con la tanda del proyecto, no abrir una PR por foto ni fusionar docs por separado.
No editar registros productivos a ciegas. El dueno conserva aprobacion y fusion.

## Area: comida · Commit: 9bb955ac6af65a314f3ac62975020b37c9edaaf3

Referencia del dueno:
https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering

Evidencia reproducible: `docs/evidencias/77-catalogo-local.mjs`, manifiesto
`77-resultados/catalogo.json`, cinco hojas de contacto y seis capturas de Canva.
El script ejecuta el helper REAL de ese Git sobre la base de 44 platos y usa
bytes/hashes de assets del mismo SHA. La evaluacion visual esta en el informe
77; generar esas hojas NO es una prueba automatica de concordancia.

### MENU77-BUFFET, P2: una imagen sin comida para Mesa bufet

Base `src/data/menus-catering.json`: `dish_main_19`, "MESA BUFET", tiene URL
explicita `/catering/menus/xv/dish_main_19.jpeg`. El archivo real es un fondo
oscuro de pizarra sin platos, 1901 x 1268 y 1.177.028 bytes. `getCateringDishImage`
lo devuelve antes de consultar `cateringDishIdsWithoutConfirmedImage`.
Estar en ese conjunto no protege esta URL explicita.

La referencia muestra fotos de buffet, no ese fondo. Comparar la captura
`77-canva-guarniciones.png` con `77-resultados/contacto-5.png`.
Assets de fotos observados en la seccion buffet de Canva (no descargados por
Codex; prefijo de la pagina anterior seguido de `/images/`):

- `180b263a9802dc1b36e0eed649a8f54d.jpg`
- `fc2de3f16c00312894a525bd3afa08a2.jpg`
- `89792b111c41a98ad881cb78b2a9649a.jpg`
- `00ca2005943c6a0edd2b446a0fde6718.jpg`

Usar una foto/composicion aprobada que muestre ese servicio. No una imagen de
otro plato ni una generada presentada como comida real. No cambiar receta,
precio o margen para arreglar una foto. No aplicar una migracion que sobrescriba
una foto personalizada correcta del catalogo maestro.

### MENU77-PICADAS, P2: dos asociaciones invertidas frente a Canva

`defaultCateringDishImages`, `src/lib/catering/menu-images.ts:24` y `:25`:

| Plato base | Foto resuelta hoy | Diferencia contra el texto visible de Canva |
|---|---|---|
| `dish_entrada_21`, PICADA CRIOLLA | `dish_entrada_22.jpeg`, tabla mixta | Esa foto aparece bajo Picada de mar en la referencia |
| `dish_entrada_22`, PICADA DE MAR | `dish_entrada_21.jpeg`, plato con anillos fritos | Esa foto aparece bajo Picada criolla en la referencia |

Captura `77-canva-entradas-3.png` y hoja `77-resultados/contacto-3.png`.
Es una discrepancia imagen/texto verificada, NO una afirmacion sobre los
ingredientes ni de que los titulos originales sean culinariamente correctos.
Confirmar la relacion canonica aprobada si Canva mismo intercambia los nombres;
no cambiar nombres, recetas o IDs por suposicion. No se encontro decision previa
de este intercambio en la busqueda dirigida del registro; eso no prueba que el
dueno nunca la haya tomado.

## Consumidores y frontera de datos reales

- `getCateringDishImage`, `src/lib/catering/menu-images.ts`.
- Catalogo interno: `src/app/(app)/empresa/menus/catalogo/page.tsx`, editor
  y tarjetas llaman directamente al helper (278/281 y 338/340 en este SHA).
- Simulador: `menuItemToServicioEmpresa`, `src/app/simulador-de-presupuesto/page.tsx:182`,
  helper en 194/415; tarjetas de entrada/principal/infantil en 2318/2354/2391.
- `getMenusPublicos` / `armarMenus`, `src/app/actions/menus-catering.ts` leen
  `menus-catering.json` mediante `readData`; la base en Git no es un volcado
  autenticado del maestro Firebase. Hay ademas cuatro variantes virtuales de buffet.

Antes de corregir, inspeccionar el maestro actual de forma autorizada y comprobar
si esos IDs/URLs siguen presentes. Las discrepancias se reprodujeron en la base
y helper de Git, NO en el selector productivo: llegar con Datos validos al Menu
registra un prospecto real. Usar entorno aislado 114 para el recorrido completo.

## Diferencias de inventario: verificar, no crear otro bug

38 fotos base coinciden con la referencia: siete ya revisadas en 75 y 31 nuevas.
Tres entradas base no se encontraron en Canva: papas cheddar, empanaditas y
pizzetitas (sin foto), y panchos de medio metro. No retirarlas sin decision.

Siete opciones de Canva no estan en la base ESTATICA: arepas, show de tartas,
faina, bunuelitos de algas; chivito con fritas, paella de mariscos y hamburguesa
con fritas como plato principal adulto. Esto NO prueba que falten en Firebase.
Comprobar IDs existentes antes de agregar; no duplicar hamburguesa infantil,
inventar ingredientes/costos ni poner precio cero para que aparezcan.

## Aceptacion requerida

1. Registrar HEAD de la tanda y resultado del contraste antes de cambiar codigo.
2. Regresion con helper real y objetos equivalentes al maestro/base: buffet no
   devuelve fondo de pizarra; ambas picadas conservan la asociacion aprobada.
   Fallo antes/arreglo despues; no test que copie el mapping en vez de usarlo.
3. En aislado, catalogo interno y simulador muestran foto + nombre correctos
   PC/movil. Guardar/cargar una foto valida desde el maestro conserva el dato
   en ambos consumidores. Una prueba de existencia de URL no reemplaza esto.
4. Conservar fotos personalizadas y datos de negocio; recetas, importes, regalos
   y permisos no se alteran por la correccion. Contrastar variantes de buffet.
5. Claude registra compilacion/pruebas del conjunto en el mismo SHA y actualiza
   `docs/YA-RESUELTO.md`. No afirmar sincronizacion productiva sin comprobarla.

Las dos pruebas nuevas que siguen son propuestas PENDIENTES: no existen ni se
ejecutaron. Las 39 unitarias de 77 prueban otros contratos, no aceptan estas fotos.

```comprobar
archivo: src/lib/catering/menu-images.ts
usa: getCateringDishImage en src/app/(app)/empresa/menus/catalogo/page.tsx
usa: getCateringDishImage en src/app/simulador-de-presupuesto/page.tsx
archivo: src/data/menus-catering.json
archivo: src/app/actions/menus-catering.ts
usa: getMenusPublicos en src/app/actions/public-simulator-bootstrap.ts
prueba: src/__tests__/catering-fotos-corresponden-al-plato.test.ts (PENDIENTE)
prueba: tests/e2e/catering-maestro-simulador-fotos.spec.ts (PENDIENTE, entorno aislado)
```
