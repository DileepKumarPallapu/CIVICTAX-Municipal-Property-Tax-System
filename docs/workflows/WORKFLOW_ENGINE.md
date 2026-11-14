# CivicTax 5.0: Central Workflow Orchestration Engine

## 1. Engine Architecture & Specification

The CivicTax 5.0 **Central Workflow Engine** orchestrates lifecycle pipelines across all municipal departments. It maintains state machines, enforces transition legality, handles automatic task routing, logs transition history, and manages SLA policies.

```
+---------------------------------------------------------------------------------------------------+
|                        CIVICTAX 5.0 CENTRAL WORKFLOW ORCHESTRATION PIPELINE                       |
+---------------------------------------------------------------------------------------------------+

                                    [ WORKFLOW TRIGGER ]
                         (Citizen Submission / Officer Action / Batch)
                                               │
                                               ▼
                              [ CivicTaxWorkflowEngine.ts ]
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                             ▼
             [ Transition Validator ]                      [ State Machine Index ]
             - Is legal transition?                        - Property (Draft -> Active)
             - Does actor have permission?                 - Assessment (Draft -> Published)
             - Are mandatory fields complete?              - Payment (Initiated -> Success)
                        │                                  - Grievance (Submitted -> Closed)
                        ▼                                  - Reassessment (Submitted -> Approved)
             [ Execution & State Mutation ]
             - Updates target record
             - Appends to Workflow History Ledger
             - Auto-generates Officer Task (Intelligent Assignment)
             - Enqueues Citizen & Officer Notifications
             - Emits Application Audit Log
```

---

## 2. Core Workflow Entity Schema

Every workflow instance in CivicTax encapsulates the following twelve attributes:

```typescript
export interface MunicipalWorkflowInstance {
  workflowId: string;             // e.g. "WF-PROP-2026-00412"
  workflowType: 'PROPERTY_REG' | 'TAX_ASSESSMENT' | 'PAYMENT' | 'GRIEVANCE' | 'REASSESSMENT';
  recordId: string;               // Target entity ID (e.g. Property ID, Assessment ID)
  recordReference: string;        // Human-readable reference (e.g. "CHN-ZN01-WD04-00104")
  currentStage: string;           // Current lifecycle stage
  previousStage: string | null;   // Immediate predecessor stage
  nextPermittedStages: string[];  // Whitelist of valid next transition stages
  assignedDepartment: string;     // e.g. "Property Registration", "Field Verification"
  assignedOfficerId: string | null;
  assignedOfficerName: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;              // ISO 8601 UTC
  updatedAt: string;              // ISO 8601 UTC
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED';
  processingHistory: WorkflowHistoryEvent[];
}

export interface WorkflowHistoryEvent {
  stage: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  actionTaken: string;
  comments: string;
  slaStatusOnExit: 'WITHIN_SLA' | 'BREACHED';
}
```

---

## 3. Supported Workflow Engine Operations

1. **`createWorkflow(instance)`**: Instantiates a new workflow pipeline upon citizen submission.
2. **`transitionStage(workflowId, nextStage, actor, comments)`**: Validates transition legality, updates status, and appends to immutable history.
3. **`assignOfficer(workflowId, officerId)`**: Routes work to an authorized zonal officer.
4. **`reassignOfficer(workflowId, newOfficerId, justification)`**: Workload balancing reassignment with logged supervisor justification.
5. **`cancelWorkflow(workflowId, reason, actor)`**: Administrative abort with mandatory audit note.
