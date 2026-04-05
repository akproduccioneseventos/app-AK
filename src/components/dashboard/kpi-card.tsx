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
      "relative overflow-hidden border-none bg-white rounded-[1.5rem] premium-shadow group hover:bg-indigo-50/30 transition-all duration-500",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 transition-colors">
          {title}
        </CardTitle>
        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-400 group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white transition-all duration-500 shadow-inner">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-indigo-300" />
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
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </Card>
  </motion.div>
);