# Prospecto: oferta opcional y contacto por WhatsApp

- Build sintetico: `a635b27071ecea22092eba2a285892c84c6f9d08`; codigo de app equivalente al `src` de `main` `9aa64f991f5ddceefa8d278a3f298be861eb10bb`.
- Recorrido: iniciar simulador con UTM de Facebook, cargar datos ficticios, conservar el paquete ante la oferta de extras, abrir `Ver Resumen y Propuesta`, registrar el presupuesto/lead y activar los botones de contacto. `window.open` se intercepta: no se abre WhatsApp ni se envia mensaje.
- Resultado de `tests/e2e/133-simulador-whatsapp-despues-de-oferta.spec.ts`: escritorio PASS; movil omitido expresamente por el test (no duplica el flujo que guarda presupuesto). La URL recibida coincide con `https://wa.me/${AK_WHATSAPP_NUMBER}?text=`.
- Corrida sobre build `a635b27071ecea22092eba2a285892c84c6f9d08`; SHA-256 del test ejecutado `8920a8271d9695bd06222e7e5c225475238f3e3185451374b74be1e664f24cc1`.
- En el CRM, el prospecto aparece por nombre y con las etiquetas `Simulador` y `Facebook`. En los dos archivos sinteticos de CRM queda `budgetSource=simulator_common`, `acquisition.source=facebook`, la campana UTM y un `presupuestoId`; no se toca ningun dato real.
- Control comercial adicional: `tests/e2e/50-venta-origen-y-galeria-publica.spec.ts` aprobo 4/4 en escritorio/movil; conserva la navegacion con UTM de Facebook hacia el simulador y no expone los textos de borrador comprobados.
- Falso fallo de la prueba anterior: `tests/e2e/simulador-contacto-oficial.spec.ts` esperaba tres botones `Continuar` despues de completar los datos. En el flujo actual, la pantalla llega a `Paso 5 de 5` y ofrece `Ver Resumen y Propuesta`; por eso la prueba antigua se queda esperando un control inexistente. El test nuevo reprodujo el trayecto, comprobo CRM/origen/campana y completo contacto sin cambiar el simulador. Se pide actualizar la prueba antigua en orden 173.
- No se usaron cuentas, prospectos, presupuestos, cobros ni mensajes reales.
