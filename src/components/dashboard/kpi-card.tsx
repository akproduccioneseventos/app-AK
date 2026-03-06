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
      "relative overflow-hidden border-none bg-white rounded-[1.5rem] premium-shadow group hover:bg-slate-50 transition-all duration-500",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
        ) : (
          <div className="text-3xl font-black text-slate-800 tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500">
              {value}
          </div>
        )}
        {description && (
          <p className="text-[10px] text-muted-foreground mt-3 font-bold bg-slate-100/80 inline-block px-3 py-1 rounded-full border border-slate-200/50">
              {description}
          </p>
        )}
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </Card>
  </motion.div>
);