# Preflight692 inicial - 26/10/2026

La primera invocacion rechazo la comprobacion antes de modificar la junction
de node_modules o iniciar TypeScript: `Need 2GiB free for isolated TypeScript`.
Exit1 del supervisor por memoria disponible menor al umbral; NO fallo de app,
instalacion ni tipos. No hubo tsc, servidor, build o cambio de datos.
El supervisor posterior espera una sola ventana acotada de cinco minutos,
conserva el mismo umbral y registra el resultado, sin parar procesos ajenos.
