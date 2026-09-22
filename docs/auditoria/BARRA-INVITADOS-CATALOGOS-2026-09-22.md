# Barra, invitados y catalogos: auditoria de fallos

## Evidencia y alcance

Main: 54cd6230d8fd10d91b031c5ae5320125e8d1bd41. Reutiliza antecedentes de docs/YA-RESUELTO.md. No reejecuta calendario ni otros informes anteriores. Copia aislada, sin datos de produccion, cuentas reales, build ni cambios en app. Sonda AST: 20 casos, 9 PASS y 11 FAIL, agrupados en ocho hallazgos. Un exit0 indica que la sonda pudo ejecutarse, no aprobacion del producto.

PR1207 29943cdd, PR1206 129c1988, PR1202 6622427c y PR1197 f0ac2027 contrastadas con main: sus aportes no modifican barra-tecnologica.actions.ts, invitados.actions.ts, fiesta.actions.ts, catalogo-fotos.ts, salones.ts, firebase-sync.ts o data-service.ts. Revalidar HEAD antes de implementar. No prueba despliegue ni comportamiento integrado de esas PR.

## INV-01 / P1: respuesta publica incluye datos de otros invitados

src/app/actions/fiesta/invitados.actions.ts: updateFiestaData devuelve updatedFiesta y submitPublicRsvp devuelve {...result, invitado}. Aunque su tipo declarado solo mencione invitado, en ejecucion tambien devuelve updatedFiesta. getFiestaById en fiesta.actions.ts quita accessKey del cliente sin sesion, pero no reduce la fiesta a datos publicos.

Sonda usa getFiestaById, updateFiestaData y submitPublicRsvp reales extraidos por AST. Datos y escritura ficticios, verifySession falso. Un alta nueva devuelve un marcador interno de prueba y el registro de otro invitado. La clave del portal cliente NO vuelve, control de redaccion observado. No se consultaron datos reales.

Consumidor real: src/app/invitacion/[fiestaId]/rsvp/page.tsx, submitPublicRsvp y result.invitado. Tambien invitacion-publica-client.tsx. Que la pantalla no dibuje updatedFiesta no evita que la respuesta viaje al navegador.

Claude: contrato publico minimo con campos permitidos, sin propagar resultado interno. Revisar tambien la funcion getFiestaById exportada en use server como superficie publica; no afirmar que eliminar el spread cierra por si solo todas las lecturas. Prueba pendiente integrada: respuesta de invitado anonimo no contiene otros invitados, sus contactos/tokens ni campos privados de empresa/fiesta.

## INV-02 / P1: reconocer un nombre entrega su credencial

submitPublicRsvp busca por nombre normalizado, conserva guestAccessToken y devuelve savedInvitado. La llamada no exige credencial previa del invitado encontrado. Sonda con solo el nombre ficticio devuelve un token aceptado por hasPublicGuestAccess real. La pantalla RSVP usa ese token para el enlace de portal personal y QR.

El historico aprueba poder cambiar la respuesta y evitar duplicados por nombre. NO se pide quitar esa capacidad ni duplicar invitados. Nombre no debe actuar como prueba de identidad para entregar una credencial. Claude debe proponer verificacion con enlace personal o canal validado; el dueno decide cualquier cambio del recorrido. Prueba pendiente: nombre coincidente sin acreditacion no devuelve token ajeno; invitado legitimo puede cambiar RSVP; nuevo invitado puede completar el recorrido autorizado.

## BAR-01 / P1: pedido no guardado consume stock y puede anunciar exito

src/app/actions/fiesta/barra-tecnologica.actions.ts: createBarDrinkOrder descuenta antes de persistir. saveFallbackOrders devuelve saveFiesta, pero el llamador no comprueba success. Si escritura principal falla y saveFiesta retorna false, el resultado final es success:true con cero pedidos y stock 10->9. Lo mismo sin db en la rama fallback. Si el fallback arroja excepcion, responde false, pero el stock permanece descontado.

Sonda ejecuta createBarDrinkOrder y saveFallbackOrders reales; descuento y persistencia sustituidos por contadores/almacen de prueba. No prueba una transaccion real de Firestore. Consumidores: src/app/evento/barra/[fiestaId]/page.tsx y MiniQuiosco.tsx bajo invitacion/[fiestaId]/invitado/[guestId], que muestra Pedido registrado si success.

Claude: pedido y reserva de stock consistentes/idempotentes, recuperacion verificable cuando una escritura falla, comprobar success del fallback. No contar reintento como nuevo consumo. Gemini: no anunciar registrado sin confirmacion. Controles PASS: alta normal guarda un pedido/descuenta una vez; barra pausada rechaza sin tocar stock.

## BAR-02 / P2: primer fallo bloquea operaciones posteriores del fallback

descontarStock encadena stockPromiseChain.then y asigna la promesa rechazada a la cadena. No recupera esa cadena antes del siguiente pedido. Sonda: primer writeData falla transitoriamente; segundo intento tambien rechaza sin volver a leer/escribir. Total una lectura y una escritura para dos intentos.

Solo rama sin db; no se generaliza a la transaccion Firestore. Claude: mantener serializacion y recuperar cola tras error, sin ocultar fallo del pedido original. Probar descuento y reposicion posteriores, no reiniciar servidor como solucion.

## BAR-03 / P2: cambiar trago puede dejar al invitado sin ninguno

changeBarDrinkOrder cancela pedido anterior y despues llama createBarDrinkOrder. Si el nuevo trago no esta disponible o falla su alta, devuelve error pero el anterior ya esta cancelado. Sonda: viejo nuevo->cancelado, cero pedidos nuevos, respuesta false. Controles PASS: mismo trago no cancela; cambio exitoso crea reemplazo.

Claude: reemplazo atomico o compensacion/idempotencia adecuada; no prometer conservar pedido si no se comprueba. Gemini: reflejar resultado real y permitir recuperacion. Conservar regla del dueno: cambio permitido antes de preparacion. Comprobar carrera con barman empezando a preparar.

## CAT-01 / P1: altas simultaneas de fotos pierden una

src/app/actions/catalogo-fotos.ts addCatalogoFoto: readData, push, writeData del array completo. Sonda con dos lecturas del mismo estado y dos altas devuelve sin error, conserva una foto. Secuencial conserva dos.

No se presenta mock como Firestore real: contrato contrastado en data-service.ts writeData y firebase-sync.ts syncToFirestore. catalogo-fotos.json mapea catalogo_fotos; la transaccion escribe el array recibido y elimina documentos que no aparecen en el, no recalcula el alta sobre estado actual. La transaccion no protege una lista construida antes de entrar a ella.

Consumidor: src/app/(app)/empresa/galeria/page.tsx guardado/subida. Claude integridad, Gemini interfaz: mutacion por documento o transaccion sobre snapshot vigente. Dos dispositivos/subidas concurrentes deben conservar ambas fotos sin mentir sobre el guardado.

## CAT-02 / P1: editar dos salones puede revertir uno

src/app/actions/salones.ts saveSalon lee salones completos, modifica uno, escribe todos. Dos ediciones simultaneas en salones DIFERENTES devuelven success:true dos veces; capacidades esperadas11/21 quedan10/21. Secuencial conserva11/21. writeData/syncToFirestore tiene el mismo contrato de reemplazo descrito arriba, con merge de cada documento pero campos obsoletos del otro salon.

Consumidores: src/app/(app)/empresa/salones/page.tsx y experiencia-visual/page.tsx. Claude: actualizar solo el registro/campos correspondientes con control de concurrencia, sin borrar cambios ajenos. Gemini: informar conflictos reales y conservar borrador. No modificar pagos ni contratos como efecto secundario.

## CAT-03 / P2: borrar el ultimo elemento no lo borra en Firestore

deleteCatalogoFoto y deleteSalon escriben [] al quitar el ultimo. syncToFirestore ignora un array vacio para estas colecciones, porque no estan en ALLOW_EMPTY_ARRAY_RESET_FILES. Accion termina sin error pero registro sigue existiendo.

Sonda ejecuta accion y syncToFirestore reales con db de memoria que implementa get/set/delete transaccional. Borrar uno de dos deja uno (PASS); borrar uno de uno deja uno (FAIL), tanto foto como salon. No emulador Firestore ni llamada externa. La cache/local puede diferir hasta recargar: no se prueba interfaz en esta sonda.

Claude: borrado individual explicito y validaciones de referencia apropiadas. NO desactivar proteccion global de colecciones vacias para resolver un boton. Gemini: reflejar fallo real. Probar ausencia tras lectura nueva, no solo quitar tarjeta optimistamente.

## Controles y limites

Un agente economico reviso catalogos/salones/activos, propuso dos candidatos y se cerro. Codex reprodujo sus dos candidatos y reviso contrato de persistencia, ademas del caso de ultimo borrado. Sobre activos fijos el agente no encontro un fallo concreto: lectura limitada, NO aprobacion de todo ese modulo.

Evidencia: docs/evidencias/barra-invitados-catalogos-sonda.cjs y barra-invitados-catalogos-resultados-2026-09-22.json. Ejecutar con Node y TypeScript existentes: AUDIT_TYPESCRIPT admite ruta de TypeScript; node SCRIPT RUTA_REPO. Extrae simbolos reales, no importa servidores ni credenciales. Resultados vigentes solo para SHA indicado.

Esta entrega cierra la tanda de diagnostico de estas areas, NO toda la auditoria profunda. No hubo pruebas con roles autenticados, dispositivos, impresoras/camara360, cuentas Meta/Google/MercadoPago o app compilada. Los informes anteriores mantienen su SHA y limites. No se ejecutaron sondas antiguas sin cambios ni se registro falso cero errores.

