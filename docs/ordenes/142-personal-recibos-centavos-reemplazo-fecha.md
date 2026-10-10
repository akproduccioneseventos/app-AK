# Orden142 - Recibos de personal: centavos, reemplazo y fecha

NO CONTRASTADO CON LA TANDA DE PROGRAMACION LOCAL NO SUBIDA.

Responsable: Claude (dinero/personal/recibos); Claude compila. Codex revisa.
10/10/2026. Fuente ejecutada2aac14e290b20945bd984a0c5e2ffdbe50eb853c.
Main remoto0af74652ebdf4c813b9eb443c358d51bc24542d7; estos consumidores no
cambian en ese delta. Unica PR abierta1282, documental: rama
`codex/auditoria-88-cierre-20261009`, HEAD previo715368d9.
Antes de programar: contrastar contra el HEAD real de Claude, cerrar lo existente
sin reimplementarlo. Esta orden no inicia otra IA ni acredita despliegue.

## Tres fallos P2 reproducidos, no redisenar ni cambiar reglas del negocio

1. PER91-CENTAVOS: pago1000, porcentajes configurados8.33/8.33.
   Papel/pantalla:857.19+71.40+71.40=999.99, pero total1000.00.
   `calculateSalaryBreakdown`, en
   `src/app/(app)/fiestas/nueva/personal/recibos/page.tsx:79`, devuelve componentes
   flotantes que se redondean separados. Consumidores reales252 y516.
   Hacer consistente el desglose a centavos con el total, distribuyendo residuo
   mediante patron monetario existente. No cambiar sueldo, porcentajes ni aportes.
   No hay evidencia de un pago real menor: el defecto es el desglose del papel.

2. PER91-REEMPLAZO: recibo firmado con PDF existente; boton visible Reemplazar,
   elegir PDFnuevo. Aviso: Primero marca el recibo como "pagado".
   SDK conserva PDFviejo, monto/fecha correctos. No se perdio archivo.
   `uploadAndSaveSignedReceipt` en
   `src/app/(app)/empleados/[id]/historial/page.tsx:212`; guardia218 acepta solo
   pagado, input510 consume funcion; boton523 promete Reemplazar.
   Permitir reemplazo documental autorizado para firmado_subido sin obligar a
   deshacer el pago. Conservar monto, fecha, pertenencia y bloqueos del servidor
   `saveReciboFirmado` en `src/app/actions/recibos-personal.ts`.
   No eliminar PDFviejo antes de confirmar reemplazo persistido. Probar fallo de
   subida/guardado y dos operadores; no aflojar permisos ni guardias monetarias.

3. PER91-FECHA: fixture fechaEvento2026-10-10; recibo y papel dicen9 de octubre.
   `formatDate` en misma pagina de personal51 usa new Date de YYYY-MM-DD;
   consumidores281/497/539. Ya existe `diaCalendario` en
   `src/lib/reportes/rango-de-dias.ts:29`, usado por
   `diaDelEventoParaElPapel` en presupuesto/recibo-contrato638. Reutilizar politica
   calendario del proyecto, no otra implementacion UTC ni mover datos guardados.
   Reproducir en America/Montevideo con fecha sola, ISO y fecha invalida.
   PDF/captura conservan9; raw de la ultima sonda de fecha NO se pudo conservar
   porque TEMP desaparecio. Reejecutar esta sonda antes de cerrar el hallazgo.

## Evidencia y aceptacion

Leer `docs/evidencias/91-personal-recibos-final.md`; raws y archivos91 adjuntos.
Dos aprobaciones acotadas: subida de firmado, bytes en Storage, enlace200/PDF,
recarga/otro navegador y aislamiento por empleado/fiesta, PC y movil.
No repetir esas aprobaciones ni las de cobros sin delta causal.

Prueba existente entregada: `docs/evidencias/91-personal-recibo-final.spec.ts`.
Raws PC:1pasa+1falla centavos; reemplazo1falla; movil1pasa. Fecha final observada
en sesion, con descarte explicito de dos fallos de selector de QA.
Pruebas permanentes de centavos/reemplazo/fecha, fallos y concurrencia: PENDIENTES
de incorporacion/ejecucion por Claude. Luego Codex retesta solo consumidores
afectados sobre SHA nuevo. Claude registra SHA/entorno/build/resultado.
No marcar area completa ni0errores por helper verde o archivo existente.
No fusionar la PR documental sola; incluir evidencia en entrega productiva.

```comprobar
archivo: src/app/(app)/fiestas/nueva/personal/recibos/page.tsx
usa: calculateSalaryBreakdown en src/app/(app)/fiestas/nueva/personal/recibos/page.tsx
archivo: src/app/(app)/empleados/[id]/historial/page.tsx
usa: uploadAndSaveSignedReceipt en src/app/(app)/empleados/[id]/historial/page.tsx
prueba: docs/evidencias/91-personal-recibo-final.spec.ts
```
