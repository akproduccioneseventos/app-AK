# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 25 de agosto de 2026.
**Estado de la app:** sana. Acentos limpios, tipos en cero, 2192 pruebas en verde, compila.
**Propuestas abiertas:** una (#1132), con el arreglo de plata y la orden para Gemini.
**Órdenes pendientes:** `docs/ordenes/7-la-app-ordenada.md`, sin empezar.

## Lo que se fusionó el 24 y 25 de agosto

- **Cerebro de publicidad de Meta (#1129).** El vigilante **mira y avisa, nunca gasta ni
  sube un presupuesto solo**; el botón que manda un anuncio a redes lo deja **en
  borrador**; el creador arma el texto con plantillas y datos reales, **sin gastar
  inteligencia artificial por uso**.
- **Las fotos del invitado no se pierden (#1130 y #1133).** Ver la lección abajo.
- **Un mismo cobro ya no se cuenta dos veces (#1132, todavía sin fusionar).** Alguien
  cobraba la cuota y la cargaba a mano, y después alguien la cargaba en la factura: **el
  panel contable mostraba el doble**. El control comparaba la referencia y no coincidían.

## La orden que está esperando a Gemini

`docs/ordenes/7-la-app-ordenada.md` — ocho bloques, **una sola propuesta**. Reordena la
app en tres puertas (Mi día, La fiesta, La empresa con marketing adentro), arregla
Instagram, agrega el control que impide que una pantalla mienta, saca los tableros de
programador y arregla dos pantallas que muestran el diseñador de mesas por error.

**Lo que el dueño pidió con sus palabras, y no se negocia:** en la pantalla del trabajo
diario **no van las palabras riesgo, urgente, crítico, vencido, alerta, atrasado ni
pendiente**, ni rojo para apurar. Cada línea es una cosa para hacer, con nombre y apellido:
"Cobrarle la segunda cuota a Marcela", no "pago vencido".

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
