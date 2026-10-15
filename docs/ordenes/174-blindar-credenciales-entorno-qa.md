# Orden 174: blindar credenciales y red del entorno QA

**Responsable sugerido:** Claude (Firebase y aislamiento de credenciales).
**Estado:** hallazgo del entorno reproducido; correccion y prueba pendientes.
**Prioridad:** P2 para QA. No es un defecto funcional demostrado en la app publicada.
**Base:** build sintetico `a635b27071ecea22092eba2a285892c84c6f9d08`, equivalente en `src` a main `9aa64f991f5ddceefa8d278a3f298be861eb10bb`.

## Observacion comprobada

Durante el intento de `tests/e2e/viaje-invitado.spec.ts`, el log del servidor informo `Firebase Admin SDK initialized with Application Default Credentials`. El runner oficial crea un ambiente desde una lista permitida que conserva rutas de usuario como `HOME`, `APPDATA` y `USERPROFILE`; por lo tanto, aunque no copie `GOOGLE_APPLICATION_CREDENTIALS` ni variables de cuentas de servicio, Google Auth aun puede descubrir credenciales ADC del usuario. La corrida se interrumpio antes de producir resultado E2E: no clasificarla PASS ni FAIL.

En esa corrida `AK_USE_LOCAL_JSON_ONLY=true` dejo `dbAdmin` nulo y los accesos observados usaron archivos JSON locales. No se observo escritura a Firestore real ni alteracion de datos reales. Sin embargo, la inicializacion ADC y la llamada del SDK cliente a Firebase con API key ficticia impiden afirmar aislamiento total o ausencia de trafico externo.

## Correccion solicitada

- Hacer que el proceso del entorno QA no pueda descubrir ADC de la cuenta del usuario ni recibir claves del host; usar configuracion temporal aislada o un modo que falle cerrado sin credenciales.
- Mantener el modo local exclusivo sin emulador, o apuntar unicamente a emuladores localhost verificados; evitar una configuracion parcial que habilite Firestore real.
- Bloquear solicitudes salientes de los navegadores de prueba a servicios externos, salvo localhost, incluyendo Firebase Installations/Firestore/Storage y servicios de marketing.
- Comprobar al iniciar que el servidor, no solo el proceso del test, esta usando la configuracion aislada y que ningun servicio real esta activo. Si no puede probarse, no arrancar.
- Agregar una prueba automatica que simule ADC disponible en el usuario anfitrion y confirme que el entorno aislado no la usa, que Firestore/Auth/Storage no inicializan conexiones reales y que el navegador no envia solicitudes externas.
- No cambiar autenticacion ni datos de produccion para facilitar QA. Esta orden solo afecta al entorno y sus pruebas.

**No repetir** `viaje-invitado.spec.ts` hasta que el aislamiento pase la nueva prueba. Despues ejecutar ese viaje en datos sinteticos y guardar el resultado completo.

```comprobar
archivo: scripts/entorno-de-pruebas.mjs
usa: ambienteAislado en el arranque de npm run entorno:pruebas
prueba: src/__tests__/entorno-aislado-no-descubre-adc.test.ts (pendiente de crear y ejecutar)
```
