# CIVICTAX Backend Data Provider Architecture

## 1. Provider Pattern & Interface Segregation

CivicTax Backend implements the Repository Pattern via `ICivicTaxRepository`:

```typescript
export interface ICivicTaxRepository {
  listProperties(filter?: PropertyFilter): Promise<IProperty[]>;
  getPropertyById(id: string): Promise<IProperty | null>;
  createProperty(prop: NewPropertyDTO): Promise<IProperty>;
  listAssessments(propertyId?: string): Promise<ITaxAssessment[]>;
  createPayment(pmt: NewPaymentDTO): Promise<{ payment: ITaxPayment; assessment: ITaxAssessment }>;
  listGrievances(): Promise<IGrievance[]>;
  createGrievance(grv: NewGrievanceDTO): Promise<IGrievance>;
}
```

---

## 2. Implementations
1. **`LocalRepository.ts`**:
   - Primary authoritative local data provider for offline demonstration and testing.
   - Enforces duplicate prevention on property numbers and transaction IDs.
   - Executes atomic parent balance rollups during payment settlement.
2. **`SalesforceClient.ts` / Salesforce Gateway**:
   - Secondary cloud adapter communicating with Salesforce Apex REST endpoints via OAuth 2.0 PKCE.
