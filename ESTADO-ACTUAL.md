# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 24 de agosto de 2026.
**Estado de la app:** sana. Acentos limpios, tipos en cero, 2172 pruebas en verde,
compila.
**Propuestas abiertas:** una en borrador (#1130), chica, para juntar con el próximo
trabajo y pagar un despliegue en vez de dos.

## Lo que se hizo el 24 de agosto

- **Se fusionó el Cerebro de Publicidad de Meta (#1129).** Pasó los cuatro controles.
  Lo que se miró línea por línea, porque toca plata: el vigilante de campañas **mira y
  avisa, nunca gasta ni sube un presupuesto solo**; el botón que manda un anuncio a
  redes lo deja **en borrador**, y el publicador automático saca únicamente lo marcado
  como "programado"; el creador de anuncios arma el texto con plantillas y datos reales
  (fotos del catálogo, testimonios, servicios), **no gasta inteligencia artificial por
  uso**.
- **La pantalla que mentía.** `/admin/asistente-ak` decía que el asistente estaba
  "temporalmente desactivado". Era falso: anda, en `/multiagente`. Ahora redirige ahí.
- **El manual quedó anotado en `CLAUDE.md`.** Existía y estaba completo, pero no
  figuraba en las reglas, así que una sesión nueva no sabía que había que actualizarlo.

## Lo que está en manos de Gemini ahora

Codex encontró cuatro cosas sobre la versión principal y **Gemini las está
corrigiendo**. Las dos primeras son las que importan:

1. Una captura guardada sin internet puede quedar asociada a **otro invitado**.
2. Touchpix puede **subir dos veces** la misma foto o reintentar un error permanente.
3. Algunas descargas del mural podrían omitir contenido pendiente sin avisar.
4. Un contador animado salta a cero y vuelve a subir.

**Cuando entregue, hay que verificarlo con lupa antes de que entre**, sobre todo las
dos primeras: son de las que sólo se ven en una fiesta de verdad.

## La regla que manda: no se sale a buscar problemas

**El dueño, 21 de agosto:** *"estoy cansado que nunca queda pronta la app"*. Y después:
*"si salís y encontrás errores, quiere decir que tiene errores"*. Las dos son ciertas.
Lo roto de verdad se arregla siempre; lo que **no** se hace es salir a auditar cada vez
que él pregunta cómo está, porque una auditoría siempre devuelve algo y todo le llega
como lista de pendientes. A esa pregunta se contesta con el estado, no con una lista.

## El manual: `docs/MANUAL-DE-LA-APP.md`

Un solo archivo, dos capas: arriba el mapa en criollo, que lee la asistente de la app;
abajo el índice técnico y los porqués, que leen las IA que programan. La lista de
pantallas la regenera `npm run mapa:generar` y **no se escribe a mano**. El candado es
`src/__tests__/mapa-de-la-app-al-dia.test.ts`: si alguien agrega una pantalla y no
regenera el mapa, se pone en rojo y ese cambio no entra.

## Falsos positivos verificados (no volver a reportarlos)

- Las notas del blog **ya salen repartidas**, una cada dos días.
- Las fotos de ejemplo de Instagram **no se publican**: sin la conexión de Meta la app
  avisa que no está conectada, no muestra fotos inventadas.
- La galería de YouTube **anda sola**, sin configurar nada.
- El blog **no depende sólo de un despertador externo**: cuando alguien del equipo
  entra a la app, lo atrasado se pone al día a los pocos segundos.

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
