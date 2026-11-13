# CivicTax Faculty Viva & Project Defense Guide

## 1. Project Summary & Academic Problem Statement

- **Project Title**: CIVICTAX — Property Tax Assessment and Payment Management System.
- **Academic Domain**: Enterprise Cloud Application Development & Smart Municipal Governance.
- **Core Problem**: Municipal tax administration suffers from manual paper assessments, inconsistent rate applications, lack of citizen transparency, and delayed arrears recovery.
- **Proposed Solution**: An enterprise hybrid application combining a modern, accessible React frontend with an authoritative Salesforce multi-tenant cloud backend.

---

## 2. Frequently Asked Faculty Viva Questions & Authoritative Answers

### Q1: Why did you separate the React frontend from Salesforce instead of building only on Salesforce?
> **Answer**: In real-world municipal architectures, citizens need high-speed, frictionless, public-facing portals that do not consume expensive Salesforce Community/Experience Cloud licenses for millions of residents. The React frontend provides the citizen experience, while Salesforce acts as the secure, authoritative system of record for municipal officers and revenue commissioners.

### Q2: How do you prevent floating-point calculation errors in tax calculations?
> **Answer**: All tax assessments and payment rollups are implemented in Apex using the `Decimal` primitive type with exact precision (`precision 14, scale 2`) and explicit rounding modes (`System.RoundingMode.HALF_UP`). JavaScript floating-point calculations in the browser are never trusted for financial transactions.

### Q3: What is your trigger recursion prevention strategy?
> **Answer**: We avoid simplistic global static boolean flags that accidentally ignore valid bulk records during batch loads. Instead, we use a single-trigger-per-object pattern delegating to idempotent service handler methods with transaction change state comparisons.

### Q4: How is citizen privacy enforced?
> **Answer**: In Salesforce, Organization-Wide Defaults (OWD) and custom Permission Sets (`CivicTax_Citizen`) restrict record visibility. In the public transparency module, `LocalTransparencyService` sanitizes data by stripping all Personal Identifiable Information (PII) before publishing ward-level aggregate metrics.

### Q5: How do you handle high-volume operations like annual tax billing?
> **Answer**: High-volume tasks are decoupled using Asynchronous Apex (`CivicTaxAsyncJobs.cls`): `Queueable` Apex for non-blocking notification dispatch and `Batchable` Apex (`OverdueAssessmentBatch`) to process thousands of delinquent accounts without exceeding governor limits.
