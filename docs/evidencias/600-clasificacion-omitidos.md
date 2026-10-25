# Clasificacion exacta de37filas omitidas

Directorio QA f8f7; libro596 contiene resultados978. Las guardas pertinentes
no cambiaron entre fuentes. No son37funciones sin revisar ni37fallos.
Revision del director reemplaza el borrador del ayudante cuyo total no cuadraba.

| Grupo mutuamente excluyente | Cantidad | Razon comprobada / cobertura |
| --- | ---: | --- |
|Variante movil omitida con pareja escritorioPASS en596|31|Guardas explicitas de proyecto; mismo archivo/titulo, otroproyecto conPASS y recibo exacto en596. No implica que la variante movil se ejecutara.|
|Variante movil omitida con pareja escritorio noPASS|4|Home3560ms, capsula viva, viaje ventas ymarcaBogue. Guardas de proyecto; no dar por cubierto por estar omitido.609 retestea solo los tres viajes funcionales, no convierte medicionLOCAL en produccion.|
|Espejo: posteo/pendiente no publico, escritorio omitido|1|El caso requiere AK_USE_LOCAL_JSON_ONLY=true y esta bateria eraSDK. No ejecutado en ese modo por512.|
|Espejo: pareja movil del mismo caso|1|beforeEach limita proyecto aPC; no una segunda causa ni nueva funcionalidad.|
|TOTAL|37|36moviles y1PC; cuatro resultados negativos de pareja no son cuatro causas de app.|

Desglose porarchivo: carga4,catering1,estaciones3,espejo3,inventario2,
cocina2,ventas1,ajustesestaciones2,agenda1,enlaces5,iconos3,tanda12oct10.
Suma37. El espejo conVisioncaida SI tiene parejaPC PASS512; no agregar
otro omitido de PC a esa condicion: era un error del primer borrador.
Fuente de guardas: test.skip de los doce specs; espejo beforeEach102 ycaso106.

405/412 son antecedentes en otra fuente; no contar esos intentos como
ejecuciones nuevas de estas filas.520 guest/date cubre otros criterios y no
el espejoJSON por identidad de nombre. Ese unico viaje de negocio adicional
ya paso en614, modoJSONlocal: unposteo, pendiente oculto al publico yrecarga
sin duplicados. Su pareja movil permanece omitida por diseno del test, no
otra funcionalidad perdida. No forzar todaslasguardas para inflarPASS.
No se certifican impresion/camara/modelo/proveedor reales ni todosroles.
