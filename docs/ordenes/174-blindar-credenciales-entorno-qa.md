# Orden 174 rectificada: ADC no demuestra credenciales reales

**Responsable sugerido:** Claude (Firebase y aislamiento de credenciales).
**Estado:** retirada como defecto de credenciales. No bloquear recorridos por este mensaje.
**Prioridad:** observacion de QA; endurecimiento opcional, separado de errores de la app.
**Base:** build sintetico `a635b27071ecea22092eba2a285892c84c6f9d08`, equivalente en `src` a main `9aa64f991f5ddceefa8d278a3f298be861eb10bb`.

## Observacion comprobada

Durante el intento de `tests/e2e/viaje-invitado.spec.ts`, el log del servidor informo `Firebase Admin SDK initialized with Application Default Credentials`. Codex interrumpio la corrida por interpretar ese mensaje como descubrimiento de credenciales. Esa conclusion no estaba demostrada. La corrida quedo sin resultado E2E: no clasificarla PASS ni FAIL.

La dependencia instalada demuestra que `applicationDefault()` construye `ApplicationDefaultCredential`; su constructor crea un objeto `GoogleAuth`. La busqueda del cliente y la solicitud de token ocurren despues, en `getAccessToken()`. El mensaje de inicializacion no demuestra que se encontraran o utilizaran credenciales. En la app, `AK_USE_LOCAL_JSON_ONLY=true` sin emulador dejo `dbAdmin` y `authAdmin` nulos; los accesos observados usaron archivos JSON locales. No se observo escritura a Firestore real.

## Observacion que sigue vigente

El navegador intento llamar Firebase Installations con la API key ficticia y obtuvo 400. Esto contamina las aserciones que exigen consola sin errores. Para esos recorridos, interceptar solicitudes externas en el arnes QA y conservar sus resultados; no cambiar la app para acomodar la prueba. Mantener modo local exclusivo o emuladores localhost verificados.

Se retira la prohibicion anterior de repetir RSVP basada solo en ADC. Puede reanudarse con datos ficticios, los controles del modo local y el bloqueo de salida del navegador. No requiere una correccion de autenticacion de produccion ni una nueva compilacion si la fuente no cambio. Antes de encargar trabajo, contrastar las tandas privadas de Claude/Gemini, cuyos HEAD siguen NO CONTRASTADOS.

Referencia local comprobada: `node_modules/firebase-admin/lib/app/credential-factory.js` (`applicationDefault`), `credential-internal.js` (`ApplicationDefaultCredential`, `getAccessToken`, `getApplicationDefault`) y `src/lib/firebase/server.ts` (rama local con `dbAdmin` nulo). No se ejecutaron solicitudes de tokens para hacer esta comprobacion.

```comprobar
archivo: scripts/entorno-de-pruebas.mjs
prueba: src/__tests__/el-entorno-aislado-no-lleva-credenciales-reales.test.ts
```
