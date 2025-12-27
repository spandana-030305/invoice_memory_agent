## Problem Overview:

- Companies process hundreds of invoices daily, many of which share recurring patterns:

- Same vendors using the same field labels

- Repeated tax issues (e.g., VAT included in totals)

- Missing or ambiguous fields (currency, service dates)

- Duplicate invoices sent multiple times

## Architecture Diagram Overview:

- The Invoice Memory Agent follows a memory-driven, agent-based architecture designed to process invoices in an explainable and continuously improving manner.

- The workflow begins with an Invoice JSON input, which is parsed and validated during the Input Understanding stage and mapped into strongly typed TypeScript data models.

- At the core of the system is the Memory Layer, which stores historical knowledge in three forms:

Vendor Memory for vendor-specific patterns

Correction Memory for recurring correction issues

Resolution Memory for past human approval and rejection outcomes

- These memories are persisted using SQLite, ensuring learning is retained across executions.

- The Decision Engine drives the agent’s behavior using a structured pipeline:

Recall retrieves relevant memory based on the current invoice context

Apply proposes corrections using recalled memory

Decide determines whether the invoice can be auto-corrected or must be escalated for human review

Learn updates memory based on final outcomes

When human review is required, decisions and feedback flow into the Learning Layer, where memory confidence and quality are adjusted. All decisions produce an Explainable Output containing reasoning, confidence scores, and an audit trail.

This architecture ensures the system remains transparent, auditable, conservative in automation, and capable of improving over time through real human feedback.

## Solution:

## System Flow:

Each invoice is processed sequentially using a four-stage pipeline:

Recall → Apply → Decide → Learn

# Recall Stage:

For a given invoice, the system retrieves previously stored information from persistent memory, including:

- Vendor-specific memory patterns

- Known correction patterns for recurring issues

- Historical resolution data for the vendor

- A duplicate indicator based on prior processing

This stage provides historical context without modifying invoice data.

# Apply Stage:

Using the recalled memory, the system proposes corrections and normalizations such as:

- Filling missing service dates using vendor-specific patterns

- Identifying invoices where VAT is already included in totals

- Recovering missing currency information from raw text

- Mapping vendor-specific descriptions to standardized SKUs

All proposed changes are explicitly recorded along with the memory patterns that triggered them. The system produces a normalized invoice representation and a list of suggested corrections.

# Decision Stage:

After applying memory, the system evaluates whether the invoice can be processed automatically or requires human review.

The decision is based on:

- Duplicate detection results

- The number of memory patterns applied

Each decision includes:

- A confidence score

- A clear reasoning statement

- A flag indicating whether human review is required

# Learning Stage:

Once a final human decision (approved or rejected) is available, the system updates its memory:

- Confidence scores for applied memory patterns are adjusted

- Usage counts and timestamps are updated

- Resolution outcomes are recorded

- All learning actions are logged for auditability

Learning is incremental and persists across executions.

# Memory Persistence:

- All memory is stored in a SQLite database

- Memory persists across program runs

- Previously learned patterns are reused when similar invoices appear

This allows the system to improve its behavior over time without retraining.

# Output:

For each processed invoice, the system produces a structured output containing:

- Normalized invoice data

- Proposed corrections

- Automation decision and confidence score

- Reasoning behind the decision

- References to applied memory patterns

- A complete audit trail covering all processing stages

The system processes invoices sequentially from the provided dataset and outputs a structured JSON result for each invoice.

