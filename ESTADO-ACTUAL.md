# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. **Se pisa, no se acumula.**

---

**Última actualización:** 22 de agosto de 2026, con la entrega de Gemini adentro.
**Estado de la app:** sana. 2082 pruebas en verde, tipos en cero, compila, sin
acentos rotos. Verificado sobre el conjunto, no sobre cada pedazo.
**Rama de esta tanda:** `claude/chat-indicaciones-trabajo-jlpbj1`, subida y verde.
**Falta que el dueño diga si se fusiona.**

## Qué hay en esta tanda (dos trabajos juntos, para fusionar una sola vez)

**1. El manual de la app** (`docs/MANUAL-DE-LA-APP.md`): uno solo, dos capas.
Arriba el mapa en criollo, que lee la asistente de la app para llevar al equipo a
la pantalla que busca. Abajo el índice técnico: dónde vive la plata, cómo
funciona la asistente, qué corre solo, **qué NO existe** y los porqués.

- El mapa se arma solo: `npm run mapa:generar` → 341 pantallas, 39 opciones de
  menú. **No escribir listas de rutas a mano en ningún lado.**
- El candado: `src/__tests__/mapa-de-la-app-al-dia.test.ts` se pone en rojo si
  alguien agrega una pantalla y no regenera el mapa.
- Arreglado: la asistente mandaba al plan de pagos y a reuniones a pantallas que
  no existen.

**2. La entrega de Gemini**, revisada y reparada: el escáner de comprobantes
enchufado en la pantalla de gastos, el calendario de Google que se sincroniza
solo, y el cartel de Spotify que decía "sin credenciales" estando conectado.

- **Se le sacó ruido**: un archivo con 2372 líneas cambiadas y ninguna diferencia
  real (editor de Windows), y dos archivos de avisos con un prospecto de prueba.
- **Mirado con lupa por tocar permisos**: no hay llaves de Google en el
  repositorio, el permiso de administración sigue puesto, el token no viaja al
  navegador.

## Lo que sigue

- **Decidir si se fusiona esta tanda.**
- **Mandarle la orden a Gemini**: `docs/ordenes/ahora.md`, una sola propuesta con
  cuatro bloques (el mapa dentro de la asistente, conectar Instagram, repartir el
  blog en la semana, y ver cómo va el posicionamiento). **Ojo: Gemini lee de la
  versión principal, así que la orden le llega recién cuando esto se fusione.**
- **Seis propuestas viejas abiertas en GitHub.** Su trabajo ya está publicado o
  quedó absorbido en esta tanda: van a la basura, no se fusionan.

## Dos cosas para decirle al dueño si pregunta

- **Las notas del blog NO salen en borrador.** Se publican directo. En un chat
  anterior se le dijo lo contrario; ya está corregido y anotado.
- **Un ayudante reportó "no compila" y era falso**: dos compilaciones a la vez en
  la misma carpeta se pisan. El error nombraba archivos generados, no código.

## Sumado el 22 de agosto: la entrega de Gemini, los cuatro bloques

Verificada entera: 2082 pruebas en verde, tipos en cero, compila, sin acentos
rotos. Va apilada arriba del manual, así que **es una sola tanda para fusionar**.

- **La asistente ya sabe manejar la app.** Recibe el mapa del menú y, si el modelo
  inventa una pantalla, **cancela la navegación** y ofrece la opción más parecida.
- **Instagram se puede probar con un botón**, del lado del servidor, con permiso
  pedido y sin que la llave viaje a ningún navegador.
- **El blog quedó en una nota cada dos días** (misma cantidad por semana,
  repartida; rinde más en Google).
- **Pantalla nueva de posicionamiento**, dentro de presencia digital.

**Lo que quedó mal y ya está pedido en `docs/ordenes/ahora.md`:** esa pantalla
promete avisar cuando una página de venta pierde el título, pero tiene los
títulos **copiados a mano** y se controla a sí misma. Si una página pierde el
título de verdad, va a seguir diciendo "óptimo". No rompe nada; es una promesa
que no cumple.
