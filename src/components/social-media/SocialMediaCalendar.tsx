
'use client';

import { useState, useMemo } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { es } from 'date-fns/locale';
import type { SocialPost, SocialPlatform } from '@/types/social-media';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Facebook, Instagram, Music, MessageSquare } from 'lucide-react';

interface SocialMediaCalendarProps {
    posts: SocialPost[];
}

const platformStyles: Record<SocialPlatform, string> = {
    Facebook: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
    Instagram: 'bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200',
    TikTok: 'bg-gray-200 text-gray-900 border-gray-400 hover:bg-gray-300',
    WhatsApp: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
};

const platformIcons: Record<SocialPlatform, React.ElementType> = {
    Facebook: Facebook,
    Instagram: Instagram,
    TikTok: Music,
    WhatsApp: MessageSquare,
};

export function SocialMediaCalendar({ posts }: SocialMediaCalendarProps) {
    const [month, setMonth] = useState(new Date());

    const postsByDay = useMemo(() => {
        const grouped: Record<string, SocialPost[]> = {};
        posts.forEach(post => {
            const day = new Date(post.publishDate).toISOString().split('T')[0];
            if (!grouped[day]) {
                grouped[day] = [];
            }
            grouped[day].push(post);
        });
        return grouped;
    }, [posts]);

    const DayContent = (dayProps: { date: Date }) => {
        const dayString = dayProps.date.toISOString().split('T')[0];
        const postsForDay = postsByDay[dayString];

        if (!postsForDay) {
            return <div className="h-full w-full">{dayProps.date.getDate()}</div>;
        }

        return (
            <Popover>
                <PopoverTrigger asChild>
                    <div className="relative h-full w-full flex items-center justify-center cursor-pointer">
                        {dayProps.date.getDate()}
                        <div className="absolute bottom-0.5 flex justify-center items-center gap-0.5">
                            {postsForDay.slice(0, 3).map(post => {
                                const Icon = platformIcons[post.platform];
                                const colorMatch = platformStyles[post.platform].match(/text-([a-z]+)-(\d+)/);
                                const color = colorMatch ? `${colorMatch[1]}-${colorMatch[2]}` : 'black';
                                return <Icon key={post.id} className="w-2 h-2" style={{color: `var(--tw-color-${color})`}}/>;
                            })}
                        </div>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                    <div className="font-bold text-sm mb-2">{dayProps.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                    <ul className="space-y-1.5">
                        {postsForDay.map(post => {
                             const Icon = platformIcons[post.platform];
                             const colorMatch = platformStyles[post.platform].match(/text-([a-z]+)-(\d+)/);
                             const color = colorMatch ? `${colorMatch[1]}-${colorMatch[2]}` : 'black';
                             return (
                                <li key={post.id} className="text-xs flex items-start gap-1.5">
                                    <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{color: `var(--tw-color-${color})`}}/>
                                    <span>{post.text.substring(0, 50)}{post.text.length > 50 ? '...' : ''}</span>
                                </li>
                             )
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
            className="p-0 rounded-md border shadow-sm mx-auto"
            components={{
                DayContent: DayContent,
            }}
             classNames={{
                day_outside: "text-muted-foreground/30",
                cell: "h-16 w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-full w-full p-1.5"
            }}
        />
    );
}
