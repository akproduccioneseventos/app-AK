import { redirect } from "next/navigation";

interface BlogPostRedirectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostRedirectPage({
  params,
}: BlogPostRedirectPageProps) {
  const { slug } = await params;
  redirect(`/public/blog/${encodeURIComponent(slug)}`);
}
