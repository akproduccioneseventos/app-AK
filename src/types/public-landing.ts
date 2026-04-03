export interface EventPackage {
  id: string;
  name: string;
  description: string;
  includes: string[];
  priceFrom?: number;
  imageUrl: string;
  imageHint: string;
  popular?: boolean;
}

export interface EventCatalog {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  heroImageUrl: string;
  heroImageHint: string;
  emoji: string;
  accentColor: string;
  packages: EventPackage[];
  whatsappMessage: string;
}
