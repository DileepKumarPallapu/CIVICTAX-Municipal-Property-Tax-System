/**
 * @description Enterprise Service for Municipal Tax Payments, Financial Reconciliation & Ledger Integrity
 * @group CivicTax 6.0
 */
public with sharing class CivicTaxPaymentService {

    public class PaymentException extends Exception {}

    /**
     * @description Records a tax payment, updates assessment balances, and enforces duplicate prevention
     */
    public static Tax_Payment__c processPayment(Id assessmentId, Decimal amount, String paymentMethod, String transactionId) {
        if (assessmentId == null) {
            throw new PaymentException('Assessment ID is required for payment processing');
        }
        if (amount == null || amount <= 0) {
            throw new PaymentException('Payment amount must be strictly greater than zero');
        }
        if (String.isBlank(transactionId)) {
            throw new PaymentException('Gateway Transaction ID is mandatory');
        }

        // Duplicate Check
        List<Tax_Payment__c> duplicatePayments = [
            SELECT Id, Transaction_ID__c, Payment_Reference__c 
            FROM Tax_Payment__c 
            WHERE Transaction_ID__c = :transactionId 
            WITH SECURITY_ENFORCED 
            LIMIT 1
        ];
        if (!duplicatePayments.isEmpty()) {
            throw new PaymentException('Duplicate payment detected: Transaction ' + transactionId + ' has already been processed.');
        }

        // Retrieve Assessment with Lock for financial concurrency safety
        List<Tax_Assessment__c> assessments = [
            SELECT Id, Total_Tax__c, Total_Amount__c, Amount_Paid__c, Outstanding_Amount__c, Assessment_Status__c 
            FROM Tax_Assessment__c 
            WHERE Id = :assessmentId 
            FOR UPDATE
        ];

        if (assessments.isEmpty()) {
            throw new PaymentException('Target Assessment record not found');
        }

        Tax_Assessment__c asm = assessments[0];
        Decimal currentOutstanding = asm.Outstanding_Amount__c != null 
            ? asm.Outstanding_Amount__c 
            : (asm.Total_Amount__c != null ? asm.Total_Amount__c : 0.0);

        if (amount > currentOutstanding) {
            throw new PaymentException('Payment amount (INR ' + amount + ') exceeds remaining outstanding balance (INR ' + currentOutstanding + ').');
        }

        Tax_Payment__c pmt = new Tax_Payment__c();
        pmt.Assessment__c = asm.Id;
        pmt.Amount__c = amount;
        pmt.Amount_Paid__c = amount;
        pmt.Payment_Date__c = System.now();
        pmt.Payment_Method__c = paymentMethod != null ? paymentMethod : 'UPI';
        pmt.Transaction_ID__c = transactionId;
        pmt.Payment_Reference__c = 'RCT-' + String.valueOf(System.currentTimeMillis()).right(6);
        pmt.Transaction_Status__c = 'Success';
        pmt.Payment_Status__c = 'Success';

        insert pmt;

        // Update Assessment state
        Decimal newPaid = (asm.Amount_Paid__c != null ? asm.Amount_Paid__c : 0.0) + amount;
        Decimal newOutstanding = currentOutstanding - amount;

        asm.Amount_Paid__c = newPaid;
        asm.Outstanding_Amount__c = newOutstanding;
        asm.Assessment_Status__c = newOutstanding <= 0 ? 'Paid' : 'Partially Paid';

        update asm;

        return pmt;
    }

    /**
     * @description Lists all payment receipts for an assessment
     */
    public static List<Tax_Payment__c> getPaymentsForAssessment(Id assessmentId) {
        return [
            SELECT Id, Name, Payment_Reference__c, Assessment__c, Amount__c, Amount_Paid__c, 
                   Payment_Date__c, Payment_Method__c, Transaction_Status__c, Transaction_ID__c 
            FROM Tax_Payment__c 
            WHERE Assessment__c = :assessmentId 
            WITH SECURITY_ENFORCED 
            ORDER BY Payment_Date__c DESC
        ];
    }
}
