# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 2 de septiembre de 2026. **Rama: `revision-t6`.**
**Lo primero: `npm run ordenes?`.** Si dice FALTA, falta, aunque las pruebas den verde.
**Pero ojo, y es lo que se aprendió hoy: que dé verde tampoco alcanza.** Ver más abajo.

## Lo que se hizo hoy

- **El álbum del recuerdo ya se abre con el enlace**, sin pedir cuenta. Era la única pantalla
  del evento que pedía iniciar sesión: **el invitado no podía abrir el regalo del cliente.**
- **La orden 34**, con lo que falta de verdad. Se verificaron una por una las ~50 funciones que
  el control daba por faltantes: **catorce ya estaban hechas.** El conteo real quedó corregido.
- **Cinco habilidades instaladas** en `.claude/skills/`: `animaciones-pro`, `que-te-encuentren`,
  `que-cargue-rapido`, `celular-primero`, más las que ya estaban.
- **Tres matafuegos nuevos**, los tres probados rompiéndolos a propósito.

## La lección del día, y está en `CLAUDE.md` como regla 7

**El control dio 10 de 10 con la página completamente quieta.** La comprobación pedía que
apareciera el nombre de la biblioteca en el archivo, y la entrega agregó un elemento **invisible
y vacío** con la animación encima.

**Una comprobación pide el RESULTADO, no el ingrediente.** La pregunta antes de escribir una:
*¿esto podría dar verde con la función apagada?*

## Lo que sigue

1. **Gemini tiene la devolución** en `docs/ordenes/DEVOLUCION-ordenes-30-34.md`: sacar el
   elemento trucho, devolver `/landing/bodas` a ser un enlace, la vista previa en vivo del
   fondo, Touchpix, y **`/evento/actual`, la pantalla de la fiesta de esta noche, que está rota.**
2. **La puerta frenó** en el recorrido: 18 pantallas rotas. Verificadas una por una, **la única
   nueva de verdad es `/evento/actual`**; cuatro son falsa alarma del control (tableros de
   números sin botones) y dos son páginas que sólo redirigen.
3. **Sin decidir:** si se corrige el recorrido para que un tablero de números no cuente como
   pantalla rota. **Es tocar un control y el dueño tiene que saberlo.**
4. La orden 33 (Remote Config) y la 31 (buscar fotos con una selfie) siguen sin programar.

## Lo que costó tiempo hoy

- **La puerta tarda 45 minutos**, y lo grande no es el recorrido: son **las 39 tandas de pruebas
  de navegador, que corren de a una** en una máquina de cuatro núcleos. Medido, no supuesto.
- **Quedó una corrida huérfana** peleándole la máquina a la buena durante 42 minutos. Antes de
  creerle a una falla: `ps aux | grep playwright`, y si hay más de una, el resultado no vale.
