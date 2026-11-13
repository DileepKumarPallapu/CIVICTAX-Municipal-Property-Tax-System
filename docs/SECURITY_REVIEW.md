# CIVICTAX Security Review & Threat Assessment

## 1. Executive Summary

This document details the application security posture, defense-in-depth measures, vulnerability assessments, and environmental boundaries for **CIVICTAX 10.0 — Smart Property Tax Assessment and Municipal Governance Platform**.

---

## 2. Threat Analysis & Defensive Implementations

| Threat Vector | Evaluation Target | Defensive Implementation & Mitigation | Status |
| :--- | :--- | :--- | :--- |
| **Salesforce Credential Leakage** | Client / Browser | OAuth 2.0 PKCE. Tokens (`access_token`, `refresh_token`) and client secrets are **never sent to or stored in React / LocalStorage**. Held strictly in server-side session memory on port 3001. | **VERIFIED CLEAN** |
| **Cross-Site Scripting (XSS)** | UI & Form Rendering | React JSX auto-escaping; zero use of `dangerouslySetInnerHTML`; text sanitization in grievance and property descriptions. | **SECURE** |
| **Cross-Site Request Forgery (CSRF)** | OAuth & REST | High-entropy random cryptographic `state` token generated per OAuth dance; verified server-side before code exchange. | **SECURE** |
| **Cross-Origin Resource Sharing (CORS)** | Backend Gateway | Explicit allowlist restricted strictly to configured `FRONTEND_URL` (`http://localhost:5173`). Wildcard `*` rejected. | **SECURE** |
| **Session Security** | Browser Cookies | Session cookie (`civictax.sid`) marked `HttpOnly` and `SameSite=Lax`. Protected against document.cookie extraction. | **SECURE** |
| **Financial Calculations Tampering** | Tax Assessments & Payments | Calculation formulas reside on the server / Apex. Client cannot override assessed base tax or force negative amounts. | **SECURE** |
| **CSV Formula Injection** | Reports & Data Export | Sanitized string output escaping leading `=, +, -, @` characters in exported CSV documents. | **PROTECTED** |
| **Privacy / PII Leakage** | Public Transparency Portal | Aggregate data filtering engine strictly removes citizen names, phone numbers, emails, and individual transaction identifiers. | **VERIFIED BY UNIT TEST** |

---

## 3. Environment & Deployment Boundaries

1. **Local Demo Authentication vs. Enterprise SSO**:
   - The local demonstration mode utilizes a browser-based session simulator with seeded test personas (`citizen@civictax.demo`, `officer@civictax.demo`, `admin@civictax.demo`).
   - This mode is designed for academic presentation and offline evaluation. It is **not** an enterprise identity provider (IdP).
2. **Salesforce Integration Boundary**:
   - When Salesforce mode is activated, authentication is delegated to Salesforce OAuth 2.0 Authorization Code Flow with PKCE, enforcing real Salesforce User permissions, Permission Sets, and Field-Level Security (FLS).
