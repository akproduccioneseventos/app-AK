# 154 - Conexiones y redes: fallos visibles y estados reales

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.
El usuario informa que Claude programa lo anterior; no se conoce esa rama local.
Comparar HEAD antes de implementar; si ya existe la correccion, validar, no duplicar.
Destinatario: Claude disponible segun el dueno. Una sola tanda/PR, sin fusion automatica.

## Version y alcance

Main99faf4eb061fa46341cfdde6f81b93b3bfb9c73c; PR1288 abierta, rama
codex/auditoria-97-ia-contexto-20261011, HEAD3804674f677482de27f91874cd0b77f8bd246abb.
App compilada8fa5b56a2833938541a657dcd15ef88130d24b0e, consumidor de
conexiones y redes igual a main. Reproduccion aislada PC/Pixel7, no publicado.
Raw/capturas108; no cambios de app ni repeticion de build/Jest.
No reabrir152(salon/guardar/dependencias) ni153(GoogleWorkspace account status).

## Tres P2 comprobados

1. /settings/sincronizaciones: al cortar SOLO getEstadoConexiones antes de su
   primera respuesta, anuncia0plataformas/0conectadas sin aviso de lectura fallida.
   Al fallar Actualizar despues de una lectura buena, conserva14plataformas sin
   indicar que el refresco fallo y el estado puede estar viejo.
   SincronizacionesPage/cargarDatos captura y escribe solo console.error.
   Mostrar error persistente, ofrecer Actualizar/reintentar y distinguir datos
   no disponibles de cero real. Si se conserva la lectura previa, avisar que no
   pudo actualizarse; no borrar conexiones ni etiquetas sin evidencia.

2. /empresa/redes-sociales: getSocialPosts falla; aparece toast Error/Failed to
   fetch. Al cerrar el toast, queda No hay publicaciones con Todos(0), sin
   indicacion persistente ni reintento de esa lectura. error se guarda en estado
   pero nunca se pinta; fetchData ya existe.
   Pintar el error en el consumidor y permitir reintentar con fetchData, sin
   disparar importar/sincronizar/publicar. No confundir Actualizar ahora del
   historial (que puede llamar a proveedores) con recargar la lista de la app.
   Mantener separado el caso vacio verdadero: no debe mostrar error.

3. /settings/sincronizaciones, Instagram: sin cuenta,0publicaciones y ningun
   meta-public-history-backfill.json/intento registrado, dice Sincronizacion en
   curso. Renderiza esa frase para todo historial.completo:false.
   Usar los datos existentes de intento/error/completo para distinguir no
   iniciada, parcial, fallida y completada. Mostrar en curso solo si hay evidencia
   de una operacion activa; si el backend no la expone, no inventar actividad.
   No rehacer sincronizacion, deduplicacion o publicaciones81/102 ya comprobadas.

Rutas verificadas:
- src/app/(app)/settings/sincronizaciones/page.tsx:SincronizacionesPage,
  cargarDatos, bloque c.id===instagram.
- src/app/actions/conexiones-estado.actions.ts:getEstadoConexiones,
  historial derivado de metaState.platforms.Instagram.
- src/app/(app)/empresa/redes-sociales/page.tsx:SocialMediaPageContent/SocialMediaPage,
  fetchData, error/setError; consume getSocialPosts desde actions/social-media.ts.

## Lo aprobado y lo que NO debe tocarse

- Recuperacion manual Actualizar vuelve a cargar Conexiones tras restaurar transporte.
- Redes avisa el primer error por toast y recargar recupera; defecto es el estado
  posterior y la falta de reintento local persistente, NO un fallo de publicacion.
- Ocho recorridos PC/movil sin sesion/vencida vuelven a login.
- Seis controles RPC con registro privado ficticio: sesion valida lee; vencida
  y anonima no entregan datos. getEstadoConexiones vencido tira Sesion no autorizada
  (500 Server Action); getSocialPosts vencido retorna[]; anonimos redirigen307.
  No aflojar cookies, origen, permisos ni cambiar autorizacion por estos hallazgos.
- No mirar GitHub Actions en rojo por facturacion ni probar cuentas/ventas reales.

## Aceptacion pendiente de la correccion

PC/movil, consumidores reales: carga buena/vacio real/primer fallo/refresco
fallido/reintento completo; cerrar toast no debe convertir fallo en lista vacia.
Instagram no iniciada/activa(si existe evidencia)/parcial/error/completa, sin
llamar proveedores reales. Nuevas pruebas propuestas PENDIENTES.
Anotar resultado/SHA en YA-RESUELTO y ESTADO-ACTUAL, en la misma tanda.
No declarar toda la app sin errores ni esta orden ejecutada por existir.

```comprobar
archivo: src/app/actions/conexiones-estado.actions.ts
usa: getEstadoConexiones en src/app/(app)/settings/sincronizaciones/page.tsx
prueba: src/__tests__/redes-sociales-error-de-lectura-con-reintento.test.tsx
prueba: src/__tests__/sincronizaciones-error-de-lectura-e-historial-instagram.test.tsx
```
