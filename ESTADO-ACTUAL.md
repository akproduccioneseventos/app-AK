# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 31 de agosto de 2026.
**Estado de la app:** sana y publicable. La puerta tiene ocho pasos y pasó entera.
**Propuestas abiertas:** ninguna fusionable. **La entrega de la orden 19 quedó devuelta.**

## Lo que se cerró y ya está publicado

- **El consentimiento del invitado funciona por primera vez.** El ajuste "pedir
  consentimiento" **se tiraba a la basura antes de llegar a la estación**: sólo el Espejo con
  IA podía pedirlo y para el resto se forzaba a "no". El tilde quedaba puesto en pantalla, así
  que parecía que sí, y al invitado **no se le preguntaba nada**.
- **Había una prueba que exigía que siguiera roto**, con el comportamiento viejo clavado.
  Corregida: ahora exige lo correcto.
- **La fotocabina**: arreglada y probada de punta a punta con cámara. Sin PIN en ninguna
  estación, puerta nueva `/evento/inicio` con los once íconos, y cada estación se instala
  como programa aparte sin quedar atada a una fiesta.

## Lo que espera a Gemini: la orden 19, devuelta

`docs/ordenes/19-los-ajustes-que-no-hacen-nada.md`, con la **DEVOLUCIÓN 1** arriba de todo.

**Lo que hizo bien y NO hay que rehacer:** la Plataforma 360 pasó de leer 4 ajustes a 9 y
Bogue de 4 a 10. Touchpix sumó dos. Y respetó el consentimiento, que se le pidió no tocar.

**Lo único que frena la fusión:** con su rama adentro, **el consentimiento deja de pedirse**.
La prueba `espejo-pide-permiso.spec.ts` pasaba antes y falla después. Ya se descartó lo obvio
—el código del arreglo está intacto en su rama, `station-config.ts` no tiene diferencias, y la
prueba conserva la cámara falsa—, así que está en otra cosa que tocó. **No se encontró la
causa y no hay que seguir adivinando: la tiene que reproducir él.**

**Su rama está en `revision-19`**, con tres arreglos ya hechos encima: no compilaba (un enlace
común donde la app exige el suyo), una página de venta sin ninguna prueba, y un tipo de evento
inventado que devolvía página buena.

## Pendiente viejo: el salón 3D

El dibujo del salón no aparece. **La pantalla del Configurador se usa igual** —catálogo,
presupuesto y guardado andan— y si el dibujo falla lo dice en criollo. Se probaron dos
arreglos y ninguno sirvió: la biblioteca 3D recibe un React sin la parte que busca, y eso es
de cómo se empaqueta la app. **Necesita una sesión dedicada, no un parche más.**

## Lo que costó tiempo, y no se repite

- **Una compilación zombi quedó viva tres horas y media** peleando con la nueva por la misma
  carpeta. Está escrito en `CLAUDE.md`: **si hay más de un `next build` corriendo, el
  resultado no vale.** Mirarlo es lo primero.
- **Nunca lanzar una prueba mientras se está editando código**: compila una versión a mitad de
  camino y el resultado no sirve.

## Decisiones tomadas (no volver a preguntar)

- **No se le pide el mail ni el teléfono al invitado** para darle su foto. El canal de "Mail"
  ya se sacó de la pantalla de armado: prometía algo que la app no hace.
- **Cloudflare: no.** **Google Flow: no se conecta.**
- **El agente de publicidad no prende ni crea campañas.** Eso lo activa el dueño.
- **Nada de promesas en la web** ni precios congelados: trabaja con ajuste anual.
- **El reloj del simulador va**, y es para la promoción, no para congelar la tarifa.
