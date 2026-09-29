# Auditoría — control de geocerca para llegada de personal no accesible, PR #1240

Fecha: 2026-09-28
HEAD candidato: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Clasificación: funcionalidad incompleta en la candidata, no defecto de producción.

## P2 — El ajuste de verificación de ubicación tiene valor por defecto apagado y no tiene consumidor de configuración

La rama agrega `AjustesLlegadaPersonal` con `defaultAjustesLlegadaPersonal.llegadaConUbicacion = false` en `src/types/settings.ts`. También añade `saveAjustesLlegadaPersonal` en `src/app/actions/settings.ts`, que puede cambiar el valor, pero en esta PR no hay pantalla/acción de usuario que llame a ese setter: la lista de archivos modificados no incluye una pantalla de ajustes; la única referencia nueva a los ajustes en el código de la tanda es la lectura desde `registrarLlegadaPersonal`.

Resultado: en una instalación sin archivo de configuración sembrado manualmente, el check-in permite registrar la llegada sin validar distancia. El campo de GPS se solicita en el cliente, pero el servidor solo impone radio si el switch quedó prendido por otro medio.

Impacto: la función aparece disponible, pero el organizador no tiene un control visible en la app para activarla o configurar los 300 metros.

Recomendación: añadir un control de administrador que consuma el getter/setter con sesión, muestre claramente el estado, el radio y el comportamiento si el salón no tiene coordenadas; o presentar la verificación como opcional/no configurada y no afirmar que está activa. Probar guardar y recargar el switch, y el flujo con switch encendido/apagado.

## Verificación

Comprobados el default, el getter/setter añadido y el diff completo de archivos de la PR; no aparece consumidor de escritura en la tanda. No se verificó el entorno de producción, estado de los archivos de configuración reales ni E2E.
