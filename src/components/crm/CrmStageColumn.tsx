
'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { CrmLead, CrmStage } from '@/types/crm';
import { CrmLeadCard } from './CrmLeadCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  return (
    <Card ref={setNodeRef} className={`w-full md:w-[320px] flex-shrink-0 border-t-4 flex flex-col ${stage.borderColor} ${isOver ? 'bg-primary/10' : stage.bgColor} shadow-md transition-colors`} style={{ height: 'calc(100vh - 22rem)', minHeight: '400px' }}>
      <CardHeader className={`p-3 ${stage.headerBgColor} ${stage.headerTextColor} rounded-t-md flex-shrink-0`}>
        <CardTitle className="text-base font-semibold flex justify-between items-center">
          <span>{stage.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${stage.bgColor} ${stage.textColor} opacity-80`}>
            {leads.length}
          </span>
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
