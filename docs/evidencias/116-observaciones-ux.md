# Observaciones de uso que no se presentan como arreglos terminados

Fuente1656ac2e, captura116-flujo-caja-mobile.png, datos completamente ficticios.

- La barra flotante izquierda y el asistente invaden parte de Balance Neto.
  Vinculado al problema152 ya registrado, no crear una orden duplicada ni afirmar
  que esta captura comprobo ausencia de solapamientos. No se altera la barra aqui.
- El bloque financiero llama Mes mas rentable a un mes futuro sin actividad.
  Propuesta: distinguir mejor saldo proyectado de rentabilidad comprobada y
  meses sin operaciones; no cambiar la definicion del indicador sin aprobarla.
- Eficiencia operativa muestra saldo/ingresos en porcentaje (-566.7 en este caso).
  Propuesta: explicar o renombrar el indicador; no afirmar que esa etiqueta
  equivalga a margen contable. La formula de la pantalla no se cambia en esta PR.
- La proyeccion omite presupuestos pasados sin factura; preservado de main.
  Decidir si los saldos firmes atrasados deben incluirse antes de cambiar politica.
  No cargar deudas nuevas desde los19documentos manuales sin contrastar originales.

No son pruebas de dispositivos, integraciones externas ni toda la aplicacion.
Las propuestas no se cuentan como errores resueltos ni bloquean aceptar el delta.
