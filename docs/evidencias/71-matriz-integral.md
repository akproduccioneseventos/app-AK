# Matriz integral de aceptación (14 áreas)

**Actualización 74:** estado vigente en `74-matriz-de-cierre.md` y
`74-cierre-de-evidencia-y-medios.md`. Main `368988bb`: 608 suites / 3522 unitarias
aprobadas; 491 E2E sólo descubiertas, NO ejecutadas. Tres pendientes nuevos de
medios/contacto en orden 125. No transferir la tabla histórica inferior al SHA
actual ni declarar 14 áreas aceptadas por los tests generales.

**Actualización 73, 6/10:** consultar primero `73-retest-de-1260-y-continuacion.md`.
Main actual `368988bb`: 21 focales pasan; CAMPO01/02 directos y COMPRA01 corregidos
con ese alcance. CAMPO73-RACE y GAL73 son hallazgos nuevos. Orden 123 y RED03 siguen
pendientes. La tabla inferior es histórica de `e52c078`: sus estados y conteos
no se transfieren al SHA nuevo ni sustituyen aceptación de recorridos completos.
72 aportó siete controles del helper de invitado por SHA y UX pública acotada;
no HTTP/RSVP completo. Ninguna área se marca limpia por esas pruebas parciales.

**Destino:** `e52c07839563115236652229d73ac5ebf2e4e551` (`codex/auditoria-integral-20261006`, HEAD local exacto; limpio al iniciar). Matriz preparada por un ayudante y completada por la revision principal con resultados de `71-resultados/manifest.json`: 3490 pruebas unitarias main y 27 de la tanda. No es aprobacion integral: no se ejecuto build, recorrido completo de navegador ni proveedores reales. Cuatro fallos reproducidos en acciones con storage simulado se detallan en informe 71.

**Contraste de tanda actualizado por la revision principal:** el destino es el merge #1258. Los objetos Git de #1259 / `f836c128cfad861a55a2352782f18c805b55e13a` se obtuvieron y verificaron; la revision de entretenimiento esta en `71-pr1259-entretenimiento.md`. Esa rama no modifica las acciones generales de fiesta, compras ni sincronizacion de Instagram donde se reproducen los cuatro hallazgos de 71. Graphify de `.audit-current-20261005` se uso solo para navegacion; su grafo no es evidencia.

**Regla de lectura:** “sin evidencia” significa que falta prueba del flujo indicado, no que falle. Un defecto conocido sólo se conserva si la evidencia dice reproducido; el código, una prueba ausente, timeout de entorno o ruta sin cobertura no demuestran por sí solos un fallo. Pruebas de 66/69 preceden al destino y no se transfieren sin identidad de fuente/consumidor.

## Matriz

**Ampliacion 72, 6/10/2026:** PR1259 avanzo a `7c96e114` y seis suites / 32
unitarias pasan alli. Helper de token/proyeccion invitado: siete casos verdes
por SHA en main/tanda; no es flujo completo. BARRA72-1/2/3 y SALON72-1 son nuevos
casos reproducidos, orden 123. CUA publico vuelve a funcionar y se recorrieron
inicio, menu movil, galeria/FAQ, Club, demo, blog y simulador hasta datos vacios;
no SHA publicado confirmado ni backend privado estable. Ver informe 72 para
no mantener el bloqueo antiguo de navegador publico ni declarar areas limpias.

| Área | Evidencia reutilizable y estado en destino | Pendiente concreto de aceptación (ruta / flujo) |
|---|---|---|
| plata | Principal: 603 suites / 3490 pruebas aprobadas sobre `e52c078`; focalizada: 5 suites / 56, incluidas en ese total. Regresiones de 70 pasan. CAMPO01/02 reproducen otro acceso por guardado general; no marcar limpia. | Rechazar modificacion financiera desde campos genericos, comprobar despues los recorridos y conciliar 19 importados con originales. |
| contrato | CAMPO02 permite al portal marcar contrato fisico firmado por accion generica, sin subir el papel. | Cerrar esa puerta; generar, firmar y recuperar documento final en navegador/backend de prueba. |
| comida | COMPRA01 reproduce pago de proveedor revertido por guardado viejo autorizado antes de la transaccion. | Cerrar esa carrera; menus e imagenes reales, cantidades y compras coherentes con originales y backend de prueba. |
| permisos | `frontera-general-de-fiestas.test.ts` pasa en destino: personal sin permiso no guarda ni obtiene secretos. CAMPO01/02: operador asignado/cliente valido marcan cuotas cobradas por guardado general. Los costos admiten ORGANIZACION en la accion especifica y NO se reportan como defecto de permisos. | Rechazar cambios de cobros/firma por campo y perfil, mantener legitimas las acciones de invitado, cliente y operador. Completar prueba HTTP entre roles; un mock no certifica sesiones desplegadas. |
| fiesta | Se solapa con permisos; 69 precede la corrección de #1258. | Recorrido organizador de crear/editar fiesta, invitados, costos y actualización parcial; comprobar lectura/guardado autorizado, aislamiento por fiesta y que el cliente no sobrescriba campos del equipo. |
| portal | PORTAL01/02 fueron observados en `feb90f4…`; no transferir a destino. | `src/app/portal-cliente/[id]/page.tsx`: fiesta del día y estados/fechas Uruguay; `AsistenteDelCliente` más ayuda/WhatsApp a 660 px; guardar cambios y sincronización del cliente. Verificar primero si ambos hallazgos históricos siguen presentes. |
| invitado | E2E histórico 69 sólo confirmó acceso visual parcial; no confirmó guardado, check-in ni entrega. | `src/app/invitacion/[fiestaId]/invitado/[guestId]`: enlace/token, RSVP sí/no, QR/mesa, check-in, subida y descarga; confirmar persistencia en backend de prueba y separación entre fiestas. |
| web | 69 observó web publicada sin SHA de despliegue; no atribuir esa UX al destino. El inventario estático no acepta el embudo. | `/simulador-de-presupuesto` y `simulador-ak`: selección/cambio de servicios y extras → datos → CRM/WhatsApp preparado → PDF multipágina y compartir; probar escritorio/móvil sobre el mismo SHA. No inferir fallo desde pasos que no se recorrieron. |
| redes | Evidencia 66 incluye SOCIAL01 reproducido en `212ba37…` por colisión de IDs en `addSongRequest`/`addDedication`; estado actual no probado aquí. Integraciones 69 son estáticas, SHA `feb90f4…`. | `src/app/actions/social-interactive.ts`: dos altas simultáneas conservan ambos registros; galería/redes, OAuth/sincronización/publicación sólo con entorno autorizado; errores y deduplicación visibles. SOCIAL01 queda “histórico reproducido, destino sin retest”. |
| estaciones | Evidencia 66 describe riesgo de reintento tras timeout en fotocabina/360/espejo por secuencia fuente; no Firebase real. Prioridad comercial vigente: fotocabina, 360 y espejo visibles sin expandir “Ver más”. | `/evento/fotocabina/[fiestaId]`, `/evento/plataforma-360/[fiestaId]`, `/evento/espejo-magico/[fiestaId]`, `/evento/touchpix/[fiestaId]`: captura → desconexión/timeout → reintento → una sola publicación → entrega; error visible. Añadir video de invitado sólo como requisito de orden 117 si esa funcionalidad está en el destino. |
| barra | Evidencia 66 cubre pruebas unitarias, no pedidos concurrentes ni hardware/Firestore real. No nuevo defecto declarado. | `src/app/actions/fiesta/barra-tecnologica.actions.ts`, `/evento/barra/[fiestaId]/listo`: pedido, cola, retiro y stock; dos pedidos simultáneos, stock insuficiente y fallo de ambos guardados con compensación verificable. |
| asistente | Orden 117 pide flujos concretos; inventario 69 no certifica proveedor. | Asistente/voz: conversación por voz, objetivo multipaso y micrófono de reunión; límite concurrente, error y resultado visible. Proveedor real sólo con autorización; no usar tests simulados como aceptación externa. |
| personal | PERS01/PERS02 fueron reproducidos por sondas aisladas en evidencia 66, SHA `212ba37…`; no afirmar que siguen en destino. | `src/app/actions/empleados.ts`, `recibos-personal.ts`, `accesos-personal-view.ts`: enlace vencido, fiesta ajena/no asignada, ubicación inválida y llegada/rechazo; verificar acción y persistencia con perfiles de prueba. |
| automaticos | AUTO01/AUTO02 se reprodujeron con instancias/servicios simulados en 66 (`212ba37…`); no son resultado del destino. | `src/lib/automatico` y consumidores en `src/app/api/cron`: dos instancias, lock vencido/liberación tardía, fallo de persistencia/proveedor y recuperación; resultado no debe marcar éxito falso ni duplicar tarea/entrega. |

## Cierre finito

1. Contrastar primero los pendientes anteriores con HEAD real de #1259/`f836c128` y con `e52c078…`; quitar de la lista lo que ya esté corregido, sin reimplementar.
2. Codex ejecuta la revisión de fuente y UX asignada por el dueño; cada observación nueva requiere archivo, símbolo/consumidor y reproducción. Las áreas Claude (dinero/cobros/contabilidad/comida/permisos) respetan el reparto; esta matriz no da instrucciones de corregir dinero.
3. Ejecutar únicamente los flujos pendientes de cada fila con datos de prueba; registrar resultado y SHA. Marcar como conocido sólo un fallo reproducido. Marcar prueba ausente como “pendiente”, nunca como defecto.
4. Reutilizar 65/66/69 sólo cuando los blobs de fuente/consumidor coincidan; sus conteos agregados no prueban aceptación de este SHA. La ruta/inventario por sí solos tampoco.
5. Sin build, despliegue y confirmación del mismo SHA no hay certificación integral. La compilación corresponde a Claude; no hacerla en este encargo documental.

**Proveniencia principal:** `docs/evidencias/69-revision-final-de-la-entrega.md` y `69-inventario-cobertura.md` (`feb90f4d…`); `66-auditoria-sobre-212ba37-voz-video-comida.md` y `67-cierre-de-tanda-no-aprobada.md` (`212ba37…`); `docs/codex/areas.json`, `docs/codex/COMO-REVISA-CODEX.md`, `AGENTS.md`, `ESTADO-AUDITORIA.md` y rutas/símbolos contrastados contra `e52c078…`. El inventario 69 contaba 370 rutas (173 coincidencias directas, 197 no mapeadas) en su SHA: no es un recuento vigente ni 197 defectos. En el destino se encontró un inventario estático de 417 archivos `page.tsx`/`route.ts`; no se pudo completar `getAllRoutes()` en esta sesión, así que no se presenta ese número como conteo de rutas aceptadas.
