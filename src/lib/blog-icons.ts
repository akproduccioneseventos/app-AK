import {
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  CreditCard,
  Heart,
  PartyPopper,
  Sparkles,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const BLOG_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  CreditCard,
  Heart,
  PartyPopper,
  Sparkles,
  Utensils,
};

export function getBlogIcon(name: string | null | undefined): LucideIcon {
  return (name && BLOG_ICONS[name]) || BookOpen;
}
