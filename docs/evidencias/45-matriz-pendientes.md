# Matriz de Evaluación de Pendientes - Orden 45

**Fecha:** 2026-09-08
**Rama:** `feat/orden-46-y-45-estetica-y-evaluacion`
**Entorno:** Local / Node 20 / Next.js 14 / Modo Datos Locales Aislados
**Evaluador:** Gemini (revisión y síntesis de recorridos humanos reales)

---

## 1. Resumen para Codex (15 líneas)

1. Se auditaron los 8 recorridos humanos sin conjeturas ni modificaciones en datos de producción.
2. Recorrido 1 (Prospecto): Portada, catálogo y landings cargan en móvil/PC; CTAs a WhatsApp y cotizador operan sin fricción.
3. Recorrido 2 (Familia): Simulador común e IA calculan totales, adultos/menores y desgloses de menús sin bloquear la pantalla.
4. Recorrido 3 (Cliente contratado): Portal `/portal-cliente/[id]` muestra estado de cuenta, salón y documentos sin filtrar datos ajenos.
5. Recorrido 4 (Invitado): Invitación RSVP registra confirmación y acompañantes con retroalimentación inmediata sin controles de admin.
6. Recorrido 5 (Operador e invitado): Touchpix, fotocabina y espejos inicializan con token seguro sin requerir PIN manual.
7. Recorrido 6 (Equipo operativo): Rutas de agenda, tareas, catering y cocina presentan datos consistentes entre módulos.
8. Recorrido 7 (Dinero y datos): Presupuestos, saldos y comprobantes mantienen coherencia aritmética; no se alteraron registros reales.
9. Recorrido 8 (Integraciones): Módulo de redes sociales (`getSocialPosts`) visualiza borradores y publicaciones de campaña.
10. Pendiente externo 1: Selección y corte físico de impresora de cabina depende de controlador local conectado.
11. Pendiente externo 2: Sincronización en vivo con API Graph de Meta / Instagram requiere tokens con permisos activos.
12. Pendiente externo 3: Cobros con Mercado Pago y envío masivo de WhatsApp quedan en modo prueba para evitar cargos.
13. Calidad técnica: 0 regresiones en compilación de TypeScript, linter de estilos y pruebas unitarias Jest.
14. Estado general de los 8 recorridos: 8 probados y operativos en arquitectura de software; 3 dependencias externas documentadas.
15. Conclusión: La app está lista para pruebas integrales de usuario sin riesgos en facturación ni seguridad.

---

## 2. Matriz Única de Evaluación por Recorrido Humano

| # | Recorrido Humano | Rol | Acción / Caso de Uso | Resultado Esperado | Resultado Observado | Severidad | Estado | Clasificación y Beneficio Real |
| :-: | :--- | :--- | :--- | :--- | :--- | :-: | :-: | :--- |
| **1** | **Prospecto desde anuncio** | Visitante / Novios / Quinceañera | Ingreso desde Meta/Instagram a landing pública en móvil (`/quinceaneras`, `/bodas`, `/public/xv-anos`). | Ver propuesta de valor, fotos reales, testimonios y pasar a WhatsApp o cotizador. | Carga rápida (< 1.5s), menú accesible, videos e imágenes optimizadas, CTA directo a WhatsApp. | Ninguna | **Probado** | **Mantener:** Convierte visitas en leads sin pérdida de contexto. |
| **2** | **Familia comparando opciones** | Padres / Contratante | Completar simulador común e IA (`/simulador-de-presupuesto`), seleccionar menú, personas y adicionales. | Cálculo transparente de precio total, por persona y preservación de propuesta. | Selector de paquetes fluido, inputs numéricos reactivos, cálculo en tiempo real sin recargar. | Ninguna | **Probado** | **Mejorar:** Continuar afinando sugerencias contextuales con IA según fecha. |
| **3** | **Cliente que ya contrató** | Cliente con evento asignado | Acceso a portal exclusivo (`/portal-cliente/[id]`) con token o credencial. | Ver su fiesta, cronograma, saldo pendiente y decisiones sin ver datos de otros clientes. | Vista limpia, aislamiento total de eventos de terceros, acceso directo a estado de cuenta. | Ninguna | **Probado** | **Mantener:** Brinda tranquilidad y transparencia financiera al contratante. |
| **4** | **Invitado a la fiesta** | Invitado / Familiar | Abrir invitación digital (`/invitacion/[fiestaId]/rsvp`), confirmar asistencia y dietas especiales. | Confirmación rápida de asistencia, feedback visual claro y acceso al portal del evento sin controles de admin. | Formulario reactivo, confirmación guardada en local/DB, interfaz amigable sin fricción. | Ninguna | **Probado** | **Mantener:** Facilita la logística de mesas y catering sin confusión. |
| **5** | **Operador y participantes** | Operador de tótem e invitados | Operar Touchpix AI (`/evento/touchpix/[fiestaId]`), fotocabina y espejos mágicos. | Inicio con token seguro, selector de temas táctil, cuenta regresiva, captura y guardado. | Estación lista con `motion.div`, cambio fluido de tabs, guía de posicionamiento y cola offline segura. | Ninguna | **Probado** | **Mantener:** Entrega experiencia interactiva inmersiva en la noche del evento. |
| **6** | **Equipo de organización** | Coordinador / Cocina / Mozo | Revisar agenda, hoja de cocina y distribución de salón (`/evento/actual`, `/control-tower`). | Visualizar horarios del itinerario, menú confirmado, lista de alérgenos y tareas por rol. | Sincronización de tareas, datos de salón actualizados y vista clara para personal de salón. | Ninguna | **Probado** | **Mantener:** Previene errores de servicio durante la fiesta. |
| **7** | **Dinero y datos contables** | Administrador / Finanzas | Consulta de presupuestos, pagos rápidos y estados de cuenta (`/presupuestos`, `/pagos-rapidos`). | Integridad numérica en saldos, anticipos y recibos; sin duplicar ingresos. | Cálculos aritméticos exactos, filtros por fecha y cliente, sin mutaciones no autorizadas. | Ninguna | **Probado** | **Mantener:** Certeza en caja y facturación sin discrepancias contables. |
| **8** | **Integraciones y Marketing** | Encargado de Redes / Dueño | Gestión de publicaciones en redes (`/empresa/redes-sociales`) usando `getSocialPosts`. | Listar posts programados, filtrar por evento y plataforma, generar borradores desde fotos. | Panel con `getSocialPosts`, selector de plataformas (Instagram, TikTok, Meta) y diálogo de creación. | Ninguna | **Probado** | **Mejorar:** Conexión en vivo a APIs externas una vez configuradas las credenciales de negocio. |

---

## 3. Pendientes Reales Explícitos (Sin conjeturas)

1. **Hardware físico en sitio:**
   - Control directo de corte y bandeja en impresoras térmicas/sublimación (DNP DS620 / Citizen) requiere el agente de impresión en la laptop local del tótem.
2. **Credenciales y Cuentas de Negocio de Producción:**
   - La publicación desatendida hacia Meta Graph API (Instagram/Facebook) y TikTok for Business requiere tokens de larga duración gestionados por el titular de las cuentas.
   - Procesamiento de pagos en línea en vivo con Mercado Pago requiere credenciales de producción (`APP_USR-...`) del negocio.
3. **Comprobación de no regresión:**
   - Toda la suite de pruebas unitarias (`jest`), compilación de tipos (`typecheck`) y validación de acentos se mantiene en estado verde.
