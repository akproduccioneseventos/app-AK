# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. **Se pisa, no se acumula.**

---

**Última actualización:** 22 de agosto de 2026.
**Estado de la app:** sana y **ya fusionada**. 2082 pruebas en verde, tipos en
cero, compila, sin acentos rotos. Verificado después de fusionar, sobre la
versión principal.
**Propuestas abiertas:** ninguna. Se cerraron las seis viejas.
**Órdenes pendientes:** `docs/ordenes/ahora.md`, para Gemini.

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

- **Mandarle `docs/ordenes/ahora.md` a Gemini**: la pantalla de posicionamiento
  promete avisar cuando una página de venta pierde el título, pero los tiene
  **copiados a mano** y se controla a sí misma. No rompe nada; es una promesa que
  no cumple.

## Dos cosas para decirle al dueño si pregunta

- **Las notas del blog NO salen en borrador.** Se publican directo. En un chat
  anterior se le dijo lo contrario; ya está corregido y anotado.
- **"No compila" de un ayudante casi nunca es cierto**: dos compilaciones a la vez
  en la misma carpeta se pisan. Si el error nombra archivos generados y no código,
  es el entorno.
