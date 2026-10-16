import { Sparkles, Megaphone, RadioTower, Globe2, Presentation, MonitorPlay } from 'lucide-react';

export const MARKETING_CUATRO_PUERTAS = [
  {
    title: 'Calendario y publicaciones con IA',
    description: 'Planifica publicaciones, calendario, piezas y generación con IA para redes.',
    href: '/empresa/redes-sociales',
    icon: Sparkles,
    tone: 'bg-pink-50 text-pink-700 border-pink-100',
  },
  {
    title: 'Campañas y anuncios',
    description: 'Métricas y retorno de inversión de campañas en Meta Ads y Google Ads.',
    href: '/contabilidad/crm/marketing-ads',
    icon: Megaphone,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    title: 'Reseñas y Google',
    description: 'Reputación online, presencia en Google Maps, ficha de negocio y opiniones.',
    href: '/empresa/presencia-digital',
    icon: RadioTower,
    tone: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    title: 'Web pública y portada',
    description: 'Editar la landing pública, beneficios, servicios, fotos y llamados a la acción.',
    href: '/empresa/marketing',
    icon: Globe2,
    tone: 'bg-violet-50 text-violet-700 border-violet-100',
  },
];

export const MARKETING_HUB_ITEMS = [
  ...MARKETING_CUATRO_PUERTAS,
  {
    title: 'Plantilla LED',
    description: 'Portafolio visual para vender en reunion: beneficios, servicios, tecnologia y cierre comercial.',
    href: '/presentacion-led/portafolio',
    icon: Presentation,
    tone: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    title: 'Demo tecnologia AK',
    description: 'Pagina de demostracion para mostrar portal, pantalla, muro, QR y estaciones sin crear una fiesta real.',
    href: '/marketing/demo-tecnologia',
    icon: MonitorPlay,
    tone: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    title: 'Biblioteca visual',
    description: 'Fotos, videos y recursos para que la venta muestre la empresa real y no solo textos.',
    href: '/settings/biblioteca-visual-ak',
    icon: RadioTower,
    tone: 'bg-amber-50 text-amber-700 border-amber-100',
  },
];
