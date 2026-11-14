# CivicTax 5.0: Document Management & Secure Digital Vault

## 1. Vault Architecture & Classification

The CivicTax 5.0 Document Management Subsystem acts as a secure, tamper-evident digital vault for all legal, architectural, and financial records supporting property transactions.

```
                           [ Citizen / Officer Upload ]
                                         │
                                         ▼
                             [ Ingestion Gatekeeper ]
                             - Strict MIME-Type Allowlist
                             - 5MB File Size Boundary
                             - Antivirus Signature Scan
                                         │
                                         ▼
                            [ Cryptographic Indexing ]
                            - Calculates SHA-256 Checksum
                            - Assigns Version ID (e.g., DOC-v1)
                            - Associates to Parent Record
                                         │
                                         ▼
                             [ Role-Based Storage ]
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
         [ Active Document Vault ]                   [ Tamper Audit Log ]
         Encrypted storage with                      Stores Checksum, Actor,
         granular RBAC access gates                  Timestamp, and Target Entity
```

---

## 2. Supported Municipal Document Classes

| Document Code | Document Class Name | Mandatory Stage | Accepted Formats | Max Size | Retention Period |
|---|---|---|---|---|---|
| `DOC-DEED` | Registered Sale Deed / Title | Property Registration | PDF | 5.0 MB | Permanent Statutory |
| `DOC-ENC` | Encumbrance Certificate (EC) | Property Registration | PDF | 5.0 MB | 15 Years |
| `DOC-BLD` | Approved Building Layout Plan | Commercial / Industrial | PDF, PNG | 5.0 MB | Permanent Statutory |
| `DOC-ID` | Citizen Identity Proof | Registration & Transfer | PDF, JPEG, PNG | 2.0 MB | 7 Years post-deactivation |
| `DOC-SURV` | Geotagged Field Inspection Photo | Physical Verification | JPEG, PNG | 4.0 MB | 10 Years |
| `DOC-RCPT` | Statutory Tax Payment Receipt | Payment Processing | System PDF | Generated | Permanent Statutory |

---

## 3. Cryptographic Integrity & Tamper Resistance

1. **SHA-256 Checksum Invariance**:
   - Every file uploaded generates a 256-bit hash prior to persisting metadata:
     $$\text{Checksum} = \text{SHA256}(\text{BinaryBuffer})$$
   - On every subsequent read or download, the checksum is re-verified. Any hash mismatch raises an immediate security alarm (`SEC-ERR-INTEGRITY-FAILED`).
2. **Version Control & Non-Destructive Revision**:
   - Documents are never overwritten or deleted during active workflows.
   - When a citizen re-uploads an updated deed following a correction request, the previous file is flagged as `ARCHIVED_SUPERSEDED` and the new file is attached as `ACTIVE_LATEST (v2)`.

---

## 4. Role-Based Access Control (RBAC) & Redaction

```
+--------------------------+---------------------+---------------------+---------------------+
| User Role                | Upload Permissions  | Read Permissions    | Redaction Behavior  |
+--------------------------+---------------------+---------------------+---------------------+
| Citizen (Owner)          | Own Properties      | Own Documents Only  | None (Full View)    |
| Verification Officer     | Field Survey Photos | Assigned Zone Docs  | Full View (Official)|
| Revenue Inspector        | Verification Audits | Municipal-wide Docs | Full View (Official)|
| Public Portal / Visitor  | None (Forbidden)    | Receipts / Assmnts  | Redacted (Masked)   |
+--------------------------+---------------------+---------------------+---------------------+
```

- **PII Redaction Policy**: When documents are accessed via public verification or audit links, sensitive fields (e.g., Aadhaar number digits 1-8, bank account numbers, personal phone numbers) are masked.

---

## 5. Salesforce Platform Architecture Parity

- **Salesforce Files Framework**:
  - `ContentVersion`: Physical binary storage, MIME type, version numbering.
  - `ContentDocument`: Parent document container.
  - `ContentDocumentLink`: Junction record associating file with `Property__c`, `Tax_Assessment__c`, or `Case`.
- **Content Workspaces / Libraries**: Municipal dockets isolated into `CivicTax_Deeds_Library` and `CivicTax_FieldSurveys_Library` with restricted library membership.
- **Apex Content Triggers**: Custom triggers enforcing file extension restrictions (`.pdf`, `.png`, `.jpg`) and verifying SHA-256 metadata.
