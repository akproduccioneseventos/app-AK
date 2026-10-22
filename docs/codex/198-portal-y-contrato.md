- Area: `portal` · Commit: `fa3b492b8f1d6a77433a92f4d63b665cfea3747c`
- Hallazgos: orden210 A1-A4/A7-A8. En `/portal/c/[accessKey]`, el boton Informar
  pago no abre formulario; un error de lectura dice que falta el presupuesto;
  una sesion cliente oculta su presupuesto aun con token propio valido; dos avisos
  simultaneos por500 quedan duplicados; la subida fallida del comprobante se
  anuncia exitosa y no se recupera al repetir; el album oficial que devuelve el
  lector se elimina en el DTO y no puede abrirse. Archivos y reproducciones:
  `docs/ordenes/210-portal-cliente-pagos-entregas-cancelacion.md`.
- Alcance: pagina activa, ReactDOM, acciones/lectores reales con adaptadores
  controlados; SDK190 confirma dos casos con emulador. No es aceptacion completa
  del area ni de todos sus controles/roles. No marcar `limpia`.

- Area: `contrato` · Commit: `fa3b492b8f1d6a77433a92f4d63b665cfea3747c`
- Hallazgos: orden210 A5/A6, `cancelServicesOrParty` en
  `src/app/actions/fiesta/portal.actions.ts`. Segunda cancelacion distinta devuelve
  devolucion10 mientras el presupuesto conserva deuda200. Con descuento fijo,
  devuelve pendiente170 mientras guarda saldo70. Reproduccion y muestras:195.
- Alcance: cuerpos reales y resumen financiero, firma real del portal, guardado/
  disponibilidad/archivos controlados. No prueba total del area ni firma externa.

- Propuesta separada, no otro error financiero:210 F1, tarjeta Pagos cierra un
  acordeon abierto en vez de mostrarlo. No redisenar toda la pagina por esta friccion.
- Cierres por alcance:191personal3PASS,196proveedor13PASS,197vozMeta8PASS.
  No son aprobaciones exhaustivas de personal, asistente o redes.
