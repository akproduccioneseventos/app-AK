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

La tanda operativa `operacion-agenda` aprobo 4 de 4: la orden del evento muestra actividad y empleado sin exponer importes en desktop/movil; la ubicacion ficticia del trabajador se entrega al navegador en ambos tamanos. El test de limpieza de agenda recibio una respuesta, pero no aprobo su control de errores de pagina porque el Firebase SDK del build sintetico intento registrar una instalacion con una API key falsa y recibio `400 INVALID_ARGUMENT`. El control movil de limpieza se omite intencionalmente en el propio test. El QA informa Firebase deshabilitado, pero no bloquea completamente esa solicitud del navegador: este caso **no se atribuye al producto** y el banco debe interceptar la red externa antes de repetirlo.

La misma sonda movil contrasto `/`, `/settings/cupones` y `/empresa/red-social-eventos` con la red externa bloqueada: las tres respondieron HTTP 200; el panel social tuvo `scrollWidth - clientWidth = 0` y contenido visible. Al agregar una medicion de interseccion, la prueba reprodujo que `ModuleNavigationDock` tapa el encabezado `Evento` por aproximadamente 1455 px2 a 390 x 844. Evidencia `133-mobile-social-overlap-390.png`; correccion pendiente, orden172. La prueba termina en fallo solo por esta asercion de solapamiento, no por carga ni desborde.

Invitado y entretenimiento: el tótem de bienvenida aprobó 8/8 casos desktop/móvil (espera, QR válido, QR ajeno/token inválido y retorno a espera, cámara falsa). La puerta `/evento/inicio` aprobó 2/2 casos desktop (11 estaciones visibles, sin PIN y descarga del acceso directo); las dos variantes móviles se omiten expresamente por el test. El barrido general de desbordes aprobó sus dos matrices de escritorio. Sus dos matrices móviles expiraron por el límite total mientras recorrían muchas rutas: la interna en `/settings/cupones` y la pública en `/`. No demuestra una falla de esas rutas; la sonda móvil puntual anterior abrió ambas y el panel social con respuestas 200, y midió el solapamiento real del dock.

Fuente visual, medidas y resultado pertenecen al entorno sintetico aislado. No se usaron cuentas, fiestas, mensajes ni cobros reales.
