export type MemoryType = "VENDOR" | "CORRECTION" | "RESOLUTION";

// Base
export interface BaseMemory {
  id?: number;
  vendor: string;
  confidence: number;
  usageCount: number;
  lastUsedAt: string;
  createdAt: string;
}

// Vendor-specific patterns
export interface VendorMemory extends BaseMemory {
  type: "VENDOR";
  pattern: string;
  field: string;
  extractedFrom: string;
}

// Repeated corrections
export interface CorrectionMemory extends BaseMemory {
  type: "CORRECTION";
  issue: string;
  action: string;
}

// Human outcomes
export interface ResolutionMemory extends BaseMemory {
  type: "RESOLUTION";
  decision: "approved" | "rejected";
}
