# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 15 de septiembre de 2026, de madrugada. **Rama: `main`**, ya publicado.

## Lo que se publicó en esta tanda

- **Guardar un cambio ya no borra el resto.** Si la lectura de lo guardado fallaba, el cambio se
  escribía encima y se llevaba puesto todo lo demás del documento. Ahora, si no se puede leer, no
  se guarda y se avisa. Es lo más grave que entró.
- **Entraron los hallazgos de Codex** y se cerró la orden 58.
- **La puerta retoma donde quedó.** Guarda qué pasó bien y sobre qué código exacto; si se cae el
  contenedor, no repite los seis minutos de compilación ni lo anterior. Cualquier cambio en el
  código invalida el avance y vuelve a correr todo.
- **La pantalla que no abre a tiempo se mira de nuevo, sola.** Antes una sola pantalla lenta con
  la máquina cargada frenaba una corrida de cincuenta minutos.

**Los dos controles nuevos se probaron rompiéndolos**, como manda la regla.

## Lo que quedó pendiente y por qué

- **La parte de navegador no llegó a dar una vuelta limpia de punta a punta.** Tres corridas
  seguidas fallaron con una prueba DISTINTA cada vez —la cámara de la fotocabina, la cápsula del
  tiempo, el movimiento de la portada— y **las tres pasan corridas solas**. Es la máquina cargada,
  no la app. El dueño decidió publicar igual y volver a correrla con la máquina descansada.
  **Eso es lo primero que hay que hacer al abrir el próximo chat:** `npm run "publicar?"`.
- **Devolución escrita para Gemini, orden 48** (`docs/ordenes/DEVOLUCION-48-entretenimiento-sesion-segura.md`):
  su arreglo de fotocabina y espejo deja la cabina colgada en "Subiendo..." para la persona
  siguiente, y su prueba nueva se aprueba a sí misma.
- **Orden 55 y 56** (Gemini) siguen a medias, en la propuesta 1206 sin fusionar.
- `docs/ordenes/DEVOLUCION-acceso-administrativo.md` sigue esperando la decisión del dueño.

## Trampas que costaron tiempo y no se repiten

- **Nunca barrer procesos por nombre con `pkill -f`**: el patrón caza también el propio comando y
  mata la sesión. Ya pasó dos veces en una noche.
- **La puerta se cae si se cae el contenedor.** Ahora al menos retoma.
- **No correr nada mientras corre la puerta.** Sigue vigente.
