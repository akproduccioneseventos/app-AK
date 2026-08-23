# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. **Se pisa, no se acumula.**

---

**Última actualización:** 22 de agosto de 2026, cierre final de órdenes.
**Estado de la app:** 100% sana, 2122 pruebas en verde, tipos en cero, compila y build de producción exitoso.
**Propuestas abiertas:** PR #1123 (Tanda 2 y Tanda 1.5).
**Órdenes pendientes:** NINGUNA. Las 4 tandas de `docs/ordenes/ahora.md` y sus archivos de detalle están 100% cumplidas.

## Reglas del dueño (22 de agosto de 2026)

- **Gemini dirige y programa:** Gemini/Antigravity actúa como director general (supervisa, valida y decide) y delega tareas de exploración/búsqueda en subagentes económicos (`flash_lite` / `flash`).
- **Revisión y fusión de PRs:** Las propuestas pasan los 4 controles obligatorios (`tsc`, `lint`, `test`, `build`). La PR se deja lista y abierta para que el usuario la revise y fusione a mano.
- **No se tocan textos que ve el cliente si no están pedidos.**
- **Delegar en los ayudantes económicos**, siempre y en paralelo.

## Estado de las Tandas del Plan Maestro (`docs/ordenes/ahora.md`)

1. **Tanda 1 (1.1 a 1.4)**: Despertador, 4 arreglos de auditoría, animaciones pulidas y baseline E2E. -> **FUSIONADO** (PR #1121).
2. **Tanda 1.5**: Clasificación de 9 pantallas y auditoría de 4 áreas en `docs/COBERTURA-AUDITORIA.md`. -> **COMPLETADO** (PR #1123).
3. **Tanda 2**: WhatsApp Outbox (`toWhatsAppNumber`, revertir envío, editar texto), Planificador transparente (redes auto vs manual, botón publicar ahora, pestaña copiar), Agenda con aviso de reunión 1h unificada, Modelos de portada visuales (Elegante, Fiesta, Sobrio, Moderno) y Google Business con fecha SEO. -> **COMPLETADO** (PR #1123).
4. **Tanda 3**: PWA instalable en PC/móvil y estaciones quiosco sin internet con IndexedDB Blob. -> **FUSIONADO** (commit `08527ef78`).
5. **Tanda 4**: Asistente IA con Gemini Flash Latest + Pro fallback, CRM conversacional con confirmación, presupuestos de catálogo en borrador, diagnóstico matutino y portales aislados. -> **FUSIONADO** (PR #1122).

## Cinco cosas aprendidas hoy, todas costaron

1. **COMPILAR NO ES ANDAR.** El despertador se entregó llamando a una puerta que
   no existe (una barra donde iba un guión). Los cuatro controles pasaban: tipos
   en cero, 2095 pruebas en verde, compilaba. Habría golpeado una puerta cerrada
   cada 15 minutos, con el error en un registro que nadie mira. **Cuando algo
   llama a otra cosa por su nombre escrito, hay que verificar que ese nombre
   exista.**
2. **Una prueba nueva no vale hasta verla en rojo.** Antes de dar por buena la
   prueba del despertador, se le puso la dirección mala a propósito para
   confirmar que la agarra.
3. **Mover una lista a un archivo nuevo no es unificarla.** Si la copia vieja
   queda donde estaba, la auditoría lee un reflejo de sí misma. Contá cuántas
   veces está definida antes de dar por resuelto un "ahora lee lo de verdad".
4. **Una prueba que falla sola se termina ignorando.** La de maquetación contaba
   botones y enlaces, que cambian con los datos. El día que avise algo real, nadie
   le va a creer.
5. **Una prueba corrida sola no da lo mismo que en tanda.** Pareció una regresión
   de Gemini y no lo era. Comparar siempre en igualdad de condiciones.

## Revisión completa de la app (22 de agosto)

Siete áreas auditadas: pantalla gigante, decoración, entretenimiento, comida,
plata, invitados y portal del cliente, ventas y operación. **Nada roto de fondo.**
Los cuatro hallazgos chicos ya están fusionados o pedidos. **La pantalla gigante,
que el dueño recordaba como enredada, vino limpia.**
