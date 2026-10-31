# 760-763 - Retest de entregas actuales, 31/10/2026

## Veredicto

Fuente ejecutada: `e6db627f74301706d5e51fc7e1838808c1d767fe`, main remoto.
Sustituye los estados de759 para estas causas, NO borra sus recibos historicos.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.

Las tres causas732 y la contradiccion737 estan CORREGIDAS y cierran por el
alcance ejecutado. No se acepta por eso toda la contabilidad, todos los contratos,
la legalidad de documentos individuales ni la version efectivamente desplegada.

Queda PARCIAL la causa743/C6 de la orden252: ya no se devuelve la factura de otro
presupuesto; sin embargo, dos intentos distintos con el mismo sufijo de cinco
caracteres no completan ambas importaciones. La segunda falla al generar el mismo
numero de factura. No se observan fondos reales mezclados ni cobros externos.

## Contraste de fuentes y propuestas

- PR1376 CERRADA/FUSIONADA: cabeza `bd1b7734fbcf04fb4661534358a8581b7e8877fc`,
  integracion `e8d670bb16b7860f745d7e25ad4aedd43fc535b9`.
- PR1370 CERRADA/FUSIONADA: cabeza final `111f1cf361a7981f2a912b69b0a51c220c5c9cd7`.
  NO es la entrega90cc rechazada en746/759.
- PR1374 CERRADA/FUSIONADA: cabeza `99b9520033573ab24aed6975d49f6fb32924489f`.
- PR1372 propia tambien integrada. SoloPR1366 figura abierta al contraste.
- Las pruebas se corrieron contra main e6db, no sobre la rama documental98ef
  ni la vieja base0abe. No se cambio el codigo de la app en ninguna de ellas.

## Resultados por causa

| Causa | Resultado observado | Estado limitado |
| --- | --- | --- |
|732 R1 comision|Pago conciliado100000/fee3000; reporte, analiticas y comparativa97000. Control sin comision tambien pasa.|CERRADA|
|732 R2 periodos proveedor|Pago octubre/evento septiembre incluido en octubre; pago septiembre/evento octubre excluido de octubre; control mismo mes pasa.|CERRADA|
|732 R3 sena independiente|Accion registra recibo1000 sin presupuesto; libro y reporte1000. Espejo de presupuesto no duplica.|CERRADA|
|737 L1 FAQ|Total100000 ajustado115000 menos50000 pagados deja65000; FAQ ya explica este ejemplo y no promete ajuste solo sobre saldo.|CERRADA|
|741 C1 RPC fiesta|Las sondas originales de personal/operador no vacian cuotas ni obtienen secreto; controles de dueno guardan.|CERRADA POR ESOS CASOS|
|741 C2 login|Sondas originales loginversion1 y2 emiten sesion aceptada por requireSession.|CERRADA POR ESOS CASOS|
|741 C3 cookie revocada|Sonda original rechaza cambio de clave ajena, mas tres originales administrativosPASS.|CERRADA POR ESOS CASOS|
|741 C4 ultimo dueno|Cuatro originales de dos bajas entre modulos y candado compartidoPASS. Base/candado controlados; NO SDK ni dos servidores reales.|CERRADA POR ESE DOBLE|
|741 C5 fiesta ya en Sena|Sonda original guarda musica sin cambiar estado, conserva controlCotizado.|CERRADA POR ESOS CASOS|
|743 C6 carga historica|Helper rechaza factura ajena, control de sufijos diferentes pasa. Sufijo igual falla con numero repetido.|PARCIAL, ver abajo|

## Pendiente exacto para Claude/Gemini: MISMA743/C6, no nueva orden

`processHistoricRecord` en `src/app/actions/historicos.ts:164` genera
`HIST-${presupuestoId.slice(-5)}`. `saveInvoice` en
`src/app/actions/invoices.ts:236` correctamente rechaza el numero ya usado por
otro presupuesto. No quitar ese rechazo ni restaurar el fallback que mezclaba
origenes; falta una identidad/numeracion sin colision entre cargas distintas,
estable para reintentos del mismo intento. Claude valida la politica del numero.

Sonda EXACTA conservada en `743-historicos.test.ts` y ejecutada como
`qa-761-historicos.test.ts`, sin cambiar aserciones:

1. A: intento `carga-A-abcde`, cliente ficticioA739, monto1000: success.
2. B: intento `carga-B-abcde`, cliente ficticioB739, monto2000: successfalse,
   error `Ya existe otra factura con el numero HIST-abcde.`
3. Quedan dos presupuestos y solo una factura, la deA1000. No se completa
   la segunda fiesta. La sonda esperaba dos exitos y dos facturas distintas.
4. Control A11111/B22222: ambos exitos y dos facturas. Consulta con origen ajeno:
   lista vacia. Esto reconoce el arreglo parcial en vez de repetir la acusacion
   anterior de que hoy ambas fiestas comparten el comprobante.

Resultado crudo: `761-observaciones-historia.json`, `761-jest.json` y log.
La orden252 queda actualizada; no duplicar247/249/251 ni reimplementar los cierres.
Regresion futura: mismo intento/retry mantiene identidad; dos cargas distintas
con igual sufijo completan ambas; no aceptar comprobante ajeno ni borrar cobros.
Estos criterios de la correccion residual NO estan aprobados mientras falle743.

## Decoracion: lo afirmado y lo realmente probado

Main incluye autopublicacion con >=2elementos, etiqueta `aprobadaSola`, recortes
transparentes, biblioteca, limites y `Sacar`. Sus siete pruebas oficiales pasan.
Tambien pasan catalogo10, fotos5, UIReact5 y gasto5. No es un recorrido nativo ni
un resultado del modelo externo: analizador/generador/almacenamiento son dobles.

Cuatro criterios NUEVOS763 pasan con servicio real y fronteras controladas:
ocho desconocidos solo piden5recortes; contador diario19 deja1y termina20;
rechazo del generador cuenta intento; PNG1024px se guarda como512px.
El dia usaUTC en el contador actual; no se cambia esa politica en esta auditoria.
No son pruebas de concurrenciaFirestore ni de recorte preciso de una foto real.

La afirmacion de guardar hasta4MB es incompleta para main actual: acepta entrada
hasta4MiB, pero Claude ya agrego reduccion512px/limite600KiB antes de guardar.
Tambien cuenta el intento de generacion en finally, incluso si falla. Ambos
ajustes son posteriores aPR1374; no reemitirlos como errores pendientes del PR.
Luna hizo contraste estatico; principal verifico estas diferencias y ejecuto763.
Su limite reportado de acceso al grafo no invalida la consultaGraphify del director.

## Conteo sin esconder fallos ni sumar version antigua

| Corrida | Suites ejecutadas | PASS | FAIL | No seleccionados |
| --- | --- | --- | --- | --- |
|760 sondas732/737 y dos regresiones entregadas|4|20|0|0|
|761 contratos/seguridad/historicos/decoracion|25|129|1|0|
|762 login/cookie con sonda original|1|3|0|2|
|763 SOLO nuevos limites decoracion|1|4|0|7|

Son156ejecucionesPASS y1FAIL, no156funcionalidades distintas. Los9no seleccionados
pertenecen a filtros explicitos: concurrencia de sesion ya tiene prueba propia
en761; los7decoracion ya se ejecutaron en761. No presentarlos como toda la suite
aprobada sin omisiones. Las13suites contractuales de736 se ejecutaron de nuevo
dentro de761 y dieron71PASS; no reutilizar el70PASS historico como si se hubiese
ejecutado sobree6db.

## Limites e higiene

QA es worktree separado y congelado en e6db. Sondas copiadas byte por byte y
hashes en recibos. Las4nuevas763 se concatenan a copia del fixture oficial;
solo se selecciona su describe. No se modifica ni debilita el test original.
Se filtra el entorno heredado, sin.env real, credenciales o cuentas. No se invocan
servicios/modelos/pagos/mensajes reales. No hay SDK, build nuevo ni navegador nativo.
Dependencias reutilizadas de candidate103: no npmci limpio ni cobertura de todas
las transitivas. `git diff` de app/config vacio tras cada corrida; temporales QA
propios se limpian al finalizar. No se fusiona ni despliega.

Los comandos Wi-Fi/IP del texto pegado no son arreglos de la app ni autorizan
modificar la red. GitHub respondio y fetch/push se verifican en esta entrega.
No se reprodujo ni se da por arreglado el error interno del clienteGoogle.
No se homologa la afirmacion global de5450pruebas/typecheck/build con estas focales.
No hay certificado de0errores/todaapp/Hosting/Meta/modeloreal/legalidad.
