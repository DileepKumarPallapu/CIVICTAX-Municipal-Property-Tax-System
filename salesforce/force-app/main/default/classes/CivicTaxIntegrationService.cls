/**
 * @description Enterprise Integration Gateway & Payload Normalization Service for CivicTax
 * @group CivicTax 6.0
 */
public with sharing class CivicTaxIntegrationService {

    public class IntegrationPayload {
        public String operation;
        public Map<String, Object> recordData;
    }

    public class IntegrationResponse {
        public Boolean success;
        public String recordId;
        public String errorMessage;
        public Object data;

        public IntegrationResponse(Boolean isSuccess, String id, Object payload, String err) {
            this.success = isSuccess;
            this.recordId = id;
            this.data = payload;
            this.errorMessage = err;
        }
    }

    /**
     * @description Normalizes incoming external JSON payloads into validated Salesforce operations
     */
    public static IntegrationResponse handleInboundRequest(String entityType, String action, Map<String, Object> payload) {
        try {
            if (entityType == 'PROPERTY') {
                Property__c prop = new Property__c();
                prop.Property_Number__c = (String) payload.get('propertyNumber');
                prop.Property_Address__c = (String) payload.get('address');
                prop.Zone__c = (String) payload.get('zone');
                prop.Property_Category__c = (String) payload.get('category');
                prop.Built_Up_Area__c = Decimal.valueOf(String.valueOf(payload.get('builtUpArea')));
                
                Property__c created = CivicTaxPropertyService.registerProperty(prop);
                return new IntegrationResponse(true, created.Id, created, null);
            } 
            else if (entityType == 'PAYMENT') {
                Id assessmentId = (Id) payload.get('assessmentId');
                Decimal amount = Decimal.valueOf(String.valueOf(payload.get('amount')));
                String method = (String) payload.get('method');
                String txnId = (String) payload.get('transactionId');

                Tax_Payment__c pmt = CivicTaxPaymentService.processPayment(assessmentId, amount, method, txnId);
                return new IntegrationResponse(true, pmt.Id, pmt, null);
            }

            return new IntegrationResponse(false, null, null, 'Unsupported entity type: ' + entityType);
        } catch (Exception ex) {
            return new IntegrationResponse(false, null, null, ex.getMessage());
        }
    }
}
