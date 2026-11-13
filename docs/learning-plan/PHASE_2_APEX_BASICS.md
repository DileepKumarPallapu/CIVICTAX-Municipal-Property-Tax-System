# Topic 12: Apex Basics, Class Structure & Data Types

## 1. Curriculum Objectives & Object-Oriented Principles
Demonstrates foundational Apex programming concepts in CivicTax:
- **Class Structure & Modifiers**: `public with sharing class` (enforcing sharing rules), `private`, `protected`.
- **Primitive Data Types**: `String`, `Integer`, `Long`, `Decimal` (Currency calculations), `Boolean`, `Date`, `Datetime`.
- **Complex Types & Generic sObjects**: `Property__c`, `Tax_Assessment__c`, `sObject`, `Database.SaveResult`.
- **Null Safety & Type Casting**: Safe navigation operator (`?.`), explicit casting, `instanceof` checks.
- **Enums & Constants**: `public enum PropertyCategory { RESIDENTIAL, COMMERCIAL, INDUSTRIAL }`.

---

## 2. Practical CivicTax Service Implementations

### 2.1 `CivicTaxPropertyService.cls`
```apex
public with sharing class CivicTaxPropertyService {
    public static final String STATUS_PENDING = 'PENDING';
    public static final String STATUS_VERIFIED = 'VERIFIED';

    public static Property__c registerParcel(Property__c parcel, Id citizenContactId) {
        if (parcel == null || citizenContactId == null) {
            throw new CivicTaxException('Invalid Parcel or Citizen Identity reference.');
        }
        parcel.Owner_Contact__c = citizenContactId;
        parcel.Verification_Status__c = STATUS_PENDING;
        insert parcel;
        return parcel;
    }
}
```

### 2.2 `CivicTaxTaxCalculator.cls`
```apex
public with sharing class CivicTaxTaxCalculator {
    public static Decimal computeBaseTax(Decimal areaSqFt, Decimal ratePerSqFt) {
        if (areaSqFt == null || areaSqFt <= 0 || ratePerSqFt == null || ratePerSqFt <= 0) {
            return 0.00;
        }
        return (areaSqFt * ratePerSqFt).setScale(2, System.RoundingMode.HALF_UP);
    }
}
```
