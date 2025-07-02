
import Link from 'next/link';

const AppLogo = () => (
  <Link
    href="/"
    className="flex flex-col items-start group text-foreground no-underline hover:opacity-80 transition-opacity"
  >
    <span className="text-lg font-bold">AK Producciones</span>
    <span className="text-sm text-muted-foreground">Gestión de Eventos</span>
  </Link>
);

export default AppLogo;
