"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AllegriaTemplate } from "@/components/invitacion/templates/AllegriaTemplate";
import { GraziaTemplate } from "@/components/invitacion/templates/GraziaTemplate";
import type {
  FiestaEnPlanificacion,
  InvitacionDigitalData,
} from "@/types/fiesta";
import type { SocialConnection } from "@/types/settings";

interface AdvancedInvitationCanvasProps {
  fiesta: FiestaEnPlanificacion;
  invitacionData: InvitacionDigitalData;
  socialConnections: SocialConnection[];
  selectedSectionId: string | null;
  onSectionClick: (sectionId: string) => void;
  onUpdate: (update: Partial<InvitacionDigitalData>) => void;
}

export function AdvancedInvitationCanvas({
  fiesta,
  invitacionData,
  socialConnections,
  selectedSectionId,
  onSectionClick,
  onUpdate,
}: AdvancedInvitationCanvasProps) {
  const sensors = useSensors(useSensor(PointerSensor));
  const sections = invitacionData.secciones ?? [];

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((section) => section.id === active.id);
    const newIndex = sections.findIndex((section) => section.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onUpdate({ secciones: arrayMove(sections, oldIndex, newIndex) });
  };

  const templateProps = {
    fiesta,
    invitacionData,
    socialConnections,
    isPreview: true,
    onSectionClick,
    onUpdate,
    onRsvpSubmit: undefined,
    selectedSectionId,
  };

  const template =
    invitacionData.plantilla === "Allegria" ? (
      <AllegriaTemplate {...templateProps} />
    ) : (
      <GraziaTemplate {...templateProps} />
    );

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <SortableContext
        items={sections.map((section) => section.id)}
        strategy={verticalListSortingStrategy}
      >
        {template}
      </SortableContext>
    </DndContext>
  );
}
