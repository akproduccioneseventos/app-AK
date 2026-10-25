# Conciliacion fija de cierres de auditoria pendientes

BORRADOR DOCUMENTAL DEL AYUDANTE, conservado. La conciliacion actual y los
resultados ejecutados estan en185-cierre-y-recuento.md. No usar los seis grupos
de abajo como seis areas nunca auditadas ni como seis errores actuales.
179/181 cierran el recorrido de lectura del empleado;180/182 revalidan el delta
de1346;183 prueba el consumidor del proveedor con el limite que declara.

Alcance: documentacion de cierres tecnicos pendientes, no una lista de areas nunca vistas ni un certificado de la aplicacion. Fuentes base: `134-conciliacion.json`, `134-conciliacion.md`, `134-roles.json`, `165-recuento-areas.json` y `175-cierre-tecnico-y-entrega.md`. La rama conocida es `codex/160-contraste-correcciones-20261021`; HEAD de esta conciliacion: verificacion al guardar. El inventario 134 parte de `7230f9d02b32805952a185f704a0208bd5d643e6`, el recuento 165 contrasta lo publicado en `9b7ee982c5d6ff1377fccc0490abc85a9cfd8419`, y 175 refiere entregas `bfde3916a43afdb700cc0828722268db7b3ea2c1` / `daefbdc00b7a43f4f252dcca6e7d9565d4d30d10`. Ninguno sustituye contraste de cambios privados no publicados.

## Pendientes

1. **Retest de programacion, solo ante delta nuevo.** Recibo 175: orden 205 agrupa la devolucion de 171/174; no repetir los fallos del mismo SHA ni duplicar 196/202/203. Cierre observable: comparar HEAD/consumidores del delta y ejecutar las sondas afectadas; registrar resultado y SHA. Hasta que haya delta contrastable, queda condicionado, no es una orden de reimplementacion.
2. **Retest de orden 172.** Recibo 134 reciente documenta solapamiento del `ModuleNavigationDock` sobre encabezado Evento y orden 172 pendiente; 175 distingue esa orden del recibo 172 (foco DOM aprobado). Cierre observable: recorrido visual en viewport/ruta afectada sin solapamiento, manteniendo evidencia de rutas desktop/movil y resultado HTTP aplicable.
3. **Pruebas UI/HTTP de proveedor e integraciones reales pendientes de evidencia.** Recibo 175: 171/174 usaron dobles; no hubo HTTP/panel proveedor/pagos reales. Cierre observable: solicitudes/respuestas y estado visible del flujo en entorno autorizado, o marcar explícitamente no ejecutable; no inferirlo desde dobles. No implica probar cuentas/cargos reales sin autorizacion.
4. **Prueba UI/HTTP de areas con recibos parciales.** 134 conciliacion y 165 recuento enlazan alcances concretos; recibo reciente 134 incluye casos parciales, omitidos y fallos de recorrido. Cierre observable: por escenario pendiente identificado en recibo, conservar ruta, viewport, estado final visible y codigo HTTP cuando aplique. No repetir lo ya aprobado por su mismo alcance.
5. **Matriz de aceptacion por control/estado/rol.** 134 reporta 6401 ubicaciones AST candidatas, 421 rutas, cero controles aceptados individualmente; 134-roles enumera siete perfiles sin matriz de permitir/denegar; 165 dice expresamente que es inventario mas recibos focales. Cierre observable: matriz ligada a controles reales, accion, estado, perfil, resultado permitido/denegado y recibo. **No se puede contar cada control con estas fuentes; no hay cifra verificable de controles totales o pendientes.** Los inventarios no son controles aceptados y esto no afirma que no fueran ejercitados.
6. **Validacion final del conjunto.** 175 deja claro que los recibos no certifican globalmente ni validan cada estado/control/rol; no hay build solicitado en este alcance documental. Cierre observable: responsable de validacion registra SHA exacto, alcance, ejecuciones, resultados y errores; distinguir prueba aprobada, correccion presente y despliegue verificado. No es afirmacion de cero errores.

No se incluyen como pendientes de Codex trabajos manuales reservados al dueño. Cierres vigentes conservados: 199 probado por 172 en DOM dentro de su alcance; 204 probado por 173 SDK dentro de su alcance; 200/201 y cierres anteriores expresamente conservados por alcance en 175. Esta lista no altera permisos, prioridades comerciales ni propone funciones nuevas.

## Comprobar

- archivo: `docs/evidencias/176-conciliacion-pendientes.md` y `.json`
- usa: manifiesto documental; consume `134-conciliacion.json`, `134-roles.json`, `165-recuento-areas.json`, `175-cierre-tecnico-y-entrega.md` y recibos enlazados en `134-recibos-recientes.json`
- prueba: pendiente; verificar parseo JSON y correspondencia de fuentes/criterios. No se ejecutó prueba UI/HTTP, app ni build.
