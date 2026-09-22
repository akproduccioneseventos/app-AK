# Devolución — órdenes 74, 75 y 77: seis pruebas de navegador nuevas no pasan

**Propuesta 1214, rama `feat/ordenes-74-75-77`.** Medido el 22 de septiembre de 2026 con la
corrida de producción (`npm run test:e2e:production`) sobre la rama juntada con `main`.

Compila, las 2.825 pruebas unitarias pasan, sin acentos rotos y `npm run ordenes?` da las tres
órdenes como hechas. **Pero las dos pruebas de navegador nuevas fallan, seis casos en total**, y
sin ellas no se puede saber si lo que se entregó funciona. **No se fusionó.**

Antes de decir "terminé", pasá lo que tocaste por `docs/ANTES-DE-ENTREGAR.md`. **Una sola
propuesta con todo**, sobre la misma rama.

## 1. El secretario — `tests/e2e/el-secretario-escucha-y-hace.spec.ts` (2 casos)

Falla en la línea ~87: **no aparece el botón `Abrir Asistente IA AK`**.

**Lo que ya medí, para que no lo busques:** el botón **sí existe** en
`src/components/multiagent/multiagent-widget.tsx`, línea ~926, con ese mismo nombre accesible.
O sea que **no es el texto del botón**: el widget no se dibuja en la pantalla que abre la prueba.

**Qué mirar, en este orden:**

1. **La sesión.** Las pantallas del equipo piden **dos mitades** —la cookie y la marca en el
   navegador—. Usá `ponerSesionDelEquipo` de `tests/e2e/helpers/fiesta-de-prueba.ts`. Con media
   sesión la pantalla rebota al ingreso y el widget nunca aparece. Es la causa más común.
2. **La pantalla.** Confirmá que la ruta que abrís monta el widget.

## 2. El salón 3D en el portal con clave — `tests/e2e/el-cliente-gira-su-salon-en-3d.spec.ts` (4 casos)

Fallan los dos casos de **"Puerta 2 (`/portal/c/[accessKey]`)"**, en escritorio y en celular:
**no aparece `[data-testid="seccion-salon-3d"]`**, ni con plano ni sin plano.

**La trampa más probable, y está escrita en `CLAUDE.md`:** con los datos locales de prueba sólo
existen las **fiestas históricas**; las fiestas activas viven en la base. Una pantalla que busca
una fiesta por su clave muestra **"no encontrada"**, y ahí no hay sección 3D que ver.

**Qué hacer:** la prueba tiene que **crear primero la fiesta de prueba con su clave de acceso**
—mirá cómo lo hacen las otras pruebas en `tests/e2e/helpers/fiesta-de-prueba.ts`— y recién
después abrir el portal. Comprobá en pantalla que el portal **encontró la fiesta** antes de
buscar el 3D; si no la encuentra, que la prueba falle diciendo eso, no "no aparece el 3D".

## Qué NO tocar

- **Lo de la Puerta 1** (el portal del cliente con sesión) **pasa**: no lo rehagas.
- `SalonDelClienteEn3D.tsx`, `contar-mesas.ts` y la prueba `el-salon-se-arma-solo-con-lo-contratado`
  están bien.

## Cómo se da por hecha

Las dos pruebas pasan **en escritorio y en celular** con la corrida de producción. Y cada una
**se pone en rojo** si se saca lo que prueba: sin el widget, sin la sección 3D.

```comprobar
prueba: tests/e2e/el-secretario-escucha-y-hace.spec.ts
prueba: tests/e2e/el-cliente-gira-su-salon-en-3d.spec.ts
```
