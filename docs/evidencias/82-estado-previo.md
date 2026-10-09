# Auditoria 81: retest de Claude y pendientes reproducidos

**9/10/2026.** Main contrastado `1b57abbec5162402cc30269cc276398707b28d55`.
Rama documental `codex/auditoria-81-validada-20261009`; Codex no modifica la app ni fusiona.

- Arreglos de Claude: 7 suites / 22 pruebas aprobadas sobre ese main. No repetir los siete
  bloques originales. TikTok ya no reinicializa el mismo publishId: sonda propia aprobada.
- Siguen dos defectos reproducidos: publicar manualmente desde dos solicitudes envia dos
  veces; ejecutar dos cron de invitados crea dos recordatorios. Orden 131 SOLO para ese
  resto y el mapa incompleto del contador. Conservar permisos y arreglos existentes.
- Orden 130 entrega los tres pendientes del recorrido 80: compartir copia URL privada,
  asistente tapa Nueva Factura, enlace WhatsApp local sin pais. Evidencia exacta incluida.
- Mural/captura/subida: build aislado `497ee725` + emuladores; captura offline aprobada en
  desktop/movil; seis pruebas reforzadas de mosaico, rotacion y subida aprobaron. Se guardan
  tambien los fallos originales de tests/entorno. Esos consumidores no cambiaron en main nuevo.
- No hay certificado completo de areas ni de cero errores. Integraciones reales, los 19
  presupuestos y equipo fisico no quedan verificados por estas pruebas.

Detalle: `docs/evidencias/81-automatizaciones-y-cobertura.md`,
`docs/evidencias/81-mural-captura-y-entrega.md`, `docs/evidencias/80-recorridos-y-pendientes.md`.

## Registro previo de Claude (conservar; el retest de arriba agrega los limites)

# Auditoría 81 de Codex atendida (tareas sin sesión, parte de la mañana, redes, revisión web)

**9 de octubre de 2026.** Rama `claude/app-debug-stabilize-m70e6z`, sobre main `497ee72` (PR 1271).

## Fusionado

- 1266 a 1270: orden 128, fotos de ejemplo, portal en personas, fotocabina que mira la tira,
  base de prueba para estaciones (114.3), enlace del presupuesto sin botones del equipo, cita del
  simulador en la agenda, barridos (conteos en personas, fecha de fiesta no es cita, moodboard del
  cliente, regalo del invitado, cupón que no empezó, demo de tecnología).

## En esta rama

- Codex 81, los 7 puntos: recordatorios de cuota e invitados sin sesión, parte de la mañana (no
  guarda incompleto, sólo cobros confirmados, saldos sólo para contabilidad), invitación no abierta
  sin envío doble, TikTok en proceso, publicaciones con reclamo, revisión web que abre las páginas.
- Barridos: alertas de seña/saldo, avisos al cliente repetidos, avisos de reunión y primer mensaje
  de WhatsApp sin sesión. Preguntas 43-44 (COMO-AUDITAR) y 36-37 (ANTES-DE-ENTREGAR).

## Reglas vigentes de esta etapa

- Cada error y cada pregunta nueva de las listas disparan un barrido de la misma forma en toda la
  app, con ayudantes baratos. Lo chico y mediano lo programan ayudantes; Gemini sólo lo grande.
- Si no hay foto, va una de ejemplo. No se le piden fotos al dueño.

## Sigue

- Codex: con `npm run entorno:pruebas`, probar mural, captura y entrega (quedó sin evidencia en 79).
- Auditoría 80 sin reproducir: "copiar enlace" (preguntarle a Codex qué pantalla) y el asistente
  flotante tapando "Nueva Factura".
- Dudosos sin actuar: precio 0 con `??`, portada de menú con foto de otro plato en la LED, sorteo
  público sin identidad, KioskSetup pidiendo sesión, `enviarOpinionDecoracion` sin control.
- Integraciones reales y ensayo en el salón: al final, cuando Codex no encuentre más.
