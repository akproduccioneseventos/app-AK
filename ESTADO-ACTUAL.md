# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 27 de agosto de 2026.
**Estado de la app:** sana. Acentos limpios, tipos en cero, 2250 pruebas en verde, compila.
**Propuestas abiertas:** ninguna.

## LO URGENTE: el dueño va a usar la fotocabina en una fiesta

Se revisó a fondo y **se probó en un navegador con cámara**. Anda bien: arranque como
kiosco (elegir fiesta → rol → PIN → bloquea), tanda de tres fotos, tira en **10x15 vertical
a 1200x1800** —la medida exacta que él imprime—, nombre del homenajeado en manuscrita, aviso
al operador si falla la cámara, y guardado sin internet.

**El defecto que importa: el recuerdo sale con el fondo pelado.** Él entrega tiras con fondo
decorado (el lila con mariposas de la fiesta de Areli). `componerTiraDeFotos` **ya sabe
recibir** `imagenFondoUrl` y `colorFondo`; la fotocabina **nunca se los pasa** y
`PublicEntertainmentEvent` ni siquiera los tiene. **El fondo ya existe en la app: es el de la
invitación digital de esa misma fiesta.**

Todo está en **`docs/ordenes/13-la-fotocabina-que-gana.md`**, con la comparación contra las
seis plataformas líderes. **Es la orden pendiente número uno.**

## La orden 12: tres bloques adentro, uno rechazado

Fusionados (#1148): publicidad autónoma, `llms.txt` y cliente ideal. **Se repararon tres
defectos graves** antes de entrar: el freno de campañas se salteaba, una prueba congelaba lo
contrario de la regla del dueño, y dos consultas quedaban abiertas a internet.

**El bloque de los videos NO se fusiona.** Rama `feat/orden-12-bloque-3-videos-portada`: los
cuatro mp4 son **el mismo archivo con cuatro nombres**, el webm está vacío, y **el navegador
no puede reproducirlos**. Se rescata sólo el cableado, que está bien.

## Dos lecciones caras de hoy, que valen para todo el proyecto

1. **Un control que se puede omitir, se omite.** El freno de gasto tenía un aviso opcional y
   la primera entrega simplemente no lo mandaba. Se volvió obligatorio: **ahora no compila
   sin él**, y al instante apareció un tercer lugar que también lo salteaba.
2. **Ojo con las pruebas que dan falsa confianza.** Dos veces hoy: una exigía que el agente
   pudiera crear campañas —lo contrario de lo pedido— y otra daba en verde con el mismo
   video repetido cuatro veces, porque nunca comparaba que fueran distintos.

## Decisiones ya tomadas (no volver a preguntar)

- **Cloudflare: no.** Se queda en Firebase.
- **Google Flow: no se conecta.** Si quiere un video de IA, lo hace él y lo sube.
- **El agente de publicidad no prende ni crea campañas.** Eso lo activa el dueño.
- **Nada de promesas en la web** ni precios congelados: trabaja con ajuste anual.
- **El reloj del simulador va**, y es para la promoción, no para congelar la tarifa.
