
import Link from 'next/link';

const AppLogo = () => (
  <Link
    href="/"
    className="flex flex-col items-start group text-foreground no-underline hover:opacity-80 transition-opacity"
  >
    <span className="text-lg font-bold">Plataforma Fiestas</span>
    <span className="text-sm text-muted-foreground">Gestión Integral</span>
  </Link>
);

export default AppLogo;
