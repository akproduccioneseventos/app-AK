# Informe de Auditoría Mecánica Continua

**Fecha de ejecución:** jueves, 20 de agosto de 2026, 3:54:13 p. m. (2026-08-20T18:54:13.978Z)
**Método:** Conteo mecánico exacto sobre archivos de código (sin IA, cero opiniones).

---

## Resumen de Resultados (4 Números)

- **1. Tareas automáticas sin rastro:** 4 hallazgos
- **2. Elementos huérfanos o solo en tests:** 159 hallazgos
- **3. Datos simulados o inventados en UI:** 1 hallazgos
- **4. Promesas automáticas en pantalla:** 120 frases a contrastar

---

### Pasada 1: ¿Dejó rastro? (Tareas automáticas) (4)

| Archivo | Línea | Detalle del hallazgo |
| :--- | :--- | :--- |
| `src/app/api/cron/generate-blog-post/route.ts` | 1 | Tarea cron "generate-blog-post": figura como "NUNCA CORRIÓ" (sin marca registrada en el servidor). |
| `src/app/api/cron/metricas-de-redes/route.ts` | 1 | Tarea cron "metricas-de-redes": figura como "NUNCA CORRIÓ" (sin marca registrada en el servidor). |
| `src/app/api/cron/publicar-programados/route.ts` | 1 | Tarea cron "publicar-programados": figura como "NUNCA CORRIÓ" (sin marca registrada en el servidor). |
| `src/app/api/cron/recordatorios-de-pago/route.ts` | 1 | Tarea cron "recordatorios-de-pago": figura como "NUNCA CORRIÓ" (sin marca registrada en el servidor). |

### Pasada 2: ¿Alguien lo llama? (Elementos huérfanos o solo en tests) (159)

| Archivo | Línea | Detalle del hallazgo |
| :--- | :--- | :--- |
| `src/components/assistant/contextual-assistant-indicator.tsx` | 1 | Componente "contextual-assistant-indicator" huérfano (0 referencias de importación en todo el código). |
| `src/components/dashboard/ShareLinkDialog.tsx` | 1 | Componente "ShareLinkDialog" solo aparece en tests (1 referencias en tests), no se usa en producción. |
| `src/components/decoracion/VistaDecorativaEditor.tsx` | 1 | Componente "VistaDecorativaEditor" huérfano (0 referencias de importación en todo el código). |
| `src/components/games/LeaderboardDisplay.tsx` | 1 | Componente "LeaderboardDisplay" huérfano (0 referencias de importación en todo el código). |
| `src/components/games/TriviaAdminPanel.tsx` | 1 | Componente "TriviaAdminPanel" huérfano (0 referencias de importación en todo el código). |
| `src/components/gastronomia/InsumosStockList.tsx` | 1 | Componente "InsumosStockList" huérfano (0 referencias de importación en todo el código). |
| `src/components/invitacion/GiftRegistryConfig.tsx` | 1 | Componente "GiftRegistryConfig" huérfano (0 referencias de importación en todo el código). |
| `src/components/invitacion/GiftRegistryModal.tsx` | 1 | Componente "GiftRegistryModal" huérfano (0 referencias de importación en todo el código). |
| `src/components/invitados/InvitadoQR.tsx` | 1 | Componente "InvitadoQR" huérfano (0 referencias de importación en todo el código). |
| `src/components/landing/CommercialJourneySection.tsx` | 1 | Componente "CommercialJourneySection" huérfano (0 referencias de importación en todo el código). |
| `src/components/landing/InstagramSyncStrip.tsx` | 1 | Componente "InstagramSyncStrip" solo aparece en tests (1 referencias en tests), no se usa en producción. |
| `src/components/landing/ProcessSection.tsx` | 1 | Componente "ProcessSection" huérfano (0 referencias de importación en todo el código). |
| `src/components/landing/StatsSection.tsx` | 1 | Componente "StatsSection" huérfano (0 referencias de importación en todo el código). |
| `src/components/landing/WinSechWidgets.tsx` | 1 | Componente "WinSechWidgets" solo aparece en tests (1 referencias en tests), no se usa en producción. |
| `src/components/marketing-banner.tsx` | 1 | Componente "marketing-banner" solo aparece en tests (1 referencias en tests), no se usa en producción. |
| `src/components/presupuestos/BudgetPrintTemplate.tsx` | 1 | Componente "BudgetPrintTemplate" solo aparece en tests (2 referencias en tests), no se usa en producción. |
| `src/components/receipt-processor.tsx` | 1 | Componente "receipt-processor" huérfano (0 referencias de importación en todo el código). |
| `src/components/rsvp/RsvpReminderPanel.tsx` | 1 | Componente "RsvpReminderPanel" huérfano (0 referencias de importación en todo el código). |
| `src/components/social-wall/QrFlyerGenerator.tsx` | 1 | Componente "QrFlyerGenerator" huérfano (0 referencias de importación en todo el código). |
| `src/app/actions/ak-100.ts` | 10 | Acción "getAk100Readiness" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/alertas.actions.ts` | 26 | Acción "getAlertasPorFiesta" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/alertas.actions.ts` | 88 | Acción "resetAlertasLeidas" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/alertas.actions.ts` | 99 | Acción "getAlertasNoLeidas" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/approvals.ts` | 30 | Acción "getAprobacionById" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/assistant.ts` | 428 | Acción "sendAssistantMessage" solo se llama en tests (2 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/audit-log.ts` | 9 | Acción "logAuditEvent" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/audit-log.ts` | 47 | Acción "getAuditLogsByFiesta" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/auth.ts` | 103 | Acción "initializeAdminIfNeeded" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/auth.ts` | 212 | Acción "getSecurityQuestions" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/auth.ts` | 259 | Acción "resetPasswordWithQuestions" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/auth.ts` | 321 | Acción "changePassword" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/auth.ts` | 367 | Acción "updateSecurityQuestions" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/auth.ts` | 407 | Acción "getUserSecurityQuestionsForEdit" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/bebidas.actions.ts` | 28 | Acción "saveBebidasMasterTemplate" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/blog-ai.ts` | 6 | Acción "generateAIBlogPostFromAdmin" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/catalogo-fotos.ts` | 21 | Acción "updateCatalogoFoto" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/catalogo-fotos.ts` | 37 | Acción "toggleCatalogoFotoDestacada" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/catalogo-fotos.ts` | 47 | Acción "getCatalogoFotosByCategoria" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/catalogo-fotos.ts` | 69 | Acción "uploadCatalogoFotoFromFile" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/cupones.ts` | 19 | Acción "getCuponById" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/cupones.ts` | 160 | Acción "getCuponesRegaloActivos" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/cupones.ts` | 344 | Acción "getAllCuponUsages" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/customers.ts` | 263 | Acción "getContractFilePath" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/customers.ts` | 271 | Acción "getBudgetFilePath" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/customers.ts` | 279 | Acción "getSalonContractFilePath" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/customers.ts` | 374 | Acción "addDocumentReferenceToCustomer" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/empleados.ts` | 179 | Acción "verificarAgendaEmpleado" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/empleados.ts` | 216 | Acción "fiestasDelMismoDiaConEmpleado" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/evento-en-vivo.ts` | 43 | Acción "getFotosEnVivo" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/evento-en-vivo.ts` | 192 | Acción "getSolicitudesCanciones" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/evento-en-vivo.ts` | 242 | Acción "getMensajesEnVivo" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/evento-en-vivo.ts` | 292 | Acción "getVotaciones" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/experience-total.ts` | 149 | Acción "getExperienceTotalReport" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/experience-total.ts` | 156 | Acción "activateUltimateEventSystem" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/feature-flags.ts` | 79 | Acción "setEventTier" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/feature-flags.ts` | 114 | Acción "setEventModuleOverride" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/feature-flags.ts` | 162 | Acción "isModuleEnabled" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/feature-flags.ts` | 191 | Acción "getEnabledModulesForEvent" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta/decoracion.actions.ts` | 65 | Acción "toggleLikeMoodboardItem" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta/fiesta.actions.ts` | 1155 | Acción "updateGuestExperienceStats" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta/invitados.actions.ts` | 154 | Acción "updateGuestRsvp" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta/invitados.actions.ts` | 318 | Acción "updateGuestDetails" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta/live.actions.ts` | 22 | Acción "updateLiveState" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta/screen-mode.actions.ts` | 461 | Acción "trackSocialFollowClick" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta/screen-playlist.actions.ts` | 27 | Acción "updatePlaylistItem" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta-actual.ts` | 88 | Acción "getInvitadosFiestaActual" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta-actual.ts` | 91 | Acción "handleRsvpSubmissionFiestaActual" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta-actual.ts` | 106 | Acción "updateClientChecklistFiestaActual" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta-actual.ts` | 107 | Acción "updateClientNotesFiestaActual" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta-actual.ts` | 111 | Acción "getZonaDigitalSettingsFiestaActual" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta-actual.ts` | 116 | Acción "saveSugerenciaMusicalFiestaActual" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta-actual.ts` | 121 | Acción "updateListaDeCargaOperativaFiestaActual" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta-actual.ts` | 140 | Acción "claimGiftFiestaActual" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/fiesta-actual.ts` | 141 | Acción "addGiftToRegistryFiestaActual" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/galeria.ts` | 68 | Acción "updateGaleriaItem" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/galeria.ts` | 86 | Acción "reorderGaleriaItems" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/galeria.ts` | 132 | Acción "getGaleriaFotosByServicio" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/games.actions.ts` | 13 | Acción "saveTriviaGame" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/games.actions.ts` | 25 | Acción "getTriviaGame" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/games.actions.ts` | 31 | Acción "savePhotoMissions" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/games.actions.ts` | 43 | Acción "getPhotoMissions" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/google-workspace-extended.ts` | 323 | Acción "getFiestaCalendarShareLinks" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/google-workspace-extended.ts` | 507 | Acción "notifyContractSignedToClient" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/google-workspace-extended.ts` | 530 | Acción "notifyPresupuestoPaymentRegistered" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/incidents.ts` | 36 | Acción "updateIncidente" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/incidents.ts` | 99 | Acción "cerrarIncidente" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/initialize-events.ts` | 48 | Acción "initializeEventsForAllCustomers" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/invitacion-config.ts` | 16 | Acción "getInvitacionConfig" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/invitacion-config.ts` | 27 | Acción "saveInvitacionConfig" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/invitacion-config.ts` | 47 | Acción "getAllInvitacionConfigs" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/invoices.ts` | 686 | Acción "scanAndTriggerPaymentReminders" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/menus-catering.ts` | 15 | Acción "invalidateMenusCache" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/mission-control.ts` | 154 | Acción "getMissionControl" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/mission-control.ts` | 169 | Acción "updateMissionControl" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/mission-control.ts` | 179 | Acción "updateEtapaEstado" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/mission-control.ts` | 231 | Acción "addNotaEtapa" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/mission-control.ts` | 248 | Acción "addEtapa" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/mission-control.ts` | 270 | Acción "updateEtapa" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/notifications.ts` | 134 | Acción "markNotificationAsRead" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/notifications.ts` | 320 | Acción "checkAndCreateEventAlerts" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/notifications.ts` | 385 | Acción "checkAndCreatePendingBalanceAlerts" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/playbooks.ts` | 19 | Acción "getPlaybookById" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/playbooks.ts` | 25 | Acción "getPlaybookByTipoEvento" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/playbooks.ts` | 31 | Acción "createPlaybook" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/playbooks.ts` | 52 | Acción "updatePlaybook" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/playbooks.ts` | 69 | Acción "deletePlaybook" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/playbooks.ts` | 154 | Acción "getPlaybookAplicaciones" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/preparation-score.ts` | 8 | Acción "getFiestaPreparationScore" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/preparation-score.ts` | 39 | Acción "guardarPreparacionComoAprendizaje" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/public-guest-portal.ts` | 106 | Acción "getPublicGuestEntertainmentLinks" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/roles.ts` | 31 | Acción "getRolById" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/scheduled-messages.ts` | 123 | Acción "generateWhatsAppClickUrl" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/scheduled-messages.ts` | 133 | Acción "getPendingMessagesForToday" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/settings.ts` | 387 | Acción "getContractTemplateByType" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/simulador-v2.ts` | 25 | Acción "checkDuplicateClient" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/simulador-v2.ts` | 118 | Acción "saveSimuladorV2Lead" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/social-connections.ts` | 122 | Acción "saveMetaPublishingCredentials" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/social-gallery.ts` | 264 | Acción "getSocialAdminAccess" solo se llama en tests (2 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/social-gallery.ts` | 268 | Acción "saveSocialGallerySettings" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/social-gallery.ts` | 668 | Acción "highlightComment" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/social-history.ts` | 114 | Acción "getSocialHistorySummary" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/social-interactive.ts` | 67 | Acción "getPolls" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/social-interactive.ts` | 366 | Acción "highlightDedication" solo se llama en tests (1 referencias en tests), no tiene uso en pantallas. |
| `src/app/actions/social-interactive.ts` | 383 | Acción "addSorteoParticipanteRedes" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/social-interactive.ts` | 415 | Acción "addSorteoGanador" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/social-interactive.ts` | 436 | Acción "activateMomento" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/touchpix-ai.ts` | 772 | Acción "getTouchpixThemes" huérfana (0 imports o llamadas en todo el código). |
| `src/app/actions/touchpix-ai.ts` | 786 | Acción "getTouchpixCharacters" huérfana (0 imports o llamadas en todo el código). |
| `src/app/(app)/contabilidad/crm/marketing-ads/page.tsx` | 1 | Pantalla "/contabilidad/crm/marketing-ads" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/empresa/dashboard/page.tsx` | 1 | Pantalla "/empresa/dashboard" solo tiene enlaces en tests (2 tests), no está enlazada en el menú. |
| `src/app/(app)/empresa/personal/[empleadoId]/historial/page.tsx` | 1 | Pantalla "/empresa/personal/[empleadoId]/historial" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/empresa/presentacion-led/configuracion/page.tsx` | 1 | Pantalla "/empresa/presentacion-led/configuracion" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/empresa/todos-los-servicios/[id]/editar/page.tsx` | 1 | Pantalla "/empresa/todos-los-servicios/[id]/editar" solo tiene enlaces en tests (1 tests), no está enlazada en el menú. |
| `src/app/(app)/fiestas/[id]/centro-de-mando/page.tsx` | 1 | Pantalla "/fiestas/[id]/centro-de-mando" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/fiestas/[id]/centro-experiencia/page.tsx` | 1 | Pantalla "/fiestas/[id]/centro-experiencia" solo tiene enlaces en tests (1 tests), no está enlazada en el menú. |
| `src/app/(app)/fiestas/[id]/cierre-mundial/page.tsx` | 1 | Pantalla "/fiestas/[id]/cierre-mundial" solo tiene enlaces en tests (1 tests), no está enlazada en el menú. |
| `src/app/(app)/fiestas/[id]/experiencia-tecnologica-ak/page.tsx` | 1 | Pantalla "/fiestas/[id]/experiencia-tecnologica-ak" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/fiestas/[id]/show-control/page.tsx` | 1 | Pantalla "/fiestas/[id]/show-control" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/fiestas/nueva/accesos-personal/page.tsx` | 1 | Pantalla "/fiestas/nueva/accesos-personal" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/fiestas/nueva/alergias/page.tsx` | 1 | Pantalla "/fiestas/nueva/alergias" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/fiestas/nueva/buzon/page.tsx` | 1 | Pantalla "/fiestas/nueva/buzon" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/fiestas/nueva/carteleria/page.tsx` | 1 | Pantalla "/fiestas/nueva/carteleria" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/fiestas/nueva/fiesta-lista/page.tsx` | 1 | Pantalla "/fiestas/nueva/fiesta-lista" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/fiestas/nueva/invitados/numeros-mesa/page.tsx` | 1 | Pantalla "/fiestas/nueva/invitados/numeros-mesa" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/fiestas/nueva/logistica/page.tsx` | 1 | Pantalla "/fiestas/nueva/logistica" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/fiestas/nueva/playlist-pantalla/page.tsx` | 1 | Pantalla "/fiestas/nueva/playlist-pantalla" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/fiestas/nueva/proveedores-portal/page.tsx` | 1 | Pantalla "/fiestas/nueva/proveedores-portal" solo tiene enlaces en tests (1 tests), no está enlazada en el menú. |
| `src/app/(app)/fiestas/nueva/reuniones/imprimir/page.tsx` | 1 | Pantalla "/fiestas/nueva/reuniones/imprimir" solo tiene enlaces en tests (1 tests), no está enlazada en el menú. |
| `src/app/(app)/repaso-diario/page.tsx` | 1 | Pantalla "/repaso-diario" solo tiene enlaces en tests (1 tests), no está enlazada en el menú. |
| `src/app/(app)/settings/ai-assistant/page.tsx` | 1 | Pantalla "/settings/ai-assistant" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/settings/contratos/clausulas/page.tsx` | 1 | Pantalla "/settings/contratos/clausulas" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/settings/mapa-tecnologico-ak/page.tsx` | 1 | Pantalla "/settings/mapa-tecnologico-ak" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/(app)/settings/promos/page.tsx` | 1 | Pantalla "/settings/promos" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/compras/page.tsx` | 1 | Pantalla "/compras" solo tiene enlaces en tests (2 tests), no está enlazada en el menú. |
| `src/app/marketing/checklist/page.tsx` | 1 | Pantalla "/marketing/checklist" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/marketing/plantillas/page.tsx` | 1 | Pantalla "/marketing/plantillas" huérfana (no existe ningún enlace o botón que lleve a ella). |
| `src/app/prospectos/[prospectId]/page.tsx` | 1 | Pantalla "/prospectos/[prospectId]" solo tiene enlaces en tests (2 tests), no está enlazada en el menú. |
| `src/app/prospectos/page.tsx` | 1 | Pantalla "/prospectos" solo tiene enlaces en tests (2 tests), no está enlazada en el menú. |
| `src/app/recursos-multi-evento/page.tsx` | 1 | Pantalla "/recursos-multi-evento" huérfana (no existe ningún enlace o botón que lleve a ella). |

### Pasada 3: ¿Muestra datos inventados? (Simulaciones y fallbacks engañosos) (1)

| Archivo | Línea | Detalle del hallazgo |
| :--- | :--- | :--- |
| `src/components/public/BlogFaq.tsx` | 22 | Posible dato simulado sin advertencia en UI: "answer: '¡Por supuesto! Todas nuestras barras de coctelería incluyen mocktails (" |

### Pasada 4: ¿Se cumple lo que promete la pantalla? (Promesas visibles al usuario) (120)

| Archivo | Línea | Detalle del hallazgo |
| :--- | :--- | :--- |
| `src/app/(app)/admin/page.tsx` | 107 | Promesa en pantalla ("al instante"): "{ title: 'Cobros / Pagos Rápidos', description: 'Registrar cobros y enviar recibos al inst" |
| `src/app/(app)/admin/page.tsx` | 230 | Promesa en pantalla ("en tiempo real"): "<span>Gestión operativa, comercial y financiera en tiempo real.</span>" |
| `src/app/(app)/calendario/page.tsx` | 793 | Promesa en pantalla ("automáticamente"): ": 'Agendá una reunión de ventas. Se sincroniza automáticamente con Google Calendar, Gmail " |
| `src/app/(app)/contabilidad/crm/atraccion-fiestas/page.tsx` | 212 | Promesa en pantalla ("automáticamente"): "Los prospectos empezarán a contarse automáticamente cuando los invitados entren por los en" |
| `src/app/(app)/contabilidad/fiestas-historicas/page.tsx` | 263 | Promesa en pantalla ("automáticamente"): "Generar Todo Automáticamente" |
| `src/app/(app)/empresa/dashboard/page.tsx` | 82 | Promesa en pantalla ("en tiempo real"): "<p className="text-sm text-slate-500">Métricas globales y alertas operativas en tiempo rea" |
| `src/app/(app)/empresa/landing-editor/page.tsx` | 541 | Promesa en pantalla ("automáticamente"): "<p className="text-[10px] text-muted-foreground">Usá saltos de línea (\n) para separar lín" |
| `src/app/(app)/empresa/page.tsx` | 53 | Promesa en pantalla ("automáticamente"): "description: 'Administrá los salones con los que trabajás. Seleccioná un salón en cada eve" |
| `src/app/(app)/empresa/page.tsx` | 130 | Promesa en pantalla ("en tiempo real"): "description: 'Editá textos, colores, imágenes y estadísticas de tu página pública. Cambios" |
| `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx` | 767 | Promesa en pantalla ("automáticamente"): "Llenar la semana de publicaciones automáticamente" |
| `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx` | 872 | Promesa en pantalla ("automáticamente"): "<span>Comentarios ocultados automáticamente ({commentsData.autoHiddenComments.length})</sp" |
| `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx` | 1680 | Promesa en pantalla ("todos los días"): "plataformas no dan datos hacia atrás, la app guarda una foto de tus números todos los días" |
| `src/app/(app)/empresa/salones/experiencia-visual/page.tsx` | 135 | Promesa en pantalla ("automáticamente"): "<div className="rounded-md bg-white p-3 text-muted-foreground">Club Uruguay queda prioriza" |
| `src/app/(app)/empresa/salones/page.tsx` | 624 | Promesa en pantalla ("automáticamente"): "Gestioná los salones con los que trabajás. Al crear un evento podés seleccionar un salón y" |
| `src/app/(app)/empresa/servicios/nuevo/page.tsx` | 210 | Promesa en pantalla ("automáticamente"): "<p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Este valor se " |
| `src/app/(app)/fiestas/nueva/carga-operativa/page.tsx` | 879 | Promesa en pantalla ("automáticamente"): "El sistema ahora calcula automáticamente:" |
| `src/app/(app)/fiestas/nueva/carga-operativa/pdf/page.tsx` | 193 | Promesa en pantalla ("al instante"): "Cada tilde de carga o devolución se guarda al instante. El enlace compartido permite entra" |
| `src/app/(app)/fiestas/nueva/carta-tragos/page.tsx` | 107 | Promesa en pantalla ("se sincroniza"): "toast({ title: 'Base sincronizada', description: 'Se actualizaron los tragos base del módu" |
| `src/app/(app)/fiestas/nueva/carteleria/page.tsx` | 609 | Promesa en pantalla ("automáticamente"): "Se detectaron <strong>{salonTableCount} mesas</strong> en el Diseño de Salón y se usaron a" |
| `src/app/(app)/fiestas/nueva/carteleria/page.tsx` | 620 | Promesa en pantalla ("en tiempo real"): "<SheetDescription>Personalizá cada pieza y visualizá los cambios en tiempo real.</SheetDes" |
| `src/app/(app)/fiestas/nueva/catering/page.tsx` | 161 | Promesa en pantalla ("automáticamente"): "toast({ title: "Menú actualizado automáticamente" });" |
| `src/app/(app)/fiestas/nueva/catering/page.tsx` | 269 | Promesa en pantalla ("automáticamente"): "Los cambios se guardan automáticamente al modificar menús, bebidas o repostería." |
| `src/app/(app)/fiestas/nueva/catering/page.tsx` | 279 | Promesa en pantalla ("automáticamente"): "El presupuesto incluye servicios de bebidas/barra. La sección de <strong>Barra de Tragos</" |
| `src/app/(app)/fiestas/nueva/catering/page.tsx` | 295 | Promesa en pantalla ("automáticamente"): "<CardDescription>Selecciona una plantilla del catálogo. Los ingredientes se sumarán a la l" |
| `src/app/(app)/fiestas/nueva/configuracion/page.tsx` | 401 | Promesa en pantalla ("automáticamente"): "<p className="text-xs text-muted-foreground">Usá el botón de sincronizar para actualizar a" |
| `src/app/(app)/fiestas/nueva/configuracion/page.tsx` | 453 | Promesa en pantalla ("automáticamente"): "<p className="text-xs text-muted-foreground">Al seleccionar un salón se completarán automá" |
| `src/app/(app)/fiestas/nueva/decoracion/page.tsx` | 665 | Promesa en pantalla ("automáticamente"): "setAutoSaveError('No se pudo guardar automáticamente — reintentando...');" |
| `src/app/(app)/fiestas/nueva/decoracion/page.tsx` | 869 | Promesa en pantalla ("automáticamente"): "<CardDescription>Elegí el estilo y se aplicará la paleta de colores automáticamente</CardD" |
| `src/app/(app)/fiestas/nueva/entretenimiento/page.tsx` | 213 | Promesa en pantalla ("al instante"): "description: 'Videos en slow motion con giros de cámara, intros/outros cinemáticas, speed " |
| `src/app/(app)/fiestas/nueva/entretenimiento/page.tsx` | 483 | Promesa en pantalla ("al instante"): "qrCallout: 'Escaneá y llevate tu recuerdo al instante'," |
| `src/app/(app)/fiestas/nueva/entretenimiento/page.tsx` | 1740 | Promesa en pantalla ("automáticamente"): "Este audio sonará automáticamente en la tablet cuando el invitado vaya a dejar su saludo." |
| `src/app/(app)/fiestas/nueva/fotografia/page.tsx` | 303 | Promesa en pantalla ("automáticamente"): "<p>● Sincronizado automáticamente: Solo Fotografía y Filmación.</p>" |
| `src/app/(app)/fiestas/nueva/itinerario/page.tsx` | 428 | Promesa en pantalla ("se sincroniza"): "<CardDescription>Organiza cada momento de la fiesta. Los cambios se sincronizan solos.</Ca" |
| `src/app/(app)/fiestas/nueva/modulo-invitado/page.tsx` | 234 | Promesa en pantalla ("automáticamente"): "<strong>Cada invitado tiene su propio link único</strong> que se genera automáticamente al" |
| `src/app/(app)/fiestas/nueva/muro-social/page.tsx` | 1211 | Promesa en pantalla ("en tiempo real"): "<p className="text-xs text-muted-foreground mt-0.5">Activa el chat en tiempo real y los co" |
| `src/app/(app)/fiestas/nueva/muro-social/page.tsx` | 1550 | Promesa en pantalla ("automáticamente"): "Cuando está activo, la pantalla gigante rota automáticamente entre los ítems de la lista (" |
| `src/app/(app)/fiestas/nueva/muro-social/page.tsx` | 1836 | Promesa en pantalla ("en tiempo real"): "Lanzá juegos interactivos a la pantalla gigante con un clic. Los invitados participan en t" |
| `src/app/(app)/fiestas/nueva/muro-social/page.tsx` | 1994 | Promesa en pantalla ("en tiempo real"): "💡 Los juegos aparecen en pantalla en tiempo real (~2 s). Si tenés un ítem de tipo "Juego"" |
| `src/app/(app)/fiestas/nueva/personal/page.tsx` | 215 | Promesa en pantalla ("automáticamente"): "if (!result.success) throw new Error(result.error \|\| "No se pudo guardar automáticamente."" |
| `src/app/(app)/fiestas/nueva/personal/page.tsx` | 499 | Promesa en pantalla ("automáticamente"): "<p className="font-semibold text-sm">El aviso por correo al equipo no se pudo enviar autom" |
| `src/app/(app)/fiestas/nueva/personal/recibos/page.tsx` | 357 | Promesa en pantalla ("automáticamente"): "toast({ title: "Error al guardar automáticamente", description: result.error \|\| "No se pud" |
| `src/app/(app)/fiestas/nueva/personal/recibos/page.tsx` | 360 | Promesa en pantalla ("automáticamente"): "toast({ title: "Error al guardar automáticamente", description: error.message, variant: "d" |
| `src/app/(app)/fiestas/nueva/portal-cliente/page.tsx` | 962 | Promesa en pantalla ("automáticamente"): "<p className="text-xs text-muted-foreground">Dias previos para abrir automaticamente la pa" |
| `src/app/(app)/fiestas/nueva/post-evento/page.tsx` | 68 | Promesa en pantalla ("automáticamente"): "description: 'La compilación del ZIP ha comenzado. Se descargará automáticamente en tu nav" |
| `src/app/(app)/playbooks/page.tsx` | 89 | Promesa en pantalla ("automáticamente"): "Plantillas prediseñadas para cada tipo de evento. Aplicalas a un evento para generar tarea" |
| `src/app/(app)/settings/ai-assistant/page.tsx` | 119 | Promesa en pantalla ("automáticamente"): "title: 'âÅ¡ ï¸ Archivos no leídos automáticamente'," |
| `src/app/(app)/settings/ai-assistant/page.tsx` | 121 | Promesa en pantalla ("automáticamente"): "? `Estos archivos no fueron leídos automáticamente: ${skipped.join(', ')}. Pegá el texto o" |
| `src/app/(app)/settings/ai-assistant/page.tsx` | 122 | Promesa en pantalla ("automáticamente"): ": `${skipped[0]}: Este archivo no fue leído automáticamente; pegá el texto o subí versión " |
| `src/app/(app)/settings/ai-assistant/page.tsx` | 498 | Promesa en pantalla ("automáticamente"): "Este archivo no fue leído automáticamente; pegá el texto o subí versión TXT." |
| `src/app/(app)/settings/budget-display/page.tsx` | 559 | Promesa en pantalla ("automáticamente"): "<p className="text-[10px] text-slate-400 leading-relaxed font-medium">Porcentaje que se ap" |
| `src/app/(app)/settings/budget-display/page.tsx` | 916 | Promesa en pantalla ("automáticamente"): "<CardDescription className="text-xs">Define servicios que deben añadirse automáticamente s" |
| `src/app/(app)/settings/budget-display/page.tsx` | 927 | Promesa en pantalla ("automáticamente"): "<p className="text-[10px] font-black text-slate-400 uppercase">Añadir automáticamente:</p>" |
| `src/app/(app)/settings/company/page.tsx` | 193 | Promesa en pantalla ("automáticamente"): "<CardDescription className="text-xs">Sube una imagen de tu firma (preferiblemente con fond" |
| `src/app/(app)/settings/company/page.tsx` | 250 | Promesa en pantalla ("se sincroniza"): "Estas cuentas se sincronizan en la configuración del Portal del Cliente para cada fiesta." |
| `src/app/(app)/settings/contratos/clausulas/page.tsx` | 194 | Promesa en pantalla ("automáticamente"): "<CardDescription className="text-xs">Usá estas variables en el texto de las cláusulas. Se " |
| `src/app/(app)/settings/datos/page.tsx` | 304 | Promesa en pantalla ("automáticamente"): "Corrige automáticamente textos corruptos en Firestore (como <code>Ã±</code> por <code>ñ</c" |
| `src/app/(app)/settings/feedback/page.tsx` | 185 | Promesa en pantalla ("automáticamente"): "<p>2. El feedback del cliente aparecerá automáticamente en la sección "Feedback Recibido"." |
| `src/app/(app)/settings/google-workspace/page.tsx` | 100 | Promesa en pantalla ("se sincroniza"): "setMessage(`Se revisaron ${result.total} fiestas con fecha y se sincronizaron ${result.syn" |
| `src/app/(app)/settings/google-workspace/page.tsx` | 299 | Promesa en pantalla ("automáticamente"): "<CardDescription>Una vez conectado, el trabajo normal de la app dispara Google automaticam" |
| `src/app/(app)/settings/notifications/page.tsx` | 139 | Promesa en pantalla ("automáticamente"): "Elige qué notificaciones deseas recibir y por qué canales. Los cambios se guardan automáti" |
| `src/app/(app)/settings/tareas-automaticas/page.tsx` | 56 | Promesa en pantalla ("automáticamente"): "'¿Confirmás revisar los recordatorios de cuotas vencidas? Ningún mensaje sale automáticame" |
| `src/app/(app)/settings/tareas-automaticas/page.tsx` | 334 | Promesa en pantalla ("automáticamente"): "Para que corran automáticamente a la hora justa las 24 horas del día (incluso si nadie tie" |
| `src/app/(app)/settings/templates/reuniones/page.tsx` | 87 | Promesa en pantalla ("automáticamente"): "<CardDescription>Estos puntos aparecerán automáticamente en cada nueva reunión que agendes" |
| `src/app/(app)/settings/whatsapp/page.tsx` | 288 | Promesa en pantalla ("automáticamente"): "El sistema intenta enviar los mensajes automáticamente en segundo plano (requiere bot conf" |
| `src/app/(app)/settings/whatsapp-business/page.tsx` | 138 | Promesa en pantalla ("automáticamente"): "<p className="text-muted-foreground text-sm">Atendé clientes automáticamente desde WhatsAp" |
| `src/app/(app)/settings/whatsapp-business/page.tsx` | 222 | Promesa en pantalla ("automáticamente"): "<li>El bot responde automáticamente según el modo configurado</li>" |
| `src/app/(app)/settings/whatsapp-business/page.tsx` | 223 | Promesa en pantalla ("automáticamente"): "<li>Se crea un lead en el CRM automáticamente</li>" |
| `src/app/(app)/settings/whatsapp-business/page.tsx` | 431 | Promesa en pantalla ("automáticamente"): "desc: 'El bot solo registra el mensaje y te notifica. No responde nada automáticamente.'," |
| `src/app/(app)/settings/whatsapp-business/page.tsx` | 544 | Promesa en pantalla ("automáticamente"): "title: 'Crear lead en CRM automáticamente'," |
| `src/app/actions/ak-100.ts` | 55 | Promesa en pantalla ("automáticamente"): "descripcion: `Creada automaticamente desde AK 100% el ${now}.`," |
| `src/app/actions/assistant.ts` | 835 | Promesa en pantalla ("automáticamente"): "`⚠️ Pude leer parte del presupuesto, pero me faltó información para crearlo automáticament" |
| `src/app/actions/assistant.ts` | 921 | Promesa en pantalla ("automáticamente"): "? 'Importado automáticamente — revisar datos'" |
| `src/app/actions/assistant.ts` | 974 | Promesa en pantalla ("automáticamente"): "finalResponse = `⚠️ No pude leer el archivo automáticamente. Probá con una imagen más clar" |
| `src/app/actions/assistant.ts` | 1316 | Promesa en pantalla ("automáticamente"): "finalResponse = `⚠️ Falta información del evento. Si querés agendar una cita rápida indicá" |
| `src/app/actions/assistant.ts` | 1463 | Promesa en pantalla ("automáticamente"): "finalResponse = `⚠️ No pude ejecutar esa acción automáticamente. Podés hacerlo manualmente" |
| `src/app/actions/fiesta/barra-tecnologica.actions.ts` | 37 | Promesa en pantalla ("al instante"): "subtitle: 'Elegí tu trago en la pantalla y el barman lo ve al instante.'," |
| `src/app/actions/fiestas-historicas.ts` | 109 | Promesa en pantalla ("automáticamente"): "notas: `Generado automáticamente desde historial: ${source.nombreEvento} (${source.anioOri" |
| `src/app/actions/meeting-intelligence.ts` | 116 | Promesa en pantalla ("automáticamente"): "alertas: text ? [] : ['No hubo transcripcion suficiente para analizar automaticamente todo" |
| `src/app/actions/meeting-intelligence.ts` | 205 | Promesa en pantalla ("automáticamente"): "descripcion: `Detectada automaticamente desde la reunion "${params.reunion.titulo}".`," |
| `src/app/actions/settings.ts` | 60 | Promesa en pantalla ("automáticamente"): "Ante pandemia, emergencia, prohibición de eventos, cierre del salón, incendio, inundación," |
| `src/app/actions/simulador-copilot.ts` | 387 | Promesa en pantalla ("en tiempo real"): "response: `Dale, para ver si el ${matchedDate} está disponible te sugiero usar el calendar" |
| `src/app/actions/simulador-copilot.ts` | 447 | Promesa en pantalla ("al instante"): "response: `¡Hola! Soy Sofía. En este momento estoy funcionando en modo asistente básico, p" |
| `src/app/actions/simulator-agenda.ts` | 107 | Promesa en pantalla ("automáticamente"): "notas: `Agendado automáticamente desde el Simulador de Presupuesto.${data.presupuestoId ? " |
| `src/app/actions/social-admin.ts` | 48 | Promesa en pantalla ("al instante"): "description: 'Un espejo táctil interactivo que saca fotos de cuerpo entero y las imprime a" |
| `src/app/actions/social-media.ts` | 176 | Promesa en pantalla ("en tiempo real"): "text: '¡Diversión en el Muro Social! Capturamos sonrisas en tiempo real con nuestra fotoca" |
| `src/app/admin/carga-historicos/page.tsx` | 70 | Promesa en pantalla ("automáticamente"): "setAnalysisError("No pudimos extraer los datos automáticamente (el archivo puede ser muy p" |
| `src/app/analytics/page.tsx` | 91 | Promesa en pantalla ("en tiempo real"): "Inteligencia de negocios en tiempo real de AK Producciones." |
| `src/app/api/payments/mercadopago/webhook/route.ts` | 50 | Promesa en pantalla ("automáticamente"): "? 'Mercado Pago confirmo el cobro y el saldo se actualizo automaticamente.'" |
| `src/app/evento/barra/[fiestaId]/page.tsx` | 682 | Promesa en pantalla ("automáticamente"): "description: 'Tu pedido se enviará a la barra automáticamente cuando vuelva la señal.'," |
| `src/app/evento/barra/[fiestaId]/page.tsx` | 1574 | Promesa en pantalla ("automáticamente"): "Volviendo automáticamente al inicio en {successCountdown} segundos..." |
| `src/app/evento/bogue/layout.tsx` | 5 | Promesa en pantalla ("en tiempo real"): "description: 'Procesador de videos Boomerang en tiempo real.'," |
| `src/app/evento/dj/[fiestaId]/page.tsx` | 206 | Promesa en pantalla ("en tiempo real"): "<span>Sugerencias del público ordenadas por votos en tiempo real. Como DJ, vos tenés el co" |
| `src/app/evento/dj/[fiestaId]/page.tsx` | 236 | Promesa en pantalla ("automáticamente"): "Los pedidos de los invitados aparecen aquí automáticamente." |
| `src/app/evento/en-vivo/[fiestaId]/invitados/page.tsx` | 286 | Promesa en pantalla ("automáticamente"): "<Input disabled placeholder="Tu nombre se agrega automáticamente" className="bg-purple-800" |
| `src/app/evento/en-vivo/[fiestaId]/invitados/page.tsx` | 556 | Promesa en pantalla ("automáticamente"): "<Input disabled placeholder="Tu nombre se agrega automáticamente" className="bg-purple-950" |
| `src/app/evento/en-vivo/[fiestaId]/pantalla/page.tsx` | 291 | Promesa en pantalla ("automáticamente"): "<p className="text-sm text-rose-400 font-bold uppercase tracking-widest">Intentando recone" |
| `src/app/evento/espejo-magico/[fiestaId]/page.tsx` | 71 | Promesa en pantalla ("automáticamente"): "review: 'La foto se envía automáticamente al muro de la fiesta.'," |
| `src/app/login/page.tsx` | 41 | Promesa en pantalla ("automáticamente"): "gmailWarning: 'No se pudo confirmar la conexion con Gmail automaticamente. Podes volver a " |
| `src/app/marketing/demo-tecnologia/page.tsx` | 118 | Promesa en pantalla ("en tiempo real"): "Presenta la tecnología de AK como una experiencia completa. Selecciona un escenario para g" |
| `src/app/portal/c/[accessKey]/PublicPortalView.tsx` | 2749 | Promesa en pantalla ("al instante"): "<p className="text-xs text-white/70">Subí tu comprobante y lo verificamos al instante</p>" |
| `src/app/portal-cliente/[id]/muro-social/page.tsx` | 794 | Promesa en pantalla ("automáticamente"): "<p className="text-xs text-muted-foreground">Las fotos nuevas de los invitados aparecerán " |
| `src/app/presentacion-led/page.tsx` | 651 | Promesa en pantalla ("automáticamente"): "Suele ser la senal del salon. Reintentando automaticamente cada 10 segundos..." |
| `src/app/public/blog/[slug]/page.tsx` | 163 | Promesa en pantalla ("al instante"): "Mandanos tu fecha tentativa, invitados y tipo de evento. Te ayudamos a ordenar opciones al" |
| `src/app/quinceaneras/page.tsx` | 26 | Promesa en pantalla ("al instante"): "detailDescription="Barra de tragos de autor sin alcohol, Espejo Mágico IA con impresión al" |
| `src/app/quinceaneras/page.tsx` | 33 | Promesa en pantalla ("en tiempo real"): "{ title: 'Muro Social 4K & Discoteca', description: 'Subida de fotos en tiempo real desde " |
| `src/app/recepcion/[fiestaId]/RecepcionClient.tsx` | 67 | Promesa en pantalla ("automáticamente"): "toast({ title: 'Guardado sin conexión 📶', description: 'Se sincronizará automáticamente a" |
| `src/app/recepcion/[fiestaId]/RecepcionClient.tsx` | 84 | Promesa en pantalla ("automáticamente"): "toast({ title: 'Guardado sin conexión 📶', description: 'Se sincronizará automáticamente a" |
| `src/app/recepcion/[fiestaId]/RecepcionClient.tsx` | 94 | Promesa en pantalla ("automáticamente"): "toast({ title: 'Guardado sin conexión 📶', description: 'Se sincronizará automáticamente a" |
| `src/app/simulador/page.tsx` | 31 | Promesa en pantalla ("en tiempo real"): "description: 'Compara menus, paquetes de servicios y tecnologia mientras ves como cambia e" |
| `src/app/simulador-ak/page.tsx` | 844 | Promesa en pantalla ("al instante"): "<p className="hidden text-xs text-muted-foreground sm:block">Chateá con Sofía y armá tu pr" |
| `src/app/simulador-de-presupuesto/page.tsx` | 2429 | Promesa en pantalla ("al instante"): "¡Llegamos a la etapa final! Ajustá la fecha y los invitados, quitá opcionales de tu paquet" |
| `src/components/catering/MenuForm.tsx` | 425 | Promesa en pantalla ("automáticamente"): "toast({ title: 'Error de auto-guardado', description: error?.message \|\| 'No se pudo guarda" |
| `src/components/crm/BookingConfirmationDialog.tsx` | 104 | Promesa en pantalla ("automáticamente"): "description: "Se ha creado el cliente y activado el evento automáticamente."," |
| `src/components/crm/BookingConfirmationDialog.tsx` | 407 | Promesa en pantalla ("automáticamente"): "<p>● Se creará automáticamente la ficha del cliente.</p>" |
| `src/components/gastronomia/GestionBebidas.tsx` | 203 | Promesa en pantalla ("automáticamente"): "Activa y configura las bebidas para el evento. Los cambios se guardan automáticamente." |
| `src/components/invitacion/InvitacionConfigPanel.tsx` | 325 | Promesa en pantalla ("automáticamente"): "<p className="text-[10px] text-muted-foreground">Cambiá el color principal y TODA la invit" |
| `src/components/invitacion/edit/SeccionConfirmacion.tsx` | 51 | Promesa en pantalla ("automáticamente"): "Nota: El sistema detecta automáticamente si el evento es una Boda para adaptar las opcione" |
| `src/components/invitacion/edit/SeccionItinerario.tsx` | 41 | Promesa en pantalla ("automáticamente"): "El itinerario se toma automáticamente del módulo de "Cronograma" del planificador." |
| `src/components/payments/mercadopago-result-client.tsx` | 94 | Promesa en pantalla ("automáticamente"): ": 'Mercado Pago aprobo el cobro y el saldo del presupuesto se actualizo automaticamente.'," |
| `src/components/presupuestos/paso-2-servicios.tsx` | 125 | Promesa en pantalla ("automáticamente"): "title: "Servicio añadido automáticamente"," |
