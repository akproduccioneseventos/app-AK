# Codex116 - Integracion sobre main actualizado

Base4c5ef2f9ada29eb852b0ee5c5dd1e0897a651ede.
Fuente congelada1656ac2ed15f30f56c5a2cb1ddba119f755728e1.
Rama codex/116-respaldo-logo-main-20261013. No fusionar automaticamente.
PASS_CURRENT_LOT_ONLY; resultado final en116-aceptacion.json.
729suites4545tests, build/tipos/lint/acentos2840 PASS,0fallos/omitidos.

## Por que no se subio la rama anterior

Claude integro PR1288 como791f0a7a durante la corrida115. Main incorporo sus
permisos, fechas Uruguay, centavos de costos y varias correcciones de paneles.
La evidencia115 (707suites4285tests/34criterios, fuente81be9ac0) se conserva
como historia, pero NO acredita este main nuevo. Esta rama nace desde4c y toma
solo lo aun ausente. No modifica sus pantallas, contador, Google ni politica3D.
Privado Claude NO CONTRASTADO; rama publica si comparada antes de programar.

## Delta real

- Libro de ajustes de costos registrado en backup y mapa Firestore.
- IDs reales de recibos legacy y _turno conservados al leer/exportar/restaurar.
- Restaurar insumos de una copia antigua sin libro descarta recibos posteriores;
  restaurar otro modulo no lo borra. No es snapshot global atomico.
- Ajuste terminado y reintento terminado solicitan backup interno con token privado.
- Lectura SDK rechazada y copia alternativa conservan huboFalla; el ZIP no
  certifica un respaldo incompleto. El consumidor normal puede conservar datos.
- El ultimo proveedor no queda bloqueado por undefined de un insumo no asociado.
  Se preservan sus permisos, IDs y nombres verdaderamente asociados.
- Plantilla custom se elimina por ID transaccional, no reescribiendo una lista
  completa. Se conserva la politica de main sobre bases y ediciones guardadas.
- Logo original del dueno copiado byte exacto desde E:/Logo (Logotipo).png.
  SHA2567f6249ff1cc7fa347dfd737f975bfd36e58ac4c2f2f57c7e472144e252220166.
  No redibujo ni transformacion de la marca; reemplaza PNG truncado de1253.
- Minimo Node20.9 coherente con Sharp0.35.5 ya fijado por Claude en main.
  No se cambia otra version ni metadata de paquetes de Linux.
- Flujo de caja: fechas de evento/presupuesto de hoy no desaparecen por leerse
  a medianocheUTC. Se usan diaCalendario, parseUruguayDate y hoyEnUruguay.
  Convenio legacy UTC00 conservado; instantes con zona se ubican en Uruguay.
  No se modifica permiso, formula de ganancia ni politica de facturas vencidas.

## Comprobaciones

135focalizadas PASS antes de congelar, incluyendo centavos del helper real y
PDF real con PNG incorporado (transporte de imagen simulado, generador sin mock).
La primera suite728 detecto2fallos: un mock viejo de borrado y un error REAL de
calendario en el flujo de caja ya presente en main4c. Se conservan los resultados.
Antes del arreglo, seis regresiones de calendario dieron3fallos/3PASS; despues,
las seis pasan en UTC y America/Montevideo. Los62controles relacionados pasan.
Los16criterios nativos y la suite amplia final de1656ac2e PASS.
La sonda116 exige16criterios: cuatro formatos Sharp y seis recorridos por
viewport (logo, proveedor, plantilla custom/base, costo+ZIP+ACK perdido y recibo
legacy pendiente+turno, ademas flujo de caja con SDK real y sus tarjetas visibles).
El caso de caja verifica1500por cobrar/10000gastos/-8500saldo en PC/Pixel7.
La preparacion inicial sembro la factura en invoices en vez de facturas:
14PASS/2NOT_ACCEPTED, conservados como fallo de harness, no de la app.
Se corrigio el fixture, no se bajaron expectativas.16PASS en repeticion completa.
No representa recorridos de las otras pantallas de Claude.
Su reduccion respecto a115 es por el delta de esta PR, no por ignorar un fallo.

## Limites

QA Windows/demo sin credenciales, datos/cuentas reales, pagos, correos ni hardware.
No Hosting/Linux, OAuth,19presupuestos originales, atomicidad global o toda la app.
Los avisos de seguridad restantes y Storage/export155 no quedan resueltos aqui.
152, cobertura109 y decisiones fotos/trivia/votos de Claude siguen separadas.
La politica actual excluye presupuestos/fiestas pasados de la proyeccion y suma
facturas vencidas a cobrar al mes actual. Se preservo: cambiarla requiere decidir
con el dueno, especialmente antes de interpretar los19presupuestos manuales.
