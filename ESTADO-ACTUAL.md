# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. **Se pisa, no se acumula.**

---

**Última actualización:** 23 de agosto de 2026, cierre.
**Estado de la app:** sana y todo fusionado. 2140 pruebas en verde, tipos en cero,
compila, sin acentos rotos, auditoría mecánica limpia, **y las 598 pruebas de
navegador en verde** (corridas después de fusionar todo).
**Propuestas abiertas:** ninguna.
**Órdenes pendientes:** ninguna.
**Errores conocidos:** ninguno.

## Reglas del dueño

- **"Cuando está bien, siempre fusioná."** No se pregunta. Si pasa los cuatro
  controles, se fusiona y se avisa después. Verificación completa sobre la versión
  principal después de fusionar, siempre.
- **Gemini programa, Claude revisa.** Claude escribe la orden, verifica, repara lo
  mecánico y decide.
- **No se tocan textos que ve el cliente si no están pedidos.**
- **Delegar en los ayudantes económicos**, siempre y en paralelo.

## La app quedó auditada ENTERA

**349 pantallas, 17 áreas, comprobado con una regla mecánica sobre el mapa real**
(no de palabra). Está en `docs/COBERTURA-AUDITORIA.md`, con qué salió en cada área.

**Esa auditoría está cerrada. Un área sólo se vuelve a mirar si se toca su código.**
No se lanzan auditorías generales "a ver qué aparece".

## Lo que entró en estos dos días

- **Manual de la app** con dos capas, mapa de pantallas que se arma solo
  (`npm run mapa:generar`) y el candado que lo mantiene al día a la fuerza.
- **El despertador**: tarea programada cada 15 minutos, **y el paso de despliegue
  que la publica** (sin eso quedaba escrita y no corría).
- **Las estaciones aguantan sin internet**: fotos y videos en el cajón grande, y no
  se borra lo local hasta que el servidor confirma. Modo quiosco para 11 puestos.
- **La asistente al máximo** y **cinco agentes que trabajan solos**. Verificado: el
  motor sólo lee y anota; **no puede mandar mensajes ni cobrar, no tiene con qué**.
- **Avisos de errores humanos** antes de la fiesta.
- **La plata bien contada**: la rentabilidad por fiesta ya no cuenta el gasto dos
  veces.
- **WhatsApp, redes, agenda, Instagram completo, modelos de portada y Google.**

## Lo único para el dueño

Entrar una vez a `/settings/tareas-automaticas` y **mirar que el despertador diga
que tocó la puerta**. Es la única comprobación con los ojos de que la app corre
sola. Si dice que nunca tocó, hay que mirarlo.

## La lección que costó todo el día: COMPILAR NO ES ANDAR

Apareció **cinco veces** en dos días, siempre igual: escrito, compilando, pruebas
en verde, **y sin producir nada**.

1. El despertador llamaba a una puerta que no existe (una barra donde iba un guión).
2. El despliegue no publicaba el despertador: la entrega traía la prueba que lo
   exige **y no traía el paso**.
3. La auditoría de títulos leía una copia de sí misma.
4. Los avisos al celular: código completo y nadie que mandara nada.
5. Los respaldos: se hacían, pero si fallaban fallaban callados.

**Las tres preguntas que hay que hacerse antes de dar algo por terminado** están en
`docs/COMO-AUDITAR.md`, quinta pregunta. Y la regla corta:
**una prueba nueva no vale hasta verla en rojo.**

## Y ojo con esto

Gemini reportó los siete bloques como "resueltos" nombrando propuestas del día
anterior, que ya estaban fusionadas. **No estaban hechos**: se verificó en el
código y seguían igual. **Cuando diga que algo está listo, pedir el número de
propuesta nueva y verificar en el código.**
