import React from 'react';
import Link from 'next/link';

export type AvisoDeDatosTipo = 'invitado' | 'cliente' | 'equipo';

interface AvisoDeDatosProps {
  para?: AvisoDeDatosTipo;
  className?: string;
}

export function AvisoDeDatos({ para = 'cliente', className = '' }: AvisoDeDatosProps) {
  let textoPrincipal = 'Usamos tus datos sólo para contestarte y para tu evento (Ley 18.331). ';

  if (para === 'invitado') {
    textoPrincipal = 'Tus datos quedan sólo para esta fiesta (Ley 18.331). ';
  } else if (para === 'equipo') {
    textoPrincipal = 'Tus datos se usan sólo para el trabajo en los eventos (Ley 18.331). ';
  }

  return (
    <p
      className={`text-[11px] md:text-[12px] text-muted-foreground/70 text-center font-normal tracking-normal leading-relaxed select-none ${className}`}
      data-testid="aviso-de-datos"
    >
      <span>{textoPrincipal}</span>
      <Link
        href="/privacidad"
        className="underline underline-offset-2 hover:text-foreground transition-colors"
      >
        Privacidad
      </Link>
    </p>
  );
}
