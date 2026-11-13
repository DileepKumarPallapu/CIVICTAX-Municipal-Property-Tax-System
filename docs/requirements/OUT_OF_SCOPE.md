# CIVICTAX Out-of-Scope Capabilities & Non-Goals

To maintain academic and professional honesty, this document explicitly records features and external integrations that are **strictly out-of-scope** for CivicTax in its current milestone release.

---

## 1. Out-of-Scope Systems & Integrations

| Capability / External System | Implementation Status | Academic / Architectural Scope Notice |
| :--- | :---: | :--- |
| **Real Commercial Banking Gateway** | **Out-of-Scope** | CivicTax provides an educational, realistic payment simulation engine (UPI, Card, Net Banking). It does not integrate with real commercial banking payment gateways (Razorpay, Stripe, NPCI live networks) to avoid real financial liability. |
| **National Government Identity SSO** | **Out-of-Scope** | National citizen identity verification (Aadhaar, DigiLocker, Singpass) is not connected. The application utilizes a role-based session manager with pre-seeded personas. |
| **Production SMS / Cellular OTP** | **Out-of-Scope** | Mobile SMS dispatch networks (Twilio, AWS SNS, Telecom gateways) are not connected. Citizen notifications are simulated via the in-app notification center. |
| **Production WhatsApp Gateway** | **Out-of-Scope** | No automated WhatsApp Business API messaging is connected. |
| **Live State Land Registry API** | **Out-of-Scope** | Title deed verification relies on citizen-submitted Index-II document reference strings and manual municipal officer approval workflows. Direct live API calls to state land revenue databases are not implemented. |
| **Official Digital Stamp Certificates** | **Out-of-Scope** | Printable receipts contain simulated municipal seals and cryptographic verification hashes for demonstration; they are not legally binding revenue stamp certificates. |

---

## 2. Integrity Declaration
CivicTax explicitly identifies these boundaries to prevent misrepresentation during academic evaluations, faculty viva voce examinations, or commercial project proposals.
