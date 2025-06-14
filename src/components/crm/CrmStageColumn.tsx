
'use client';

import type { CrmLead, CrmStage } from '@/types/crm';
import { CrmLeadCard } from './CrmLeadCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CrmStageColumnProps {
  stage: CrmStage;
  leads: CrmLead[];
  allStages: CrmStage[];
  onMoveLead: (leadId: string, newStageId: string) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
  movingLeadId: string | null;
  deletingLeadId: string | null;
}

export function CrmStageColumn({
  stage,
  leads,
  allStages,
  onMoveLead,
  onDeleteLead,
  movingLeadId,
  deletingLeadId,
}: CrmStageColumnProps) {
  return (
    <Card className={`w-72 md:w-80 flex-shrink-0 border-t-4 ${stage.borderColor} ${stage.bgColor} shadow-md`}>
      <CardHeader className={`p-3 ${stage.headerBgColor} ${stage.headerTextColor} rounded-t-md`}>
        <CardTitle className="text-base font-semibold flex justify-between items-center">
          <span>{stage.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${stage.bgColor} ${stage.textColor} opacity-80`}>
            {leads.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 h-[calc(100vh-280px)] min-h-[200px]"> {/* Adjusted height */}
        <ScrollArea className="h-full pr-2">
          {leads.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className={`text-sm ${stage.textColor} opacity-70`}>No hay leads en esta etapa.</p>
            </div>
          ) : (
            leads.map(lead => (
              <CrmLeadCard
                key={lead.id}
                lead={lead}
                stages={allStages}
                onMoveLead={onMoveLead}
                onDeleteLead={onDeleteLead}
                isMoving={movingLeadId === lead.id}
                isDeleting={deletingLeadId === lead.id}
              />
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
