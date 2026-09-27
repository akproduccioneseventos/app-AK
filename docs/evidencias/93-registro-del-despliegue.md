# Registro de los despliegues de App Hosting — 27 de septiembre de 2026

Lo copió el dueño desde la consola de Firebase (App Hosting, ak-producciones), a pedido de la
orden 93. Es el historial de publicaciones, no el registro interno de cada compilación.

| Compilación | Propuesta (commit) | Resultado |
|---|---|---|
| build-2026-09-27-003 | 1234 (`5e384c6`) | **Actual: publicada** |
| build-2026-09-27-002 | 1233 (`86de081`) | Error en la compilación |
| build-2026-09-27-001 | 1232 (`91dc29e`) | Publicada (anterior) |
| build-2026-09-26-005 | 1231 (`63dace0`) | Error en la compilación |
| build-2026-09-26-004 | 1230 (`481c40c`) | Publicada (anterior) |
| build-2026-09-26-003 | 1229 (`b046863`) | Error en la compilación |
| build-2026-09-26-002 | 1228 (`ded4046`) | Publicada (anterior) |
| build-2026-09-26-001 | 1227 (`69a5685`) | Publicada (anterior) |
| build-2026-09-25-005 | 1226 (`97638e0`) | Error en la compilación |
| build-2026-09-25-004 | 1225 (`a5dc043`) | Error en la compilación |

## Qué se puede afirmar con esto, y qué no

- **La versión publicada hoy es la 1234**, que contiene todo lo anterior, incluidas las órdenes 91,
  92 y 93. Se comprueba en `https://akproducciones.uy/api/health`: el campo `version` tiene que
  empezar con el commit de la compilación de la 1234. Desde el contenedor de Claude no se llega
  al dominio; lo puede mirar Codex.
- **Las fallas no son del código de la propuesta que falló.** Cada compilación fallida fue seguida
  por otra que **trae ese mismo código y más**, y esa sí se publicó. Si el código no compilara,
  la siguiente también fallaría. Además, la puerta local compiló verde cada una de esas versiones.
- **La causa de las fallas intermitentes no se conoce.** Para saberla hace falta el registro
  interno de una compilación fallida, que se abre tocando esa fila en la consola. No se cambia
  nada del despliegue (memoria, máquina, facturación) sin ese registro.
- **Qué significa para el negocio hoy:** una fusión puede no publicarse, y queda publicada la
  versión anterior hasta la próxima fusión que compile. No rompe lo que ya está en línea.
