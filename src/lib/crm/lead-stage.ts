export function resolvePublicLeadStage(input: {
  existingStageId?: string;
  initialStageId: string;
  budgetStageId?: string;
  isSimulatorLead: boolean;
  shouldAdvanceToBudget: boolean;
}): string {
  if (input.existingStageId) {
    if (input.shouldAdvanceToBudget && input.budgetStageId) {
      return input.budgetStageId;
    }
    return input.existingStageId;
  }

  if (input.isSimulatorLead && input.budgetStageId) {
    return input.budgetStageId;
  }

  return input.initialStageId;
}
