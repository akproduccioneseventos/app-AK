# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 28 de agosto de 2026, con la fotocabina lista para usar.
**Estado de la app:** **`npm run "publicar?"` en verde, los ocho pasos**, incluido el
recorrido completo en navegador. Se puede publicar.
**Propuestas abiertas:** ninguna.

## LO DE HOY: la fotocabina, que el dueño usa en una fiesta

**Estaba rota y la pantalla quedaba en negro.** El invitado apretaba el botón y no pasaba
nada más: sin foto, sin cartel. La pantalla **le avisaba a la base y esperaba la respuesta**,
y recién después iba a buscar la imagen de la cámara; para cuando volvía, el recuadro de la
cámara ya no estaba. Ahora **se saca la foto primero y se avisa después, sin esperar**: si la
base tarda o falla, la foto ya está.

**No se veía leyendo el código** —hay un control que comprueba que la cámara esté, y parece
suficiente; sólo que valía para el instante anterior a la espera—. Se encontró abriéndola en
un navegador y apretando el botón.

**Se le sacó el PIN a todas las estaciones**, pedido del dueño: *"o mejor sacale el PIN y ta,
así no complica."* No se pide clave ni al armar ni al salir. El aparato igual queda fijo en
esa estación y esa fiesta.

**Se hizo la puerta que faltaba: `/evento/inicio`**, con los once entretenimientos en íconos.
La pantalla ya existía pero había que saberse el enlace exacto de cada estación, así que en
la práctica no existía.

**Y un archivo descargable**: un botón baja un acceso directo que, con doble click, abre esa
estación de esa fiesta en la máquina del empleado. Sin explicarle nada a nadie.

**Cómo se usa, para repetirlo:** entrar a `/evento/inicio`, tocar el ícono, elegir la fiesta,
"Dejar el aparato listo". Para otra máquina, "Bajar acceso directo" y copiar el archivo.

## La música quedó conectada de verdad

El pedido del dueño era: *"muchas veces nos pasan link de YouTube; quiero que todo esté
conectado, no sólo el link."*

La primera entrega **reconocía** el enlace pero **no lo abría**: para una lista de Spotify
guardaba una canción que decía *"Playlist de Spotify compartida"*, artista *"Spotify"*. El
DJ hubiera visto eso en vez de los temas. **Era el mismo problema con mejor cartel.**

Ahora hay un botón que **abre los enlaces**: las listas de Spotify se leen con la llave que
la app ya tenía, y los videos de YouTube por su puerta pública, que **no necesita llave ni
cuesta nada**. Lo que no se puede abrir vuelve aparte, con el motivo en criollo —lista en
privado, video borrado, servicio caído— y **nunca como una canción inventada**.

**El panel de conexiones ahora pregunta en vez de suponer**, y separa los dos permisos, que
son distintos: *"buscar canciones y abrir listas"* por un lado y *"escribir en tu playlist"*
por el otro. Se sacó la fila de YouTube que había quedado duplicada.

**El DJ ve una sola lista**: lo del cliente junto con los pedidos de los invitados, con los
repetidos agrupados y el número al lado.

## Dos defectos reales que aparecieron al verificar

1. **La pantalla del Configurador de Reunión —la que se usa sentado adelante del cliente—
   se rompía entera** y mostraba "¡Ups! Algo salió mal": sin catálogo, sin presupuesto, sin
   guardar. La causa está adentro de la vista 3D del salón
   (`Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')`). **Ya no se
   lleva puesta la pantalla**: si el dibujo falla, falla sólo el dibujo y lo dice en criollo.
   **PENDIENTE: el 3D sigue sin verse.** React 18.3.1 y `@react-three/fiber` 8.18.0 son
   compatibles entre sí, así que no es un problema de versiones: hay que buscarlo con calma.
2. **Yo había puesto esa pantalla en una lista de excepciones** del recorrido, creyendo que
   estaba vacía por no tener fiesta elegida. Estaba rota. **El control la marcaba bien y la
   excepción lo tapaba.** Sacada, con la advertencia escrita en el archivo.

## Lo que hay que saber de los controles

Ahora son ocho pasos. Los dos nuevos —**"Lo que se dijo es lo que es"** y **el trinquete**—
salieron de la otra sesión y valen su peso: **el primero me agarró a mí**, con una función
que salía a buscar a Spotify y no tenía ninguna prueba.

Antes ya habían aparecido tres controles que mentían: el corredor de navegador decía "todas
pasaron" con cero pruebas corridas, el de acentos daba verde con cero archivos revisados, y
el recorrido de pantallas medía el HTML crudo. Los tres, arreglados.

**La lección, y ya pasó cuatro veces: cuando un control deja de mirar, lo que entra no se
ve.**

## Método que funcionó, para repetirlo

**De los hallazgos que reportaron los ayudantes, la mayoría fueron falsa alarma.** Dos
ejemplos: dijeron que un archivo de "promesas" era código muerto —y es una lista que existe
justamente para que una prueba la use— y que había números inventados en pantalla —y eran
valores por defecto de configuración—. **Verificar cada hallazgo con los propios ojos antes
de tocar nada no es opcional.**

## Decisiones ya tomadas (no volver a preguntar)

- **No se le pide el mail ni el teléfono al invitado** para darle su foto: frena la fila.
- **Cloudflare: no.** **Google Flow: no se conecta.**
- **El agente de publicidad no prende ni crea campañas.** Eso lo activa el dueño.
- **Nada de promesas en la web** ni precios congelados: trabaja con ajuste anual.
- **El reloj del simulador va**, y es para la promoción, no para congelar la tarifa.
