# Orden184 - Fecha civil de la hoja de cocina en Uruguay

**Estado actual:** CERRADA la fecha civil por151,2PASS UTC/Uruguay sobre
2e5363f259461a31bf6b31807872c227855415de, pantalla y medio print. Entrada
2027-08-08 conserva8/8; codigo relacionado sin cambio hasta main894d.
Ver154-cierre.md y151-date-source.spec.ts. El fallo143 siguiente es historico.

ID estable: AK-CODEX-143-COCINA-FECHA-CIVIL.
Responsable: Claude (comida/fechas operativas). Codex solo audita/documenta.
P2. NUEVO defecto reproducido, NO correccion realizada. No afecta las porciones.

Fuente ejecutada y compilada:17d26a631f500a263c48c4973d9c6f57d56ba421,
PR1327, rama feat/ordenes-178-179-impresos-ia38. Main7230 conserva la misma
conversion; se contrasto el candidato entregado, no solo la web vieja.
PR1327 avanzo luego a a98a4b25009f9994d7a9cbd3025972a4142634c2: SOLO cambio
cuatro archivos E2E, sin cambio de runtime/config/dependencias; no otra app.
NO CONTRASTADO CON LA TANDA PRIVADA ACTUAL DE CLAUDE: comprobar su HEAD antes
de programar; si ya esta resuelto alli, validar y no duplicarlo.

## Resultado observable

Fiesta ficticia con configuracion.fechaEvento='2027-08-08'. La pagina REAL
/fiestas/nueva/catering/hoja-de-cocina?fiestaId=... muestra:
-Navegador UTC:8/8/2027, correcto.
-Navegador America/Montevideo:7/8/2027, un dia antes; tambien en modo imprimir.

Consumidor verificado: src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx,
HojaDeCocinaContenido, expresion new Date(hoja.fecha).toLocaleDateString('es-UY').
La fecha de entrada sale sin alterar de fiesta.configuracion.fechaEvento en
src/lib/catering/hoja-de-cocina.ts, armarHojaDeCocina. ISO solo fecha se
interpreta como instante UTC y se presenta en el dia anterior de Uruguay.

Corregir SOLO la representacion de la fecha civil usando el criterio local
existente en la app. No cambiar fecha almacenada, zona del servidor, permisos,
cantidades ni formulas. Mantener el estado sin fecha y entradas soportadas.
No tocar roundMoney ni migrar datos para resolver una fecha de presentacion.

## Prueba y limites

143-civil:1PASS UTC/1FAIL Uruguay,0omitidos/reintentos. Datos ficticios,
servicios externos bloqueados, mismo build142; capturas y lecturas antes de
asercion conservadas. El primer intento exigia ceros a la izquierda y fallo
tambien enUTC por ese error de QA; original143 preservado. El control corregido
compara dia/mes/ano numericos, NO acepta el dia anterior para ponerlo en verde.

Ver docs/evidencias/143-consolidado.json y143-civil-*.jpeg. No prueba otra
pantalla ni escritura de fechas.178 cabecera impresa ya paso dos viajes en142;
este defecto es distinto y la correccion de178 no debe deshacerse.

Aceptar despues de ejecutar la regresion en el SHA corregido: misma fecha8/8
enUTC yMontevideo, pantalla/impresion y recarga; agregar limites de mes/ano y
fecha ausente sin modificar los datos. El E2E existe y fue ejecutado; aun falla
enUruguay. No dar por hecho el arreglo porque exista el archivo de prueba.

```comprobar
archivo: src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx
usa: armarHojaDeCocina en src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx
no-usa: new Date(hoja.fecha).toLocaleDateString en src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx
prueba: tests/e2e/143-cocina-fecha-local.spec.ts
```
