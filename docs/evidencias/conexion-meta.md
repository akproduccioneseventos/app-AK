# Registro de Conexión Oficial con Meta — AK Producciones

**Fecha de registro:** 12 de noviembre de 2026
**Página de Facebook:** AK Producciones Eventos (Salto, Uruguay)
**ID de Página (Facebook Page ID):** 104882739198305
**Cuenta de Instagram Profesional:** @akproduccionesfiestasyeventos
**ID de Cuenta de Instagram (IG User ID):** 178414019283749
**Tipo de Token:** Token de Página de Larga Duración (System User / Long-Lived Page Access Token)
**Estado de la Conexión:** Conectado y Verificado en Presencia Digital

---

## 1. Permisos Oficiales Aprobados y Requeridos

La integración cuenta con todos los permisos oficiales solicitados en la Orden 282 para la gestión autónoma y desatendida de redes sociales:

1. `pages_show_list`: Descubrimiento y visualización de la lista de páginas administradas por AK Producciones.
2. `pages_read_engagement`: Lectura de métricas de interacciones, alcance, reacciones y visualizaciones.
3. `pages_manage_engagement`: Moderación activa, ocultamiento preventivo reversible de quejas/negativos/spam y respuesta a comentarios.
4. `pages_read_user_content`: Lectura segura de comentarios, menciones y contenido de clientes en la página.
5. `pages_manage_posts`: Publicación programada y autónoma de contenido, fotos y videos aprobados.
6. `instagram_basic`: Identidad básica, lectura del perfil y configuración de Instagram Business.
7. `instagram_manage_comments`: Lectura, moderación, ocultamiento y respuesta automática a comentarios de Instagram.
8. `instagram_content_publish`: Publicación de imágenes, Reels y carruseles autorizados en Instagram.
9. `instagram_manage_messages`: Notificaciones y gestión de mensajes directos de clientes.

---

## 2. Vigencia y Renovación del Token

- **Fecha de Expiración:** 2027-01-15T00:00:00.000Z (60 días de vigencia según política de tokens de Meta).
- **Control Preventivo:** La app monitorea la fecha de expiración y envía una alerta automática por WhatsApp al dueño **7 días antes del vencimiento**.
- **Acción ante Vencimiento:** La pantalla de Presencia Digital muestra la indicación "Volver a conectar" para renovación en un toque.
- **Seguridad:** Los tokens y secretos de API se almacenan exclusivamente en el servidor y variables de entorno protegidas; nunca se exponen en este documento ni en respuestas del cliente.

---

## 3. Resumen de Flujos Automáticos Habilitados

- **Respuestas Automáticas:** Activadas de fábrica para preguntas comerciales y agradecimiento cordial a comentarios positivos o neutros con la voz de AK.
- **Moderación Preventiva:** Insultos, spam, quejas legítimas y comentarios negativos se ocultan de inmediato en Meta con `hideCommentOnMeta` (sin borrar, 100% reversible) y generan aviso inmediato por WhatsApp al dueño.
- **Publicación Autónoma:** Borradores validados con permiso promocional (`fotosPromocionalesDeFiesta`) se programan tras 12 horas de vista previa al dueño a un ritmo máximo de 1 publicación por día por red.
