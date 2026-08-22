# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. **Se pisa, no se acumula.**

---

**Última actualización:** 22 de agosto de 2026.
**Estado de la app:** sana y **ya fusionada**. 2084 pruebas en verde, tipos en
cero, compila, sin acentos rotos. Verificado después de fusionar, sobre la
versión principal.
**Propuestas abiertas:** ninguna. Se cerraron las seis viejas.
**Órdenes pendientes:** ninguna. La última la entregó Gemini y ya está fusionada.

## Regla nueva del dueño (22 de agosto de 2026)

**"Cuando está bien, siempre fusioná."** No se pregunta más. Si la tanda pasa los
cuatro controles, se fusiona sola y se avisa después. Verificación completa sobre
la versión principal, siempre, después de fusionar.

## Lo que entró en esta fusión

- **`docs/MANUAL-DE-LA-APP.md`**: uno solo, dos capas. Arriba el mapa en criollo,
  que lee la asistente de la app. Abajo el índice técnico: dónde vive la plata,
  qué corre solo, **qué NO existe** y los porqués.
- **El mapa se arma solo** (`npm run mapa:generar`): 341 pantallas, 39 opciones de
  menú. **No escribir listas de rutas a mano en ningún lado.**
- **El candado**: `src/__tests__/mapa-de-la-app-al-dia.test.ts` se pone en rojo si
  alguien agrega una pantalla y no regenera el mapa.
- **La asistente ya sabe manejar la app**: recibe el mapa del menú y, si el modelo
  inventa una pantalla, **cancela la navegación** y ofrece la más parecida.
- **Instagram**: botón para probar la conexión, del lado del servidor.
- **El blog pasó a una nota cada dos días** (misma cantidad por semana).
- **Pantalla de posicionamiento**, dentro de presencia digital.
- **El escáner de comprobantes** ya se llega desde la pantalla de gastos.

## Lo que sigue

- **Nada abierto.** No hay propuestas, no hay órdenes y no hay errores conocidos.
- Lo único en cancha del dueño: **cargar la conexión de Instagram** para que la
  galería traiga sus fotos. El botón para probarla ya está.

## Dos cosas para decirle al dueño si pregunta

- **Las notas del blog NO salen en borrador.** Se publican directo. En un chat
  anterior se le dijo lo contrario; ya está corregido y anotado.
- **"No compila" de un ayudante casi nunca es cierto**: dos compilaciones a la vez
  en la misma carpeta se pisan. Si el error nombra archivos generados y no código,
  es el entorno.

## Sumado el 22 de agosto (segunda tanda, ya fusionada)

- **La auditoría de títulos lee los títulos de verdad**, de cada página, no de una
  lista copiada. Aparecieron **tres páginas de venta sin título propio**, que la
  lista a mano tapaba: ya lo tienen.
- **Reparado al verificar**: la lista de páginas de promoción quedó escrita dos
  veces —la página usaba una, la auditoría leía la otra—. Quedó una sola, en
  `src/lib/marketing/promo-pages.ts`.
- La prueba de fotos propias se actualizó para mirar los dos archivos. **No se
  desactivó ninguna prueba.**

**Lección que costó dos vueltas:** mover una lista a un archivo nuevo **no** es lo
mismo que unificarla. Si la vieja queda donde estaba, la auditoría sigue leyendo
una copia de sí misma. Antes de dar por resuelto un "ahora lee la fuente real",
contá cuántas veces está definida la lista.
