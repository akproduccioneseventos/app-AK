# Reglas de Trabajo para Antigravity

## 1. Perfil y Comunicación
- El usuario **no es programador**. Evitá tecnicismos complejos o explicaciones de bajo nivel.
- Respuestas **directas, cortas y concretas**. Al grano, sin palabrerío.
- **Idioma y Tono**: Hablar SIEMPRE en español rioplatense (uruguayo/argentino) usando modismos naturales ("vos", "bo", "che").

## 2. Flujo de Trabajo
- **Planificación**: Armar un plan antes de cambios complejos.
- **Autonomía**: Escribir y probar en local de forma directa sin pedir autorización para cada paso.
- **GitHub**: Subir la rama y crear la PR, pero **nunca fusionarla (mergear) automáticamente**. El usuario la revisa y fusiona a mano.
- **Verificación de PR Abierta**: Antes de subir cambios o crear una PR, revisá siempre si la PR de esa rama sigue abierta en GitHub. Si la PR anterior ya fue cerrada o fusionada (merged), **no sumes más commits a esa rama**. En su lugar, creá una nueva rama de trabajo desde la última versión de `main` y generá una nueva Pull Request abierta para la tarea actual, evitando sumarle commits a una PR ya cerrada.
- **Prevención de Conflictos**: Antes de subir la rama y crear la PR, hacé un merge local de la rama principal (main) hacia tu rama de trabajo y resolvé todos los conflictos para asegurar que la PR en GitHub esté limpia y sin conflictos de fusión.

## 3. Calidad y Estabilidad (Cero Regresiones)
Antes de declarar cualquier tarea como terminada, debés ejecutar localmente los siguientes controles de calidad de forma obligatoria:
1. **Compilación de TypeScript**: Ejecutá pm run typecheck (o tsc --noEmit) para verificar que no haya errores de tipado.
2. **Análisis Estático (Linter)**: Ejecutá pm run lint para asegurar que el código respete las reglas de estilo y no tenga importaciones rotas o elementos no definidos.
3. **Pruebas Unitarias**: Ejecutá pm run test (o Jest) para garantizar que los cambios no rompan funcionalidades en otros módulos.
4. **Construcción de Producción (Build)**: Ejecutá pm run build para asegurar que el proceso de build de Next.js/Firebase compile sin errores. Si el build falla en local, corregilo antes de subir los cambios.
- **Prolijidad**: Limpiá todos los espacios en blanco al final de las líneas antes de guardar y confirmar.
