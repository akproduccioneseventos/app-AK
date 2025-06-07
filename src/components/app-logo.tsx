import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/" className="flex flex-col items-start group">
      <span className="text-2xl font-bold font-headline text-primary group-hover:text-primary/80 transition-colors">
        AK PRODUCCIONES
      </span>
      <span className="text-xs font-body text-muted-foreground tracking-wider group-hover:text-foreground transition-colors">
        MEDIA PROSUTEE
      </span>
    </Link>
  );
}
