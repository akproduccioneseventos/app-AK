'use client';

import { LandingNav } from '@/components/landing/LandingNav';

interface PublicNavbarProps {
  whatsappNumber?: string;
  whatsappMessage?: string;
  className?: string;
}

export function PublicNavbar({
  whatsappNumber,
  whatsappMessage,
  className,
}: PublicNavbarProps) {
  return (
    <>
      <LandingNav
        solid
        whatsappNumber={whatsappNumber}
        whatsappMessage={whatsappMessage}
        className={className}
      />
      <div className="h-16 md:h-20" aria-hidden="true" />
    </>
  );
}
