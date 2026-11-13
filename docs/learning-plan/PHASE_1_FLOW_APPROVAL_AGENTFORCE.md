# Topic 10: Flow Builder, Approval Processes & Agentforce AI Concepts

## 1. Flow Builder Implementations

CivicTax features all four core Salesforce Flow types:

### 1.1 Screen Flow: `Citizen_Property_Registration_Wizard`
- User-friendly multi-step screen flow for walk-in citizens at municipal citizen service desks.
- Form inputs, file upload screen component, and instant confirmation screen.

### 1.2 Before-Save Record-Triggered Flow: `Property_PreSave_Sanitization`
- Runs before commit on `Property__c`.
- Auto-formats property number (uppercase) and auto-sets default status to `PENDING`.

### 1.3 After-Save Record-Triggered Flow: `Payment_Receipt_Dispatcher`
- Runs after commit on `Tax_Payment__c`.
- Invokes notification subflow and enqueues receipt generation.

### 1.4 Scheduled-Triggered Flow: `Due_Date_Reminder_Scheduler`
- Runs daily at 06:00 IST to find assessments due within 7 days, sending proactive SMS reminders.

---

## 2. Multi-Step Approval Processes
- **`Property_Verification_Approval`**: Initial submission locks record; routes to Zonal Revenue Officer; approval unlocks and sets status to `VERIFIED`.
- **`Reassessment_Approval_Process`**: 2-step process (Assistant Engineer technical check $\to$ Zonal Commissioner financial sanction).

---

## 3. Agentforce & Einstein AI Learning Plan Alignment

> [!NOTE]
> **Ethical AI & License Guardrail**: Agentforce and Einstein Generative AI require specialized enterprise add-on licenses (`Einstein 1 Platform`). In our academic environment, the conceptual architecture is fully mapped, while local client-side AI is powered by the rule-based **CiviAssist** engine.

- **Agentforce Municipal Service Agent**: Autonomous AI agent handling citizen tax FAQs, payment receipt lookups, and grievance status queries.
- **Trusted AI Principles**: Grounding responses in verified municipal tax schedules; zero hallucination of payment amounts; PII masking on citizen query transcripts.
- **Next Best Action (NBA)**: Proactively suggests early-bird payment rebate options to eligible taxpayers.
