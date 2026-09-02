'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { SUAVE, contenedorCascada, itemCascada } from '@/lib/motion';

export function LandingMotionGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={contenedorCascada}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LandingMotionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.article
      variants={itemCascada}
      className={className}
    >
      {children}
    </motion.article>
  );
}

export function LandingMotionBlock({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: SUAVE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}