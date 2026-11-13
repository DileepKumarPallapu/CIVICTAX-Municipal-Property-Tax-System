# CIVICTAX Digital Document Vault Specification

## 1. Document Management Architecture

The Digital Document Vault centralizes municipal document metadata while avoiding large binary bloat in browser storage:

- **Document Categories**:
  - `TITLE_DEED`: Sub-registrar registered sale deeds and Index-II extracts.
  - `SANCTIONED_PLAN`: Town planning sanctioned architectural layout drawings.
  - `TAX_RECEIPT`: Generated municipal payment receipts with cryptographic signatures.
  - `ASSESSMENT_BILL`: Annual tax assessment demand notices.
  - `GRIEVANCE_PROOF`: Supporting photographic or legal evidence for grievance tickets.
  - `CLEARANCE_CERTIFICATE`: Formal municipal tax clearance certificates.

---

## 2. Storage & Validation Policy

1. **Size Limits & Formats**:
   - Permitted formats: `application/pdf`, `image/jpeg`, `image/png`.
   - Maximum upload size: $5\text{ MB}$ per document.
2. **Controlled Storage**:
   - In demonstration mode, documents store metadata (document reference, file name, upload date, sha256 checksum) with mock binary access.
   - Large binary payloads are never serialized directly into ordinary LocalStorage.
