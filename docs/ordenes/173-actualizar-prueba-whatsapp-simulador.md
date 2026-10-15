# Orden 173: actualizar el recorrido E2E de contacto del simulador

**Estado:** comportamiento actual observado con datos sinteticos; prueba historica desactualizada, actualizacion pendiente.
**Prioridad:** P2, evita que una comprobacion de regresion falle por usar el paso equivocado.
**Base:** build aislado `a635b27071ecea22092eba2a285892c84c6f9d08`, arbol `src` equivalente a main `9aa64f991f5ddceefa8d278a3f298be861eb10bb`.

## Observacion

`tests/e2e/simulador-contacto-oficial.spec.ts` llena los datos, avanza y espera tres botones `Continuar` mas. La interfaz llega a `Paso 5 de 5`, muestra una oferta opcional que permite conservar la seleccion y luego presenta `Ver Resumen y Propuesta`; no existe el `Continuar` extra esperado. El test viejo se agota esperando ese control. La nueva sonda 133 resolvio la oferta, abrio el resumen y comprobo que los botones interceptados generan la URL oficial de AK.

Esto es un desajuste del test, no un defecto confirmado del simulador. No cambiar promociones, paquetes, precios ni persistencia para acomodar la prueba. Actualizar solo el E2E para seguir el control visible, contemplar la oferta opcional y comprobar el contacto oficial sobre datos aislados.

**NO CONTRASTADO CON LAS TANDAS PRIVADAS ACTIVAS DE CLAUDE/GEMINI**; comparar sus HEAD antes de editar y evitar duplicar una correccion si ya se hizo.

## Criterio de aceptacion

- El test antiguo deja de esperar el paso inexistente y maneja la opcion de conservar el paquete.
- Completa hasta el resumen, confirma que el prospecto y su origen/campana llegan al CRM y comprueba el numero oficial en la URL interceptada, sin abrir WhatsApp ni enviar mensajes.
- Solo genera datos sinteticos y se omite fuera del entorno aislado.

```comprobar
archivo: tests/e2e/simulador-contacto-oficial.spec.ts
usa: test('los botones de WhatsApp del simulador abren el numero oficial de AK') en tests/e2e/simulador-contacto-oficial.spec.ts
prueba: tests/e2e/133-simulador-whatsapp-despues-de-oferta.spec.ts
```
