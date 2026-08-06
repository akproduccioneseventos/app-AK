"use client";

import {
  DndContext,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CrmStageColumn } from "@/components/crm/CrmStageColumn";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { CrmLead, CrmStage } from "@/types/crm";

const BOARD_SCROLL_STYLE = {
  height: "calc(100vh - 320px)",
  minHeight: "400px",
  maxHeight: "900px",
} as const;

interface CrmDesktopBoardProps {
  stages: CrmStage[];
  leadsByStage: Record<string, CrmLead[]>;
  deletingLeadId: string | null;
  onDeleteLead: (leadId: string) => Promise<void>;
  onHire: (lead: CrmLead) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function CrmDesktopBoard({
  stages,
  leadsByStage,
  deletingLeadId,
  onDeleteLead,
  onHire,
  onDragEnd,
}: CrmDesktopBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <ScrollArea
        className="w-full whitespace-nowrap pb-4"
        style={BOARD_SCROLL_STYLE}
      >
        <div className="flex gap-4">
          {stages.map((stage) => (
            <CrmStageColumn
              key={stage.id}
              stage={stage}
              leads={leadsByStage[stage.id] || []}
              onDeleteLead={onDeleteLead}
              deletingLeadId={deletingLeadId}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </DndContext>
  );
}
