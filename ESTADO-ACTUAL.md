# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 20 de agosto de 2026.
**Estado de la app:** sana. Controles en verde: acentos limpios (0 rotos), TypeScript en 0 errores, 301 test suites en verde (1923 tests pasados), build de producción Next.js OK.
**Orden completada:** `docs/ordenes/hechas/3-lo-automatico-que-se-ve.md` — Bloques 1 a 5 completados.
**Siguiente orden en la fila:** `docs/ordenes/4-la-auditoria-que-corre-sola.md`.

## Lo que se cerró en esta entrega (Orden 3: Que se vea qué está funcionando de verdad)

- **Bloque 1 — Pantalla "¿Qué está funcionando?" (`/settings/tareas-automaticas`):**
  - Muestra las 4 tareas que la app hace sola: notas del blog, números de redes, posteos programados y recordatorios de cuota.
  - Indica cuándo corrió por última vez (o "Nunca corrió"), su frecuencia y qué se pierde si no corre.
  - En rojo las tareas atrasadas o que nunca corrieron, en verde las que están al día.
  - Botón para poner al día tareas atrasadas y ejecución manual.
  - Enlace directo desde el menú principal (`MainNav`) en Configuración y desde la página de Ajustes.

- **Bloque 2 — Pantalla "¿Qué está conectado?" (`/settings/sincronizaciones`):**
  - Monitoreo de 13 plataformas: Google Analytics, Ficha de Google, Google Calendar, WhatsApp, Instagram, Facebook, YouTube, TikTok, Threads, X, Spotify, Mercado Pago, Meta Ads.
  - 3 estados exclusivos: `Conectada`, `Falta configurarla`, `No se usa`.
  - Explica en criollo qué se pierde sin jerga técnica ni datos simulados inventados.

- **Bloque 3 — Disparo en segundo plano seguro:**
  - Al ingresar al panel, las tareas desatendidas (métricas, posteos, blog) se ponen al día en segundo plano si están vencidas.
  - Los recordatorios a clientes y WhatsApp **NUNCA** se disparan automáticamente (esperan confirmación humana).

- **Bloque 4 — Guía para el dueño (`docs/PRENDER-LAS-TAREAS.md`):**
  - Guía corta y simple con las 4 direcciones exactas para configurar cron jobs externos gratuitos en 5 minutos.

- **Bloque 5 — Lista de música del cliente en la cabina del DJ (`/evento/dj/[fiestaId]`):**
  - Bloque superior de alto contraste: "⭐ INFALTABLES DEL CLIENTE" (dorado, sin scroll) y "🚫 PROHIBIDAS — NO REPRODUCIR" (rojo).

## Lo que depende del dueño (no lo puede hacer ninguna IA)

1. **Reclamar la ficha de Google** y elegir bien la categoría (negocio que atiende a domicilio).
2. **Configurar los 4 despertadores externos** siguiendo `docs/PRENDER-LAS-TAREAS.md`.
