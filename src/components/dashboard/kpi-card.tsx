'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  isLoading?: boolean;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, description, icon: Icon, isLoading, className }) => (
  <Card className={cn("shadow-lg border-none bg-white rounded-3xl overflow-hidden group hover:bg-slate-50 transition-all duration-300", className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
      <CardTitle className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-primary transition-colors">
        {title}
      </CardTitle>
      <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-500">
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent className="px-6 pb-6">
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : (
        <div className="text-3xl font-black text-slate-800 tracking-tighter">
            {value}
        </div>
      )}
      {description && (
        <p className="text-[10px] text-muted-foreground mt-2 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded-full">
            {description}
        </p>
      )}
    </CardContent>
  </Card>
);