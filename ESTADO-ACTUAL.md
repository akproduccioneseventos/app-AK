# Acá quedé

**1 de octubre de 2026.** La 1247 (órdenes 100 y 103) se fusionó con la puerta en verde.

## Espera a Gemini — UNA sola propuesta

Desde la rama **`claude/ponte-al-dia-qtrho3`**, en este orden: **104** (hallazgos de Codex en la
1240 que seguían rotos: cocina con 0 adultos, notas de reunión, gasto de mantenimiento, orden de
evento cortada, alerta de mantenimiento, ubicación del personal, escaneo de carga, QR, horario de
redes), **101** (asistente del cliente, contrato revisado, letra chica Ley 18.331, privacidad),
**102** (asistente que se anticipa), **105** (WhatsApp con audios y voz real, regla de oro de la
plata) y **106** (galería con videos en la reunión, IA por voz, recorrido de demo, invitados sin
pérdida con dos servidores, fotos borrosas e inadecuadas, vista mágica del salón, "Viví la
experiencia" en la web).

## Espera al dueño

- **Barra de tragos:** confirmar las recetas de los 12 tragos y dónde va el licor de durazno. Con eso
  se suma a la orden 106 un bloque de barra (carrusel en el tótem, foto con el trago, apertura y
  cierre, descuento por receta, informe).
- **Hoja de las estaciones** (https://claude.ai/artifact/HJmMRuPNQSKbzmG4tM8FwP): lo que marque
  "No" se saca y "Cambiar" va a una orden. Se lee con `ArtifactData` colección `marcas`.
- **Número de la IA en WhatsApp:** primero se prueba su propio chat; si no llega, un chip aparte.

## Cómo se fusiona (error 30)

- La puerta anota el commit aprobado en `.ak-puerta-verde.json`; la fusión sin `expectedHeadSha`
  igual a ese commit la frena `scripts/antes-de-fusionar.mjs`.
- Con la puerta corriendo: no cambiar de rama ni `commit -a` (error 31).

## Trampas

- Medidas de maquetación que trae una entrega desde otra máquina: volver a las de la principal.
- Apagar procesos por número o nombre exacto, nunca `pkill -f` (error 20).
