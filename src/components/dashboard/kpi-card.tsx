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
  >
    <Card className={cn(
      "group relative overflow-hidden border-slate-200/80 bg-white/95 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]",
      className
    )}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-700 via-amber-400 to-sky-500" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-5 sm:p-6">
        <CardTitle className="text-[11px] font-black uppercase tracking-normal text-slate-500 transition-colors group-hover:text-teal-800">
          {title}
        </CardTitle>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-teal-700 transition-all duration-300 group-hover:border-amber-200 group-hover:bg-amber-50 group-hover:text-amber-700">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        ) : (
          <div className="text-3xl font-black tracking-normal text-slate-950 transition-transform duration-300 group-hover:scale-[1.02] origin-left">
              {value}
          </div>
        )}
        {description && (
          <p className="mt-3 inline-block rounded-md border border-slate-200/80 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
              {description}
          </p>
        )}
      </CardContent>
    </Card>
  </motion.div>
);
