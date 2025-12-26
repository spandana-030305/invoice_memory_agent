import { ApplyResult } from "./apply";
import { RecallResult } from "./recall";

export interface DecisionResult {
  requiresHumanReview: boolean;
  confidenceScore: number;
  reasoning: string;
}

export function decideAction(
  applyResult: ApplyResult,
  recallResult: RecallResult
): DecisionResult {
  // Duplicate → escalate
  if (recallResult.isDuplicate) {
    return {
      requiresHumanReview: true,
      confidenceScore: 0.2,
      reasoning: "Invoice appears to be a duplicate based on vendor and invoice number."
    };
  }

  // No memory used → low confidence
  if (applyResult.appliedMemories.length === 0) {
    return {
      requiresHumanReview: true,
      confidenceScore: 0.3,
      reasoning: "No relevant memory found; system lacks confidence to proceed automatically."
    };
  }

  // Some memory applied → medium confidence
  if (applyResult.appliedMemories.length === 1) {
    return {
      requiresHumanReview: true,
      confidenceScore: 0.6,
      reasoning: "One memory pattern applied; suggestion made but human review recommended."
    };
  }

  // Multiple memories → high confidence
  return {
    requiresHumanReview: false,
    confidenceScore: 0.85,
    reasoning:
      "Multiple consistent memory patterns applied; system confident to auto-correct."
  };
}


