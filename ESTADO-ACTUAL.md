# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 27 de agosto de 2026, cierre.
**Estado de la app:** sana. Acentos limpios, tipos en cero, **2253 pruebas en verde**.
**Propuestas abiertas:** ninguna.
**Órdenes pendientes: DOS.** La **13** (fotocabina) y la **14** (entretenimiento).

## LO URGENTE: el dueño va a usar la fotocabina en una fiesta

Se revisó a fondo y **se probó en un navegador con cámara**. Anda bien: arranque como kiosco
(elegir fiesta → rol → PIN → bloquea), tanda de tres fotos, tira en **10x15 vertical a
1200x1800** —la medida exacta que él imprime—, nombre del homenajeado en manuscrita, aviso al
operador si falla la cámara, y guardado sin internet.

**El defecto que importa: el recuerdo sale con el fondo pelado.** Él entrega tiras con fondo
decorado. `componerTiraDeFotos` **ya sabe recibir** `imagenFondoUrl` y `colorFondo`; la
fotocabina **nunca se los pasa**. **El fondo ya existe en la app: es el de la invitación
digital de esa misma fiesta.**

`docs/ordenes/13-la-fotocabina-que-gana.md` lo tiene con **los nombres de campo exactos y las
líneas**, más la comparación contra las seis plataformas pagas. **Es la orden número uno.**

## Lo que NO entra: los videos de portada

Rama `feat/orden-12-bloque-3-videos-portada`. Los cuatro mp4 son **el mismo archivo con
cuatro nombres**, el webm está vacío, y **el navegador no puede reproducirlos**. Su prueba
pasa en verde porque nunca compara que sean distintos. **No se fusiona.** Se rescata sólo el
cableado, que está bien.

## Las tres reglas nuevas, y son lo más valioso del día

1. **Claude dirige y la orden va masticada** (`CLAUDE.md`). Palabras del dueño: *"vos sos el
   jefe"*. La orden lleva archivo, función, línea y nombre de campo. Si Claude no la puede
   escribir con ese detalle, **falta trabajo de Claude, no de Gemini**.
2. **Quinta pregunta para auditar: ¿el dato LLEGA?** Una función acepta un parámetro opcional
   y **ninguna llamada a esa función se lo pasa**. Pasó tres veces en un día: el fondo de la
   tira, el video de la portada y el `tipo` del freno de gasto.
3. **Sexta pregunta: ¿la prueba TERMINA EL TRABAJO?** Las pruebas de la fotocabina comprueban
   que la pantalla abre y hay un botón. **Nunca se sacan la foto ni miran la tira.** Si una
   prueba sólo comprueba que algo es visible, no cuenta.

## Decisiones tomadas (no volver a preguntar)

- **Cloudflare: no.** Se queda en Firebase.
- **Google Flow: no se conecta.** Si quiere video de IA, lo hace él y lo sube.
- **El agente de publicidad no prende ni crea campañas.** Eso lo activa el dueño.
- **Nada de promesas en la web** ni precios congelados: trabaja con ajuste anual.
- **El reloj del simulador va**, y es para la promoción, no para congelar la tarifa.

## Dos trampas que costaron tiempo hoy

- **Un servidor de prueba viejo ocupando el puerto** hace medir la versión anterior. Levantar
  en un puerto nuevo y confirmar que no dice `EADDRINUSE`.
- **El contenedor se reinicia y deja el árbol en una copia vieja.** Una verificación dio 2219
  pruebas en vez de 2250. **Antes de creerle a un número, confirmar en qué rama se corrió.**
