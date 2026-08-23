# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. **Se pisa, no se acumula.**

---

**Última actualización:** 23 de agosto de 2026, cierre.
**Estado de la app:** sana y todo fusionado. 2140 pruebas en verde, tipos en cero,
compila, sin acentos rotos, auditoría mecánica limpia y **598 pruebas de navegador
en verde**.
**Propuestas abiertas:** ninguna.
**Órdenes pendientes:** ninguna.
**Errores conocidos:** ninguno.

## LA AUDITORÍA ESTÁ CERRADA

**349 pantallas, 17 áreas, MÁS todo el código nuevo de estos dos días.**
Está en `docs/COBERTURA-AUDITORIA.md`, con qué salió en cada área.

**Un área sólo se vuelve a mirar si se toca su código.** No se lanzan auditorías
generales "a ver qué aparece": ya se hizo y está escrito.

## Reglas del dueño

- **"Cuando está bien, siempre fusioná."** No se pregunta. Verificación completa
  sobre la versión principal después de fusionar, siempre.
- **Gemini programa, Claude revisa.** Claude escribe la orden, verifica, repara lo
  mecánico y decide.
- **No se tocan textos que ve el cliente si no están pedidos.**
- **Delegar en los ayudantes económicos**, siempre y en paralelo.
- **Verificar cada hallazgo de un ayudante antes de reportarlo.** Nueve de cada
  diez no sobreviven.

## Lo que quedó funcionando

- **La app corre sola**: despertador cada 15 minutos **y el paso de despliegue que
  lo publica**.
- **Las estaciones aguantan sin internet**, con las fotos en el cajón grande y sin
  borrar nada antes de que el servidor confirme. Modo quiosco en 11 puestos.
- **Cinco agentes que trabajan solos.** No pueden mandar mensajes ni cobrar: **no
  tienen con qué**, y eso está verificado.
- **Avisos de errores humanos** antes de la fiesta.
- **La plata bien contada** por fiesta, y **la asistente ya no puede inventar
  precios**: salen del catálogo.
- **Manual de la app** con el mapa que se arma solo y el candado que lo obliga.
- WhatsApp, redes, agenda, Instagram completo, modelos de portada y Google.

## Lo único para el dueño

Entrar a `/settings/tareas-automaticas` y **mirar que el despertador diga que tocó
la puerta**. Es la única comprobación con los ojos de que la app corre sola.

## Pendiente menor, anotado y no urgente

Con dos pestañas abiertas en la misma estación, la misma foto se puede subir dos
veces al muro. Pasa sólo si alguien abre la fotocabina dos veces en la misma
máquina.

## LA LECCIÓN DEL PROYECTO: COMPILAR NO ES ANDAR

Apareció **siete veces** en dos días: escrito, compilando, pruebas en verde, **y
sin producir nada**. El despertador llamando a una puerta que no existía; el
despliegue que no lo publicaba; la auditoría que se miraba al espejo; los avisos al
celular sin nadie que los mande; los respaldos que fallaban callados; el agente de
contenido que decía "borrador creado" sin crearlo; el aviso de seña que se apagaba
solo.

**Las tres preguntas están en `docs/COMO-AUDITAR.md`, quinta pregunta.** Y las dos
reglas cortas:

1. **Una prueba nueva no vale hasta verla en rojo.** Rompé a propósito lo que tiene
   que detectar.
2. **Una medición tomada mientras corre otra cosa no vale.** Grabar y medir siempre
   con la máquina sola.

## Y ojo con esto

Gemini reportó una vez los siete bloques como "resueltos" nombrando propuestas del
día anterior, ya fusionadas. **No estaban hechos.** Cuando diga que algo está
listo: **pedir el número de propuesta nueva y verificar en el código.**
