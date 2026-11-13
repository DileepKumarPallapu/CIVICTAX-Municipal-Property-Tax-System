// PaymentService.cls
// CivicTax 8.0 Authoritative Apex Payment Processing Service
public with sharing class PaymentService {
    public class PaymentException extends Exception {}

    // Process a tax payment, update assessment balances and statuses atomically
    public static Tax_Payment__c recordPayment(
        String assessmentId,
        Decimal amount,
        String paymentMethod,
        String transactionId
    ) {
        if (amount == null || amount <= 0) {
            throw new PaymentException('Payment amount must be greater than zero.');
        }
        if (String.isBlank(transactionId)) {
            throw new PaymentException('Transaction reference ID is mandatory.');
        }

        // Duplicate payment transaction protection
        List<Tax_Payment__c> duplicateCheck = [
            SELECT Id, Transaction_ID__c 
            FROM Tax_Payment__c 
            WHERE Transaction_ID__c = :transactionId 
            WITH USER_MODE 
            LIMIT 1
        ];
        if (!duplicateCheck.isEmpty()) {
            throw new PaymentException('Duplicate transaction reference detected: ' + transactionId);
        }

        // Lock assessment for balance calculation
        List<Tax_Assessment__c> assessments = [
            SELECT Id, Name, Total_Amount__c, Amount_Paid__c, Outstanding_Amount__c, Assessment_Status__c 
            FROM Tax_Assessment__c 
            WHERE Id = :assessmentId 
            WITH USER_MODE 
            FOR UPDATE
        ];
        if (assessments.isEmpty()) {
            throw new PaymentException('Target assessment record not found.');
        }

        Tax_Assessment__c asm = assessments[0];
        Decimal currentPaid = asm.Amount_Paid__c == null ? 0 : asm.Amount_Paid__c;
        Decimal outstanding = asm.Outstanding_Amount__c == null ? asm.Total_Amount__c : asm.Outstanding_Amount__c;

        if (amount > outstanding) {
            throw new PaymentException('Payment amount (₹' + amount + ') exceeds remaining balance (₹' + outstanding + ').');
        }

        // Create Payment record
        Tax_Payment__c payment = new Tax_Payment__c(
            Name = 'PAY-' + System.currentTimeMillis(),
            Assessment__c = asm.Id,
            Amount_Paid__c = amount,
            Payment_Date__c = System.now(),
            Payment_Method__c = paymentMethod,
            Transaction_ID__c = transactionId,
            Payment_Status__c = 'SUCCESS'
        );
        insert as user payment;

        // Recalculate Assessment
        Decimal newPaid = (currentPaid + amount).setScale(2, System.RoundingMode.HALF_UP);
        Decimal newOutstanding = (asm.Total_Amount__c - newPaid).setScale(2, System.RoundingMode.HALF_UP);

        asm.Amount_Paid__c = newPaid;
        asm.Outstanding_Amount__c = newOutstanding;
        if (newOutstanding <= 0) {
            asm.Assessment_Status__c = 'PAID';
        } else {
            asm.Assessment_Status__c = 'PARTIALLY_PAID';
        }

        update as user asm;
        return payment;
    }
}
