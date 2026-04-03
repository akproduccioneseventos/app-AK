// Types for the public-facing event catalog landing pages

export type EventType =
  | 'bodas'
  | 'xv-anos'
  | 'fiestas'
  | 'cumpleanos'
  | 'corporativos'
  | 'aniversarios';

// ---------- Hero ----------
export interface HeroData {
  headline: string;
  subheadline: string;
  /** Background gradient CSS value or Tailwind classes */
  gradientClasses: string;
  /** Accent colour for decorative elements */
  accentColor: string;
  /** Emoji or short icon string shown next to headline */
  emoji: string;
  ctaLabel: string;
}

// ---------- Service / Package ----------
export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  included: string[];
  price?: string;
  highlighted?: boolean;
}

// ---------- Testimonial ----------
export interface Testimonial {
  id: string;
  authorName: string;
  /** e.g. "instagram" | "whatsapp" | "google" */
  source: 'instagram' | 'whatsapp' | 'google' | 'text';
  text: string;
  /** Optional URL to a screenshot image */
  screenshotUrl?: string;
  date?: string;
}

// ---------- Gift / Promotion ----------
export interface GiftItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface PromotionData {
  sectionTitle: string;
  sectionSubtitle?: string;
  gifts: GiftItem[];
}

// ---------- FAQ ----------
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// ---------- Payment Method ----------
export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

// ---------- Gallery ----------
export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  /** "wide" cells span 2 columns */
  size?: 'normal' | 'wide';
}

// ---------- Why Choose Us ----------
export interface WhyUsItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

// ---------- Process Step ----------
export interface ProcessStep {
  id: string;
  step: number;
  title: string;
  description: string;
  icon: string;
}

// ---------- Full Catalog Data ----------
export interface EventCatalogData {
  eventType: EventType;
  /** Slug used in the URL: /public/bodas */
  slug: string;
  /** Display name */
  name: string;
  hero: HeroData;
  services: ServiceItem[];
  testimonials: Testimonial[];
  promotion: PromotionData;
  faqs: FAQItem[];
  paymentMethods: PaymentMethod[];
  gallery: GalleryImage[];
  whyUs: WhyUsItem[];
  process: ProcessStep[];
  /** WhatsApp number for CTA links (digits only) */
  whatsappNumber?: string;
  /** Custom CTA message pre-filled in WhatsApp */
  whatsappMessage?: string;
}
