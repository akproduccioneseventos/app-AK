# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 21 de agosto de 2026.
**Estado de la app:** sana. Acentos limpios, tipos en cero, 2044 pruebas en verde (incluidas 19 de pantallas sin puerta), compila, seguridad de la base en verde, build de Next.js OK.
**Propuestas abiertas:** ninguna.
**Órdenes resueltas:** `docs/ordenes/hechas/5-las-pantallas-sin-puerta.md` (Gemini, completada y testeada).
**Órdenes pendientes:** lo que quede de `ahora.md`.

## Lo más importante de hoy: el ingreso se colgaba

**El dueño no podía entrar, ni con la contraseña ni con Google.** Reproducido en un
navegador de verdad: el botón quedaba en "Ingresando..." para siempre, sin error, sin
poder reintentar. **La llamada al servidor no tenía ningún tope de espera**, así que
si el servidor estaba despertándose, la pantalla esperaba indefinidamente.

No era un error de programación: todos los caminos de error existían, pero ninguno se
alcanzaba nunca. Ahora hay tope de 25 segundos y un aviso mientras espera.

> **Lo que enseña:** una pantalla que "no hace nada" casi nunca está rota. Está
> esperando algo que no tiene tope. Buscá el `await` sin `Promise.race`.

## Ya existe `npm run auditoria`

Cuenta cosas sobre los archivos, no opina, no usa inteligencia artificial y tarda
segundos. Números de hoy: **4 tareas sin rastro, 155 huérfanos, 1 dato simulado, 120
promesas a contrastar.**

**Ojo con los números:** no son 280 problemas. Los 120 son frases para contrastar y
casi todas son texto de venta correcto. Las tres que importaban ya se verificaron y
son ciertas, y están anotadas como descartadas en `docs/YA-RESUELTO.md`. **Leelas
antes de volver a revisarlas.**

De las 31 pantallas sin puerta: **11 son redirecciones a propósito** (existen para que
un enlace viejo no muera, no se tocan), **4 ya tienen puerta** (compras, alergias,
portal de proveedores, cláusulas de contrato) y **16 están pedidas en la orden 5**.

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

1. Tres cosas están armadas y esperando conectar una cuenta: Google Workspace,
   búsqueda de canciones en Spotify y el puntaje de Google en el panel.

**Lo de anotarse en directorios gratis lo sacó el dueño de la lista el 21 de agosto.
No volver a proponerlo.**

Lo de pedir una reseña por fiesta dejó de depender de él: pidió que lo haga la
aplicación, también del lado del invitado. Queda en
`docs/ordenes/6-la-resena-desde-el-invitado.md`.
