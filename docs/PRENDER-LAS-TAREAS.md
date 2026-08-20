# Cómo prender las tareas para que corran solas

Para que las 4 cosas automáticas de la aplicación funcionen las 24 horas del día (incluso cuando nadie tiene la computadora ni el celular prendido), hay que configurar 4 renglones en un servicio gratuito de internet que funciona como despertador.

Se hace **una sola vez en 5 minutos**.

---

## Paso 1: Abrir la página gratuita del despertador

1. Entrá a [cron-job.org](https://cron-job.org) y create una cuenta gratis con tu correo.
2. Hacé clic en el botón azul **"CREATE CRONJOB"** (Crear tarea).

---

## Paso 2: Copiar y pegar los 4 renglones

Creá una tarea por cada uno de estos 4 renglones:

### 1. Las notas del blog (1 vez por semana)
- **Título / Name:** `AK - Escribir notas del blog`
- **Dirección / URL:** `https://TU-DOMINIO.com/api/cron/generate-blog-post`
- **Cada cuánto / Schedule:** Elegir `Every 1 week` (cada 1 semana, por ejemplo los lunes a las 09:00 hs).
- **Encabezado / Header (opcional si usás clave):** `Authorization: Bearer TU_CRON_SECRET`

---

### 2. Guardar los números de las redes (1 vez por día, de noche)
- **Título / Name:** `AK - Guardar números de redes`
- **Dirección / URL:** `https://TU-DOMINIO.com/api/cron/metricas-de-redes`
- **Cada cuánto / Schedule:** Elegir `Every 1 day` (todos los días a las 23:30 hs).
- **Encabezado / Header (opcional si usás clave):** `Authorization: Bearer TU_CRON_SECRET`

---

### 3. Publicar los posteos programados (Cada 15 minutos)
- **Título / Name:** `AK - Publicar posteos programados`
- **Dirección / URL:** `https://TU-DOMINIO.com/api/cron/publicar-programados`
- **Cada cuánto / Schedule:** Elegir `Every 15 minutes` (cada 15 minutos).
- **Encabezado / Header (opcional si usás clave):** `Authorization: Bearer TU_CRON_SECRET`

---

### 4. Avisar de las cuotas por vencer (1 vez por día, de mañana)
- **Título / Name:** `AK - Recordatorios de cuota`
- **Dirección / URL:** `https://TU-DOMINIO.com/api/cron/recordatorios-de-pago`
- **Cada cuánto / Schedule:** Elegir `Every 1 day` (todos los días a las 09:00 hs de la mañana).
- **Encabezado / Header (opcional si usás clave):** `Authorization: Bearer TU_CRON_SECRET`

---

## Paso 3: ¿Cómo saber si está funcionando?

Entrás a la aplicación al menú **Configuración → Tareas Automáticas** (`/settings/tareas-automaticas`).
Vas a ver los 4 renglones con tilde verde que dicen **"Al día"** y la hora exacta en la que corrieron por última vez.
