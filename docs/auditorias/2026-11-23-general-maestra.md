# Auditoría general maestra (23/11/2026)

Informe del dueño, hecho en vivo sobre la app publicada, en local y sobre el código. Lista de trabajo de la orden 337
(lo que ya está en la 336 no se repite). Resumen por área:

- **Web pública y simulador:** casi bien; `/buscar` pide sesión; textos del simulador ("Organizamos de la fiesta", doble ícono).
- **Fiestas, calendario, clientes y cobros en vivo:** error en nueve pantallas por la lectura de la colección de fiestas
  (arreglado por Claude el 23/11: objeto plano, número del documento, fechas como texto, 15 s, historial sin `configuracion`).
- **Planificador:** `/fiestas/nueva` se caía sin `invitadosEstimados` (arreglado por Claude); Video de vida y Buzón con
  error; `?id=` vuelve a `/eventos`.
- **Portal e invitación:** `/portal` pierde `clientPortalSettings` (orden 336); el recap da 404 al invitado; el QR manda al
  cliente a `/login`.
- **Accesos de personal y proveedores:** Repostería y Fotografía caen en `/login`; el enlace externo de carga llega vacío.
- **Noche de fiesta:** 13/13 estaciones abren; detalles en Espejo, muro sin fiesta, chat en local y recepción con JSON local.
- **Seguridad:** archivos leídos con la ruta que viene del dato en cuatro descargas; el ingreso con Google acepta una firma
  mala como "empresa"; descargas y chat de IA con sólo sesión.
- **Ajustes:** cinco paneles en blanco por enlace directo, respaldo trabado en "averiguando", "Datos legales y cobro" abre
  otra pantalla.
- **Conexiones:** andan GA4, Meta Pixel y YouTube; faltan conectar siete (las conecta el dueño desde Ajustes).
