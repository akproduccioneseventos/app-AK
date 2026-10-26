# Validacion inicial interrumpida: no es un build aceptado

- Fuente a83acf76a627053da6e6ab913aba70e0f89535b2.
- Se detuvo exclusivamente el Next build propio PID16292, descendiente comprobado
  de8392/7548. No se detuvo ningun proceso ajeno.
- Motivo: revision del cambio propio encontro que `videoState=recording` tambien
  significa vista previa. La guardia nueva rechazaba iniciar la cuenta regresiva.
- Prueba `653-countdown-rojo`: un fallo de comportamiento y un control aprobado.
- Corregido usando el estado del MediaRecorder real, no el estado de la vista.
- `653-countdown-y-focales`:23criterios aprobados; una ruta adicional de test
  inexistente fue un error del comando QA, no otro defecto de la aplicacion.
- Los recibos originales y el codigo inicial se conservan. El build654 no termino
  ni certifica tipos, lint o funcionamiento. La fuente final se valida en657.
