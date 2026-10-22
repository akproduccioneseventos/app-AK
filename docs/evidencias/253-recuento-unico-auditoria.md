# Recuento unico - 22/10/2026

Main observado baa034fd25ab77b886e7096105a6114f0336bfdc. CandidatoGemini1353b91.
EntregaClaude1357:675a908a61997147a138fcca1bb7982c22acddf1 ABIERTA, no retesteada.
Indice consolidado de165/169/198/202/220 y cierres216-250. No nueva ejecucion.
AUDITADO = hay comprobaciones concretas del area, NO toda el area aceptada.
CORREGIDO/COMPROBADO = cierre por el alcance y fuente de su recibo; no prueba
automatica de todos los consumidores actuales. Manualdeldueno no es pendienteCodex.

## 1. Areas con auditoria documentada

| Area | Ejemplos comprobados | Recibos/indice |
| --- | --- | --- |
| Cobros/cuotas/facturas/recibos | Numeros, permisos, reintentos, aviso de pago y comprobante |124/128/130/133/154;222|
| Contrato/senia/firma | Fechas, cancelacion/reprogramacion, resumen, constancia y concurrencia |128/133/151/154;223/240|
| Comida/compras/insumos | Cocina, fecha civil, compras y controles focales |129/131/133/151|
| Ingreso/sesiones/permisos | Identidad, perfiles, acceso propio/ajeno y recortes |136/154/156/157/160/178|
| Fiesta/invitados/confirmaciones | Planificacion, agenda, mesas y viajes focales |126/131/132/133/135/151|
| Portal cliente | Pago, bancos, album, musica, portada, cambios y persistencia |188-195;221-229;240|
| Portal invitado | Identidad, enlaces y accesos focales |126/133/157|
| Web/blog/simuladores | Viaje comercial, PDF/CRM, galeria y controles de navegacion |133/150/154/155/161/172;213/215parciales|
| Redes/galeria | Sincronizador/duplicados por alcance y protocoloMeta |155/161/164/174/180;197/237|
| Entretenimiento | Estaciones/enlaces/tokens, 3D y filtros por alcance |125/133/135/157/174/180/182;233|
| Barra | Pedidos, DJ y controles focales |132/135|
| Asistente/WhatsApp | Guardados, resultados veraces, voz/Meta con dobles |118-121/135/157/162/171/174/180/182;237|
| Personal/recibos | Perfil propio, asignaciones, agenda y rol de atencion |129/131/133/154/160/178/179/181;191|
| Tareas automaticas | Puertas/respuestas, algunos motores, publicador y recordatorios |129/131/158-160/162/164;247-250|

## 2. Cierres concretos comprobados, no areas enteras

- Presupuestos manual/configurador: guardado tras respuesta perdida, fuentes118/119.
- Portal/aprobaciones: cinco causas211 cerradas por216; DOSintercalados213
  cerrados por242 sobre mainbaa (firma y compensacion que no borra invitados).
- Avisos de pago/reintentos/comprobante fallido:222SDK12PASS, A1/A2.
- Pedidos de menu/servicios simultaneos:221SDK9PASS, A9 por sus variantes.
- Cancelacion/reprogramacion/importes/PIN y reintentos:22315PASS, A5/A6.
- Acceso al presupuesto propio con sesion cliente y errores de lectura:224/227,
  A3/A4 por sus controles; el fallo de botonA7 NOqueda cerrado.
- Entrada de proveedor/error/reintento:19613PASS, cierre209 por alcance.
- Personal:1913PASS, sincronizador elige atencion y no cocina.
- Voz/Meta:197/237 protocolo compuesto; NOproveedor/modelo/audio real certificados.
- Cocina/fecha/cabecera y foco de visores tienen cierres historicos151/154/172;
  consultar recibo antes de reabrir. No declarar cada menu/pantalla completa.

## 3. Ya auditado pero falta corregir o comprobar entrega

| Pendiente concreto | Responsable/estado contrastado |
| --- | --- |
|4causas contrato: resumen, constancia alterable, firma concurrente, texto no visto|216/Claude; entrega1357 informa correccion; Codex NOla retesteo|
|Recordatorio sinclave puede llamar remitente|217R1/Claude; entrega1357 informa correccion; Codex NOla retesteo|
|Fecha reprogramada ignorada; falloenvio+respaldo consume dia; reservafallida marcaexito|217R2/R3/R4 Gemini; Claude los agrega a215bloque6; sin delta nuevo verificado|
|Boton Informar pago sin formulario y enlace de album perdido|212/Gemini;227/229 confirman en1353b91; no corregido en fuente contrastada|
|Filtros: consumidores carasvacias, reactivos sin efecto, ruleta reinicia|214/Gemini;233 confirma en1353b91; no corregido en fuente contrastada|
|Devolucion general1353: compilacion, pruebas y controles enumerados porClaude|215/Gemini; no aprobada. No contar38pruebas fallidas como38bugs|

## 4. Cobertura pendiente de demostrar (NO lista de nuevos defectos)

- Completar los recorridos en navegador que quedaron cancelados/no ejecutados,
  sobre una fuente actual congelada.215solo52casos:49PASS/1SKIP/2inconclusos.
- Completar la matriz accion/estado/rol:421rutas/7roles/6401AST inventarian,
  pero no prueban que cada control de las14areas se haya ejecutado.
- Cubrir estados UI/offline/transiciones no acreditados de invitado y estaciones;
  no convertir las areas enteras en "nunca auditadas" ni atribuirles fallos sin prueba.
- Motores automaticos restantes: respuestas de11rutas NOprueban ejecucion completa
  de11motores;247/249/250 agregan escenarios, no cierran todo el conjunto.
- Verificar resultados de conexiones externas con evidencia del proveedor;
  dobles locales NOcertifican sincronizacion/modelo/voz/entrega de mensajes reales.

No hay base para decir "solo faltan Xbotones" ni "audite toda la app".
Los renglones de3 son trabajo conocido de correccion/retest, NO partes sin auditar.
Los de4 son limites concretos de evidencia, no cuatro areas nuevas descubiertas.
Este indice sustituye listas generales contradictorias; actualizar solo con
nuevo recibo/fuente, sin sumar otra vez las reejecuciones ni borrar cierres validos.
