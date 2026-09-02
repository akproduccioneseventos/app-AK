'use client';

import { motion } from 'framer-motion';
import { SUAVE } from '@/lib/motion';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { Camera, Sparkles, UtensilsCrossed, Music, GlassWater } from 'lucide-react';

export default function LandingXVAnosPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: SUAVE }}
    >
      <EventLandingPage
        eventType="Fiesta de 15 Años"
        source="landing-quince"
        heroImage="/media/catalogo-servicios/quinceanera_hero.png"
        heroImageAlt="Fiesta de 15 años producida por AK Producciones"
        intro="La noche de tus 15 pensada para que te diviertas al máximo junto a tus amigos y familia."
        detailTitle="Tu noche soñada con tecnología y diversión sin límites"
        detailDescription="Barra de tragos de autor sin alcohol, Espejo Mágico IA con impresión al instante, Muro Social en vivo y discoteca con iluminación LED sincronizada."
        detailImage="/media/catalogo-servicios/xv-pista-iluminada-01.jpeg"
        detailImageAlt="Pista de baile y luces para fiesta de 15"
        simulatorHref="/simulador-de-presupuesto?tipo=XV%20a%C3%B1os"
        services={[
          { title: 'Barra de tragos sin alcohol', description: 'Cócteles de autor frutales, milkshakes y presentaciones divertidas para tus invitados.', icon: GlassWater },
          { title: 'Espejo Mágico & Fotocabina IA', description: 'Fotos divertidas impresas en el acto con accesorios y filtros mágicos de IA.', icon: Camera },
          { title: 'Muro Social 4K & Discoteca', description: 'Subida de fotos en tiempo real desde el celular a la pantalla gigante del salón.', icon: Music },
          { title: 'Catering Adolescente & Gala', description: 'Finger food, hamburguesitas de autor, pizza party y menúes especiales.', icon: UtensilsCrossed },
          { title: 'Decoración & Ambientación LED', description: 'Luces arquitectónicas, letras gigantes iluminadas y rincones temáticos para fotos.', icon: Sparkles },
        ]}
      />
    </motion.div>
  );
}
