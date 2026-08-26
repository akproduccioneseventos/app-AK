# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 25 de agosto de 2026, cierre.
**Estado de la app:** sana. Acentos limpios, tipos en cero, 2195 pruebas en verde,
compila (282 páginas).
**Propuestas abiertas:** ninguna.
**Órdenes pendientes:** ninguna. La orden 7 se entregó y se fusionó.

## Lo que se fusionó el 24 y 25 de agosto

- **Cerebro de publicidad de Meta (#1129).** El vigilante **mira y avisa, nunca gasta ni
  sube un presupuesto solo**; el botón que manda un anuncio a redes lo deja **en
  borrador**; el creador arma el texto con plantillas y datos reales, **sin gastar
  inteligencia artificial por uso**.
- **Las fotos del invitado no se pierden (#1130 y #1133).** Ver la lección abajo.
- **La app ordenada (#1134).** Lo más grande de la tanda:
  - **«Mi día»** junta seis pantallas sueltas en una. **Sin las palabras que el dueño
    prohibió** —riesgo, urgente, crítico, vencido, alerta, atrasado, pendiente— y sin
    rojo. Cada línea es una acción con nombre y apellido: *"Cobrarle la segunda cuota de
    $12.000 a Marcela"*. Los montos sólo los ve quien tiene permiso de contabilidad.
  - **Marketing es un módulo**, con redes, WhatsApp, anuncios y su rendimiento adentro.
  - **Un mismo cobro ya no se cuenta dos veces.** Alguien cobraba y lo cargaba a mano, y
    después alguien lo cargaba en la factura: el panel contable mostraba el doble.
  - **Salieron los dos tableros de programador** y se arreglaron las dos pantallas que
    abrían el diseñador de mesas por error.

## Lo que quedó a medias, y hay que terminar

- **El menú todavía no quedó en tres puertas.** Se agregó «Mi día» y el módulo de
  marketing, pero las cinco secciones siguen ahí. No se perdió nada: falta agrupar.
- **El control anti-mentira quedó angosto.** Hoy mira las pantallas de conexiones y
  redes, no todas. La parte que sí quedó fuerte es la de las palabras prohibidas en
  «Mi día»: **si alguien mete "urgente" ahí, la prueba se pone en rojo.**

## La lección de la tanda: los cuatro controles no alcanzan

Dos entregas seguidas **pasaron acentos, tipos, todas las pruebas y el build**, y aun así
le hacían perder la foto a un invitado: la cabina guardaba la foto sólo si el error se
llamaba de cierta manera —y **el Safari del iPhone la llama distinto**—, y la cola la
borraba a los tres intentos.

> **Al revisar una entrega, la pregunta no es "¿pasa los controles?" sino "¿qué ve el
> usuario cuando algo falla?".** Lo que ninguna prueba pregunta, ninguna prueba lo agarra.

## Lo que se contó de la app (no volver a buscarlo)

**350 pantallas, y cero para borrar.** 38 son redirecciones que hay que dejar, 310 están
enlazadas, y las 2 que aparecían sin uso son falso positivo verificado. Los tableros que
parecían repetidos **ya estaban unificados**: hay un solo Centro de Fiesta. El detalle,
con números, está en `docs/YA-RESUELTO.md`.

## La regla que manda: no se sale a buscar problemas

**El dueño, 21 de agosto:** *"estoy cansado que nunca queda pronta la app"*. Y después:
*"si salís y encontrás errores, quiere decir que tiene errores"*. Las dos son ciertas. Lo
roto de verdad se arregla siempre; lo que **no** se hace es salir a auditar cada vez que
él pregunta cómo está, porque una auditoría siempre devuelve algo y todo le llega como
lista de pendientes. A esa pregunta se contesta con el estado, no con una lista.

## Ojo al revisar entregas de Gemini

**Tres veces seguidas** trajo la configuración de cobros de Mercado Pago, que deja los
cobros en dinero real sin la llave que valida los avisos de pago. Vuelve porque cada
entrega arranca de una copia vieja. **Revisar `apphosting.yaml` en cada entrega.**

## Decisiones cerradas que NO se vuelven a preguntar

- **No se toca nada que aumente lo que cobra Firebase.** El servidor se queda dormido a
  propósito; si una auditoría lo marca como lentitud, es falso positivo.
- **La llave de cobros no se cambia.** Se propuso dos veces; dijo que no.
- **El WhatsApp es su número personal.** Preparar sí, mandar no. Ningún bot general.
- **El video de vida no lo toca la app.**
- **La reseña la pide la aplicación, también al invitado.** Ya está hecho.
- **Anotarse en directorios gratis: descartado.**
- Los testimonios de las páginas de venta **son reales**.
- No tiene local físico: la ficha va sin dirección, con zona de cobertura.
