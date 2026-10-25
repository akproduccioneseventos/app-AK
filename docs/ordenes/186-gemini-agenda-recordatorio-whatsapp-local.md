# 186 (antes179) - Gemini: enlace de agenda y legibilidad de costos

**Estado actual:** CERRADOS los dos defectos por151,4PASS PC/Pixel7 sobre
2e5363f259461a31bf6b31807872c227855415de: enlace598, telefono099 almacenado
sin cambiar tras recarga, fecha/hora conservadas y titulo de costos visible.
Consumidores relacionados iguales hasta main894d. Ver154-cierre.md y
151-agenda-source.spec.ts. El informe siguiente es historico; no reencargar.

ID estable: AK-CODEX-136-WA099-COST. Usar este ID y el nombre COMPLETO del
archivo, no solo "179": existe otra179 de Gemini sobre portada/IA, distinta.
Contraste140: Gemini `4d845b921d3b579515de7937fd7d209cbab71f3b`, rama
`feat/ordenes-178-179-impresos-ia38`, conserva los consumidores de agenda y
servicios IDENTICOS a7230 por blobGit. No cerrar esta orden por la entrega de
`179-gemini-devolucion-176-177-y-ia-gratis-mas-nueva.md`.
NO CONTRASTADO CON LA CABEZA PRIVADA ACTUAL DE CLAUDE.
Contraste publico: main `7230f9d02b32805952a185f704a0208bd5d643e6`;
PR1325 `5f704e68ffc65796d74bbe5d11046bf1c0413004` y
PR1326 `a21d0b6987bb55757be217bdadf63f8ca67a6cb6` no cambian ni el consumidor
`src/app/(app)/contabilidad/crm/agenda/page.tsx` ni `src/lib/commercial/contact.ts`.
El consumidor visual `src/app/(app)/empresa/servicios/page.tsx`, `CardTitle` de
`src/components/ui/card.tsx` y `src/app/globals.css` tampoco cambian en esas PR.
Esto no aprueba esas PR ni acredita otras dependencias transitivas o Hosting.
Reconfirmar ambos HEAD antes de programar; si ya fue corregido, no duplicar.

## Defecto P2 observado

Como organizador, cargar un prospecto desde `/contabilidad/crm` con un telefono
uruguayo local, sin correo ni presupuesto. Agendar una reunion desde
`/contabilidad/crm/agenda`, guardar y recargar. El contacto, la reunion y la hora
de Uruguay se conservan. Sin embargo, el enlace **Recordar por WhatsApp** queda
`https://wa.me/099...?...`: conserva el cero nacional y no incorpora `598`.

La fuente es `buildReminderUrl`, dentro de `CrmAgendaPage`: elimina caracteres
no numericos pero no normaliza el destino. El enlace lo consume la tarjeta de
reunion de esa misma pantalla. No se envio ningun mensaje ni se comprobo que
el telefono ficticio tenga WhatsApp. El defecto demostrado es el formato del
enlace, no un envio fallido ni un fallo de fecha.

[WhatsApp requiere numero internacional completo en click-to-chat](https://faq.whatsapp.com/5913398998672934).
El proyecto ya tiene `toWhatsAppDigits` en `src/lib/commercial/contact.ts`.
WA80 se dio por cerrado para clientes, portal, RSVP e invitados; este consumidor
de agenda no aparece en aquel alcance y conserva la variante original. No
reabrir ni reimplementar los consumidores ya corregidos.

## Cambio acotado

- Reutilizar el normalizador existente al construir el enlace de recordatorio.
- **No modificar el telefono almacenado**, exigir correo ni alterar la cita.
- No duplicar `598`; respetar telefonos internacionales de otros paises segun
  el contrato vigente del ayudante. Conservar texto y hora del recordatorio.
- No agregar otra integracion, envio automatico ni dependencia de produccion.
- Si la interfaz admite un prospecto sin telefono, conservar su alternativa de
  compartir sin destinatario; no inventar un numero.

## Aceptacion y evidencia

La sonda `tests/e2e/136-maestros.spec.ts`, caso `comercial: prospecto y agenda...`,
compara por separado el telefono guardado, fecha/hora persistida y `pathname`
del enlace. El resultado y el enlace observado viajan en
`136-masters-sdk-comercial-defecto-results.json.gz` (PC) y
`136-masters-sdk-comercial-movil-results.json.gz` (Pixel7). Pixel7 necesita abrir
la columna CRM plegada antes de leer la tarjeta, como lo hace el caso final.
Firestore local demo, compilacion135 de fuente7230; no cuentas reales.

Retestar ese caso con build del SHA corregido. Agregar prueba focal del
consumidor con `099...`, `+598...` y un internacional ya valido; esta ampliacion
unitaria esta **PENDIENTE**, no se afirma creada ni ejecutada por Codex.
Claude valida el conjunto y fusiona; Codex no programa ni fusiona.

## Segundo defecto P2: titulo oscuro sobre panel oscuro

En `/empresa/servicios`, el titulo **Ajuste de Costos Global** se ve casi negro
sobre azul oscuro en la captura nativa movil
`docs/evidencias/136-masters-sdk-chromium-mobile-4.png`. No se toco el boton de
ajustar ni ningun importe para observarlo.

El panel usa `bg-slate-900 text-white`, pero su `CardTitle` tiene explicitamente
`text-foreground` desde el componente compartido y no recibe color local que
lo sustituya. La captura demuestra la legibilidad mala; no se presenta un
ratio WCAG calculado ni una prueba automatizada de contraste inexistente.

Aplicar contraste claro **en ese titulo**, sin cambiar el color compartido de
todos los `CardTitle`, ni la formula/confirmacion/permisos del ajuste de costos.
Retest visual PC/celular en build nuevo y prueba focal local del estilo; la
prueba de contraste propuesta sigue PENDIENTE. Incluir ambos arreglos en la
misma tanda, no abrir una PR por cada uno.

```comprobar
archivo: src/app/(app)/contabilidad/crm/agenda/page.tsx
usa: toWhatsAppDigits en src/app/(app)/contabilidad/crm/agenda/page.tsx
prueba: tests/e2e/136-maestros.spec.ts
```
