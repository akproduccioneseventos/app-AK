# Codex108 - dos bloques: conexiones/redes y limites de sesion

Encargado PC/Pixel7. App8fa5b56a2833938541a657dcd15ef88130d24b0e,
HEAD3804674f/main99faf4eb, PR1288 abierta. Tres consumidores revisados
no difieren de main. Tanda privada de Claude NO identificada ni contrastada.
Registro107 vigente, no se repiten cuenta needs_reconnect ni orden152.

## Tres fallos P2 reproducidos en ambos contextos

- CON108-CARGA: aborto unicamente actionID getEstadoConexiones
  0051f335e69a311e5dda97534264a9ff35e688867c. Primera carga0plataformas sin
  aviso; refresco falla y conserva14plataformas sin advertir estado viejo.
  Actualizar restaurado recupera. cargarDatos solo registra console.error.
- RED108-VACIO: aborto getSocialPosts
  000e797b2efc3330251864f0db3c16dd61c563e8ee. Toast Error/Failed to fetch
  visible; al cerrar con ToastClose real queda vacio/0 y no hay Reintentar.
  Estado error almacenado no tiene consumidor JSX. Recarga recupera.
- CON108-INSTA: falta cuenta,0fotos y no existe archivo de backfill/intento;
  aun asi dice Sincronizacion en curso. El UI equipara completo:false con activo.
  Raw del action confirma ultimaSincronizacion/error undefined. No se sincronizo
  Instagram ni se infiere que falla su API. Orden154 agrupa los tres.

## Aprobaciones acotadas, no seguridad total

- Ocho recorridos:2pantallas x2contextos x2sesiones(anonima/vencida) terminan
  en login, incluso con localStorage/sessionStorage de una sesion vieja.
- Seis controles RPC: dos actions con sesion valida/vencida/ausente.
  Valida200 devuelve14plataformas y marcador privado ficticio de SocialPost;
  vencida no devuelve ninguno (500 error de sesion en conexiones,200[] en posts);
  ausente307/login. Positivo y negativo usan el mismo protocolo/consumidor.
- Archivos social-posts propios inicialmente vacios respaldados/restaurados
  exactamente; los no existentes se retiran. No contenido de clientes ni credenciales.
- No publicaciones, correos, pagos, OAuth o sincronizacion de cuentas reales.
  El panel hace un GET publico de sondeo a YouTube sin credenciales; eso NO
  certifica publicar videos. HTTPS del navegador se bloquea en las sondas.

## Incidentes de la prueba, no defectos adicionales de app

- Dos intentos de buscar enlace exacto Conexiones en el menu no completaron;
  no se certifica ese menu ni se declara boton roto. Se usaron rutas verificadas
  en main-nav.tsx; esos fallos son del setup y no cierran navegacion lateral.
- Primera lectura de sesion vencida con domcontentloaded obtenia cuerpo vacio
  antes de hidratar: inconclusa. La final espera networkidle y confirma login.
- Primer RPC seguia el307 hacia localhost con Origin127, bloqueado por CSRF.
  NO probaba permisos; log conserva digest3736877243. Control final impide
  redirects, confirma dos positivos200 y compara los mismos endpoints.
- Primera expectativa RPC307 para toda denegacion era equivocada: conexiones
  vencido tira Sesion no autorizada/digest3036932852, posts retorna[] por permiso.
  Criterio final es no exponer datos, con registro privado en control positivo;
  no ocultar fallos ni relajar autorizacion. Primer raw/exit1 conservado.
- Helper107 acepta etiqueta108 para no pisar evidencias107. App sin cambios;
  se reutiliza compilacion8fa, no se vuelve a ejecutar4139Jest por documentacion.
- Servidor propio detenido intencionalmente al cerrar la auditoria; el wrapper
  registra exit4294967295 por Stop-Process, no por fallo de la app. Puerto3300
  sin escucha al finalizar. Archivos de datos restaurados, sin diff productivo.

## Limites

Orden154 sin programar,153 pendiente y152 en trabajo segun el usuario.
No estados reales de proveedores, todas las variantes/perfiles ni0erroresglobales.
19originales/hardware/Hosting mismoSHA siguen fuera. No nueva dependenciaproduccion.
Grafo consultado puntual; no reconstruido por sondas/documentacion.
