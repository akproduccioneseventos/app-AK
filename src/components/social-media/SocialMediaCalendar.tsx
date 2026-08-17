'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import type { SocialPost, SocialPlatform } from '@/types/social-media';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AtSign, Facebook, Instagram, MessageSquare, Music, Youtube } from 'lucide-react';

interface SocialMediaCalendarProps {
  posts: SocialPost[];
}

const platformStyles: Record<SocialPlatform, string> = {
  Facebook: 'text-blue-600',
  Instagram: 'text-pink-500',
  Threads: 'text-slate-800 dark:text-slate-100',
  TikTok: 'text-slate-900 dark:text-white',
  YouTube: 'text-red-600',
  X: 'text-slate-900 dark:text-white',
  WhatsApp: 'text-green-600',
};

const platformIcons: Record<SocialPlatform, React.ElementType> = {
  Facebook,
  Instagram,
  Threads: AtSign,
  TikTok: Music,
  YouTube,
  X: AtSign,
  WhatsApp: MessageSquare,
};

export function SocialMediaCalendar({ posts }: SocialMediaCalendarProps) {
  const [month, setMonth] = useState(new Date());

  const postsByDay = useMemo(() => {
    const grouped: Record<string, SocialPost[]> = {};
    posts.forEach((post) => {
      const parsed = new Date(post.publishDate);
      if (Number.isNaN(parsed.getTime())) return;
      const day = parsed.toISOString().split('T')[0];
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(post);
    });
    return grouped;
  }, [posts]);

  const DayContent = (dayProps: { date: Date }) => {
    const dayString = dayProps.date.toISOString().split('T')[0];
    const postsForDay = postsByDay[dayString];

    if (!postsForDay) return <div className="h-full w-full">{dayProps.date.getDate()}</div>;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative flex h-full w-full cursor-pointer items-center justify-center">
            {dayProps.date.getDate()}
            <div className="absolute bottom-0.5 flex items-center justify-center gap-0.5">
              {postsForDay.slice(0, 3).map((post) => {
                const Icon = platformIcons[post.platform];
                return <Icon key={post.id} className={`h-2 w-2 ${platformStyles[post.platform]}`} />;
              })}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <div className="mb-2 text-sm font-bold">
            {dayProps.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <ul className="space-y-1.5">
            {postsForDay.map((post) => {
              const Icon = platformIcons[post.platform];
              return (
                <li key={post.id} className="flex items-start gap-1.5 text-xs">
                  <Icon className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${platformStyles[post.platform]}`} />
                  <span>{post.text.substring(0, 50)}{post.text.length > 50 ? '...' : ''}</span>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Calendar
      mode="single"
      month={month}
      onMonthChange={setMonth}
      locale={es}
      className="mx-auto rounded-md border p-0 shadow-sm"
      components={{ DayContent }}
      classNames={{
        day_outside: 'text-muted-foreground/30',
        cell: 'h-16 w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: 'h-full w-full p-1.5',
      }}
    />
  );
}
