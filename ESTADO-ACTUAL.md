# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 21 de agosto de 2026.
**Estado de la app:** sana. Acentos limpios, tipos en cero, 2044 pruebas en verde (incluidas pruebas de puertas de servidor en cero pendientes y pantallas sin puerta), compila, seguridad de la base en verde, build de Next.js OK.
**Propuestas abiertas:** ninguna.
**Órdenes resueltas:**
1. Puertas de servidor: 100% protegidas y auditadas (`puertas-pendientes-de-revisar.json` en `{}`).
2. Afinamiento de auditoría mecánica continua: `scripts/auditoria.mjs` refinado, 1 hallazgo real, cero falsos positivos.
**Órdenes pendientes:** ninguna urgente.

## Lo más importante de hoy: auditoría mecánica afinada y puertas cerradas

1. **Puertas de servidor:** Se auditaron y protegieron con `requireAppSession()` todas las Server Actions administrativas en `src/app/actions/`. Las funciones públicas legítimas quedaron formalmente declaradas en `auditoria-puertas-abiertas.test.ts`. El archivo de pendientes quedó en cero.
2. **Auditoría mecánica continua (`scripts/auditoria.mjs`):** Se eliminó el ruido de falsas alarmas (rutas en Windows, detección kebab/PascalCase, barrel files, exclusión de términos gastronómicos reales como mocktails y filtrado de ayudas de UI). El reporte en `auditoria-out/informe.md` ahora devuelve números limpios y precisos (1 hallazgo real comprobado).

## La regla que más encontró esta semana

> **Cuando algo pasa de correr en un solo lugar a correr en el navegador de cada uno,
> la pregunta no es "¿funciona?" sino "¿qué pasa si dos lo hacen a la vez?".**

Con esa pregunta aparecieron: un posteo que salía dos veces en las redes, la nota del
blog pagada dos veces, y un permiso que se había ampliado sin querer.

## Decisiones del dueño que NO se vuelven a preguntar

Están todas en `CLAUDE.md`. Las más recientes:

- **No se toca nada que aumente lo que cobra Firebase.** El servidor se queda dormido
  a propósito. Si una auditoría lo marca como problema de velocidad, es falso
  positivo: la app contesta entre 5 y 25 milésimas y las páginas de venta salen
  armadas de antes.
- **El video de vida no lo toca la app.**
- **La ficha de Google está verificada** y los dos enlaces son los correctos.

## Lo que depende del dueño

1. **Pedir una reseña por fiesta**, a todos por igual y sin premio.
2. Anotarse en los directorios gratis.
3. Tres cosas están armadas y esperando conectar una cuenta: Google Workspace,
   búsqueda de canciones en Spotify y el puntaje de Google en el panel.
