# CIVICTAX Backend Architecture & Modular Services

## 1. Modular Server Architecture

```mermaid
flowchart TD
    Client["Client Requests (React / Postman)"] --> Server["server.ts (CORS, Express, CookieParser)"]
    Server --> AuthModule["routes/authRoutes.ts (OAuth 2.0 PKCE)"]
    Server --> SFProxy["routes/salesforceRoutes.ts (Apex REST Proxy)"]
    Server --> MuniRoutes["modules/municipalRoutes.ts (Properties, Assessments, Payments)"]
    MuniRoutes --> ServiceFactory["repositories/ServiceFactory.ts"]
    ServiceFactory --> LocalRepo["repositories/LocalRepository.ts"]
    LocalRepo --> Storage["Authoritative In-Memory & Schema Layer"]
```

---

## 2. Directory Layout & Module Responsibilities

```
server/src/
├── config/             # Config loader (SF URLs, secrets, ports)
├── middleware/         # Session guard, logging, error handling
├── modules/            # municipalRoutes.ts (REST CRUD endpoints)
├── repositories/       # ICivicTaxRepository, LocalRepository, types.ts
├── routes/             # authRoutes.ts, salesforceRoutes.ts
├── services/           # salesforceClient.ts (Token exchange, refresh)
├── utils/              # pkce.ts (Crypto SHA-256 challenges)
├── types/              # Session and token interfaces
└── server.ts           # App bootstrap and router mounting
```
