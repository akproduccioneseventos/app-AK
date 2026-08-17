# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 17 de agosto de 2026.
**Estado:** rama `agent/historial-redes-sociales` abierta en PR #1018; no fusionada.
**Propuestas abiertas:** PR #1018 — Memoria histórica de redes sociales para AK.

## Memoria histórica de redes

Se amplió el módulo existente `Empresa → Redes sociales`; no se creó un sistema
paralelo. La propuesta agrega importación histórica de Facebook, Instagram,
Threads, TikTok, YouTube y X desde exportaciones oficiales ZIP/JSON/JS, con fecha
original, texto, enlaces, métricas disponibles, deduplicación y agrupación de una
misma pieza distribuida en varias redes.

YouTube también puede recorrer todo el canal por API cuando existan
`YOUTUBE_API_KEY` y `YOUTUBE_CHANNEL_ID`. El Agente de Marketing lee la memoria
real para evitar repetir copys recientes y detectar temas sobrepublicados. Nada se
publica ni modifica automáticamente en las redes originales.

## Validación

La PR disparó CI, Firestore rules, browser smoke y CodeQL, pero **ningún job llegó
a ejecutar un solo paso**. GitHub informó: `The job was not started because your
account is locked due to a billing issue.` Por eso el fallo actual de Actions no
es una prueba de código rojo ni verde: no hubo runner.

El entorno de este agente tampoco dispone de un checkout autenticado del repo para
correr `tsc`, Jest, acentos y build localmente. La PR queda en borrador y no se
fusiona a ciegas.

## Lo que falta para cerrar esta propuesta

1. Resolver el bloqueo de facturación de GitHub Actions o ejecutar los controles
en un checkout autenticado.
2. Corregir cualquier error real que aparezca en esos controles.
3. Completar la anotación obligatoria en `docs/YA-RESUELTO.md` antes de fusionar.
4. Después de fusionar, configurar YouTube y cargar/autorizar los archivos oficiales
de las demás redes para hacer el backfill real de la cuenta de AK.

## Dónde va el plan de catorce bloques

**Entrega 1: HECHA y fusionada.** Trivia con podio por mesa, secretario que
habla, llegada del equipo y logística en oscuro.

**Entrega 2: pendiente.** La reunión que se agenda sola desde el simulador (la más
importante), la pregunta de los quince a las invitadas, que no se pierda la foto ni
el pedido de la barra sin internet, y las misiones secretas.

**Entrega 3: pendiente.** Configurador de cierre, videos, termómetro de la fiesta,
libro de la fiesta, cada uno ve lo suyo, transmisión en vivo.

## Decisiones del dueño que siguen vigentes

Descartó el precio variable por fecha, alquilarle la app a otros salones y el
"ensayo de la fiesta". Pidió que la captación de prospectos no sea sólo en la
fotocabina sino en toda pantalla donde el invitado ya consiguió lo suyo, y que el
menú de niños y adolescentes sea el mismo.
