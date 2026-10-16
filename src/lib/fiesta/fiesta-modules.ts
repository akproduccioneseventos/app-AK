import React from 'react';
import {
  Zap, Settings2, ClipboardCheck, ListChecks, MessageSquare, Archive, DollarSign, CreditCard,
  ClipboardList, Truck, Users2, UserCheck, Lock, KeyRound, Clock, Music, Video, Users,
  Camera, Sparkles, Gift, Mic, Star, Globe, Smartphone, QrCode, LayoutDashboard, Activity,
  Gamepad2, Tv, ListVideo, ShieldCheck, Palette, UtensilsCrossed, ShoppingCart, Wine,
  Calculator, Printer, BookOpen, Hash
} from 'lucide-react';

export type ModuleBadge = 'Cliente' | 'Invitado' | 'Operativo' | 'Pantalla' | 'Interno' | 'Impresión' | 'VIP';

export type PestanaFiesta =
  | 'contrato-y-pagos'
  | 'cliente-e-invitados'
  | 'comida-y-barra'
  | 'equipo-y-logistica'
  | 'noche';

export interface ModuleDefinition {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  category: string;
  pestana: PestanaFiesta;
  color: string;
  badge?: ModuleBadge;
}

export const modules: ModuleDefinition[] = [
  // 1. CENTRO DE PRODUCCIÓN
  { id: 'configuracion', title: "Configuración", href: "/fiestas/nueva/configuracion", icon: Settings2, description: "Datos maestros del evento.", category: 'CENTRO DE PRODUCCIÓN', pestana: 'contrato-y-pagos', color: "bg-slate-100 text-slate-600", badge: 'Interno' },
  { id: 'resumenPlanificacion', title: "Consolidado", href: "/fiestas/nueva/resumen-planificacion", icon: ClipboardCheck, description: "Visión total de lo pactado.", category: 'CENTRO DE PRODUCCIÓN', pestana: 'contrato-y-pagos', color: "bg-primary/10 text-primary", badge: 'Interno' },
  { id: 'tareas', title: "Tareas", href: "/fiestas/nueva/tareas", icon: ListChecks, description: "Checklist operativo del equipo.", category: 'CENTRO DE PRODUCCIÓN', pestana: 'contrato-y-pagos', color: "bg-slate-100 text-slate-600", badge: 'Interno' },
  { id: 'reuniones', title: "Reuniones", href: "/fiestas/nueva/reuniones", icon: MessageSquare, description: "Minutas y acuerdos con el cliente.", category: 'CENTRO DE PRODUCCIÓN', pestana: 'contrato-y-pagos', color: "bg-blue-100 text-blue-600", badge: 'Interno' },
  { id: 'documentos', title: "Documentos", href: "/fiestas/nueva/gestion-documental", icon: Archive, description: "Contratos, recibos y expedientes.", category: 'CENTRO DE PRODUCCIÓN', pestana: 'contrato-y-pagos', color: "bg-slate-100 text-slate-600", badge: 'Interno' },
  { id: 'costos', title: "Costos y Rentabilidad", href: "/fiestas/nueva/gestion-costos-rentabilidad", icon: DollarSign, description: "Márgenes y rentabilidad real del evento.", category: 'CENTRO DE PRODUCCIÓN', pestana: 'contrato-y-pagos', color: "bg-emerald-100 text-emerald-600", badge: 'Interno' },
  { id: 'planPagos', title: "Pagos", href: "/fiestas/nueva/plan-pagos", icon: CreditCard, description: "Plan de pagos y cuotas del evento.", category: 'CENTRO DE PRODUCCIÓN', pestana: 'contrato-y-pagos', color: "bg-green-100 text-green-600", badge: 'Interno' },

  // 2. OPERATIVA Y LOGÍSTICA
  { id: 'cargaOperativa', title: "Lista de Carga", href: "/fiestas/nueva/carga-operativa", icon: ClipboardList, description: "Lista operativa para utileros. Carga y retorno.", category: 'OPERATIVA Y LOGÍSTICA', pestana: 'equipo-y-logistica', color: "bg-amber-100 text-amber-700", badge: 'Operativo' },
  { id: 'logistica', title: "Logística", href: "/fiestas/nueva/logistica", icon: Truck, description: "Accesibilidad, estacionamiento y protocolo de lluvia.", category: 'OPERATIVA Y LOGÍSTICA', pestana: 'equipo-y-logistica', color: "bg-indigo-100 text-indigo-600", badge: 'Operativo' },
  { id: 'proveedoresPortal', title: "Proveedores", href: "/fiestas/nueva/proveedores-portal", icon: Users2, description: "Acceso restringido y coordinación con externos.", category: 'OPERATIVA Y LOGÍSTICA', pestana: 'equipo-y-logistica', color: "bg-cyan-100 text-cyan-700", badge: 'Operativo' },
  { id: 'personal', title: "Personal", href: "/fiestas/nueva/personal", icon: UserCheck, description: "Equipo asignado al evento y recibos.", category: 'OPERATIVA Y LOGÍSTICA', pestana: 'equipo-y-logistica', color: "bg-teal-100 text-teal-600", badge: 'Operativo' },
  { id: 'accesosPersonal', title: "Accesos Personal", href: "/fiestas/nueva/accesos-personal", icon: Lock, description: "Credenciales y control de acceso del equipo.", category: 'OPERATIVA Y LOGÍSTICA', pestana: 'equipo-y-logistica', color: "bg-slate-100 text-slate-600", badge: 'Operativo' },

  // 3. EXPERIENCIA DEL CLIENTE VIP
  { id: 'portalCliente', title: "Portal Cliente VIP", href: "/fiestas/nueva/portal-cliente", icon: KeyRound, description: "Centro de colaboración exclusivo para el cliente.", category: 'EXPERIENCIA DEL CLIENTE VIP', pestana: 'cliente-e-invitados', color: "bg-amber-100 text-amber-600", badge: 'Cliente' },
  { id: 'itinerario', title: "Itinerario", href: "/fiestas/nueva/itinerario", icon: Clock, description: "Cronograma minuto a minuto, vista cliente e interna.", category: 'EXPERIENCIA DEL CLIENTE VIP', pestana: 'cliente-e-invitados', color: "bg-blue-100 text-blue-600", badge: 'Cliente' },
  { id: 'musica', title: "Música", href: "/fiestas/nueva/musica", icon: Music, description: "Lista de temas y pedidos musicales del cliente.", category: 'EXPERIENCIA DEL CLIENTE VIP', pestana: 'cliente-e-invitados', color: "bg-purple-100 text-purple-600", badge: 'Cliente' },
  { id: 'videoVida', title: "Video de Vida", href: "/fiestas/nueva/video-vida", icon: Video, description: "Fotos de infancia y material para el video emotivo.", category: 'EXPERIENCIA DEL CLIENTE VIP', pestana: 'cliente-e-invitados', color: "bg-indigo-100 text-indigo-600", badge: 'Cliente' },
  { id: 'invitados', title: "Invitados", href: "/fiestas/nueva/invitados", icon: Users, description: "Lista completa, confirmaciones y gestión.", category: 'EXPERIENCIA DEL CLIENTE VIP', pestana: 'cliente-e-invitados', color: "bg-violet-100 text-violet-600", badge: 'Cliente' },

  // 4. PRODUCCIÓN MULTIMEDIA
  { id: 'fotografia', title: "Foto y Video", href: "/fiestas/nueva/fotografia", icon: Camera, description: "Seguimiento, entregas y material fotográfico.", category: 'PRODUCCIÓN MULTIMEDIA', pestana: 'noche', color: "bg-purple-100 text-purple-600", badge: 'Interno' },
  { id: 'entretenimiento', title: "Entretenimiento", href: "/fiestas/nueva/entretenimiento", icon: Sparkles, description: "Fotocabina, 360, Vogue y Espejo Mágico conectados al QR, galería y muro social.", category: 'PRODUCCIÓN MULTIMEDIA', pestana: 'noche', color: "bg-blue-100 text-blue-700", badge: 'Invitado' },
  { id: 'regalos', title: "Regalos", href: "/fiestas/nueva/regalos", icon: Gift, description: "Mesa de regalos digital para invitados.", category: 'PRODUCCIÓN MULTIMEDIA', pestana: 'cliente-e-invitados', color: "bg-violet-100 text-violet-700", badge: 'Invitado' },
  { id: 'buzon', title: "Buzón de Recuerdos", href: "/fiestas/nueva/buzon", icon: Mic, description: "Descarga de audios/videos del buzón y bienvenida.", category: 'PRODUCCIÓN MULTIMEDIA', pestana: 'noche', color: "bg-purple-100 text-purple-700", badge: 'Cliente' },
  { id: 'postEvento', title: "Post-Evento", href: "/fiestas/nueva/post-evento", icon: Star, description: "NPS, galería y referidos post fiesta.", category: 'PRODUCCIÓN MULTIMEDIA', pestana: 'noche', color: "bg-amber-100 text-amber-700", badge: 'Interno' },

  // 5. EXPERIENCIA DEL INVITADO VIP
  { id: 'paginaWeb', title: "Invitación Web", href: "/fiestas/nueva/pagina-web", icon: Globe, description: "Web pública interactiva para invitados.", category: 'EXPERIENCIA DEL INVITADO VIP', pestana: 'cliente-e-invitados', color: "bg-blue-100 text-blue-600", badge: 'Invitado' },
  { id: 'moduloInvitado', title: "Portal Invitado", href: "/fiestas/nueva/modulo-invitado", icon: Users, description: "Controla qué ve cada invitado en su portal.", category: 'EXPERIENCIA DEL INVITADO VIP', pestana: 'cliente-e-invitados', color: "bg-violet-100 text-violet-700", badge: 'Invitado' },
  { id: 'redSocial', title: "Red Social de la Fiesta", href: "/fiestas/nueva/social-fiesta-pro", icon: Smartphone, description: "Red social privada que funciona 30 días antes con interacción de invitados y feeds.", category: 'EXPERIENCIA DEL INVITADO VIP', pestana: 'noche', color: "bg-fuchsia-100 text-fuchsia-700", badge: 'VIP' },
  { id: 'checkin', title: "QR / Check-in", href: "/fiestas/nueva/invitados/checkin-scanner", icon: QrCode, description: "Ingreso con QR y recepción de invitados.", category: 'EXPERIENCIA DEL INVITADO VIP', pestana: 'noche', color: "bg-green-100 text-green-600", badge: 'Invitado' },
  { id: 'disenoSalon', title: "Mesas Asignadas", href: "/fiestas/nueva/invitados/layout", icon: LayoutDashboard, description: "Plano de mesas y asignación de invitados.", category: 'EXPERIENCIA DEL INVITADO VIP', pestana: 'cliente-e-invitados', color: "bg-indigo-100 text-indigo-600", badge: 'Invitado' },

  // 6. PANTALLA GIGANTE AK
  { id: 'enVivo', title: "Evento en Vivo", href: "/fiestas/nueva/en-vivo", icon: Zap, description: "Centro de operaciones para el día de la fiesta.", category: 'PANTALLA GIGANTE AK', pestana: 'noche', color: "bg-primary text-white shadow-xl shadow-primary/30", badge: 'Pantalla' },
  { id: 'centroFiesta', title: "Centro de Fiesta", href: "/fiestas/nueva/centro", icon: Activity, description: "La pantalla para dirigir la noche: el reloj y el cronograma, cuánta gente llegó, quién trabaja y los accesos a cada herramienta.", category: 'PANTALLA GIGANTE AK', pestana: 'noche', color: "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30", badge: 'Pantalla' },
  { id: 'muroSocial', title: "Muro Social & Pantalla", href: "/fiestas/nueva/muro-social", icon: Gamepad2, description: "Mural de fotos, playlist de pantalla, juegos interactivos y configuración de la pantalla gigante.", category: 'PANTALLA GIGANTE AK', pestana: 'noche', color: "bg-violet-100 text-violet-700", badge: 'Pantalla' },
  { id: 'zonaDigital', title: "Zona Digital AK", href: "/fiestas/nueva/zona-digital", icon: Sparkles, description: "Retos, juegos, emojis, fotos, redes y experiencias para adolescentes.", category: 'PANTALLA GIGANTE AK', pestana: 'noche', color: "bg-red-50 text-red-700", badge: 'Invitado' },
  { id: 'pantallasTotem', title: "Pantallas Tótem", href: "/fiestas/nueva/pantallas-totem", icon: Tv, description: "Tótems personalizados con QR, fotos sincronizadas, fondos en movimiento y modo pista.", category: 'PANTALLA GIGANTE AK', pestana: 'noche', color: "bg-cyan-100 text-cyan-700", badge: 'Pantalla' },
  { id: 'playlistPantalla', title: "Playlist Pantalla", href: "/fiestas/nueva/playlist-pantalla", icon: ListVideo, description: "Lista de reproducción en vivo para la pantalla del salón.", category: 'PANTALLA GIGANTE AK', pestana: 'noche', color: "bg-blue-100 text-blue-700", badge: 'Pantalla' },
  { id: 'readiness', title: "Control Operativo", href: "/fiestas/nueva/readiness", icon: ShieldCheck, description: "Semáforo de preparación y riesgo operativo del evento.", category: 'PANTALLA GIGANTE AK', pestana: 'noche', color: "bg-emerald-100 text-emerald-700", badge: 'Interno' },
  { id: 'fiestaLista', title: "Calidad de Experiencia", href: "/fiestas/nueva/fiesta-lista", icon: ClipboardCheck, description: "Auditoría premium, checklist de demo y salida a la luz.", category: 'PANTALLA GIGANTE AK', pestana: 'noche', color: "bg-red-600 text-white shadow-xl shadow-red-500/25", badge: 'Interno' },

  // 7. DISEÑO, SALÓN Y AMBIENTACIÓN
  { id: 'decoracion', title: "Decoración", href: "/fiestas/nueva/decoracion", icon: Palette, description: "Estilo, moodboard y ambientación del salón.", category: 'DISEÑO, SALÓN Y AMBIENTACIÓN', pestana: 'cliente-e-invitados', color: "bg-pink-100 text-pink-600", badge: 'Interno' },

  // 8. GASTRONOMÍA Y SERVICIO
  { id: 'catering', title: "Gastronomía / Catering", href: "/fiestas/nueva/catering", icon: UtensilsCrossed, description: "Cálculo de menú, insumos y porciones.", category: 'GASTRONOMÍA Y SERVICIO', pestana: 'comida-y-barra', color: "bg-orange-100 text-orange-600", badge: 'Interno' },
  { id: 'listaCompras', title: "Lista de Compras", href: "/fiestas/nueva/catering/lista-compras", icon: ShoppingCart, description: "Insumos necesarios para el catering.", category: 'GASTRONOMÍA Y SERVICIO', pestana: 'comida-y-barra', color: "bg-slate-100 text-slate-600", badge: 'Operativo' },
  { id: 'alergias', title: "Gestión Alimentaria", href: "/fiestas/nueva/alergias", icon: Users2, description: "Celíacos, alergias y dietas especiales.", category: 'GASTRONOMÍA Y SERVICIO', pestana: 'comida-y-barra', color: "bg-orange-100 text-orange-600", badge: 'Operativo' },
  { id: 'cartaTragos', title: "Carta de Tragos", href: "/fiestas/nueva/carta-tragos", icon: Wine, description: "Carta de bebidas para el evento.", category: 'GASTRONOMÍA Y SERVICIO', pestana: 'comida-y-barra', color: "bg-fuchsia-100 text-fuchsia-700", badge: 'Impresión' },
  { id: 'plannerCostoFiesta', title: "Planificador Gastronómico", href: "/fiestas/nueva/planner-costo-fiesta", icon: Calculator, description: "Gastos por categoría y armado de mesas.", category: 'GASTRONOMÍA Y SERVICIO', pestana: 'comida-y-barra', color: "bg-orange-100 text-orange-600", badge: 'Interno' },
  { id: 'barraTecnologica', title: "Barra Tecnológica", href: "/fiestas/nueva/barra-tecnologica", icon: Wine, description: "Pantalla tactil de tragos, pantalla barman y fotos sociales con hashtag.", category: 'GASTRONOMÍA Y SERVICIO', pestana: 'comida-y-barra', color: "bg-rose-100 text-rose-700", badge: 'Invitado' },

  // 9. CARTELERÍA Y MATERIAL IMPRESO
  { id: 'carteleria', title: "Cartelería de Mesas", href: "/fiestas/nueva/carteleria", icon: Printer, description: "Kit completo: tragos, menú, QR y números.", category: 'CARTELERÍA Y MATERIAL IMPRESO', pestana: 'comida-y-barra', color: "bg-violet-100 text-violet-600", badge: 'Impresión' },
  { id: 'menuMesa', title: "Menú de Mesa", href: "/fiestas/nueva/menu-mesa", icon: BookOpen, description: "Menú impreso para cada mesa.", category: 'CARTELERÍA Y MATERIAL IMPRESO', pestana: 'comida-y-barra', color: "bg-slate-100 text-slate-600", badge: 'Impresión' },
  { id: 'numerosMesa', title: "Números de Mesa", href: "/fiestas/nueva/numeros-mesa", icon: Hash, description: "Impresión de señalética y números.", category: 'CARTELERÍA Y MATERIAL IMPRESO', pestana: 'comida-y-barra', color: "bg-slate-100 text-slate-600", badge: 'Impresión' },

  // 10. EVENTO EN VIVO / CENTRO DE OPERACIONES
  { id: 'feedback', title: "Feedback", href: "/settings/feedback", icon: Star, description: "Encuesta post-evento y NPS.", category: 'EVENTO EN VIVO / CENTRO DE OPERACIONES', pestana: 'noche', color: "bg-yellow-100 text-yellow-600", badge: 'Interno' },
  { id: 'resumenImprimible', title: "Resumen Imprimible", href: "/fiestas/nueva/resumen-imprimible", icon: Printer, description: "Resumen completo listo para imprimir.", category: 'EVENTO EN VIVO / CENTRO DE OPERACIONES', pestana: 'equipo-y-logistica', color: "bg-slate-100 text-slate-600", badge: 'Operativo' },
];
