# En curso: tanda de la auditoría 66 + auditoría de toda la app (35 preguntas)

**5 de octubre de 2026.** Rama `claude/ponte-al-dia-qtrho3`, todo commiteado, **sin fusionar**:
se corre la puerta (`npm run "publicar?"`) y, en verde, se abre la propuesta y se fusiona en otro
paso con `expectedHeadSha` igual a `.ak-puerta-verde.json`.

## Qué trae

- Auditoría 66 de Codex (orden 116): enlace vencido del personal, coordenadas inválidas,
  canciones que se pisaban, candado de tareas entre servidores, tareas fallidas anotadas como
  corridas, y los trece pendientes de plata, comida y permisos.
- Auditoría de toda la app con las 35 preguntas: CRM, contrato en papel, ficha del personal,
  cupones, menús, activos fijos, enlaces del personal y lista de compras pedían sólo sesión;
  costo de insumos a los menús sin lista vieja; mensaje honesto de la seña.
- Puerta más rápida: un cambio adentro del servidor corre sólo las pruebas de su pantalla.
- Jest 597 suites / 3.432 pruebas en verde, tipos en cero, acentos bien (antes de la puerta).

## Para Gemini — UNA propuesta

- **Orden 117**: video de la quinceañera para cada invitado (aprobado por el dueño), "llamarla"
  y objetivos de varios pasos (105 b3 y b7), micrófono en la reunión y pantalla gigante con todas
  las fotos (106 b2 y b5), y los dos ajustes de estaciones que nadie lee.
- **Orden 112 B.1 (AUD01)**: el contador de Codex cubre todas las rutas.

## Después de fusionar

- Pedirle a Codex que vuelva a mirar: cobros, menús/insumos, quién ve qué, barra, personal y
  tareas automáticas (`npm run "codex?"`).
- Orden 114 sigue sin las dos pruebas de entorno compilado (no se puede abrir servidor desde la
  nube); orden 92 espera el ensayo en el salón (va al final, no se lista como pendiente).

## Cómo se fusiona (error 30)

- Sin `expectedHeadSha` igual al de `.ak-puerta-verde.json`, no se fusiona.
- No cambiar de rama ni `commit -a` mientras corre la puerta.
