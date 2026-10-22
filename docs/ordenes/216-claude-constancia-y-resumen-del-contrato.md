# AK-CODEX-240 - Contrato del portal: resumen y constancia

Responsable: Claude (dinero, permisos y contrato). Codex solo audita/prueba/documenta.
Fuente ejecutada: `9d1a07f99b8d6972995ff8c2b9f1a5a1ac4a81de`.
Los archivos efectivamente cargados se contrastan con main
`baa034fd25ab77b886e7096105a6114f0336bfdc` y candidato1353
`b91bdbeff7d3db7489fabdadd599776376c0577a` en `240-contraste-fuentes.json`.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.
No rehacer213: sus dos intercalados pasan en242 sobre mainbaa.

## Evidencia y limite

`240-firma-cliente-sdk.mjs/json`: 11 criterios, 6PASS/5FAIL, CUATRO causas;
los dos FAIL del resumen son la misma causa con/sin cuenta cliente.
Acciones y permisos/HMAC reales, Firebase Admin SDK/emulador demo real;
cookies/headers, transporte de lectura y notificaciones controlados. No HTTP,
navegador, PDF, cobro, contrato en papel ni validez juridica certificados.
Fixture ficticio, cero documentos al terminar y limpieza200.

## C1 - El cliente autorizado no obtiene su resumen economico

`getContractSigningSummary` en `src/app/actions/fiesta/documentos.actions.ts`
llama a `getPresupuestoById` sin la capacidad/token que exige ese lector.
Con portal valido y presupuesto100000/senia30000/saldo70000 existentes,
devuelve success con0/20000/0. Se reproduce sin cuenta app y con perfil cliente;
el control con cuenta dueno devuelve100000/30000/70000.
Consumidor: `ClientContractPage` en `src/app/portal/[fiestaId]/contrato/page.tsx`.
La pagina representa esos datos como "A definir", senia20000 y saldo "—";
no afirmar que el DOM se ejecuto en240 ni que muestra literalmente $0.
Resolver la lectura del presupuesto PROPIO despues de autenticar ese portal.
No hacer publico porID el lector general, ni inventar importes cuando falla.

## C2 - El guardado general permite falsificar una constancia existente

Tras una firma valida, el cliente llama a `updateFiestaPartial` con
`{firmaDigitalConstancia:{signedBy:'Reemplazo desde parcial',signedAt:'1900-01-01',textoHuella:'falso'}}`
y `allowPortal:true`. Devuelve success y el SDK relee esos valores persistidos.
Restringir los campos de constancia a la accion dedicada y a su identidad
verificada, sin bloquear el guardado legitimo de esa accion ni otros datos del portal.

## C3 - Dos firmas concurrentes sobrescriben la primera

Dos llamadas leen inicialmente sin firma. A guarda; B continua desde su lectura
vieja. Ambas devuelven success; queda FirmanteB y se generan dos notificaciones.
Hacer atomica la primera escritura/lectura de constancia en el guardado real;
el reintento secuencial ya preserva la primera y debe seguir haciendolo.

## C4 - Se registra aceptacion de un texto que el cliente no vio

El cliente lee textoA. El equipo lo cambia a textoB antes del clic. La accion
acepta sin version esperada y guarda la huella deB. Debe rechazar/refrescar y
pedir nueva aceptacion si cambio el texto visto, no atribuirle aceptacion deB.
El consumidor `handleSign` hoy solo envia ID/nombre/aceptacionPlan.

## Preservar y comprobar

La constancia NO contrata, reserva, cobra, crea seña ni reemplaza el papel.
Preservar la decision del dueno de25/9, orden86, y los6controles positivos240:
sesion requerida, control economico dueno, plan debe aceptarse, constancia
persistente sin cambiar estado/firmafisica/cobros, retrysecuencial inmutable,
error de escritura visible. No abrir una PR por causa; integrar la tanda.
Prueba de regresion propuesta abajo PENDIENTE: no existe ni fue ejecutada porCodex.

```comprobar
archivo: src/app/actions/fiesta/documentos.actions.ts
usa: getContractSigningSummary en src/app/portal/[fiestaId]/contrato/page.tsx
usa: signContractDigitally en src/app/portal/[fiestaId]/contrato/page.tsx
archivo: src/app/actions/fiesta/fiesta.actions.ts
usa: updateFiestaPartial en src/app/actions/fiesta/documentos.actions.ts
prueba: docs/evidencias/240-firma-cliente-sdk.mjs
prueba: src/__tests__/contrato-constancia-version-y-permisos.test.ts
```
