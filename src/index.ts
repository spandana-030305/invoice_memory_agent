import fs from "fs";
import path from "path";

import { initializeMemoryTables } from "./memory/memoryStore";
import { recallMemory } from "./engine/recall";
import { applyMemory } from "./engine/apply";
import { decideAction } from "./engine/decide";
import { learnFromHuman, logAudit } from "./engine/learn";

import { Invoice } from "./models/invoice";
import { ProcessingResult } from "./models/output";
import { AuditStep } from "./models/output";

// Load Data

const invoicesPath = path.join(__dirname, "../data/invoices_extracted.json");
const humanCorrectionsPath = path.join(
  __dirname,
  "../data/human_corrections.json"
);

const invoices: Invoice[] = JSON.parse(fs.readFileSync(invoicesPath, "utf-8"));
const humanCorrections = JSON.parse(
  fs.readFileSync(humanCorrectionsPath, "utf-8")
);

// Initialize DB

console.log("Starting Invoice Memory Agent...");
initializeMemoryTables();

// Human Decision

function getHumanDecision(invoiceId: string): "approved" | "rejected" {
  const record = humanCorrections.find(
    (h: any) => h.invoiceId === invoiceId
  );
  return record?.finalDecision ?? "approved";
}

// Process Invoices

async function processInvoice(invoice: Invoice): Promise<ProcessingResult> {
  const auditTrail: AuditStep[] = [];

  // Recall
  const recallResult = await recallMemory(invoice);
  auditTrail.push({
    step: "recall",
    timestamp: new Date().toISOString(),
    details: `Recalled ${recallResult.vendorMemories.length} vendor memories`
  });

  // Apply
  const applyResult = applyMemory(invoice, recallResult);
  auditTrail.push({
    step: "apply",
    timestamp: new Date().toISOString(),
    details: applyResult.proposedCorrections.join("; ") || "No corrections suggested"
  });

  // Decide 
  const decision = decideAction(applyResult, recallResult);
  auditTrail.push({
    step: "decide",
    timestamp: new Date().toISOString(),
    details: decision.reasoning
  });

  // Learn
  const humanDecision = getHumanDecision(invoice.invoiceId);
  learnFromHuman(
    invoice.invoiceId,
    invoice.vendor,
    applyResult.appliedMemories,
    humanDecision
  );

  logAudit(
    "learn",
    `Invoice ${invoice.invoiceId} ${humanDecision}`
  );

  auditTrail.push({
    step: "learn",
    timestamp: new Date().toISOString(),
    details: `Human decision: ${humanDecision}`
  });

  // Final Output
  return {
    normalizedInvoice: applyResult.normalizedInvoice,
    proposedCorrections: applyResult.proposedCorrections,
    requiresHumanReview: decision.requiresHumanReview,
    reasoning: decision.reasoning,
    confidenceScore: decision.confidenceScore,
    memoryUpdates: applyResult.appliedMemories,
    auditTrail
  };
}

// Demo Run

(async () => {
  for (const invoice of invoices) {
    console.log(`\n📄 Processing ${invoice.invoiceId} (${invoice.vendor})`);

    const result = await processInvoice(invoice);

    console.log(JSON.stringify(result, null, 2));
  }
})();


