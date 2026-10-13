## Descripcion del Cambio

Nueva propuesta desde main4c5ef2f9, porque PR1288 fue integrada por Claude mientras
se validaba115. No copiar aquella rama entera ni fusionar esta automaticamente.

- Logo original entregado por el dueno, copiado byte exacto, visible PC/celular y
  decodificado por el generador real del PDF. Reemplaza un PNG truncado.
- Libro de ajustes de costos incluido en respaldos; IDs legacy recuperados.
  Restauracion de insumos antiguos descarta recibos posteriores, sin alterar otros
  modulos. Ajustes completados solicitan backup interno.
- ZIP incompleto o lectura rechazada no se anuncian como respaldo actual.
- Proveedor no queda bloqueado por comparar dos undefined; permisos intactos.
- Borrado de plantilla personalizado por ID, sin perder otras plantillas.
  Politica de bases/ediciones de main conservada.
- Flujo de caja no omite fecha de hoy ni corre medianocheUTC al mes anterior;
  reutiliza convenciones de Uruguay. No cambia formula de ganancia ni permisos.
- Node minimo20.9 coherente con Sharp0.35.5 ya actualizado en main.

Se mantienen las pantallas, Google, fechas y permisos de Claude, el redondeo a
centavos y la implementacion3D publicada. No se redeclaran arreglos ya existentes.
NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.

## Tipo de Cambio
- [x] Correccion de errores
- [ ] Nueva funcionalidad comercial
- [x] Optimizacion de persistencia/borrado individual
- [x] Documentacion/configuracion y evidencia

## Lista de Verificacion
- [x] Fuente congelada1656ac2ed15f30f56c5a2cb1ddba119f755728e1.
- [x] TypeScript y lint exit0; advertencias previas conservadas.
- [x] Acentos exit0,2840archivos.
- [x] Build final exit0, lint/tipos/PWA activos, sin credenciales privadas.
- [x]729suites4545Jest PASS,0fallos/omitidos; manifiesto de la misma fuente.
- [x]16criterios nativos Next compilado+SDK Firestore demo, PC/Pixel7.
- [x]6casos de calendario en UTC y America/Montevideo; ambosPASS.
- [x] Grafo local actualizado165:14452nodos/43630relaciones/923comunidades,0LLM.
- [x] SDK demo0 tras parar app; servicios propios apagados, datos ajenos intactos.

Los resultados anteriores se conservan: suite50bd2fallos, seis casos antes3fallos,
fixture de facturas inicial en coleccion incorrecta14PASS/2fallos y luego16PASS.
Se corrigen causas; no se aflojan expectativas ni se omiten pruebas.
115:707suites4285tests/34criterios corresponden a81be9ac0, NO a esta fuente.

## Impacto en Firebase
- [ ] Cambia reglas/permisos
- [ ] Nuevas Cloud Functions
- [x] Frontend/Hosting y acciones de servidor existentes
- [ ] Requiere credenciales nuevas

No se certifican Hosting/Linux, OAuth, pagos/correos reales,19documentos originales,
equipos fisicos, atomicidad global del snapshot ni toda la aplicacion.
152/otras155/cobertura109 y observaciones UX permanecen separadas.
GitHub Actions por facturacion no sustituyen los resultados locales.
Registro compartido: docs/YA-RESUELTO.md y ESTADO-ACTUAL.md.

## Auditoria117 historica y cierre118 de la correccion

ACTUALIZACION118: defecto161 CORREGIDO y contrastado en662f123d.
731suites4564tests0fallos/omitidos PASS; build con tipos/lint y acentos PASS.
6flujos nativos PC/Pixel7 PASS: ACK2->2, recarga, timelineCRM sin repetir,
cotizacion nueva distinta mismo telefono y documento real visible tras recarga.
118-aceptacion.json; no se certifica todo el producto ni los consumidores legacy
que no envian operationId.152 sigue como friccion, no se fusiono ni publico.
Texto117 de abajo conservado como HISTORIA anterior a la correccion.

Sobre la misma fuente1656: reintento del configurador tras perder la respuesta
de un guardado ya realizado crea otro presupuesto. Repro PC y Pixel7: SDK2->3,
esperado2. Orden161, evidencia117-contraste.json. No se oculta por4545Jest PASS.
Control antes de llegar al servidor SI guarda uno y abre destino real.
Friccion152 desktop sigue: indicador cubre parte de Guardar inferior; teclado y
boton superior disponibles. Los51casos de permisos firmador/documentos/exports
de Claude ya pasan en116; no volver a programarlos. Proveedor real no certificado.
Esta ampliacion toca solo QA/registro, no app ni importes, ni ejecuta otro build.
No fusionada; dueno decide. Orden escrita no inicia a otra IA ni acredita arreglo.
