# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 21 de agosto de 2026, cierre.
**Estado de la app:** sana y terminada. Acentos limpios, tipos en cero, pruebas en
verde, compila, seguridad de la base en verde.
**Auditoría:** las cinco pasadas en **cero**. No queda ningún hallazgo abierto.
**Propuestas abiertas:** una en borrador, sólo con este registro y dos ajustes de la
auditoría. Se junta con el próximo trabajo, no se fusiona sola.
**Órdenes pendientes:** ninguna.

## La regla que manda: no se sale a buscar problemas

**El dueño, 21 de agosto:** *"estoy cansado que nunca queda pronta la app, cada vez que
pregunto me decís se arregló esto o esto"*. Y después: *"si salís y encontrás errores,
quiere decir que tiene errores"*.

Las dos cosas son ciertas. Lo que se encontró ese día era real y estuvo bien
arreglarlo. **Lo que estaba mal era el método:** cada vez que él preguntaba cómo estaba
la app, se salía a auditar de nuevo, y una auditoría siempre devuelve algo. Mezclado
con lo real venía lo que no lo era, y todo llegaba como lista de pendientes.

- **Lo que está roto de verdad se arregla siempre.** Roto de verdad es: falla en una
  fiesta, una cuenta da mal, plata que se mueve mal, alguien ve lo que no tiene que
  ver, o una pantalla que el usuario no puede usar.
- **No se audita porque sí**, ni al abrir sesión, ni porque él pregunte cómo está. A
  esa pregunta se contesta con el estado, no con una lista nueva.
- **Lo que no está roto no se reporta como pendiente:** se anota en
  `docs/YA-RESUELTO.md` como falso positivo verificado y se cierra.
- **Lo mirado y decidido se declara en el código**, para que no se vuelva a levantar.

## Los dos que quedaban, cerrados

- **La foto al comprobante** anda pero no la enlaza nadie. **Queda guardada sin
  enlazar**: muestra los datos y no los guarda en ningún pago, así que engancharla así
  gastaría inteligencia artificial sin dejar nada anotado. Declarada con su motivo.
- **La "promesa" de WhatsApp** era un comentario del código, no un cartel en pantalla.
  Se corrigió el control, no el comentario.

## Cosas que ya se cuidan solas

Ninguna marca de conflicto sin resolver en ningún archivo (nació porque la
configuración del servidor quedó rota y el despliegue no iba a arrancar), ninguna
puerta pública cerrada de más, ninguna función de servidor abierta sin querer, y el
ingreso con tope de espera.

## Ojo al revisar entregas de Gemini

**Tres veces seguidas** trajo la configuración de cobros de Mercado Pago, que deja los
cobros en dinero real sin la llave que valida los avisos de pago. Vuelve porque cada
entrega arranca de una copia vieja. **Revisar `apphosting.yaml` en cada entrega.**

## Lo que depende del dueño

**Nada urgente.** Conectar tres cuentas cuando quiera: Google Workspace, búsqueda de
canciones en Spotify y el puntaje de Google en el panel.

## Decisiones cerradas que NO se vuelven a preguntar

- **No se toca nada que aumente lo que cobra Firebase.** El servidor se queda dormido a
  propósito; si una auditoría lo marca como lentitud, es falso positivo.
- **Anotarse en directorios gratis: descartado.**
- **La reseña la pide la aplicación, también al invitado.** Ya está hecho.
- **El video de vida no lo toca la app.**
- **La llave de cobros no se cambia.** Se le propuso dos veces; dijo que no.
- **El WhatsApp es su número personal.** Ningún bot general, nunca.
- Los testimonios de las páginas de venta **son reales**.
- No tiene local físico: la ficha va sin dirección, con zona de cobertura.
