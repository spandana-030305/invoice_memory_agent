import { VendorMemory, CorrectionMemory, ResolutionMemory } from "../models/memory";

export interface RecallResult {
  vendorMemories: VendorMemory[];
  correctionMemories: CorrectionMemory[];
  resolutionMemories: ResolutionMemory[];
  isDuplicate: boolean;
}

import { db } from "../memory/memoryStore";
import { Invoice } from "../models/invoice";

// Vendor Memory Recall
function recallVendorMemory(vendor: string): Promise<VendorMemory[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM vendor_memory WHERE vendor = ?`,
      [vendor],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows as VendorMemory[]);
      }
    );
  });
}

// Correction Memory Recall
function recallCorrectionMemory(vendor: string): Promise<CorrectionMemory[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM correction_memory WHERE vendor = ?`,
      [vendor],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows as CorrectionMemory[]);
      }
    );
  });
}

// Resolution Memory Recall
function recallResolutionMemory(vendor: string): Promise<ResolutionMemory[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM resolution_memory WHERE vendor = ?`,
      [vendor],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows as ResolutionMemory[]);
      }
    );
  });
}

// Main Recall Function
import { checkDuplicate } from "../utils/duplicateCheck";

export async function recallMemory(invoice: Invoice): Promise<RecallResult> {
  const [vendorMemories, correctionMemories, resolutionMemories] =
    await Promise.all([
      recallVendorMemory(invoice.vendor),
      recallCorrectionMemory(invoice.vendor),
      recallResolutionMemory(invoice.vendor),
    ]);

  const isDuplicate =
    invoice.fields.invoiceNumber != null
      ? await checkDuplicate(invoice.vendor, invoice.fields.invoiceNumber)
      : false;

  return {
    vendorMemories,
    correctionMemories,
    resolutionMemories,
    isDuplicate,
  };
}


