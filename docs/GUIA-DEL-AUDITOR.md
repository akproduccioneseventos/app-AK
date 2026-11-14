# Guía para el auditor de la app de AK Producciones

Esta guía es para quien audita la app de afuera. Dice cómo entrar, qué ve cada tipo de usuario, por dónde moverse y
qué cosas están decididas a propósito (para no reportarlas como errores).

Dirección de la app: **https://akproducciones.uy**

---

## 1. Cómo entrar

1. Abrí **https://akproducciones.uy/login**.
2. Entrá con el **correo y la clave de auditor** que te pasó el dueño.
3. Vas a ver la app del equipo completa, con todos los módulos.

**Tu acceso es de sólo mirar.** Podés abrir todo, pero cualquier intento de guardar, borrar, cobrar, publicar o mandar un
mensaje se frena con este aviso:

> *"Acceso de auditor: se puede mirar todo, pero no guardar ni mandar nada."*

**Ese aviso no es un error de la app**: es el candado que te protege a vos y a los datos reales. Podés tocar los botones
para ver qué hacen hasta el último paso.

### La regla más importante

**Hacé todo en la misma ventana del navegador donde entraste como auditor.** Así el candado te acompaña también en las
pantallas públicas (la web, el simulador, la invitación). **No uses una ventana de incógnito ni otro navegador** para
probar formularios: ahí no estás identificado como auditor y lo que envíes se guarda de verdad (por ejemplo, un
prospecto nuevo en la lista del dueño).

---

## 2. Los tipos de usuario y cómo ver la app como cada uno

| Quién | Qué es | Cómo lo ves vos |
|---|---|---|
| **Equipo / dueño** | La app interna: fiestas, ventas, plata, recursos, ajustes | Es lo que ves al entrar |
| **Prospecto** | Alguien que todavía no contrató y llega por la web | Abrí la web pública (sección 4) |
| **Cliente** | Quien contrató una fiesta; tiene su portal | Desde una fiesta, botón **"Ver como el cliente"** (sección 5) |
| **Invitado** | Quien va a la fiesta: invitación, confirmación, fotos, juegos | Desde una fiesta, botón **"Ver como un invitado"** (sección 6) |

Los otros perfiles del equipo (secretaria, operador, personal) no se pueden simular con tu acceso: ven **menos** cosas
que el dueño (la secretaria ve presupuestos, cobros y clientes, pero no sueldos ni ganancias; el operador sólo la noche de
la fiesta, sin nada de plata; el personal, sólo lo suyo).

---

## 3. La app del equipo (lo que ves al entrar)

Recorré el menú de la izquierda (en el celular, el botón de menú). Está agrupado así:

### Inicio
- **Panel de control** (`/admin`): resumen, prioridades y accesos rápidos.
- **Mi Día** (`/mi-dia`): lo de hoy. **Centro de Control** (`/centro-de-control`): pedirle cosas al asistente.
- **Alertas** (`/alertas`) y **Cambios a aprobar** (`/aprobaciones`).

> Nota: hay varios paneles de inicio que se pisan. **Ya está detectado** y hay una reorganización en camino (siete
> secciones con pestañas). No hace falta reportarlo.

### Fiestas
- **Eventos activos** (`/eventos`): la lista de fiestas. **Elegí una fiesta próxima** para recorrer todo lo que sigue.
- Al tocar **"Planificar"** se abre la fiesta por dentro (`/fiestas/nueva?fiestaId=…`), con 5 pestañas:
  **Contrato y pagos · Cliente e invitados · Comida, barra e impresos · Equipo y logística · La noche**.
  Cada pestaña tiene tarjetas que abren cada módulo (invitados, menú, música, personal, pagos, decoración, etc.).
- **Centro de fiesta** (`/fiestas/<id>/centro`): la pantalla de la noche (gente que llegó, equipo, pendientes, y los
  accesos a cada estación). **Acá están los botones "Ver como el cliente" y "Ver como un invitado".**
- **Calendario** (`/calendario`), **Incidentes** (`/incidentes`), **Guías de armado** (`/playbooks`),
  **Personal en dos fiestas** (`/recursos-multi-evento`), **Muro social** (`/empresa/red-social-eventos`).

### Vender
- **Prospectos** (`/contabilidad/crm`): etapas Nuevo → Contactado → Entrevista → Presupuesto enviado → Negociación →
  Ganado/Perdido. **Agenda** (`/contabilidad/crm/agenda`).
- **Presupuestos** (`/presupuestos/nuevo`): la lista; cada uno se abre, se ve, y tiene PDF, estado de cuenta y recibo.
- **Clientes** (`/customers`), **Simulador IA** (`/simulador-ak`), **WhatsApp del día** (`/contabilidad/crm/outbox`):
  los mensajes preparados; **nunca salen solos**, los manda una persona.

### Plata
- **Pagos rápidos** (`/pagos-rapidos`), **Panel contable** (`/empresa/contabilidad`), **Facturas** (`/invoices`),
  **Gastos** (`/empresa/contabilidad/gastos`), **Flujo de caja** (`/empresa/contabilidad/flujo-caja`),
  **Ganancias y pérdidas** (`/empresa/contabilidad/reportes`), **Métricas** (`/empresa/dashboard`).

### Recursos
- **Menús** (`/empresa/menus`), **Tragos** (`/empresa/menus/tragos`), **Compras** (`/compras`), **Insumos**
  (`/empresa/insumos`), **Salones** (`/empresa/salones`), **Servicios** (`/empresa/servicios`), **Proveedores**
  (`/proveedores`), **Empleados** (`/empleados`), **Equipos** (`/empresa/activos-fijos`).

### Marketing
- **Marketing y redes** (`/marketing`), **Publicaciones** (`/empresa/redes-sociales`), **Reseñas de Google**
  (`/empresa/resenas-google`), **Anuncios** (`/contabilidad/crm/marketing-ads`), **Presencia digital**
  (`/empresa/presencia-digital`), **Galería pública** (`/empresa/galeria`), **Editor de la portada**
  (`/empresa/landing-editor`).

### Ajustes
- **Ajustes generales** (`/settings`): desde ahí se llega a todas las configuraciones (seña y simulador, empresa,
  WhatsApp, contrato, promociones, asistente, tareas automáticas, conexiones, seguridad).
- **Tareas automáticas** (`/settings/tareas-automaticas`): muestra cuándo corrió por última vez cada tarea sola.

---

## 4. Como prospecto (la web pública)

Abrilas **en la misma ventana** (ver la regla de la sección 1):

- Portada: `/` · Tipos de fiesta: `/bodas`, `/quinceaneras`, `/cumpleanos` · Catálogo: `/catalogo`
- Experiencia y tecnología: `/experiencia-ak` · Blog: `/public/blog`
- **Simuladores de presupuesto:** `/simulador-de-presupuesto` (paso a paso) y `/simulador-ak` (con asistente).
  Probá armar uno distinto para cada tipo de fiesta. Al final pide el teléfono: **ahí se va a frenar con el aviso de
  auditor**, y está bien.
- Botones de WhatsApp: tienen que llevar al número de AK.

---

## 5. Como cliente (su portal)

1. Entrá a una fiesta → **Centro de fiesta** → **"Ver como el cliente"**. Se abre el portal de esa fiesta.
2. Recorré: su panel, el **contrato y los pagos** (saldo, cuotas, seña), **invitados y confirmaciones**, **menú**,
   **música**, **fotos y videos**, **muro social**, **preguntas frecuentes**, y los pedidos de cambios.
3. Cosas para mirar con atención: que los importes coincidan con el presupuesto de esa fiesta en la app del equipo, que
   el cliente **no vea nada interno** (costos, sueldos, notas del equipo, datos de otros clientes) y que cada botón
   diga en criollo qué va a pasar.

---

## 6. Como invitado

1. Entrá a una fiesta → **Centro de fiesta** → **"Ver como un invitado"**. Se abre la invitación de un invitado real de
   esa fiesta.
2. Recorré: la **invitación**, **confirmar asistencia**, el **portal del invitado**, **su mesa**, y el **centro de la
   fiesta** (`/evento/hub/<id de la fiesta>`), que lleva a todo lo demás:
   fotocabina, espejo mágico, plataforma 360, barra de tragos, pedir temas al DJ, buzón de saludos, muro en vivo y
   galería. Después de la fiesta: el **álbum** (`/album/<id>`).
3. Lo que necesita cámara o pantalla gigante (fotocabina, 360, espejo, muro) se puede abrir y mirar, pero sacar fotos y
   subirlas queda frenado por tu acceso.
4. Cosas para mirar: que un invitado **no vea datos de otros invitados** (teléfonos, listas), ni plata, ni nada interno.

---

## 7. Lo que está decidido a propósito (no es un error)

Son decisiones comerciales del dueño. Si te llaman la atención, anotalas como comentario, **no como error**:

- **El reloj del simulador** que aparece después de armar el presupuesto: es la promoción con fecha (descuento y
  regalos), a propósito.
- **El ajuste anual del 15%** en los precios va siempre. Se trabaja **sólo en pesos uruguayos**.
- **Salón Club Uruguay:** siempre muestra un precio tachado del doble ("50% OFF"). Es marketing, a propósito.
- **La seña es de $5.000** (se cambia en Ajustes). El **30% es la multa por cancelar**, no la seña.
- **Al poner el celular en el simulador aparecen presupuestos anteriores de ese número:** es a propósito, para que el
  cliente compare.
- **La invitación devuelve el QR de entrada a quien escribe un nombre de la lista:** en las fiestas la entrada la
  controla el nombre; ese QR sólo abre lo del propio invitado.
- **Las fotos del muro se bajan con el enlace directo:** a propósito.
- **La firma digital del cliente es una constancia:** la reserva y la seña las confirma el contrato en papel.
- **Los mensajes a clientes no salen solos:** la app los prepara y los manda una persona. Las excepciones son las
  respuestas automáticas a comentarios en redes y el recordatorio a invitados que no abrieron la invitación.
- **En los textos no hay garantías, "24/7" ni plazos de respuesta**, y la experiencia dice "+7 años" y "+200 eventos":
  a propósito.
- **El servidor "se duerme"** si nadie entra un rato y la primera carga puede tardar unos segundos: está decidido así
  para no pagar más por mes.

---

## 8. Cómo reportar lo que encuentres

Una línea por hallazgo, separados en tres listas:

1. **Roto**: algo que falla, una cuenta que da mal, alguien que ve lo que no le corresponde.
2. **Incómodo de usar**: pasos de más, cosas difíciles de encontrar, textos que no se entienden.
3. **Se ve mal**: en especial **en el celular** (cosas cortadas, que se salen de la pantalla, botones chicos).

Para cada uno: **pantalla** (la dirección), **qué hiciste**, **qué esperabas**, **qué pasó**, y si podés una captura.
Si viste la app **como cliente o como invitado**, decilo en la línea.

---

## Lo que falta auditar (actualizado el 14/11/2026)

Ya auditado: contabilidad, simulador, presupuesto, catálogo, Club Uruguay, web y textos, entretenimiento, pantallas de la noche,
red social, invitados y puerta, salón 3D, asistentes (Sofía y el del equipo), módulos de control y la guía de 19 puntos.

### Se puede hacer HOY con el acceso de auditor (sólo mirar)

1. **Personal por dentro:** ficha de cada empleado, recibos de sueldo y "Total cobrado", y el portal del personal abierto con su enlace.
2. **Comida:** menús, recetas e ingredientes (que los costos salgan del ingrediente), y la lista de compras de una fiesta con invitados.
3. **Barra:** que cada trago de la carta tenga receta con insumos que existan.
4. **Contrato:** abrir el contrato de una fiesta real y leerlo entero (huecos, fechas, horas, cédula).
5. **Logística:** lista de carga de una fiesta, equipos asignados y mantenimiento.
6. **Volver a mirar lo arreglado** cuando Claude avise que se publicó: fiestas contadas una vez (59 → 22), alertas, portal sin sesión,
   respuestas del asistente.

### Se puede cuando Gemini termine la orden 299 (fiesta de muestra para el auditor)

7. Portal del cliente completo: pagos, contrato, decoración, invitados, como si fuera el cliente.
8. Simulador hasta el final como prospecto, sin que quede guardado.

### NO se puede con este acceso (hace falta el dueño)

9. **Lo que guarda o cobra** (emitir factura, registrar un pago, agendar, firmar): sólo con una cuenta que escriba. Se hace en la
   fiesta de muestra cuando esté la orden 299, o con el dueño al lado.
10. **Cada papel por separado** (secretaria, personal, operador de la noche, proveedor): hace falta que el dueño cree una cuenta de
    prueba por papel.
11. **La voz del asistente:** sólo en un teléfono de verdad.
12. **Volver atrás desde una copia de seguridad:** es destructivo; sólo con el dueño y sobre la fiesta de muestra.
