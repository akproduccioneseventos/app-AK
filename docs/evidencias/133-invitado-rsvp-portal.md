# Invitado RSVP y portal: recorrido concluido en QA

- App/build: `a635b27071ecea22092eba2a285892c84c6f9d08`.
- Main contrastado: `9aa64f991f5ddceefa8d278a3f298be861eb10bb`; ambos arboles `src` son `eee81aaa660b1d2d229fee75cf1b7096fd065e1a`.
- Resultado final: **10 PASS, 0 FAIL, 0 omitidos**, cinco escenarios en Chromium desktop y Pixel 7. Duracion 54.2 s.
- Fuente de prueba ejecutada SHA256: `0231afcb0bd7117cd59095c2e172f605a9c7322566a7fef9c9b731fe1cbec85d`.
- Entorno: datos sinteticos JSON locales, health con Firebase/Gemini/Workspace/mail/Instagram/MercadoPago deshabilitados. Rutas HTTP externas del contexto interceptadas; service workers deshabilitados y API ausente para representar un navegador sin soporte. No acepta ejecutarse fuera del runner ficticio localhost.

## Alcance observado

1. Invitado confirma con dos acompanantes: guarda `partySize=3`, contacto y cancion en el evento. El QR tiene pixeles oscuros reales y el boton Descargar esta habilitado; este caso no descarga el archivo.
2. Elegir que no asistira muestra el boton correcto de cancelacion.
3. El equipo recibe la confirmacion del primer caso y el centro de fiesta cuenta tres personas.
4. Cancelar con el mismo nombre actualiza una sola fila a Rechazado, sin duplicar al invitado.
5. El cliente entra con su clave; ve al invitado confirmado sembrado para ese escenario, ve Saldo y accede al centro del muro con la misma sesion. Guardar configuracion muestra exito. Este ultimo caso no comprueba una relectura del cambio de diseno.

La confirmacion conserva la clave del portal del cliente. No se modifico codigo de la app. Al terminar, puerto 3300 sin listener y cero fixtures `e2e_invitado_*` en ambas carpetas del entorno temporal.

## Corridas y errores de QA conservados

- `133-invitado-red-local`: 10 PASS iniciales, con rutas externas interceptadas.
- `133-invitado-red-local-final`: 6 PASS / 4 FAIL al agregar el bloqueo artificial de service workers. Playwright dejaba la API presente pero registro sin objeto; Workbox fallo leyendo `waiting`. El reinicio del worker recreo el fixture y dos casos dependientes perdieron su estado previo. No son cuatro defectos de la app.
- `133-invitado-red-local-sin-sw`: 10 PASS finales; se representa ausencia de API, segun el guard real de `@ducanh2912/next-pwa/dist/sw-entry.js`. No se quitaron aserciones de RSVP, persistencia, QR, portal ni consola.

Son los mismos diez escenarios, no treinta comprobaciones distintas. Se conservan resultados comprimidos y recibos de las tres corridas. La primera interrupcion por el mensaje ADC fue una conclusion excesiva de Codex y ya esta rectificada en orden174.

## Limites

No prueba PWA/offline, OAuth real, pagos reales, subida/moderacion de fotos, camara fisica, escaneo fisico, estetica completa ni el area invitado/portal entera. Los privados Claude/Gemini siguen NO CONTRASTADOS; PR1321 y PR1322 se identificaron con HEAD publicos, sin revisar su codigo en esta tanda.

```comprobar
prueba: tests/e2e/133-invitado-con-red-local.spec.ts
archivo: docs/evidencias/133-invitado-red-local-sin-sw-execution.json
archivo: docs/evidencias/133-invitado-red-local-sin-sw-results.json.gz
```
