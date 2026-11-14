# CivicTax 4.0: Centralized Error Handling, Resilience & Performance

## 1. Centralized Error Handling Architecture

CivicTax 4.0 implements a unified exception and resilience hierarchy preventing unhandled crashes and data corruption:

```
+---------------------------------------------------------------------------------------------------+
|                        CENTRALIZED ERROR HANDLING & RESILIENCE PIPELINE                           |
+---------------------------------------------------------------------------------------------------+

   [ UI Interaction / API Request ]
                 │
                 v
   [ Validation Boundary ] ──( Invalid Input )──> Inline Form Alert (No network call)
                 │
                 v (Network Call)
   [ Express Gateway / Salesforce ]
                 │
                 ├─────( Network Timeout / 503 )─────> Automated Safe Retry (Max 3 attempts with jitter)
                 │
                 ├─────( Duplicate Transaction )───> Idempotent Rejection Envelope
                 │
                 └─────( Business Rule Violation )──> Standardized JSON Error Payload
                                                              │
                                                              v
                                              [ Global Toast / Error Boundary ]
```

---

## 2. Resilience Mechanisms

1. **Duplicate Submission Prevention**:
   - Primary action buttons (e.g. "Pay Tax", "Submit Property") enter disabled state with loading spinners immediately upon click.
   - Idempotency keys (`Idempotency-Key` header) prevent duplicate payment debits.
2. **Unsaved Change Warnings**:
   - Navigation guards alert citizens if they attempt to navigate away from an incomplete property registration wizard with unsaved draft fields.
3. **Network Failure Recovery**:
   - In-flight drafts are cached in local browser session storage so citizens can resume without re-entering parcel dimensions if the network drops.

---

## 3. Performance & Computational Optimizations

- **Debounced Universal Search**: $300\text{ ms}$ debounce threshold prevents excessive search queries while typing.
- **Route-Based Code Splitting**: Main bundle split via dynamic imports, keeping the critical initial HTML payload under $1.5\text{ kB}$.
- **Recharts Virtualization**: Responsive chart wrappers re-render only when container bounds or underlying record sets mutate.
