# Tareas automáticas en AK Producciones (100% Autónomas)

**No tenés que configurar nada a mano.** La aplicación corre sus tareas desatendidas sola, las 24 horas del día, sin importar si nadie tiene la computadora o el celular prendido.

---

## Cómo funciona por dentro

El proyecto cuenta con dos motores automáticos coordinados:

1. **El Despertador de Fondo (Google Cloud / Firebase Functions):**
   - Una tarea programada única en el proyecto (`functions/src/index.ts`) se ejecuta **cada 15 minutos** de forma 100% autónoma en los servidores de Google.
   - Pregunta qué tareas están vencidas (`/api/cron/despachador`) y ejecuta lo que corresponde sin costo mensual adicional.

2. **Red de Seguridad en Visitas Públicas:**
   - Cada vez que un visitante o prospecto entra a la portada (`akproducciones.uy`), se lanza una puesta al día en segundo plano sin hacerlo esperar.
   - Si el despertador de fondo tuviera cualquier interrupción de red, las visitas aseguran que las tareas no se atrasen.

3. **Candado de Concurrencia Seguro (Protección Anti-Duplicación):**
   - Cuando una tarea arranca, toma un **candado atómico antes de trabajar**.
   - Si diez personas entran en el mismo minuto o coincide con el despertador, una sola ejecuta y las otras se retiran inmediatamente.
   - Nunca se generan notas de blog repetidas ni se gasta de más en inteligencia artificial.

---

## Las 4 tareas que corren solas

1. **Escribir notas del blog (`/api/cron/generate-blog-post`):** Publica notas optimizadas para Google cada 2 días.
2. **Guardar números de redes sociales (`/api/cron/metricas-de-redes`):** Guarda seguidores y alcance diariamente a la medianoche.
3. **Publicar posteos programados (`/api/cron/publicar-programados`):** Revisa cada 15 minutos si hay posteos agendados listos para salir.
4. **Avisar cuotas por vencer (`/api/cron/recordatorios-de-pago`):** Prepara diariamente la lista de avisos pendientes en la bandeja de salida (ningún bot escribe ni manda mensajes solo).

---

## ¿Cómo comprobar que está funcionando?

Entrá a **Configuración → Tareas Automáticas** (`/settings/tareas-automaticas`).
Ahí vas a ver cada tarea con su estado (**Al día**), la fecha/hora exacta en la que corrió por última vez y quién la disparó (*Despertador de fondo* o *Visita a la web*).
