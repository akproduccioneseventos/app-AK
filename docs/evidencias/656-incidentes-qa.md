# Incidentes previos a los viajes de navegador

- El primer intento no encontro pngjs como paquete independiente. Se usa el PNG
  ya incluido en Playwright, sin instalar dependencias en produccion.
- El segundo no inicio viajes por RAM insuficiente. El finally tenia una guarda
  incompleta y borro JSON dentro de la copia QA propia antes de tomar snapshot.
- Se restauraron SOLO data/ y src/data/ de .qa-658-final-NJUXsp desde su HEAD.
  Git diff quedo vacio. No se tocaron datos de otros checkouts ni produccion.
- El helper corregido toma TODOS los bytes antes de editar, marca baselineCaptured
  y solo restaura/limpia si esa marca existe. Espera memoria de forma acotada.
- El recibo656 original permanece como fallo de QA, cero viajes ejecutados.663
  usa namespace nuevo; no convierte esos intentos en errores de la aplicacion.
