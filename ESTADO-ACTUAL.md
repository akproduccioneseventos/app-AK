# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. **Se pisa, no se acumula.**

---

**Última actualización:** 21 de agosto de 2026, cierre de la tanda del manual.
**Estado de la app:** sana. 2074 pruebas en verde, tipos en cero, compila, sin
acentos rotos.
**Rama de esta tanda:** `claude/chat-indicaciones-trabajo-jlpbj1`, subida y verde.
Todavía sin propuesta abierta: el dueño decide si se abre o se fusiona.

## Lo que se hizo

- **`docs/MANUAL-DE-LA-APP.md`**: uno solo, dos capas. Arriba el mapa en criollo
  (lo lee la asistente de la app para llevar al equipo a la pantalla que busca),
  abajo el índice técnico: dónde vive la plata, cómo funciona la asistente, qué
  corre solo, **qué NO existe** y los porqués que el código no cuenta.
- **El mapa se arma solo**: `npm run mapa:generar` → 341 pantallas, 39 opciones
  de menú. **No escribir listas de rutas a mano en ningún lado.**
- **El candado**: `src/__tests__/mapa-de-la-app-al-dia.test.ts` se pone en rojo si
  alguien agrega una pantalla y no regenera el mapa.
- **Arreglado**: la asistente mandaba al plan de pagos y a reuniones a pantallas
  que no existen.
- **`docs/ordenes/ahora.md`**: orden nueva para Gemini, UNA propuesta con cuatro
  bloques (mapa en la asistente, conectar Instagram, blog repartido, ver cómo va
  el posicionamiento).

## Lo que hay que decirle al dueño si pregunta

- **Las notas del blog NO salen en borrador.** Se publican directo. En un chat
  anterior se le dijo lo contrario; ya está corregido y anotado.
- **Hay 6 propuestas abiertas en GitHub.** Cuatro son viejas y su trabajo ya está
  publicado: van a la basura, no se fusionan. Las otras dos son de la noche del
  21; una de ellas se llevó adentro un dato de prueba y un archivo reescrito
  entero por fin de línea de Windows. Está ofrecido limpiarlas y juntarlas.

## Lo que sigue

- Que el dueño decida qué hacer con las propuestas abiertas.
- Mandarle la orden a Gemini.
