# AK-CODEX-264-CONTRATO-GUARDADO-DESPUES-DE-FIRMA

Responsable: Claude (contrato/dinero/permisos). Codex solo audita/prueba/documenta.
Fuente main725e62ba2f909578628fad47402d125ed9632c70, incluye1358.
Tanda publicaGemini1353b91 contrastada por HEAD; no es una entrega de este arreglo.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS; contrastar antes de programar.

## P1 - Un guardado iniciado antes de la firma cambia el texto despues de firmar

Consumidor verificado en el SHA auditado:
`updateContratoFiestaActual` en `src/app/actions/fiesta-actual.ts`, llamado por
`src/app/(app)/fiestas/nueva/gestion-documental/contrato-servicio/page.tsx`.
Pasa por `updateFiestaPartial`, `updateDataPartial` y la rama de documento
individual de `syncToFirestore`, que termina en set con merge:true.

264 ejecuta esa cadena REAL y `signContractDigitally`/`actualizarFiesta` con
Firestore AdminSDK demo real. DOS criterios:1PASS/1FAIL, UNA causa, sin errorQA.

1. El contrato contiene textoA, sin constancia. El equipo inicia guardar textoB.
2. Pasan las lecturas/guardas de los dos wrappers, que aun ven sin firma.
3. Inmediatamente antes de la escritura real, el cliente firmaA con la huellaA
   correcta. La transaccion real confirma success:true y persiste la constanciaA.
4. Continua la escritura del equipo: set merge:true deja textoB, conserva la
   constanciaA y responde success:true. La relecturaSDK confirma el desacuerdo.

Huella guardadaA86e849ee..., huella del textoB6dc64b5f...; JSON conserva completas.
No es la firma de texto no visto216C4: alli cambia ANTES de firmar y254 ya paso.
Aqui otro guardado pasa la guarda ANTES, pero escribe DESPUES de la firma valida.
No reabrir216C1-C4 ni reencargar la misma orden. Esta es una frontera nueva.

## Resultado requerido

La comprobacion de constancia y la escritura del texto deben mantener juntas
la misma invariancia: no modificar silenciosamente el texto al que corresponde
una firma ya confirmada, aunque la firma aparezca entre la lectura y el guardado.
Rechazar/avisar el conflicto o usar el mecanismo de adenda aprobado, sin borrar,
recalcular ni atribuir al cliente una firma sobreB que nunca acepto.

Una lectura adicional anterior al set no cierra la carrera; comprobar donde
realmente se persiste. Conservar los permisos actuales y las rutas validas
del contrato del salon/adendas/cambio de fecha. No cambiar politicas comerciales.
La constancia sigue SIN reservar/cobrar/reemplazar el contrato obligatorio en papel.

## Control, alcance y entrega

Control264: si ya estaba firmado ANTES de iniciar el guardado, este se rechaza,
no se llama al escritor y permanecen textoA+huellaA. Mantenerlo.
Identidad, predicado portal/acceso a evento, cookies no usadas, copias locales,
respaldo y notificaciones controlados. Permisos y acciones reales; NOvalidacion
de HTTP, interfaz nativa, PDF, validez legal, todos los roles o datos reales.
El hook solo ordena el intercalado antes del sync real; no cambia la decision
de las acciones ni sustituye el escritor/actualizador por un resultado prefijado.
0fiestas al terminar, limpieza200, servicios propios cerrados.
Regresion propuesta abajo PENDIENTE hasta que Claude la implemente y ejecute.

```comprobar
archivo: src/app/actions/fiesta/fiesta.actions.ts
usa: updateFiestaPartial en src/app/actions/fiesta-actual.ts
usa: updateContratoFiestaActual en src/app/(app)/fiestas/nueva/gestion-documental/contrato-servicio/page.tsx
usa: updateDataPartial en src/app/actions/fiesta/fiesta.actions.ts
prueba: docs/evidencias/264-contrato-guardado-sdk.mjs
prueba: src/__tests__/contrato-guardado-no-cambia-texto-firmado-en-medio.test.ts
```
