# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 20 de agosto de 2026.
**Estado de la app:** sana. Tipos en cero, 1916 pruebas, acentos limpios, compila.
**Propuestas abiertas:** ninguna.
**Órdenes en fila:** `ahora.md` (bloques 7 y 8), `2-despues-de-los-comentarios.md`,
`3-lo-automatico-que-se-ve.md`, `4-la-auditoria-que-corre-sola.md`. **Una
propuesta por orden, en ese orden.**

## LO MÁS IMPORTANTE: cómo se audita ahora

**Está en `docs/COMO-AUDITAR.md`. Se lee antes de auditar.** El método viejo falló:
la app estaba declarada terminada y en un día aparecieron unas veinte fallas
reales. **Ninguna era un error de programación: todas pasaban los cinco controles
de salud sin despeinarse.**

> **La pregunta vieja era "¿está escrito?". La nueva es "¿pasó de verdad?".**

Cuatro preguntas, todas mecánicas, todas para los ayudantes: ¿dejó rastro?,
¿alguien lo llama?, ¿simula datos en vez de avisar?, ¿lo que promete la pantalla
existe en el código?

**Al ayudante se le pide "contá y listá", nunca "revisá si está bien".** Con
criterio inventan: 70% de falsas alarmas. Contando, 100% de aciertos.

## El barrido completo ya se hizo. Esto dio

- **24 cosas pensadas para pasar solas.** **Tres sin nadie que las dispare:** los
  números de las redes, los posteos programados y los recordatorios de cuota. **El
  blog SÍ tiene disparador** (`MarketingAutomationTrigger` en `app-shell.tsx`,
  cuando un administrador abre la app). Al inventariar, la respuesta correcta
  tiene tres estados: *la dispara algo*, *sólo si alguien abre la app*, *nadie*.
- **Código huérfano: limpio.** Lo que parecía huérfano era falsa alarma.
- **Datos inventados en pantalla: uno.** El chat de la fiesta completaba la hora,
  el salón y la vestimenta cuando no estaban cargados. Arreglado en los dos
  caminos, incluido lo que se le pasa al modelo.
- **Promesas incumplidas: dos.** La cola sin señal se borraba entre pantallas, y
  la lista de música del cliente nunca le llega al DJ. La primera arreglada; la
  segunda, texto corregido y el arreglo pedido en la orden.

## Lo que queda del lado del dueño

**Una sola cosa destraba tres tareas:** prender el disparador en Firebase. Gemini
deja el paso a paso sin jerga en `docs/PRENDER-LAS-TAREAS.md`.

Y lo de siempre: reclamar la ficha de Google y pedir una reseña por fiesta, a
todos por igual y sin premio.

## Decisiones del dueño que NO se vuelven a preguntar

- **Los testimonios de las páginas de venta son reales.** Se reportaron dos veces
  como inventados. No se tocan.
- **La ficha de Google está verificada** y el enlace de reseñas cargado.
- **No tiene local físico:** trabaja en el salón que lo contrate. La ficha va sin
  dirección, con zona de cobertura.
- **Wfolio no es una integración:** es un campo donde se pega el enlace del álbum.
- Descartó el precio variable por fecha, alquilar la app a otros salones y el
  "ensayo de la fiesta".
