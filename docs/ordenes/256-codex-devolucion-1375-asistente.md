# Orden 256 — Devolución de la propuesta 1375 (asistente de AK, orden 255) (30/10/2026)

**Para Codex.** Seguí sobre la rama `gemini/orden-255-asistente-ak`, desde `5035fedc7`. **Una sola entrega, no
fusiones**: Claude compila, verifica y publica. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md`. No subas los
archivos de `data/` ni `src/data/` que escriben las pruebas.

La revisión de Claude sobre `5035fedc7` (con la versión principal ya junta): acentos bien. **No compila**: hay 4 errores
de tipos. **Fallan 4 de 923 grupos de pruebas.** Lo demás está bien encaminado y no se rehace: la memoria, la
vigilancia, el cierre después de la fiesta, los borradores comerciales, el permiso de fotos del cliente, el
resumen de la mañana y las reservas del gasto de IA.

## Bloque 1 — sacar la biblioteca `audiobox` (no compila, y no se acepta)

`src/lib/asistente/whatsapp-voz.ts:3` importa `audiobox`, sumada en `package.json`. **No se agrega**, por dos motivos:

- es un paquete de una sola persona, publicado por primera vez el 3/8/2026;
- no está instalada, así que tipos y pruebas fallan (`whatsapp-voz.ts:3,48` y `whatsapp-voz.test.ts:10,53`).

Hacelo así:

- Sacá `audiobox` de `package.json` y de `package-lock.json`.
- La voz de Gemini llega como WAV PCM de 16 bits. Para pasarla a MP3, usá `@breezystack/lamejs`, con la **versión
  exacta** y sin `^`. Es la copia mantenida de `lamejs`, la de uso más extendido.
- **Leé vos el encabezado del WAV**: buscá el bloque `fmt `, sacá frecuencia y canales, y tomá los datos del bloque
  `data`. No sumes otra biblioteca.
- Si la conversión falla o el MP3 pasa del tamaño permitido, **se contesta por texto**, como ya hace
  `enviarRespuestaWhatsApp` (`por-whatsapp.ts:~656`).
- La prueba `whatsapp-voz.test.ts` arma un WAV de verdad, lo convierte y comprueba que el resultado empiece con un
  encabezado MP3 válido (`ID3` o el sincronismo `0xFFE`). **No simules el codificador.**

## Bloque 2 — vuelve la respuesta automática a quien llega por un anuncio (decisión del dueño)

En `src/app/api/whatsapp/webhook/route.ts` **sacaste la llamada a `processIncomingMessage`**. Desde entonces, al
prospecto que llega tocando un anuncio o una publicación no le contesta nadie. **Es una decisión del dueño (20/8 y
20/10/2026) y estaba andando**: el bot contesta solo a quien viene de la publicidad; a familia, proveedores y amigos,
no.

La orden 255 pedía otra cosa: que **sólo el mensaje con el presupuesto y las 3 fotos** (bloque 6) quede en la bandeja
para que lo mande una persona.

- Volvé a poner, **después** del freno `correspondeContestarSolo`:
  - el `processIncomingMessage(phone, messageText, clientName, WHATSAPP_WEBHOOK_INTERNAL_TOKEN)`;
  - su respuesta para Twilio, como estaba en `dcdac4ee3`.
- Lo único que cambia: cuando `atencionAnuncio.completo` ya armó el borrador del presupuesto con fotos, ese mensaje
  queda en la bandeja y el bot **no manda precios**. La charla común sigue saliendo sola.
- **Comprobá:** `src/__tests__/solo-contesta-a-los-de-la-publicidad.test.ts` vuelve a verde **sin tocar la prueba**.
  Ajustá también `orden-255-webhook-solo-borradores.test.ts` a esta regla:
  - un prospecto de anuncio recibe respuesta automática;
  - un número que no viene de un anuncio, no;
  - el presupuesto con fotos queda sin enviar.

## Bloque 3 — el agente "Previsor" se puede correr a mano

En `tipos.ts` sumaste `anticipador`, pero `ejecutarAgenteManual` (`src/app/actions/agentes-autonomos.ts:57-77`) no
tiene su `case`, así que contesta "Agente no reconocido".

- Sumá el `case 'anticipador'`, con la misma función que usa el motor (`motor-agentes.ts:~841`).
- **Comprobá:** `src/__tests__/ia-86-agentes-publicidad-e-intervalo.test.ts` en verde, sin tocarla.

## Bloque 4 — la pantalla del contrato en el portal

`src/__tests__/contrato-fecha-portal-dia-civil.test.tsx` falla en sus dos casos ("08 de agosto de 2027" y "—"). Empezó
a fallar cuando la pantalla (`src/app/portal/[fiestaId]/contrato/page.tsx`) pasó a pedir
`getClientPromotionalPhotoConsent`.

- Si ese pedido falla, **la pantalla del contrato tiene que mostrarse igual**: el permiso de fotos queda en "no hay
  autorización vigente" y el contrato no se cae.
- En la prueba, simulá también `getClientPromotionalPhotoConsent` y `setClientPromotionalPhotoConsent`.
- Sumá un caso con el pedido del permiso fallando: el contrato se ve igual, con su fecha.

## Al terminar

Corré `npx tsc --noEmit` (cero), `npx jest --silent` (todo verde) y `npm run check:acentos`, y pegá las últimas líneas de
cada uno.

```comprobar
no-usa: audiobox en src/lib/asistente/whatsapp-voz.ts
no-usa: audiobox en package.json
usa: processIncomingMessage en src/app/api/whatsapp/webhook/route.ts
usa: anticipador en src/app/actions/agentes-autonomos.ts
usa: getClientPromotionalPhotoConsent en src/__tests__/contrato-fecha-portal-dia-civil.test.tsx
prueba: src/__tests__/solo-contesta-a-los-de-la-publicidad.test.ts
prueba: src/lib/asistente/whatsapp-voz.test.ts
```
