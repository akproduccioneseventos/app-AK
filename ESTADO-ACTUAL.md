# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión, así que si crece más de 40 líneas deja de servir. Lo histórico va a
`ESTADO-AUDITORIA.md`, que no se lee salvo que haga falta.

Quien cierre una sesión reescribe este archivo. No se acumulan tandas: se pisa.

---

**Última actualización:** 7 de agosto de 2026
**Rama:** todo fusionado en `main`. No hay propuestas abiertas.
**Estado:** compila, 1295 pruebas en verde, sin acentos rotos.

## Cómo se trabaja (acordado con el dueño)

Claude audita y deja la orden en `docs/ordenes/`. Gemini programa y sube la
propuesta. Claude verifica y fusiona; si viene rota vuelve a Gemini, salvo que
sea un renglón. Plata, cobros y permisos los escribe Claude. **Un módulo se
termina, no se deja a medias.**

## Módulo de entretenimiento: TERMINADO

Los cuatro bloques de `docs/ordenes/entretenimiento-02.md` están fusionados.

- **Bloque A**: la trivia sabe en qué mesa está cada invitado y el muro saluda
  por nombre. El que no tiene mesa juega igual.
- **Bloque C**: tope de 3 generaciones de IA por sesión de foto, contado en el
  servidor, más una red de contención de 150 por hora por estación. Una sola
  lista de estilos.
- **Bloque D**: las estaciones funcionan sin muro contratado. La foto **se
  guarda siempre**; si el muro está pausado o no contratado queda pendiente y no
  se ve. Nadie saltea la pausa de la moderación.
- **Bloque E**: el operador ve en su cabina si un invitado tuvo una falla, con
  la hora. Se borra solo cuando la estación vuelve a andar.
- Además: videos del invitado hasta 15 segundos; el tope del evento pasó de 200
  a 5000 fotos; el paquete de recuerdos baja ordenado por estación y se puede
  pedir de a una; 10 estilos nuevos de IA y se eligen por fiesta.

**Ojo:** `npm run build` estaba roto en `main` desde la propuesta #856 (la
pantalla de recepción). Ya está arreglado, pero conviene correr el build y no
sólo las pruebas antes de dar algo por sano.

## Lo próximo, si nadie dice otra cosa

Las pruebas de navegador de las estaciones quedaron corriendo al cerrar. Si
alguna falla, es lo primero a mirar.
