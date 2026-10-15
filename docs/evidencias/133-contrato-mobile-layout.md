# Evidencia: contrato del portal en celular

- SHA de la app desplegada en la copia aislada: `a635b27071ecea22092eba2a285892c84c6f9d08`; su arbol `src` coincide con main `9aa64f991f5ddceefa8d278a3f298be861eb10bb`.
- Navegador: Chromium mobile emulado, viewport 390 x 844.
- Recorrido: evento de QA sintetico; abrir el portal, entrar con clave ficticia, aceptar terminos, registrar constancia y observar el bloque del contrato.
- Resultado: 1 de 1 reproduccion falla los criterios de titulo (3 lineas), sello sobre etiqueta y texto del boton fuera de sus limites. El documento no presenta desplazamiento horizontal global.
- Medidas registradas: nombre/sello `left=229.83, right=324.73, top=592.02, bottom=707.09`; etiqueta `left=215, right=342, top=679.5, bottom=695.5`; boton 244 px y texto 336 px.
- Captura: `133-contrato-mobile-layout.png`.
- Prueba reproducible: `tests/e2e/133-contrato-responsive.spec.ts`; ejecutada contra el build sintetico, fallo esperado que reproduce los criterios visuales. Revalidar en el build posterior a la correccion.

## Alcance que no se debe confundir

La tanda aparte de portal/3D tuvo 13 aprobadas y 15 expiradas al cerrar el contexto o la grabacion de trazas. Las 15 corresponden a escenarios de salon 3D; no dejaron una asercion funcional identificable como causa. Hubo trazas ZIP incompletas y la consola del QA registro una solicitud de Firebase con API key ficticia invalida. Por tanto, esta corrida **no certifica ni condena el salon 3D**; requiere una prueba focalizada con cierre del navegador/telemetria aislados. El subgrupo no 3D aprobo el guardado/recarga de mensajes del cliente y las cuatro comprobaciones del panel en escritorio y movil.

Fuente visual, medidas y resultado pertenecen al entorno sintetico aislado. No se usaron cuentas, fiestas, mensajes ni cobros reales.
