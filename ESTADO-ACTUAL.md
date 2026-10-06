# En curso: una propuesta con orden 121 (tótem), orden 122 (Codex 71) y la barra

**6 de octubre de 2026.** Rama `claude/ponte-al-dia-qtrho3` sobre main `e52c078` (PR 1258), con
la rama de Gemini `feat/orden-117-video-invitados` (PR 1259) adentro: al fusionar esta, la 1259
queda fusionada también.

## Qué trae

- **Orden 117/121 (Gemini, revisada):** tótem de bienvenida `/evento/bienvenida/{fiesta}` con
  cámara, saludo, mesa y video; botón en entretenimiento; interruptor del video por invitado en el
  portal. Claude: pantalla pública, aviso de datos, el video no traba el tótem, QR real en pruebas,
  sin presupuesto basura por WhatsApp, sin atajo de permiso en `actualizarFiesta`.
- **Orden 122 (Codex, auditoría 71):** el guardado general de la fiesta no cambia plata ni contrato
  sin contabilidad (CAMPO01/02); compras guarda sólo lo pedido (COMPRA01); el aviso de pago del
  cliente va por `actualizarFiesta`; un presupuesto nuevo no nace cobrado sin contabilidad
  (barrido de la pregunta 38). Preguntas 38 y 39 nuevas.
- **Barra:** la prueba del doble toque fallaba en main por stock cero en los datos de prueba (no
  era la app); el invitado ve el motivo real.
- Una prueba escribía en el repositorio verdadero dentro de la subida: arreglado y con control.

## Sigue

- Puerta completa → propuesta → fusión en otro paso con `expectedHeadSha`.
- **Gemini: RED03 de la orden 122** (dos sincronizaciones de Instagram pierden un video; la galería
  se guarda entera también en `galeria.ts`). Y 112 B.1 (AUD01).
- Codex vuelve a mirar plata, permisos y comida sobre el SHA fusionado.
- Pregunta pendiente al dueño: ¿escanear en el tótem cuenta como llegada? Hoy no.

## Cómo se fusiona (error 30)

- Sin `expectedHeadSha` igual al de `.ak-puerta-verde.json`, no se fusiona.
- No cambiar de rama ni `commit -a` mientras corre la puerta.
