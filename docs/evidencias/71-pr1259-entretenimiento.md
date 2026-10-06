# Evidencia 71 — PR1259, entretenimiento / operador e invitado

Fecha: 2026-10-06. Lectura inicial del ayudante sin ejecucion, completada por Codex con cuatro suites unitarias: 27 aprobadas. Sin servidores, credenciales reales ni build.

## Base exacta

- Main revisado: `e52c07839563115236652229d73ac5ebf2e4e551` (merge PR1258).
- Destino pendiente contrastado por objetos Git: `f836c128cfad861a55a2352782f18c805b55e13a`, padre `404c8233014785ba97aade8253916f285358a685`, commit `feat(orden-121): totem de bienvenida con camara, confeti y mesa; interruptor video invitados`.
- Checkout documental conserva main; despues se creo `.audit-pr1259-20261006` en el SHA pendiente exacto para correr solo sus cuatro suites. Fuentes verificadas por Git. Graphify de `.audit-current-20261005` es mapa historico, no evidencia de implementacion. Originales y hashes: `71-resultados/manifest.json`, apartado `pendingRun`.
- Alcance prometido: video de invitado, tótem welcome, tokens/UX de estación, voz y flujos del operador/invitado. Sin evaluación de dinero ni decisión final.

## Hallazgo descartado por la revision principal

**Falso positivo del ayudante: no se confirma un corte a los 12 segundos.** En el SHA exacto `f836c128`, el temporizador de 12000 ms esta dentro del `else` que muestra el saludo SIN video. La rama con `videoUrl` pasa a modo video sin ese temporizador; el elemento reproduce hasta `onEnded={handleVideoEnded}`. No pedir a Gemini corregirlo ni atribuirle un error que no tiene. La comprobacion principal reviso el bloque completo, no una coincidencia de texto aislada. No se ha reproducido video real en navegador.

No confirmé otro fallo nuevo con evidencia suficiente para elevarlo.

## Requisitos del alcance

- **Cubiertos en fuente y suite unitaria aprobada:** guardar video portal con sesion, limite/tipo, almacenamiento privado, rollback de fallo y control de pertenencia (`src/app/actions/videos-invitados.ts`; `src/__tests__/el-video-para-cada-invitado.test.ts`). El portal publico filtra video por interruptor y `checkedIn` y pantalla invitado lo consume. No se probo Firebase o video real en navegador.
- **Tótem:** consumidor y enlace del panel existen; escanea `guestId` + token, el servidor usa `hasPublicGuestAccess`, expide URL firmada y el UI ofrece volver/saltar por `volverAEspera`/control; E2E presente (`tests/e2e/el-totem-de-bienvenida.spec.ts`). El temporizador de saludo no prueba un corte del video. E2E no ejecutada.
- **Estación:** `overlayName` llega al render de tira en `src/app/evento/fotocabina/[fiestaId]/page.tsx:694` y `src/lib/entretenimiento/tira-fotocabina.ts:258`; canales condicionan botones QR/WhatsApp/email en `page.tsx:1741,1783,1795`; tests de contrato añadidos (`src/__tests__/los-ajustes-de-la-estacion-llegan.test.ts:55-74`). Es cobertura fuente/contrato, no validación visual del aparato.
- **Voz:** conversación manos libres ya tiene estado y ciclo escuchar/responder (`src/components/multiagent/multiagent-widget.tsx:262-264,341-412,698-713`), con prueba añadida `src/__tests__/conversacion-en-vivo-con-voz.test.ts`. Configurador de reunión usa `SpeechRecognition` y `reproducirVozReal` sobre borrador (`src/app/(app)/empresa/configurador-reunion/page.tsx:182-226`). No ejecutado ni probado con navegador/micrófono.
- **Unitarias ejecutadas y aprobadas:** `el-video-para-cada-invitado`, `los-ajustes-de-la-estacion-llegan`, `conversacion-en-vivo-con-voz` y `portada-del-portal-del-cliente`; total 27 en HEAD pendiente. Las descripciones de estacion/voz anteriores distinguen fuente de resultado real: no hubo camara o microfono.
- **Pendiente de validar:** flujos completos operador/guest, token QR real, camara/dispositivo, autoplay/audio y estados en movil; E2E sobre SHA exacto y prueba fisica de estaciones. Unitarias aprobadas no equivalen a esos resultados.

## Comprobación

archivo: `src/app/evento/bienvenida/[fiestaId]/page.tsx`
usa: `obtenerVideoBienvenidaTotem` en `src/app/evento/bienvenida/[fiestaId]/page.tsx`
prueba: `tests/e2e/el-totem-de-bienvenida.spec.ts` (presente; pendiente de ejecución en este cotejo)
