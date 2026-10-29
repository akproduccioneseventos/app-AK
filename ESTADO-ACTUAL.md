# Estado actual — 29 de octubre de 2026
## Orden 255 en curso en la propuesta 1375
- PR en `gemini/orden-255-asistente-ak`; `main` `5c22efad3e1f16075bf1689caa6c7ca41099763a` integrado localmente. Código verificado en `b34871889529d5a3818c86b48be970b889e3ef27`.
- Cambios: entrada de audio/foto validada, comprobantes como propuestas, reserva atómica para medios, plan de reunión sin contactar clientes, anticipador de mozos, vigilancia nocturna, límites de descanso y regla del resumen matutino.
- La voz saliente sigue pendiente: no hay encoder compatible; cuando está habilitada, se informa por texto y no se intenta enviar WAV.
- Verificación en ese HEAD: 5 suites, 39 pruebas focalizadas aprobadas; ESLint y `git diff --check` aprobados. No se hizo typecheck, build ni Firebase real.
- Graphify se actualizó; avisó que no pudo analizar `src/types/fiesta.ts:1597`. No se verificó si afecta compilación.
- Pendientes: caso 7 (fotos con permiso promocional verificable y presupuesto verdaderamente en borrador); caso 10 (informe posfiesta con datos reales y consumidor de producción); prospectos que se enfrían y cuotas atrasadas (estas últimas para Claude). `el-asistente-de-ak.test.ts` aún no reúne los 11 casos en ese único archivo.
- Orden 255 incompleta y sin publicar. La PR queda abierta; Claude debe correr typecheck/build y verificar el conjunto.

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
