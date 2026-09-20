# Carteleria, menu impreso y numeros de mesa

Codex, 2026-09-20. Primera pasada de estos recorridos; no revalidacion de fotografia, itinerario ni reuniones.

## Version y metodo

Base ejecutada: PR1210, d2f35915590b9901243d9d7b2f68e1d21713ebd5. Se contrastaron listas completas de archivos de las seis PR abiertas: 1210, 1209, 1207, 1206, 1202 y 1197; ninguna modifica las tres pantallas ni fiesta/fiesta.actions.ts. No se detecto en ellas una correccion de estos hallazgos.

Se consulto el registro compartido por carteleria/menu-mesa/numeros-mesa. Existia evidencia de apertura de numeros-mesa, no de estos comportamientos. Abrir una pantalla no valida su guardado, fecha, carga fallida ni consistencia con el plano.

Repo local original no disponible; Graphify no disponible localmente. Fuentes obtenidas por GitHub al SHA exacto. No se reconstruyo el grafo ni se instalaron dependencias de produccion.

12 casos nuevos, 6 PASS y 6 FAIL, agrupados en CINCO hallazgos. Ejecucion AST de funciones reales con servicios y setters simulados. Una primera ejecucion de la sonda fallo por un error propio del arnes (await task() en vez de await task); se corrigio y la segunda ejecucion completa termino con codigo 0. Ese error NO se atribuye a la app.

## Parte 1: kit de carteleria

Archivo: `src/app/(app)/fiestas/nueva/carteleria/page.tsx`.

### IMP-01 / P1: confirma kit guardado con fallo parcial

`handleSaveAll` (431-456) espera Promise.all de cuatro acciones, pero no comprueba sus resultados. Si updateMenuMesa devuelve success:false, muestra Kit guardado y actualiza configuracion local. La excepcion rechazada si se informa como error.

Contrato confirmado en `src/app/actions/fiesta/fiesta.actions.ts`: updateMenuMesa, updateNumerosMesa y updateCartaTragos pueden devolver success:false, sin rechazar la promesa. Consumidor real: boton onClick={handleSaveAll}, linea 592.

Pruebas: kit-normal PASS; kit-partial FAIL (successNotice=true, localUpdates=1); kit-throws PASS. No se simulo ni afirmo una transaccion real en Firebase.

Impacto humano: el organizador cree que todo quedo listo, pero al volver puede encontrar una parte vieja. Recomendacion para Gemini: inspeccionar cada resultado, identificar lo que no se guardo y conservar el trabajo para reintentar; no decir todo guardado. Claude debe revisar consistencia de las escrituras, porque las acciones guardan la fiesta completa. Concurrencia real de esas cuatro escrituras NO probada en esta tanda.

### IMP-02 / P2: fecha impresa retrocede un dia en Uruguay

`formatDate` (82-89) interpreta YYYY-MM-DD mediante new Date y luego aplica zona local. En America/Montevideo, 2026-10-10 produce 09/10/2026. Consumidores: numerosMesa.fechaEvento al cargar (352), y fechaEventoTexto (473), usada en carteles. El formateador de numeros-mesa, en cambio, conserva 10/10/26 con el mismo dato.

Pruebas: date-carteleria.tsx FAIL; date-numeros.tsx PASS. No depende de opiniones esteticas: el mismo dia se imprime distinto entre herramientas.

Gemini: usar semantica de fecha de calendario, sin conversion de zona para una fecha sin hora. Probar fin de mes/ano y dato vacio; no reemplazar globalmente fechas-hora sin distinguirlas.

## Parte 2: menu de mesa

Archivo: `src/app/(app)/fiestas/nueva/menu-mesa/page.tsx`.

### IMP-03 / P2: al fallar el guardado se pierde el borrador

`handleSave` (110-131) restaura lastSavedDataRef.current en catch. La pantalla avisa que restauro la version anterior, pero elimina el texto trabajado, incluyendo cambios realizados mientras esperaba la respuesta. No es silencio ni falso exito: es una recuperacion que descarta trabajo.

Pruebas: menu-normal PASS; menu-failure FAIL (Nuevo -> Anterior); menu-late-failure FAIL (Ultima edicion -> Anterior). Se comprueba estado local, NO borrado de datos en servidor.

Consumidor: boton de guardar y edicion en MenuMesaTemplate, con onUpdate que modifica data. Gemini: conservar borrador al fallar, distinguir pendiente de guardado de version persistida y permitir reintentar. Si se desea una accion Restaurar, que sea explicita; no imponer nuevo flujo sin aprobacion del dueno.

Criterio pendiente de integracion: editar menu, cortar servicio de guardado, ver texto intacto, reintentar y recargar con datos guardados. Validar tambien que imprimir/descargar no comunique que ya se guardo si sigue pendiente.

## Parte 3: numeros de mesa y plano

Archivo: `src/app/(app)/fiestas/nueva/numeros-mesa/page.tsx`.

### IMP-04 / P2: el mismo plano produce cantidades distintas

`loadData` cuenta solo elementos cuya category incluye mesa. Carteleria usa filterTableElements: tipo element y seats definido o nombre con mesa. Un elemento valido del tipo LayoutElement con seats:8, category:Mobiliario y name:Redonda cuenta en carteleria, pero no en numeros-mesa; este ultimo conserva 20, su cantidad inicial.

Pruebas: numbers-category PASS (1); numbers-seats FAIL (20); kit-seats PASS (1). Fixture compatible con src/types/fiesta.ts, donde category y seats son opcionales. No se afirma que los 19 eventos reales contengan ese elemento: sus datos no se inspeccionaron.

Impacto: dos herramientas dicen cantidades diferentes y pueden preparar tarjetas de mas. Gemini: acordar y reutilizar un criterio de mesa real; no contar indiscriminadamente cualquier mueble con asientos. La identificacion definitiva requiere verificar el catalogo real. Probar mesas, sillas, mesas auxiliares y planos vacios; no cambiar asignaciones de invitados automaticamente.

### IMP-05 / P2: carga fallida queda en pantalla de espera

En `loadData`, el catch solo muestra toast y finally deja isLoading=false. Fiesta permanece null. El render `if (isLoading || !fiesta)` devuelve el indicador de carga; no ofrece error persistente ni reintento.

Prueba numbers-fails FAIL: spinner=true despues de rechazo. No se renderizo el componente: se ejecuto la funcion real y se evaluo el predicado de render existente.

Gemini: distinguir no cargado, cargando, fallo y exito; permitir reintentar sin activar autoguardado de defaults durante un fallo. El hook usa enabled=!isLoading && !!fiestaId, pero NO se probo aqui que guarde automaticamente tras ese fallo: no convertir esa posibilidad en un hecho.

## Evidencia reproducible

`docs/evidencias/impresos-sonda.cjs` y `docs/evidencias/impresos-resultados-2026-09-20.json`.

Preparar desde d2f35915590b9901243d9d7b2f68e1d21713ebd5 los archivos:
- carteleria.tsx: src/app/(app)/fiestas/nueva/carteleria/page.tsx
- menu.tsx: src/app/(app)/fiestas/nueva/menu-mesa/page.tsx
- numeros.tsx: src/app/(app)/fiestas/nueva/numeros-mesa/page.tsx

Ejecutar con Node y TypeScript disponible: `node docs/evidencias/impresos-sonda.cjs CARPETA_FUENTES`. AUDIT_TYPESCRIPT admite ruta al modulo TypeScript. La sonda fija America/Montevideo; no escribe datos ni accede a red.

## Mejoras de uso y limites

Las mejoras utiles aqui son confianza al guardar, no perder el trabajo y coherencia entre los impresos. No hace falta sumar otra pantalla ni animaciones para resolverlas.

Pendiente: vista real movil/escritorio, descarga JPG, codigos QR escaneados, impresion A4 con margenes/cortes y plano real. El calculo de piezas de carteleria usa la hoja completa mientras el contenedor agrega padding y espacios: es una sospecha de maquetacion que REQUIERE render/impresion antes de declararla fallo. No hubo comprobacion visual, E2E, build ni escrituras Firebase.

No se modifico codigo de aplicacion, no se fusiono y no se solicito rehacer correcciones anteriores. Gemini atiende interfaz; Claude revisa consistencia/datos y compila posteriormente. Esto no inicia automaticamente a otra IA. Continuar primera pasada antes de revalidar arreglos, segun orden del dueno.

