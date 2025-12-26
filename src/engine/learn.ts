function updateConfidence(
  current: number,
  decision: "approved" | "rejected"
): number {
  if (decision === "approved") {
    return Math.min(current + 0.1, 0.95);
  }
  return Math.max(current - 0.2, 0.1);
}

// Learn Vendor Memory
import { db } from "../memory/memoryStore";

export function learnVendorMemory(
  vendor: string,
  pattern: string,
  field: string,
  extractedFrom: string,
  decision: "approved" | "rejected"
) {
  const now = new Date().toISOString();

  db.get(
    `SELECT * FROM vendor_memory WHERE vendor = ? AND pattern = ?`,
    [vendor, pattern],
    (err, row: any) => {
      if (row) {
        const newConfidence = updateConfidence(row.confidence, decision);
        db.run(
          `UPDATE vendor_memory
           SET confidence = ?, usageCount = usageCount + 1, lastUsedAt = ?
           WHERE id = ?`,
          [newConfidence, now, row.id]
        );
      } else {
        db.run(
          `INSERT INTO vendor_memory
           (vendor, pattern, field, extractedFrom, confidence, usageCount, lastUsedAt, createdAt)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
          [vendor, pattern, field, extractedFrom, 0.5, now, now]
        );
      }
    }
  );
}

//Learn Correction Memory
export function learnCorrectionMemory(
  vendor: string,
  issue: string,
  action: string,
  decision: "approved" | "rejected"
) {
  const now = new Date().toISOString();

  db.get(
    `SELECT * FROM correction_memory WHERE vendor = ? AND issue = ?`,
    [vendor, issue],
    (err, row: any) => {
      if (row) {
        const newConfidence = updateConfidence(row.confidence, decision);
        db.run(
          `UPDATE correction_memory
           SET confidence = ?, usageCount = usageCount + 1, lastUsedAt = ?
           WHERE id = ?`,
          [newConfidence, now, row.id]
        );
      } else {
        db.run(
          `INSERT INTO correction_memory
           (vendor, issue, action, confidence, usageCount, lastUsedAt, createdAt)
           VALUES (?, ?, ?, ?, 1, ?, ?)`,
          [vendor, issue, action, 0.5, now, now]
        );
      }
    }
  );
}

// Learn Resolution Memory
export function learnResolutionMemory(
  vendor: string,
  decision: "approved" | "rejected"
) {
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO resolution_memory
     (vendor, decision, confidence, usageCount, lastUsedAt, createdAt)
     VALUES (?, ?, ?, 1, ?, ?)`,
    [vendor, decision, 0.5, now, now]
  );
}

// Audit Trail
export function logAudit(step: string, details: string) {
  const timestamp = new Date().toISOString();

  db.run(
    `INSERT INTO audit_trail (step, timestamp, details)
     VALUES (?, ?, ?)`,
    [step, timestamp, details]
  );
}

// Main Learn Function
export function learnFromHuman(
  invoiceId: string,
  vendor: string,
  appliedMemories: string[],
  finalDecision: "approved" | "rejected"
) {
  logAudit("learn", `Learning from invoice ${invoiceId}`);

  // Vendor memory on first approval
  if (finalDecision === "approved" && appliedMemories.length === 0) {
    learnVendorMemory(
      vendor,
      "Leistungsdatum",
      "serviceDate",
      "rawText",
      "approved"
    );
  }

  // Logic
  for (const memory of appliedMemories) {
    if (memory.startsWith("VendorMemory")) {
      learnVendorMemory(
        vendor,
        "Leistungsdatum",
        "serviceDate",
        "rawText",
        finalDecision
      );
    }
  }

  learnResolutionMemory(vendor, finalDecision);
}



