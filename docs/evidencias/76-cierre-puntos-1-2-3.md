# 76 - Pedido de cerrar pendientes, publicación y recorridos

7/10/2026. Fuente `9bb955ac6af65a314f3ac62975020b37c9edaaf3`, sin nuevas
PR abiertas. Documentación en rama `codex/auditoria-75-20261007`; el commit
documental NO es una versión nueva de la app. Codex no programó app, compiló,
fusionó, cobró ni escribió prospectos/clientes/pedidos reales.

## Punto 1: tres pendientes contrastados, no corregidos por Codex

Área: web · Commit: 9bb955ac6af65a314f3ac62975020b37c9edaaf3.
Hallazgos: CONTACT75 P1, fallback de WhatsApp del simulador. Reusar sonda 75
y orden 126: no hay cambio de bootstrap/callbacks desde 368988bb ni entrega
pendiente contrastable en GitHub. Sin conexión/error/timeout los dos botones
preparan destino de ejemplo, no el canónico. Sonda aislada, NO mensaje real.

Área: redes · Commit: 9bb955ac6af65a314f3ac62975020b37c9edaaf3.
Hallazgos: RED03 P2, dos sincronizaciones de videos pueden perder una unión
de galería. Misma fuente de social-media/galeria/generic-json-store que 368988bb;
reusar reproducción 71 y directiva completa de Claude en 122. No repetir
deduplicación ya arreglada ni tocar catálogo/posts por esta causa. Pendiente
regresión roja actual y verde tras arreglo, incluyendo galería + Instagram.

Área: todas, mecanismo de cobertura · Commit: 9bb955ac6af65a314f3ac62975020b37c9edaaf3.
Hallazgos: AUD01 P2, mismas causas de 112 B.1, NO hallazgo nuevo del asistente.
Sonda actual de helpers reales: 419 rutas, 185 cubiertas, 234 fuera. Una
modificación simulada en `portal-cliente/[id]/page.tsx` conserva área
hipotéticamente limpia; un resumen de estados hipotéticos dice terminado
con rutas afuera. No se modificó `areas.json` ni se certificó ningún área.
Sonda y lista completa en `76-contador-probe.mjs` y `76-resultados/contador.json`.
Pasar esta sonda significa reproducir el fallo, no que esté arreglado.

No hay CLI Gemini/Claude aquí ni conexión que pruebe que estén ejecutando.
Gemini implementa los tres, Claude compila la tanda, Codex retesta sobre su
SHA. Órdenes publicadas no equivalen a ejecución de otra IA. Una tanda con
código+docs, no PR/fusión documental sola. Dueño aprueba y fusiona.

## Punto 2: publicado todavía NO aceptado

Rol/recorrido: visitante público, privacidad y acceso.
Entorno: `https://akproducciones.uy`, SHA servido desconocido.
Resultado: PARCIAL; corrección de privacidad aún no observable.

- Recarga nueva de privacidad todavía muestra `akproduccionessalto@gmail.com`
  como teléfono de WhatsApp. Captura `76-privacidad-publicada.png`.
- Corrección 125 presente en Git y sus regresiones actuales aprobadas en 75.
  No se pide reimplementarla ni se atribuye el desfase a caché/build sin prueba.
- Consulta read-only a deployments de GitHub devuelve lista vacía; no aporta
  un SHA de Firebase. No se miraron controles de Actions/facturación.
- No hay CLI Firebase/gcloud disponible. El marcador de versión existente
  se expone en `/api/health`; su bloqueo anterior por cliente NO se convirtió
  en falla de app ni se intentó eludir por otra petición/ruta de red.

Claude debe aportar versión/rollout observable del final de la tanda.
Después se verifica el mismo SHA y el resultado de los arreglos publicados;
ver una portada en línea no equivale a despliegue aceptado.

## Punto 3: comprobado aquí y límite exacto

Rol/recorrido: visitante anónimo → login/recuperación → intentar panel.
Entorno: público, SHA desconocido. Resultado: PARCIAL, no recorrido de tres roles.

Aprobado en este recorrido de lectura:
- `/login` carga correo/contraseña/Google sin el antiguo error de carga.
- Envío vacío exige completar campos; no se intentaron credenciales reales.
- Enlace de recuperación abre los métodos Google/código por correo.
  NO se presionó enviar código ni se cambió contraseña.
- `/empresa/dashboard` anónimo termina en login con redirect correcto.
  Captura `76-login-protegido.png`; no prueba acceso de usuario autorizado.

NO EJECUTADO: recorrido completo de organizador, cliente e invitado; guardado
y recarga, PDF final, permisos entre fiestas, captura/cola y sincronización
del conjunto. El entorno preparado no es accesible aquí ni se identificó un
artifact compilado de este SHA: no hay listener en 3000/3300/3311/8080 y los
checkouts inspeccionados no tienen artifact completo con versión. El script
de entorno siempre compila; no se lanzó bajo el reparto de compilación a
Claude. No se usaron clientes de producción como datos de prueba.

Ayudante económico sólo inventarió artifacts/scripts y quedó cerrado. No
ejecutó tests/build/servidor. Mantener `.serena/` local fuera del commit.
Orden 114 actualizada con SHA y entrega exacta para destrabar el entorno;
matriz 74 define resultados esperados, no otra orden duplicada ni prueba
de que un módulo falla por no haber sido probado. Solicitud de enlace hecha
al dueño, sin pedir secretos. No se declara terminado ninguno de los tres
puntos hasta obtener sus correcciones y aceptación reales.

## Evidencia conservada sin inflar cifras

Las 50 focales de 75 siguen vigentes: código app sin cambios. No se repitieron
ni se sumó este recorrido a ese total. Las 3522 generales son de 368988bb.
Única sonda nueva ejecutada: contador actual, salida 0 reproduciendo AUD01.
No se conceden 14 áreas limpias por referencias/archivos o por abrir login.
