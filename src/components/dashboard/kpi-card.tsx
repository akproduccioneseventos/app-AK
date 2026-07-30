'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  isLoading?: boolean;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, description, icon: Icon, isLoading, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="h-full"
  >
    <Card className={cn(
      "group relative h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10",
      className
    )}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5 sm:p-6">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors group-hover:text-indigo-600">
          {title}
        </CardTitle>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-2.5 text-indigo-600 transition-all duration-300 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-indigo-600/20">
          <Icon className="h-5 w-5 shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
        {isLoading ? (
          <div className="h-9 w-32 rounded-lg bg-slate-100 animate-pulse" />
        ) : (
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 transition-transform duration-300 group-hover:scale-[1.01] origin-left">
            {value}
          </div>
        )}
        {description && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  </motion.div>
);
