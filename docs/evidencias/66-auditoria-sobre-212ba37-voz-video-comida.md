# Auditoria virtual parcial sobre main 212ba37

**Fecha:** 5 de octubre de 2026
**Commit revisado:** `212ba37da9c7540fd044b9de6e0edfe448ddfbe5` (main confirmado nuevamente por GitHub el 5/10; SHA del despliegue no confirmado en el recorrido visual actual).
**Estado:** parcial; no certifica la app ni declara areas limpias.
**PR abiertas consultadas:** ninguna en ese momento.

## Pruebas ejecutadas

- Suite Jest completa en entorno aislado, sin secretos ni servicios reales: **589 suites y 3.383 pruebas aprobadas**.
- Pruebas focalizadas de voz/video: **3 suites y 18 pruebas aprobadas**.
- Contratos, seña, flujo comercial, imágenes de menú y menú público: **6 suites y 68 pruebas aprobadas**.
- Los conjuntos focalizados ya forman parte de la suite completa; no sumar sus cantidades a 3.383.
- Las pruebas de Gemini simulan la respuesta: no hubo llamada real. El E2E de duración mide un archivo de muestra, no genera el video en un navegador real.
- El recorrido E2E `viaje-invitado` quedó **inconcluso e invalido como evidencia de cierre**: el primer lanzamiento no tenía servidor (10 fallos de conexión); al corregir eso, pasaron 2/10 antes de detenerlo por mensajes de inicialización ADC y fallback de Firestore. No se confirmó acceso remoto: una consulta independiente no pudo cargar credenciales. Los dos archivos JSON sintéticos que dejó la prueba se borraron; no se hicieron más operaciones.

## Hallazgos confirmados

### COMIDA — costo interno público: exposición comprobada, interpretación corregida

`getMenusPublicos` es una acción sin sesión utilizada por el inicio del simulador y la presentación (`src/app/actions/public-simulator-bootstrap.ts`, consumidor en `src/app/simulador-ak/page.tsx`). En `src/app/actions/menus-catering.ts:180-186` elimina `ingredients` y `profitMargin`, pero conserva `totalDishCost`; el costo se calcula en las líneas 105-120. **No se comprobó una extracción externa en producción; el flujo público y el campo serializado se confirman en el código de main.**

**Rectificación de la revisión 68:** la frase del test “sin el costo, el margen ni el proveedor” pertenece a `getServiciosEmpresaPublicos`, no a `getMenusPublicos`. Para menús el test dice “sin la receta ni el margen”. Además, el comentario de `menus-catering.ts:176-178` explica que conservar el costo es intencional, y `menuItemToServicioEmpresa` en `src/app/simulador-ak/page.tsx:92` lo usa como `valorUnitarioEstimado`. Por tanto, no corresponde afirmar que ese test prohíbe el campo ni retirarlo sin adaptar el consumidor. La exposición sigue siendo un riesgo de privacidad para evaluar con Claude; el comentario técnico no demuestra aprobación del dueño. Si se decide ocultarlo, preservar presupuesto y rentabilidad calculando lo interno en servidor y probar ambos resultados. Esta observación no es una orden para quitar el campo aisladamente.

### COMIDA / PERMISOS — acciones de insumos no comprueban el permiso del perfil

`src/lib/auth/perfiles.ts` concede `INSUMOS` al dueño y a la secretaria, pero no al operador. Sin embargo, `getInsumos`, `getInsumoById`, `saveInsumo`, `deleteInsumo` y `adjustAllInsumoCosts` en `src/app/actions/insumos.ts` sólo exigen `requireAppSession`; esa función confirma sesión firmada, no permiso (`src/lib/auth/require-session.ts`). Las acciones de servidor son invocables fuera de la pantalla, por lo que esconder el módulo no cierra esta puerta. El operador autenticado puede leer el stock/costo y llamar acciones de mutación. La prueba de límites de seguridad verifica sesión, no este cruce de roles.

### PLATA / PERMISOS — varias lecturas y cambios masivos sólo exigen sesión

`getPresupuestos`, `getPresupuestoById`, `getPresupuestosWithPendingPayments` y `getPresupuestoShareToken` en `src/app/actions/presupuestos.ts` validan que exista sesión, pero no comprueban `PERMISOS.CONTABILIDAD`. El perfil operador no tiene ese permiso según `src/lib/auth/perfiles.ts`. Como acciones exportadas del servidor pueden invocarse directamente, aunque se oculte la pantalla. Devuelven listas completas o presupuestos con datos del cliente, fecha, servicios, pagos y saldo; el share-token además permite ampliar el acceso. `repairVerifiedBudgetDates`, llamada desde la pantalla de presupuestos, también acepta cualquier sesión para reescribir fechas de toda la lista.

Hay pruebas que protegen la lectura de facturas con permiso contable, pero no cubren estas lecturas de presupuestos por rol.

La acción tiene muchos consumidores del planificador que pueden necesitar los servicios, no necesariamente el estado financiero; también tiene consumidores del portal con token. La corrección no debe bloquear a ciegas el trabajo operativo: separar lectura completa con permiso contable, proyección operativa mínima y lectura del cliente limitada al token válido.

### COMIDA — un ajuste masivo fallido puede aplicarse dos veces

`adjustAllInsumoCostsInterno` en `src/app/actions/insumos.ts` persiste primero todo el inventario ajustado y luego propaga los cambios plato por plato. Si alguna propagación falla, devuelve `success:false`, pero conserva el porcentaje aplicado en el inventario y parte de los menús puede quedar desactualizada. La pantalla presenta el error y permite volver a intentar; el segundo intento aplica el mismo porcentaje sobre el valor ya modificado. Esto puede dejar costos y rentabilidad incorrectos. La prueba `el-ajuste-de-costos-no-miente.test.ts` comprueba error cuando falla el primer guardado, no fallo parcial después de uno o más guardados exitosos ni el reintento.

### ENTRETENIMIENTO — música y compartir del video no corresponden a lo que ofrece la interfaz

`src/components/album/TuVideoDeLaFiestaModal.tsx:133` anuncia un montaje “con música”, pero `musicaUrl` sólo aparece en el tipo de `src/lib/video-resumen/generar-video-resumen.ts` y no se usa al renderizar o grabar; el `MediaRecorder` recibe únicamente el `canvas.captureStream`. Además, `handleCompartir` (líneas 89-107) comparte `window.location.href`, no el Blob ni una URL persistente del video creado. La persona que recibe el enlace no recibe el archivo recién generado. Las pruebas verifican que haya botones y que una muestra de archivo dure, pero no que la generación mezcle audio o que compartir entregue el video.

### CONTROL DE AUDITORIA — el contador puede ignorar cambios sin commit

`scripts/codex-limpio.mjs:23-25` compara sólo `git diff <commit>..HEAD` y usa los directorios declarados. No revisa el índice, el árbol de trabajo ni archivos nuevos sin seguimiento. Si un área marcada limpia se edita localmente sin commit, `npm run codex?` puede seguir llamándola limpia. En la revisión actual ninguna figura limpia (0/14), así que no produjo hoy un falso “todo limpio”, pero el mecanismo debe considerar ese estado antes de servir como certificado.

### ASISTENTE — límite de llamadas concurrentes

`src/app/api/asistente/voz-parte/route.ts:20-25` implementa el tope diario con lectura y escritura separadas. Solicitudes simultáneas pueden leer el mismo contador y todas sintetizar antes de que se refleje el incremento; el tope de 100 no es atómico. El reproductor manda el texto en la URL de un `fetch` GET (`src/lib/asistente/reproductor-voz.ts:74-75`), que puede quedar en registros de solicitudes según su configuración. **Rectificación de la revisión 68:** ese `fetch` no agrega por sí mismo una entrada al historial de navegación, y no se inspeccionaron registros reales de proxies. La ruta ya tiene POST: una eventual corrección debe aprovecharlo y validar su consumidor. Estas condiciones no están cubiertas por las pruebas secuenciales actuales.

## Lo que salió bien en este bloque

- `getPublicSocialPosts` fuerza `soloAprobados`; no se encontró exposición de publicaciones pendientes en el álbum público revisado.
- Los 68 tests focalizados de contratos, seña y catering aprobaron. Esto no cierra esas áreas completas.
- La documentación oficial actual de Google confirma que `gemini-3.8-flash-tts` existe y que el modelo anterior `gemini-2.5-flash-preview-tts` sigue siendo el fallback configurado; no es un hallazgo de modelo inexistente: [modelos oficiales Gemini](https://ai.google.dev/gemini-api/docs/models).

### BARRA — acciones de equipo permiten operar stock sin permiso de insumos

En `src/lib/auth/perfiles.ts:50-58`, el perfil `operador` recibe `NOCHE` y `ORGANIZACION`, pero no `INSUMOS`. Sin embargo, las acciones de barra `saveBarraTecnologicaSettings` (`src/app/actions/fiesta/barra-tecnologica.actions.ts:544`), `createBarmanManualOrder` (`:744`), `updateBarDrinkOrderStatus` (`:983`), `getCierreDeBarra` (`:1083`) y `guardarCierreDeBarra` (`:1145`) sólo llaman `requireAppSession`. Esa función (`src/lib/auth/require-session.ts:9`) comprueba que exista sesión, no el permiso del perfil. Varias de esas acciones cambian inventario: crear pedidos manuales descuenta botellas, cancelar pedidos las repone y el cierre puede ajustar depósito (`ajustarDeposito`). Por lo tanto, un usuario operador autenticado puede invocarlas directamente aunque su perfil no tenga permiso de insumos. **Hallazgo confirmado por lectura de las acciones exportadas y la matriz de perfiles; no se ejecutó una prueba de integración autenticada con perfiles reales.** Responsable de corrección según el reparto acordado: Claude (permisos/stock). La corrección debe preservar la operación de la pantalla del barman con el rol autorizado, evitando un bloqueo general por el mero hecho de añadir un permiso.

### BARRA — se confirma un pedido aunque falten ingredientes reales

En `createBarDrinkOrder` (`src/app/actions/fiesta/barra-tecnologica.actions.ts:575-741`), el servidor comprueba `drink.stockDisponible`, pero esa propiedad viene del catálogo/fiesta (`getBarDrinks`, `:133-151`), no se calcula desde el depósito en esa función. Después, dentro de la transacción, `descontarYGuardarEnUnaOperacion` guarda el pedido incluso cuando un documento de ingrediente no existe o su cantidad es inválida, porque lo omite (`:337-363`). Si el stock real es cero, `calculateActualStockMovement(0, requested)` devuelve cero (`src/lib/barra-tecnologica.ts:31-34`) y la transacción igualmente registra el pedido. Si el valor de catálogo está atrasado respecto del depósito real, el invitado recibe confirmación para un trago sin ingredientes disponibles; la misma función puede aceptar dos pedidos concurrentes cuando queda menos stock que el requerido. **Defecto confirmado por la lógica, no reproducido con transacciones Firebase reales.** Prioridad P1; responsable Claude por stock. La escritura debe ser atómica y rechazar el pedido cuando cualquiera de sus ingredientes no alcance, sin confirmar una orden parcial.

### BARRA — el pedido manual puede dejar stock descontado sin registro

`createBarmanManualOrder` (`src/app/actions/fiesta/barra-tecnologica.actions.ts:744-786`) ejecuta `descontarStock` antes de escribir la orden. Si falla tanto la escritura Firestore como `saveFallbackOrders`, retorna error, pero no llama a `reponerStock` ni anota una devolución pendiente. El camino de invitado sí contempla explícitamente la compensación en caso de que fallen ambos guardados; el camino del barman no. No hay una prueba encontrada para el fallo de persistencia del pedido manual. **Riesgo confirmado por la rama de errores; no se forzó una caída de ambas persistencias.** Prioridad P2; responsable Claude.

### ENTRETENIMIENTO — cualquier sesión del equipo supera la frontera de operador

`getEntertainmentLaunchToken` en `src/app/actions/fiesta/entretenimiento.actions.ts:94-113` requiere únicamente `requireAppSession` y luego entrega tanto `guestToken` como `operatorToken` para la estación indicada. `hasEntertainmentControlAccess` en `src/lib/auth/entertainment-token.ts:93-100` devuelve `true` ante cualquier `hasAppSession()`; `hasAppSession` sólo verifica que el token de sesión sea válido (`src/lib/auth/require-session.ts:3-6`). Por eso las acciones que protegen el ciclo de la estación con `hasEntertainmentControlAccess` no comprueban `PERMISOS.NOCHE`, `ORGANIZACION` ni asignación a esa fiesta. La matriz declara que `personal`, `cliente`, `prospecto` e `invitado` no tienen permisos del equipo (`src/lib/auth/perfiles.ts:50-67`). El enlace real desde la pantalla de entretenimiento está en `src/app/(app)/fiestas/nueva/entretenimiento/page.tsx:854`; los controles de pantalla del evento usan el patrón más estricto `requireEventPermission(fiestaId, PERMISOS.NOCHE)` que ya verifica la prueba `public-admin-entertainment-boundary.test.ts`. **Fallo confirmado en la política de autorización del servidor; el acceso real de una cuenta de cada perfil no se ejecutó en navegador.** Responsable de corregir: Claude por tratarse de permisos. No retirar el modo operador legítimo ni romper la apertura pública de las estaciones.

### ENTRETENIMIENTO — un timeout puede volver a publicar una captura ya guardada

Las páginas de fotocabina (`src/app/evento/fotocabina/[fiestaId]/page.tsx:976`), Plataforma 360 (`src/app/evento/plataforma-360/[fiestaId]/page.tsx:679`) y espejo mágico (`src/app/evento/espejo-magico/[fiestaId]/page.tsx:913`) envían la captura con `conTopeDeEspera(uploadEntretenimientoMedia(formData))`, pero las tres peticiones iniciales no mandan `clientMediaId` (no aparece ese campo en ninguna de las tres páginas). `conTopeDeEspera` usa `Promise.race` y no cancela la petición original (`src/lib/ui/tope-de-espera.ts:20-38`); al agotarse el plazo, los componentes guardan la captura en IndexedDB para subirla luego. Esa segunda subida sí manda su ID estable (`src/lib/offline/offline-sync-manager.ts:145-161`). En el servidor `uploadEntretenimientoMedia` usa un ID aleatorio si falta `clientMediaId` y sólo comprueba duplicados cuando recibe ese campo (`src/app/actions/fiesta/entretenimiento.actions.ts:197-207`). Así, si la primera petición termina guardando después del timeout, el reintento offline no la reconoce y crea otra entrada en el muro. El mensaje de timeout afirma “No se guardó nada”, algo que el cliente no puede asegurar. **Defecto confirmado por la secuencia de código, no reproducido contra Firebase real.** Prioridad P2; responsable: Gemini. La corrección debe asignar el mismo ID desde la captura inicial hasta cualquier reintento y hacer idempotente la persistencia del post, no sólo la lista local.

### INVITADOS — la lista privada no limita por perfil ni por evento asignado

`getInvitados` en `src/app/actions/fiesta/invitados.actions.ts:64-68` exige una sesión y devuelve `fiesta.invitados` completa mediante `getFiestaById(fiestaId, LECTURA_COMPLETA)`. Esa lectura puede incluir contacto y credenciales. No exige `PERMISOS.NOCHE`/`ORGANIZACION` ni `requireEventPermission`, a diferencia del control de evento en `src/lib/auth/event-access.ts`. En el test `src/__tests__/la-lista-de-invitados-pide-sesion.test.ts`, `verifySession` se reduce a un booleano y el escaneo trata `requireAppSession` como equivalente a permiso; no se ensayan perfiles, asignación al evento ni acceso a la acción como operador/persona. **No es un acceso anónimo confirmado: sí hay requisito de sesión. La brecha confirmada es que el servidor no aplica el perfil ni la asignación del evento; no se probó con cuentas reales.** Debe alinearse a la autorización necesaria para recepción/muro sin bloquear a los roles que sí necesitan operar esas pantallas. Responsable: Claude (permisos/privacidad).

## Barra: comprobaciones que pasaron / límites

- Pasaron en la suite general las pruebas de pedido sin sesión, idempotencia, reposición de botellas, recetas, cierre y pantalla de retiro (`el-invitado-pide-un-trago-sin-sesion.test.ts`, `un-trago-que-no-se-guardo-no-descuenta-botellas.test.ts`, `las-recetas-de-la-barra-descuentan-de-verdad.test.ts`, `el-cierre-de-barra-muestra-lo-que-salio-sin-registrar.test.ts`, `la-pantalla-trago-listo.test.ts`). Estas pruebas no cubren el rechazo por perfil operador/cliente.
- Las pruebas `entertainment-session-permissions.test.ts` y `public-admin-entertainment-boundary.test.ts` pasaron, pero la primera simula `hasEntertainmentControlAccess` y la segunda no exige permiso de perfil para tokens de operador; no prueban la matriz completa de perfiles contra las acciones reales.
- No hay una prueba encontrada que deje la subida directa pendiente, supere el timeout y luego reintente la misma captura en IndexedDB; esa carrera sigue sin cobertura.
- `la-lista-de-invitados-pide-sesion.test.ts` verifica sesión pero no perfil ni asignación a la fiesta; no demuestra aislamiento por rol.
- `getBarPedidosListos` no exige sesión, pero su consumidor es la pantalla pública del tótem `/evento/barra/[fiestaId]/listo`, que necesita mostrar pedidos listos para retirar. No se eleva esto a defecto en esta auditoría; queda pendiente revisar que la respuesta pública no incluya campos innecesarios del pedido.
- No probé hardware de tótem/barra, red de evento, pedidos simultáneos en Firestore real ni cierre con inventario productivo.

## Web pública y simulador: recorrido visible parcial

**Entorno:** `https://akproducciones.uy/`, navegador Codex, 5 de octubre de 2026. Se abrió la web publicada; el endpoint de salud no pudo consultarse desde este navegador (`ERR_BLOCKED_BY_CLIENT`), por lo que **no se confirmó aquí el SHA del despliegue**. Esta evidencia visual no se atribuye automáticamente al commit local.

- La portada cargó con imagen y CTA. Desde “Proyectar mi fiesta” se llegó al simulador; la espera inicial “Preparando catálogo…” terminó y apareció “Comenzar mi presupuesto”.
- Se avanzó hasta el formulario de datos. Al pulsar Continuar vacío, el formulario explicó los cuatro datos faltantes (nombre, WhatsApp válido, opción de salón y fecha). No se ingresaron datos ni se creó un prospecto: el resto del embudo queda pendiente de un entorno con datos de prueba autorizado.
- En la galería pública, el filtro Catering mostró 27 resultados y el contenido observado se presentó bajo esa categoría. En la vista “Todos”, “Kebab gourmet para eventos” aparecía bajo Catering; la clasificación concreta que se había señalado como decoración no se repitió en esta muestra.
- **UX P2, visual reproducido:** a 660 px de ancho el CTA flotante rojo “Cotizá tu fiesta” aparece a la vez que el mismo CTA del encabezado y queda encima de la primera fila de la galería, cubriendo parte de una foto. Al navegar al bloque de servicios también permanece sobre el contenido. Consolidar a un solo CTA visible en ese breakpoint o reservar espacio para el flotante; no tapar contenido.
- **Oportunidad estética, no defecto funcional:** el hero usa una fotografía muy oscura y la galería una superficie blanca; la transición de paleta se percibe abrupta en la navegación observada. Está alineado con la preferencia ya expresada por el dueño de evitar saltos de negro a blanco, pero el ajuste visual requiere su aprobación de diseño.
- El recorrido no valida el envío de recuperación, CRM, WhatsApp, precios reales ni descarga de PDF.
- Desde el artículo, el enlace del pie “Gastronomía Gourmet & Catering” sí navegó a `/#landing-services` y mostró la sección correspondiente; este destino pasó.

### Ficha de Club Uruguay

En `https://akproducciones.uy/club-uruguay` la ficha cargó con fotografía del salón, CTA de cotización/visita y tres imágenes de montajes con sus rótulos; no está vacía y la muestra no trae fotos de la galería general mezcladas. **Oportunidad comercial P2, no error funcional:** la página sólo comunica “Salto, Uruguay” y no presenta capacidad, dirección/mapa preciso, condiciones ni servicios verificados del local. Una ficha breve de datos confirmados ayudaría a la familia a decidir si coordina una visita; no inventar ni completar datos sin confirmación de AK.

El hero oscuro termina junto a un bloque blanco visible inmediatamente debajo en el viewport de 660 px. La combinación se ve otra vez en la ficha; consolidar esta observación con la oportunidad de consistencia visual de portada, no crear dos órdenes duplicadas.

### Artículo del blog: foto principal

Se abrió el artículo público “Ideas originales de animación y cabinas de fotos para tu fiesta en Salto”. El encabezado muestra el título y la bajada encima de una foto usada como fondo con una capa oscura; en la siguiente pantalla aparece el cuerpo y la caja “Idea principal”, sin una foto destacada independiente visible. **Fricción visual P2 confirmada en navegador:** no cumple la presentación editorial pedida (imagen protagonista separada del texto, como una publicación). La lectura del texto sí es posible; no es un error de carga. No se cambió ni publicó contenido.

## Continuación con Graphify: red social del evento

**Área:** invitado / fiesta · **Commit:** `212ba37da9c7540fd044b9de6e0edfe448ddfbe5`.

### SOCIAL01 — dos canciones o dedicatorias simultáneas se sobrescriben

**P1, reproducido en sonda aislada.** `addSongRequest` y `addDedication` en `src/app/actions/social-interactive.ts:221,353` generan los documentos con `song_${Date.now()}` y `ded_${Date.now()}`. Las escrituras posteriores usan `.doc(id).set(...)`, sin componente aleatorio ni identidad de fiesta en la clave. Dos creaciones en el mismo milisegundo guardan el mismo documento: ambas llamadas devuelven éxito, pero la segunda reemplaza la primera. Como las colecciones son globales, también ocurre entre fiestas diferentes.

**Evidencia:** `node docs/evidencias/66-sonda-social-colision.cjs` ejecutó las funciones TypeScript de este commit con Firestore simulado y reloj fijo. En cada uno de los cuatro casos (canciones/dedicatorias, misma fiesta/fiestas distintas) hubo 2 respuestas exitosas y sólo 1 documento persistido, con IDs devueltos idénticos. La sonda comprueba la reproducción del defecto, no es una prueba de aceptación de la corrección. No se escribieron datos remotos.

**Responsable:** Gemini. Usar identidades únicas por creación y comprobar que dos llamadas simultáneas conservan ambos registros; preservar el contrato de reintentos que tenga cada consumidor. La orden 82 ya explica este patrón para CRM/agenda, pero no incluye estas dos funciones. No se encontró corrección específica en `docs/YA-RESUELTO.md`. Las pruebas existentes de votos atómicos no cubren la creación simultánea de documentos.

### Herramientas y límites del índice

Se regeneró Graphify sobre este SHA: 2.198 archivos de código, 11.763 nodos, 39.183 relaciones y 654 comunidades. Una consulta de `addSongRequest`/`addDedication` devolvió sus consumidores reales. Se omitieron 2 documentos semánticos por falta de clave de IA; el parser advirtió extracción parcial posible en 25 archivos. El índice usa 0 tokens de API, está en `graphify-out/` y es local/ignorado por Git. No equivale a compilación ni valida que los módulos funcionen. Se instaló `uv` 0.12.23 como herramienta del equipo y se comprobó su ejecución; no se cambiaron dependencias de la app.

## Automáticos: comprobaciones de fallo y concurrencia

**Área:** automaticos · **Commit:** `212ba37da9c7540fd044b9de6e0edfe448ddfbe5`. **Hallazgos:** AUTO01 y AUTO02. No se ejecutaron tareas reales ni se enviaron comunicaciones.

### AUTO01 — el candado no garantiza una sola corrida entre instancias

**P1, reproducido en sonda aislada.** `intentarAdquirirLock` en `src/lib/automatico/control-concurrencia.ts:27` usa memoria por proceso y una lectura/escritura separada de `tareas-lock.json`; no adquiere el estado persistente con transacción o compare-and-set. Dos instancias leen el estado libre antes de escribir y ambas reciben `true`. Además, `liberarLock` escribe `enCurso:false` sin comprobar identidad del dueño: cuando una corrida supera los cinco minutos y otra adquiere el candado vencido, la corrida antigua puede liberar el candado de la nueva, dejando entrar a una tercera.

**Evidencia:** `node docs/evidencias/66-sonda-tareas-automaticas.cjs` cargó el módulo real en dos contextos separados con persistencia simulada compartida. Resultado: `[true,true]` donde sólo una adquisición debía pasar. El caso de vencimiento y liberación tardía permitió entrar al tercer dueño mientras el segundo seguía activo. La prueba existente `concurrencia-tareas-automaticas.test.ts` usa una sola instancia del módulo y sólo comprueba el candado en memoria. No se comprobó una duplicación efectiva de publicaciones o consumo de IA en producción.

**Responsable:** Gemini. Necesita una adquisición persistente atómica y liberación condicionada al identificador de dueño; cubrir dos procesos, vencimiento, liberación tardía y fallo de persistencia. `ponerAlDiaAlEntrar` es el consumidor real (`src/lib/automatico/al-entrar-a-la-app.ts:98`), invocado desde la portada y el despachador. Mantener las decisiones aprobadas sobre preparar mensajes frente a enviarlos.

### AUTO02 — cuatro servicios fallidos se informan como tareas correctas

**P2, reproducido en sonda aislada.** En `src/lib/automatico/al-entrar-a-la-app.ts:125-126,153-154`, las métricas, comentarios de redes, recordatorios de cuotas y recordatorios de reuniones convierten sus rechazos a `null`. El bloque general añade entonces `metricas` y `recordatorios` a `corrio`, llama `marcarCorrida` y guarda su fecha. El panel recibe éxito aunque el trabajo no se haya completado y el próximo intento queda sujeto al intervalo de 24 horas. La decisión de limitar reintentos tras un fallo puede conservarse, pero el fallo debe quedar visible.

**Evidencia:** la misma sonda hizo rechazar los cuatro servicios. El resultado tuvo `fallaron:[]`, marcó `metricas-de-redes` y `recordatorios-de-pago` como corridas y persistió `ultimaCorrida`. No hubo llamadas a servicios reales.

**Responsable:** Gemini para el despachador; Claude conserva cualquier modificación de lógica contable. Informar fallos totales o parciales y comprobar los resultados que devuelven las tareas, sin dejar que un fallo interrumpa las demás. Añadir pruebas de fallo de un subservicio y de todos los subservicios; el panel debe mostrar el resultado correspondiente.

## Personal: vigencia del enlace y llegada

**Área:** personal / permisos · **Commit:** `212ba37da9c7540fd044b9de6e0edfe448ddfbe5`. **Hallazgos:** PERS01 y PERS02; responsable Claude (permisos y datos de personal).

### PERS01 — el enlace vencido sigue abriendo el portal y modificando asistencia

**P1, reproducido en sonda aislada.** `getAccesoPersonalPortalView`, `responderAsistenciaPersonal` y `registrarLlegadaPersonal` en `src/app/actions/accesos-personal-view.ts:33,85,129` llaman a `getAccesoById`, que sólo busca el token (`src/app/actions/accesos-personal.ts:45`). No aplican `accesoVencido`, aunque la misma credencial sí queda rechazada como `vencido` por `verifyAccesoPersonalToken`. Por ello la vigencia depende de qué acción se invoque y no protege el portal de personal.

**Evidencia:** `node docs/evidencias/66-sonda-acceso-personal.cjs` ejecutó el lookup real, el control de vigencia real y las acciones del portal con un acceso sintético vencido en 2020. El control del módulo devolvió no autorizado/vencido, pero el portal devolvió datos y las dos mutaciones respondieron éxito. Se simuló la persistencia; no se usaron tokens de empleados reales.

**Corrección y retest:** aplicar la política existente de vigencia antes de devolver datos o cambiar asistencia/llegada; probar vencimiento explícito, ventana por defecto de 90 días y token vigente asignado. No cambiar la decisión documentada sobre fechas ilegibles sin consultar al dueño. El consumidor real es `src/app/acceso-personal/[tokenId]/page.tsx`.

### PERS02 — coordenadas no finitas superan el control de llegada

**P2, reproducido en sonda aislada.** `registrarLlegadaPersonal` (`src/app/actions/accesos-personal-view.ts:173-180`) verifica sólo `typeof === 'number'`. `NaN` e `Infinity` pasan esa condición; la fórmula devuelve `NaN`, y `NaN > radioMaximo` es falso. Entonces se registra la llegada aunque no haya una ubicación válida. También falta validar los rangos geográficos del dato que viene del cliente.

**Evidencia:** con control de ubicación encendido y coordenadas de salón válidas, la sonda mandó `lat:NaN`, `lng:Infinity`; la acción devolvió `success:true`, distancia `NaN` y aplicó el check-in. No se forzó una escritura de estos valores en Firebase real.

**Corrección y retest:** rechazar coordenadas no finitas o fuera de latitud/longitud válidas, y rechazar una distancia no finita antes de persistir. Mantener los casos ya comprobados de radio válido, token inválido y ubicación desactivada. La prueba existente `la-llegada-con-ubicacion-mide-bien.test.ts` no cubre estos valores.

### Personal: comprobación aprobada

`getRecibosFirmadosByEmpleado` llama a `getRecibosFirmados`, que sí exige `PERMISOS.SUELDOS`. La llamada inicial a `requireAppSession` no omite el permiso interno; no se reporta una filtración de recibos por esa función. Se confirmó por la cadena real de llamadas, no por una búsqueda superficial de palabras.

## Límites y continuación

- Los cobros reales, el correo, redes sociales, credenciales de clientes, Gemini real y hardware de entretenimiento no se probaron en este bloque.
- La app completa no está certificada: el contador sigue en **0/14 áreas limpias** y el área de plata permanece con hallazgos abiertos en el registro.
- Las cinco fallas nuevas SOCIAL01, AUTO01-02 y PERS01-02 se reprodujeron ejecutando funciones del código actual con persistencia/servicios simulados. No se corrió compilación ni se tocó el código de la app; las sondas viven en documentación y demuestran el defecto, no aceptación de una futura corrección.
- GitHub main volvió a consultarse y seguía en `212ba37`; no había PR abierta en esa consulta. No se conoce una tanda local/no subida de Gemini o Claude, por lo que cualquier orden exige contrastar nuevamente antes de programar.
- Próximo trabajo: recorrer los flujos internos de fiesta/portal con entorno aislado que garantice no leer/escribir producción; volver a comprobar sólo los cambios que Claude o Gemini integren sobre su SHA exacto.
