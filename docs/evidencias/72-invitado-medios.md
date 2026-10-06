# Evidencia 72: acceso del invitado, RSVP y medios

6/10/2026. Revision del ayudante completada/corregida por el principal.
Main `e52c07839563115236652229d73ac5ebf2e4e551`; tanda PR1259
`7c96e11427c673d72638ac593bcd783915955aa8`. El helper de la tanda agrega un
tipo `videoPersonal`, no cambia el control de acceso ni la proyeccion ejecutada.
Graphify historico se uso como mapa, no como prueba. No cambios de app/build.

## Ejecutado sobre codigo real

`node docs/evidencias/72-invitado-probe.cjs [SHA]`: siete casos por commit.
Token vacio/errado, ID ajeno, invitado inexistente y token de otra fiesta no
obtienen proyeccion. Token valido obtiene solo al invitado propio: sin token ni
telefono privado, lista de otros invitados, cuotas, contrato o tarea interna.
Se ejecuta `buildPublicGuestPortalData` y `hasPublicGuestAccess`, no una copia de
su formula. Consumidor real: `getPublicGuestPortalData` en la pagina del invitado.
Resultado PASS en ambas bases; no defecto nuevo en ESTE alcance.

## No comprobado dinamicamente aqui

- RSVP: la inspeccion sugiere que partySize JSON null usa fallback 1; no se eleva
  como defecto ni se certifica la accion. `submitPublicRsvp` tiene cobertura
  preexistente en `rsvp-deduplication.test.ts`, incluida en bateria 71, no fue
  una nueva prueba del payload null en esta sesion.
- La sonda inicial del ayudante copiaba la formula sin llamar a la app. El
  principal la descarto y sustituyo; ejecutarla como Jest dio cero tests y
  "must contain at least one test". Fue error del metodo, NO fallo de AK.
- No se ejecuto sesion HTTP, confirmacion/check-in/QR ni subida/descarga de medios.
  ZIP `/api/fiestas/[fiestaId]/download-recuerdos` es administrativo con sesion;
  localizarlo no certifica entrega al invitado.

No se reabren CAMPO01/02, PERS01/02 ni idempotencia social; no area limpia.
Los nuevos casos propios del MiniQuiosco estan en la orden 123/informe 72.

```comprobar
archivo: src/lib/guest-portal-public-data.ts
usa: buildPublicGuestPortalData en src/app/actions/public-guest-portal.ts
usa: getPublicGuestPortalData en src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx
prueba: docs/evidencias/72-invitado-probe.cjs (EJECUTADA: helper por SHA; no HTTP/RSVP)
```
