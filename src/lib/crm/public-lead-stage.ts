export function resolvePublicLeadStageId(input: {
  existingStageId?: string;
  initialStageId: string;
  budgetStageId?: string;
  shouldAdvanceToBudget: boolean;
}): string {
  if (input.shouldAdvanceToBudget) {
    return input.budgetStageId || input.initialStageId;
  }
  return input.existingStageId || input.initialStageId;
}
