# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 27 de agosto de 2026.
**Estado de la app:** sana. Acentos limpios, tipos en cero, 2237 pruebas en verde, compila.
**Propuesta abierta:** **#1147**, verificada y esperando que el dueño toque el botón verde
(se cortó el permiso de escritura de GitHub y no se pudo marcar lista desde la sesión).
**Orden pendiente:** la **12**, con cuatro bloques, para Gemini. Él confirmó que la toma.

## El tema grande del día: el dueño no podía entrar a su propia app

Se resolvió entero, y la causa nunca fue su clave. Cinco defectos encadenados:

1. **La app estaba vacía**: no había ninguna cuenta creada. Sólo sabía crear el primer
   administrador si encontraba una configuración cargada; si faltaba, quedaba así para
   siempre. Callejón sin salida. **Ahora el primer ingreso con Google crea la cuenta.**
2. **El botón de Google no hacía nada en el celular**: mandaba a todo teléfono por el
   desvío, que falla en silencio en Safari y en la app instalada. **Ahora abre la ventanita.**
3. **La pantalla quedaba guardada en el teléfono** y se dibujaba muerta. **Ya no se guarda.**
4. **Decía "contraseña incorrecta" cuando la base no contestaba**, y a los cinco intentos
   lo dejaba afuera quince minutos. **Un fallo del servidor ya no cuenta como intento.**
5. **Veinticinco segundos de espera muda.** Ahora contesta en 8 a 11 y **dice cuál de
   cuatro problemas fue**.

**La lección del método:** el diagnóstico automático resolvió en un intento lo que llevaba
horas de adivinar. Y una trampa que costó tres mediciones falsas: **un servidor de prueba
viejo ocupando el puerto** hacía medir la versión anterior. Ante una medición rara,
levantar el servidor en un puerto nuevo.

## Lo otro que se fusionó

- Google ya puede leer la web y hay **una sola dirección** (lo que entra con www se desvía).
- **Fuera las promesas**: "respuesta en 24 horas" (tres lugares) y todo lo de congelar
  precio. El ajuste anual va siempre y congelarlo lo contradice.
- **El reloj del simulador se queda**: es para la promoción, **no** para congelar la tarifa.
  `CLAUDE.md` tenía mal el motivo y quedó corregido — con eso mal escrito, la sesión
  siguiente devolvía el texto viejo.
- **El freno de gasto del agente de publicidad**: niega en vez de aconsejar, cuenta lo
  comprometido hasta fin de mes, y **el agente no prende ni crea campañas** (eso lo activa
  el dueño).

## La orden 12, cuatro bloques, UNA sola propuesta

1. El agente de publicidad **actúa** sobre Meta Ads, obligado a pasar por el freno.
2. **La web legible para las IA** sobre Firebase: `llms.txt` (no existe), datos del negocio
   y preguntas frecuentes marcados. **Cloudflare quedó descartado: no volver a proponerlo.**
3. **Movimiento en las portadas.** El mecanismo existe y nadie le pasa un video. Cuatro
   escalones; **el que importa es que la IA arme el pase con las fotos reales**, porque es
   el único que anda sin que el dueño cargue nada.
4. **El cliente ideal calculado** sobre ganados contra perdidos. **No se inventa**: si
   faltan contratos, se dice.

## Decisiones nuevas, para no volver a preguntarlas

- **Cloudflare: no.** Se queda en Firebase; lo que quiere es lo que esa herramienta mide.
- **Google Flow: no se conecta.** No tiene puerta para aplicaciones y el motor de video se
  cobra por generación. Si quiere un video de IA, lo hace él en Flow y lo sube.
- **La app ya genera imágenes con IA** (modelo de imagen de Gemini). Esa puerta ya está.
