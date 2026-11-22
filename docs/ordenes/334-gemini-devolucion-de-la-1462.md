# Orden 334 — Devolución de la 1462: veinte pruebas de pantallas en rojo después de juntar pantallas

**Para Gemini. Misma rama `gemini/ordenes-331-332`, misma propuesta (#1462).** No abras otra. Arrancá de lo que hay en la
rama: Claude ya le sumó cuatro arreglos (Centro de control, paquete del AK Editor, enlaces del invitado sin pase y la lista
de controles de `YA-RESUELTO.md` apuntando a los paneles). **No los deshagas.**

## Qué pasó

Los tipos, Jest, los acentos y `ordenes?` dan bien. Lo que frena es **"La app usada de verdad"**: 25 pruebas de navegador
fallan, y **fallan igual al repetirlas solas** (`npm run otravez`), así que no es la máquina cargada. En la principal pasan.
Todas tocan pantallas que la orden 331 pasó a solapas o que dejaron de existir.

**La regla, la misma de la 331:** si la pantalla nueva hace lo mismo, la prueba **sigue a la pantalla nueva y mira el
mismo resultado**: la misma cuenta, el mismo cartel, el mismo botón. No se ablanda una comprobación, no se borra una prueba
y no se cambia lo que mira por "que cargue". Si la prueba falla porque la pantalla **perdió** algo, se le devuelve eso a
la pantalla.

## Bloque 1 — Las redirecciones encadenadas pierden la solapa

`next.config.js` ~449: `/fiestas/nueva/logistica` va a `/fiestas/nueva/carga-operativa?tab=logistica`, y ~475
`/fiestas/nueva/carga-operativa` va a `/fiestas/nueva/operacion?tab=carga-operativa`. Encadenadas, la segunda **pisa la
solapa** y el que entra por logística cae en otra cosa. Igual con `/fiestas/nueva/carga-operativa/pdf` (~440).

- Cada dirección vieja va **en un solo salto** a su destino final: `/fiestas/nueva/logistica` →
  `/fiestas/nueva/operacion?tab=logistica` (o la solapa que corresponda), y el PDF igual.
- Recorré **todas** las redirecciones que agregaste y buscá las que apuntan a otra dirección que también se redirige.

## Bloque 2 — Las pantallas que no muestran lo que la prueba espera

Por cada una: abrila en la dirección que usa la prueba, mirá qué se ve y decidí entre "la prueba sigue a la pantalla" y
"la pantalla perdió algo". Lo que esperaba cada prueba:

| Prueba (`tests/e2e/`) | Esperaba y no encontró |
|---|---|
| `la-carga-operativa-avisa-cuando-no-alcanza.spec.ts`, `la-carga-operativa-se-sincroniza.spec.ts` | el título "Carga Operativa" (el panel muestra "Control de Logística": bloque 1) |
| `las-pantallas-no-quedan-cargando.spec.ts` | logística y "reuniones imprimir" con fiesta inexistente vuelven a `/eventos` |
| `los-enlaces-llegan-a-donde-dicen.spec.ts` | los reportes sin fiesta van a `/eventos` |
| `el-cierre-de-barra-se-ve-en-el-panel.spec.ts` | el texto "Cierre de barra" en el panel de la barra |
| `en-vivo-se-lee-en-el-celular.spec.ts` | el título "Recepción" en `/fiestas/nueva/en-vivo` |
| `la-hoja-de-cocina.spec.ts`, `la-hoja-del-dj-dice-la-verdad.spec.ts`, `la-ia-trabaja-sola.spec.ts` | la hoja de cocina y la del DJ se abren e imprimen |
| `la-ia-arma-la-web-del-evento.spec.ts` | "Armar con IA" en la página web del evento |
| `la-reunion-de-organizacion-guarda-donde-corresponde.spec.ts` | la canción de entrada aparece en Música |
| `la-seccion-edicion-de-videos.spec.ts` | la sección de edición de videos y la descarga de `ak-editor.zip` |
| `orden-86-pantallas.spec.ts` | la firma del portal: "falta el papel" sin atajo para confirmar |
| `pantallas-con-iconos-react19.spec.ts` | decoración PDF, experiencia mundial y zona digital con su ícono y nombre |
| `salon-3d-se-dibuja.spec.ts` | el botón "3D" del salón |
| `la-grilla-de-caras.spec.ts` | la grilla de caras con al menos una cara |
| `layout-baseline.spec.ts`, `mobile-overflow.spec.ts` | las direcciones viejas (`/fiestas/nueva/portal-cliente`, `/fiestas/nueva/reuniones`): pasalas a las nuevas y regenerá la referencia de geometría **sólo** de las pantallas que se movieron |

## Bloque 3 — Las pruebas de la portada de dos botones que ya no existe

`public-smoke.spec.ts` ("simulator hub connects both options") y `simulador-hub-contraste-real.spec.ts` prueban la portada
de dos botones que el dueño mandó sacar. Reemplazalas por lo que es verdad ahora, mirando el resultado:

- `/simulador` termina en `/simulador-de-presupuesto` y se ve el simulador de siempre.
- Al pie del simulador está el enlace chico a Sofía y lleva a `/simulador-ak`.
- El contraste se mide sobre el simulador de verdad, no sobre una pantalla que no existe.

## Cómo entregar

1. Corré **solas** las pruebas de esta lista hasta que pasen las 25 (escritorio y celular).
2. Después la puerta completa, una vez: `npm run "publicar?"`.
3. Subí a la misma rama y avisá en la 1462. Si una no sale, entregá el resto igual y decí cuál y por qué.
4. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

```comprobar
no-usa: destination: '/fiestas/nueva/carga-operativa?tab=logistica' en next.config.js
no-usa: Elegí la experiencia para cotizar tu fiesta en tests/e2e/simulador-hub-contraste-real.spec.ts
prueba: tests/e2e/la-carga-operativa-avisa-cuando-no-alcanza.spec.ts
prueba: tests/e2e/las-pantallas-no-quedan-cargando.spec.ts
prueba: tests/e2e/public-smoke.spec.ts
```
