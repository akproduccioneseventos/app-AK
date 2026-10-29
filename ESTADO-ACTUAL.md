# Estado actual — 29 de octubre de 2026
## Orden 255 en curso en la propuesta 1375
- PR en `gemini/orden-255-asistente-ak`; se incorporó localmente `main` `5c22efad3e1f16075bf1689caa6c7ca41099763a` y se están resolviendo los conflictos del historial compartido y el catálogo de costos.
- Commit `256e548ca`: entrada de audio/foto validada, comprobantes como propuestas, reserva atómica de consumo para medios, plan de reunión sin contactar clientes, anticipador de mozos, vigilancia nocturna y bloqueo de tareas que contacten clientes sin aprobación.
- La voz saliente sigue pendiente: no hay encoder compatible; cuando está habilitada, se informa por texto y no se intenta enviar WAV.
- Antes de integrar main: 5 suites, 36 pruebas focalizadas aprobadas; ESLint puntual aprobado. Hay que repetirlas sobre el candidato fusionado. Sin typecheck, build ni Firebase real.
- Pendientes: caso 7 (borrador comercial, fotos con permiso promocional verificable y presupuesto sin cambio de estado); caso 10 (informe posfiesta con datos reales y consumidor de producción); alerta de cuotas, que corresponde al equipo de Claude. `el-asistente-de-ak.test.ts` todavía no reúne los 11 casos en ese único archivo; los casos 7 y 10 tampoco están cubiertos.
- La integración local de main está en curso; la Orden 255 sigue incompleta y no está publicada.

Rama de trabajo: `claude/app-debug-stabilize-m70e6z`. Versión publicada: la integración de 1370 y 1374 (esta tanda).

## Publicado en esta tanda
- **1370 de Gemini (órdenes 247, 249, 251 y 252):** sesiones que se cortan, perfil roto que no entra, último dueño, casillas de módulos fuera, enlace del presupuesto que se apaga, factura y presupuesto que no se borran con cobros, centavos del contador, un solo número de plata (comisión, mes de pagos, seña sin presupuesto, saldo), pregunta frecuente del ajuste.
- **1374 de Gemini (orden 254):** plantillas de decoración que se publican solas y objetos nuevos a la biblioteca.
- **Completado por Claude:** dueños con candado entre servidores, presupuesto que se vuelve a mirar en la transacción del borrado, recortes achicados para que entren en la base y gasto contado siempre, tipos de la comisión y del renglón cerrado, sesión de prueba con usuario adentro en las pruebas de navegador.

## Pendiente
- **Codex** programa: orden 255 bloques 3 a 9 (sobre la 1375) y orden 253 (sobre la 1371). Claude compila, verifica y publica.
- **Gemini**: órdenes 242 a 246 y 248 (una sola propuesta).

## Para el dueño (abogado)
- Revisión legal del contrato de Codex: `docs/evidencias/738-legal-contratos-dictamen.md` en la rama de Codex. No se cambia nada sin abogado.

## Errores de plata y permisos abiertos
- Ninguno conocido después de esta publicación.
