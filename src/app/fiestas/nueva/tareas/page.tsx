import TareasClientPage from './client';

// This is a Server Component by default.
// It wraps the actual page content, which is a Client Component.
// This pattern helps Next.js properly handle server-side pre-rendering
// while allowing the page itself to use client-side hooks like useState and useEffect.
export default function TareasPage() {
  return <TareasClientPage />;
}
