# Acá quedé

**2 de octubre de 2026.** La 1248 (órdenes 101, 102, 104, 105 y 106, con las devoluciones 107 y
108) se fusionó con la puerta en verde. La revisión la terminó Claude: permisos del asistente,
propuestas en turno, hora del contrato, WhatsApp que no dice "anoté" sin anotar, pruebas sin atajos.

## Espera a Gemini — UNA sola propuesta, desde la principal

- **106, lo que faltó:** `/experiencia`, `/tecnologia`, fiesta suspendida, barra (apertura, cierre,
  informe y las 12 recetas con licor de durazno en el Atomic green), salón decorado y salón mágico,
  voz en la reunión, opciones de voz en Ajustes, y el **video resumen de verdad** (con las fotos de
  la fiesta; el "de muestra" era una página grabada y se sacó). Claude mira un video antes de fusionar.
- **105:** voz real en el Parte de la mañana.
- **109:** barrido de formatos que pierden lo que escribió una persona (pregunta 31).

## Pendiente de Codex

- Auditoria 64 sobre main `c13073f`, contrastada con PR 1251 `ea2cb46` y publicado
  `0864e136`. Registro completo en `docs/evidencias/64-auditoria-integral-2026-10-02.md`.
- Orden 112 (era 111 de Codex): cobros HECHO (39da52a), PER01 y AUD02 HECHOS;
  Gemini: AUD01 (cobertura del contador), masticado en la orden. No reprogramar descartes.
- 3.334 tests cubiertos en dos configuraciones; 9 recorridos web/PDF pasan. El barrido
  de navegador no termino: no hay certificado de 14 areas limpias ni hardware probado.
- Claude compila el conjunto; Codex verifica recorridos faltantes sobre ese SHA estable.

## Cómo se fusiona (error 30)

- La puerta anota el commit aprobado en `.ak-puerta-verde.json`; sin `expectedHeadSha` igual, no.
- Con la puerta corriendo: no cambiar de rama ni `commit -a` (error 31).
- Una prueba que falla con la máquina cargada se repite sola con `npm run otravez` antes de tocar código.

## Trampas

- Medidas de maquetación de otra máquina: volver a las de la principal.
- Apagar procesos por número o nombre exacto, nunca `pkill -f` (error 20).
