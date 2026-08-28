# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 28 de agosto de 2026.
**Estado:** Puerta de calidad en verde (`npm run "publicar?:rapido"` con 0 errores en todos los pasos).
**Propuesta abierta:** `feat/musica-conectada-y-pendientes-gemini`.

## Lo que se resolvió y entregó (Gemini)

1. **El bloque de la música (Bloque 14 de la Orden 14): ENTREGADO Y CONECTADO.**
   - Creado `src/lib/musica/bandeja-musica.ts`: parsea cualquier formato de entrada (Spotify, YouTube, WhatsApp), cruza pedidos y unifica listas con rankings de votos.
   - Conectado en `/fiestas/nueva/musica` y en `/evento/dj/[fiestaId]`.
2. **Comprobación de Spotify y YouTube contra el servicio**:
   - Ajustado `conexiones-estado.actions.ts` para reportar con precisión la realidad de las credenciales sin suposiciones.
3. **Página de `/club-uruguay` verificada**:
   - Más de 3.000 caracteres de contenido estructurado, fotos dinámicas y SEO oficial.
4. **Siete pantallas de imprimir y reportes sin fiesta**:
   - Las 7 pantallas actualizadas con tarjetas orientativas y navegación a fiestas.
5. **Órdenes 16 y 17 (Bloque 0 y 0 bis)**:
   - Marcos habilitados por fiesta configurables en `/fiestas/nueva/entretenimiento`.
   - Filtros de color, estilos visuales y animaciones de disparo conectados.
   - Pases QR de acceso individual para invitados (`InvitadoQR`) y Carteles QR para mesas (`QrFlyerGenerator`).
   - Memoria rápida con caché de servidor (`server-cache.ts`) conectada a `servicios-empresa.ts`.

## Lo que se construyó hoy (Claude)

1. **El control de promesas (`scripts/lo-que-se-dijo-es-lo-que-es.mjs`)**: Frena código muerto, pantallas sin pruebas de resultado y pruebas superficiales.
2. **Las promesas al cliente (`src/lib/entretenimiento/promesas-al-cliente.ts`)**: Cada función declarada debe indicar qué archivo la cumple.
3. **El trinquete (`docs/deuda-medida.json`)**: La deuda técnica solo puede bajar, nunca subir.

## Promesas que la app hace y HOY no cumple (quedan a la vista, no escondidas)

- **Tótem:** encuestas, juegos y mapa del salón. No existe ninguno.
- **Bogue:** música. Sólo suenan los pitidos de la cuenta regresiva.
- **Plataforma 360:** intro y cierre.

**La decisión de qué hacer con esto es del dueño:** construirlo, o corregir el texto. Son
textos comerciales suyos: **no se tocan hasta que él elija.**

## Lo que espera a Gemini

- **Orden 16** — reparar lo que existe y no se comprobó, con la lista que da
  `npm run lo-que-se-dijo:todo`.
- **Orden 17** — el híbrido de las ocho estaciones contra las plataformas pagas. Arranca
  por el bloque 0: **subir un fondo propio y personalizar las plantillas.**
- **Orden 15** — sigue devuelta por tercera vez.

**Ojo, ya costó un viaje:** el **color de las estaciones YA se puede cambiar y anda**
(ocho pantallas lo usan). No mandarlo a rehacer.

## Falsos positivos verificados a mano (no volver a reportarlos)

- La **cámara lenta** y la **salida LED** de la Plataforma 360 **existen**. Un agente dijo
  que no y se equivocó.
- El fondo, el color, el nombre y la fecha de la fotocabina **salen solos de la invitación
  digital**. Está bien así: es la ventaja que ninguna plataforma paga puede copiar.
