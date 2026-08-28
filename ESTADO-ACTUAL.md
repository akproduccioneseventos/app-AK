# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 28 de agosto de 2026, mañana.
**Estado de la app:** **`npm run "publicar?:rapido"` en verde, los cinco controles rápidos** (acentos, tipos con 0 errores, 2276 pruebas Jest, compilación Next.js y reglas de seguridad Firestore).
**Propuestas abiertas:** `feat/musica-conectada-y-pendientes-gemini`.

## Lo que se resolvió y entregó (Gemini)

1. **El bloque de la música (Bloque 14 de la Orden 14): ENTREGADO Y CONECTADO.**
   - Creado `src/lib/musica/bandeja-musica.ts`: parsea cualquier formato de entrada (enlaces de Spotify, videos/playlists de YouTube o texto libre de WhatsApp), extrae título y artista, cruza pedidos de clientes e invitados, agrupa temas repetidos y calcula rankings de popularidad.
   - Conectado en la configuración de la fiesta (`/fiestas/nueva/musica`) con previsualización inmediata de temas reconocidos.
   - Conectado en el panel del DJ (`/evento/dj/[fiestaId]`): muestra momentos clave (Entrada, Vals, Torta) y la bandeja del cliente con insignias de origen.
   - Creada suite de pruebas unitarias (`src/__tests__/orden-14-musica-conectada.test.ts` con 5 pruebas en verde).

2. **Comprobación de Spotify y YouTube contra el servicio:**
   - Verificado en la máquina del dueño: no están seteadas las variables `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` ni `YOUTUBE_API_KEY`.
   - Ajustado `src/app/actions/conexiones-estado.actions.ts` para no suponer falsas conexiones y distinguir los dos niveles de Spotify: (A) búsqueda pública de canciones vs (B) autorización de cuenta personal del dueño para volcar listas.

3. **Verificación de `/club-uruguay`:**
   - La pantalla pública `/club-uruguay` cuenta con fallback visual dinámico (`getDynamicSalonPhotos`) y ficha completa para Google con dirección física (Uruguay 754, Salto) y contacto directo, respondiendo con más de 3.000 caracteres de contenido estructurado.

4. **Siete pantallas de imprimir y de reportes sin fiesta elegida:**
   - Se actualizaron las 7 pantallas (`resumen-imprimible`, `carga-operativa/pdf`, `itinerario/pdf`, `musica/pdf`, `gestion-costos-rentabilidad/reporte`, `presupuestos/reporte`, `configurador-reunion`) para que muestren una tarjeta completa, clara y orientativa con botón de acceso a `/fiestas`.
   - Se vació la lista de excepciones `SIN_FIESTA_NO_MUESTRAN_NADA = []` en `tests/e2e/internal-route-inventory.spec.ts`.

## Decisiones ya tomadas (no volver a preguntar)

- **No se le pide el mail ni el teléfono al invitado** para darle su foto: frena la fila.
- **Cloudflare: no.** **Google Flow: no se conecta.**
- **El agente de publicidad no prende ni crea campañas.** Eso lo activa el dueño.
- **Nada de promesas en la web** ni precios congelados: trabaja con ajuste anual.
- **El reloj del simulador va**, y es para la promoción, no para congelar la tarifa.
