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
      "group relative overflow-hidden border-red-100/90 bg-white/95 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-[0_22px_60px_rgba(127,29,29,0.12)]",
      className
    )}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-900" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-5 sm:p-6">
        <CardTitle className="text-[11px] font-black uppercase tracking-normal text-slate-500 transition-colors group-hover:text-red-800">
          {title}
        </CardTitle>
        <div className="rounded-lg border border-red-100 bg-red-50 p-2.5 text-red-700 transition-all duration-300 group-hover:border-red-200 group-hover:bg-red-600 group-hover:text-white">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
        {isLoading ? (
          <div className="h-8 w-28 rounded-lg bg-slate-100 shimmer" />
        ) : (
          <div className="text-3xl font-black tracking-normal text-slate-950 transition-transform duration-300 group-hover:scale-[1.02] origin-left">
              {value}
          </div>
        )}
        {description && (
          <p className="mt-3 inline-block rounded-md border border-red-100 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-800">
              {description}
          </p>
        )}
      </CardContent>
    </Card>
  </motion.div>
);
