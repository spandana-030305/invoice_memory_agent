import { Invoice } from "../models/invoice";
import { RecallResult } from "./recall";

export interface ApplyResult {
  normalizedInvoice: Invoice;
  proposedCorrections: string[];
  appliedMemories: string[];
}

import { VendorMemory, CorrectionMemory } from "../models/memory";

// Apply Vendor Memory
function applyVendorMemory(
  invoice: Invoice,
  vendorMemories: VendorMemory[],
  proposedCorrections: string[],
  appliedMemories: string[]
): Invoice {
  let updatedInvoice = { ...invoice };

  for (const memory of vendorMemories) {
    if (
      memory.field === "serviceDate" &&
      !invoice.fields.serviceDate &&
      invoice.rawText.includes(memory.pattern)
    ) {
      proposedCorrections.push(
        `Filled serviceDate using vendor pattern '${memory.pattern}'`
      );
      appliedMemories.push(`VendorMemory:${memory.pattern}`);

      updatedInvoice = {
        ...updatedInvoice,
        fields: {
          ...updatedInvoice.fields,
          serviceDate: "EXTRACTED_FROM_RAWTEXT"
        }
      };
    }
  }

  return updatedInvoice;
}

// Apply Correction Memory
function applyCorrectionMemory(
  invoice: Invoice,
  correctionMemories: CorrectionMemory[],
  proposedCorrections: string[],
  appliedMemories: string[]
): void {
  for (const memory of correctionMemories) {
    if (
      memory.issue === "VAT_INCLUDED" &&
      invoice.rawText.toLowerCase().includes("vat")
    ) {
      proposedCorrections.push(
        "Invoice indicates VAT included; totals may need recalculation"
      );
      appliedMemories.push(`CorrectionMemory:${memory.issue}`);
    }
  }
}

// Main Apply Function
export function applyMemory(
  invoice: Invoice,
  recallResult: RecallResult
): ApplyResult {
  const proposedCorrections: string[] = [];
  const appliedMemories: string[] = [];

  let normalizedInvoice = applyVendorMemory(
    invoice,
    recallResult.vendorMemories,
    proposedCorrections,
    appliedMemories
  );

    /* ---------------- VAT Included Correction (Parts AG) ---------------- */

  if (
    normalizedInvoice.rawText.includes("MwSt. inkl") ||
    invoice.rawText.includes("Prices incl. VAT")
  ) {
    proposedCorrections.push(
      "Prices include VAT; recompute net and tax amounts"
    );
    appliedMemories.push("CorrectionMemory:VAT_INCLUDED");
  }

    /* ---------------- Currency Recovery ---------------- */

  if (!invoice.fields.currency && invoice.rawText.includes("EUR")) {
    normalizedInvoice.fields.currency = "EUR";
    proposedCorrections.push("Recovered missing currency from rawText");
    appliedMemories.push("CorrectionMemory:CURRENCY_RECOVERY");
  }

    /* ---------------- Freight SKU Mapping ---------------- */

  if (
    invoice.vendor === "Freight & Co" &&
    normalizedInvoice.fields.lineItems[0]?.description
      ?.toLowerCase()
      .includes("seefracht")
  ) {
    normalizedInvoice.fields.lineItems[0].sku = "FREIGHT";
    proposedCorrections.push("Mapped 'Seefracht' to SKU FREIGHT");
    appliedMemories.push("VendorMemory:FREIGHT_SKU");
  }

  applyCorrectionMemory(
    normalizedInvoice,
    recallResult.correctionMemories,
    proposedCorrections,
    appliedMemories
  );

  return {
    normalizedInvoice,
    proposedCorrections,
    appliedMemories
  };
}
