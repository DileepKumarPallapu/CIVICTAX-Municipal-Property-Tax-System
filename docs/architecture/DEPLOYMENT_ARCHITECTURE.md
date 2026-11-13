# CIVICTAX Deployment & DevOps Architecture

## 1. Cloud Infrastructure & Deployment Topology

```mermaid
flowchart LR
    subgraph Vercel["Vercel Cloud Edge (Global CDN)"]
        SPA["React 19 SPA (Vite Build)\n(dist/index.html + Static Chunks)"]
        VercelConfig["vercel.json\n(SPA Rewrites & Security Headers)"]
    end

    subgraph NodeHost["Node.js Hosting (Railway / Render / Local)"]
        Gateway["Express 4 Gateway\n(Node.js v20+ / v24+ Runtime)"]
        SessionMemory["Encrypted Session Store\n(Cookie civictax.sid)"]
    end

    subgraph Salesforce["Salesforce Cloud (Multi-Tenant Org)"]
        ApexEndpoints["CivicTax Apex REST API\n(/civictax/v1/*)"]
        DB["Authoritative Custom Database\n(Property__c, Tax_Assessment__c)"]
    end

    SPA -->|Session Cookie API Calls| Gateway
    Gateway -->|OAuth 2.0 PKCE / HTTPS| Salesforce
```

---

## 2. CI/CD & Build Validation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Developer
    participant Git as GitHub Repository
    participant Pipeline as Build & Test Runner
    participant Vercel as Vercel Production Deployment
    participant SF as Salesforce Playground CLI

    Developer->>Git: Push Commit (main branch)
    Git->>Pipeline: Trigger Automated Verification
    Pipeline->>Pipeline: Run TypeScript Compilation (tsc -b)
    Pipeline->>Pipeline: Run Vitest Suite (npm test -- --run)
    Pipeline->>Pipeline: Run Vite Production Build (npm run build)
    Pipeline-->>Developer: 20/20 Tests Passed (Exit Code 0)
    Git->>Vercel: Automatic Webhook Trigger
    Vercel->>Vercel: Build & Deploy Static Assets to Edge CDN
    Developer->>SF: sf project deploy start --target-org CivicTaxPlayground
    SF-->>Developer: Metadata Deployed (Objects, Apex, Triggers, LWC)
```

---

## 3. Production Readiness Checklist

1. **SPA Rewrites**: Verified `vercel.json` rewrite configuration (`/(.*) -> /index.html`).
2. **Security Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
3. **Optimized Chunks**: Static assets compiled into versioned chunks with gzip compression (407 kB JavaScript bundle).
4. **Environment Isolation**: No production secrets in `.env.example` or frontend bundle.
