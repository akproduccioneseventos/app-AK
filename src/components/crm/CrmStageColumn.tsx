
'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { CrmLead, CrmStage } from '@/types/crm';
import { CrmLeadCard } from './CrmLeadCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

const INACTIVITY_DAYS = 7;

interface CrmStageColumnProps {
  stage: CrmStage;
  leads: CrmLead[];
  onDeleteLead: (leadId: string) => Promise<void>;
  deletingLeadId: string | null;
  onHire: (lead: CrmLead) => void;
}

export const CrmStageColumn = memo(function CrmStageColumn({
  stage,
  leads,
  onDeleteLead,
  deletingLeadId,
  onHire,
}: CrmStageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });
  
  const leadIds = leads.map(l => l.id);

  const inactiveCount = leads.filter(l => {
    const last = new Date(l.lastContactedAt || l.updatedAt || l.createdAt);
    return (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24) >= INACTIVITY_DAYS;
  }).length;

  return (
    <Card ref={setNodeRef} className={`w-full md:w-[320px] flex-shrink-0 border-t-4 flex flex-col ${stage.borderColor} ${isOver ? 'bg-primary/10' : stage.bgColor} shadow-md transition-colors`} style={{ height: 'calc(100vh - 22rem)', minHeight: '400px' }}>
      <CardHeader className={`p-3 ${stage.headerBgColor} ${stage.headerTextColor} rounded-t-md flex-shrink-0`}>
        <CardTitle className="text-base font-semibold flex justify-between items-center">
          <span>{stage.name}</span>
          <div className="flex items-center gap-1">
            {inactiveCount > 0 && (
              <Badge variant="outline" className="text-[9px] h-5 px-1 bg-orange-50 text-orange-700 border-orange-300" title={`${inactiveCount} sin actividad hace +${INACTIVITY_DAYS} días`}>
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />{inactiveCount}
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs px-2 py-0.5 font-black ${stage.bgColor} ${stage.textColor} opacity-80 border-none`}>
              {leads.length}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full pr-2">
            <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
            {leads.length > 0 ? (
                leads.map(lead => (
                <CrmLeadCard
                    key={lead.id}
                    lead={lead}
                    onDeleteLead={onDeleteLead}
                    isDeleting={deletingLeadId === lead.id}
                    onHire={() => onHire(lead)}
                />
                ))
            ) : (
                <div className="flex items-center justify-center h-24 p-6">
                    <p className={`text-sm ${stage.textColor} opacity-70`}>No hay prospectos en esta etapa.</p>
                </div>
            )}
            </SortableContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
