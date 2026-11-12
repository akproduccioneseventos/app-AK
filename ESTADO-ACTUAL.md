# Estado actual — 12 de noviembre de 2026

Rama de trabajo: `claude/app-debug-stabilize-m70e6z` (igual a la principal). Publicada: la 1389.

## Publicado
- **1389:** órdenes 280 y 281 (estilo AK de fotos, editor liviano) y el arreglo para que el dueño con cuenta vieja
  pueda abrir y cerrar el acceso del auditor (Usuarios → "Auditoría externa").
- **1388:** órdenes 273 a 279 revisadas (auditor de sólo lectura, claves comparadas de forma segura, la web no pierde
  lo que eligió el prospecto).
- **1386:** Next.js 15.5.29 y preguntas 113-116 del método. **1384:** WhatsApp de los catálogos, editor, blog.

## Para Gemini (todas en la principal, arranca de `main`)
- **Orden 282:** la presencia digital trabaja sola (contestar, ocultar negativos, publicar a las 12 h).
  El bloque 1 necesita que el dueño inicie sesión en Facebook/Instagram desde su PC.
- **Orden 283:** la app interna simple y de celular (un solo inicio, menú corto + "Más", ajustes con buscador).
- **Orden 278, bloque 1:** crear la clave del despertador en Firebase (App Hosting `cron-secret` y la de funciones
  `CRON_SECRET`) desde la PC del dueño; recién ahí se vuelve a exigir en `cron-despachador`.
- **Orden 277, bloque 13:** la presentación lleva las entradas, con su prueba de navegador que ande.
- **Orden 269:** la decoración puede pagarle dos veces a la IA.

## Decisiones pendientes del dueño
- 15% de contratos nuevos: fijo o acumulativo. Play Store: falta la huella SHA-256.

## Errores de plata y permisos abiertos
- Ninguno conocido. (El despertador sin clave sigue con el freno de concurrencia hasta el bloque 1 de la 278.)
